#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

#include <SPI.h>
#include <MFRC522.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/semphr.h"

#define ENTRY_TRIG_PIN 27
#define ENTRY_ECHO_PIN 35

#define EXIT_TRIG_PIN 23
#define EXIT_ECHO_PIN 22

// --------- RFID (RC522) ---------
// Wiring (RC522 -> ESP32)
// SDA/SS -> GPIO 5
// SCK    -> GPIO 18
// MOSI   -> GPIO 13
// MISO   -> GPIO 19
// RST    -> GPIO 21
// 3.3V/GND as normal
#define RFID_SS_PIN   5
#define RFID_SCK_PIN  18
#define RFID_MOSI_PIN 13
#define RFID_MISO_PIN 19
#define RFID_RST_PIN  21

static const unsigned long RFID_DEBOUNCE_MS = 2500;
static String lastRfidUid = "";
static unsigned long lastRfidSeenMs = 0;
static uint8_t rfidBadReads = 0;
static unsigned long lastRfidRecoverMs = 0;

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

// --------- WIFI ---------
const char* WIFI_SSID = "TP-Link_DE3A";
const char* WIFI_PASSWORD = "61693906";

// --------- SUPABASE ---------
// NOTE: The anon key is public for client-side apps, but any sensor secrets must be kept private.
const char* SUPABASE_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3ltanprdWlvaHNxYWxycWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjk2NjMsImV4cCI6MjA4ODIwNTY2M30.CKZoZbIu0MDZplXl_8Qf-K6n5nFaPMvp4ZHp7TcdIkM";
const char* SUPABASE_INGEST_RPC_PATH = "/rest/v1/rpc/ingest_occupancy_change";
static const char* SUPABASE_INGEST_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co/rest/v1/rpc/ingest_occupancy_change";
static const char* SUPABASE_RFID_INGEST_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co/rest/v1/rpc/ingest_rfid_scan";

// Occupancy-only diagnostics mode: reduce device load and isolate ultrasonic -> Supabase transport.
static const bool OCCUPANCY_ONLY_DIAGNOSTICS = false;

// These must match rows in public.sensors (sensor_identifier + secret used to generate ingest_secret_hash)
const char* ENTRY_SENSOR_IDENTIFIER = "doorA_entry";
const char* ENTRY_SENSOR_SECRET = "ENTRY_SECRET";
const char* EXIT_SENSOR_IDENTIFIER = "doorA_exit";
const char* EXIT_SENSOR_SECRET = "EXIT_SECRET";
static const bool RFID_ENABLED = true;

// --------- SENSOR LOGIC ---------
const float DETECT_THRESHOLD_CM = 25.0;
const int REQUIRED_HITS = 1;
const unsigned long REARM_DELAY_MS = 500;
const unsigned long DOOR_EVENT_COOLDOWN_MS = 250;
const unsigned long AMBIGUOUS_WINDOW_MS = 200; // if both sensors trigger within this window, treat as no-op

// --------- DEBUG ---------
static const bool DEBUG_HTTP = true;
static const bool DEBUG_WIFI = true;
static const bool DEBUG_HEARTBEAT = true;
static const bool DEBUG_RFID = false;

static const uint32_t HTTP_TIMEOUT_MS = 5000;
static const uint32_t HTTP_MIN_GAP_MS = 1200;
static const uint32_t HTTP_FAIL_BACKOFF_MS = 7000;

static unsigned long lastHeartbeatMs = 0;
static unsigned long lastDoorEventMs = 0;
static unsigned long lastRfidDiagMs = 0;
static const unsigned long RFID_DIAG_EVERY_MS = 2000;
static unsigned long nextHttpAttemptAtMs = 0;
static int8_t lastOccupancyQueuedChange = 0;
static unsigned long lastOccupancyQueuedAtMs = 0;

enum PendingDir : uint8_t { PENDING_NONE = 0, PENDING_ENTRY = 1, PENDING_EXIT = 2 };
static PendingDir pendingDir = PENDING_NONE;
static unsigned long pendingSinceMs = 0;
static float pendingDistanceCm = -1.0;

int entryCloseCount = 0;
int exitCloseCount = 0;

int peopleInside = 0;

unsigned long entryFarSince = 0;
unsigned long exitFarSince = 0;
bool entryFarTimerRunning = false;
bool exitFarTimerRunning = false;

bool entryArmed = true;
bool exitArmed = true;

static bool ensureWiFiConnected();
static bool sendOccupancyChangeToSupabase(const char* sensorIdentifier, const char* sensorSecret, int change, float distanceCm, int localCount);
static bool sendRfidScanToSupabase(const char* sensorIdentifier, const char* sensorSecret, const char* uidHex);

static size_t sanitizeJwtKey(char* out, size_t outLen, const char* in);
static int countChar(const char* s, char ch);
static void printJwtShapeDebug(const char* label, const char* jwt);
static bool allowHttpAttempt(const char* tag);
static void noteHttpResult(int httpCode);

static void pollRfid(unsigned long now);
static String formatUidHex(const MFRC522::Uid& uid);
static void rfidDiagnostics(unsigned long now);

static void rfidTask(void*);

static SemaphoreHandle_t httpMutex = nullptr;

struct ScopedMutex {
  SemaphoreHandle_t m;
  bool acquired;
  ScopedMutex(SemaphoreHandle_t mutex, TickType_t waitTicks) : m(mutex), acquired(false) {
    if (!m) {
      acquired = true;
    } else {
      acquired = (xSemaphoreTake(m, waitTicks) == pdTRUE);
    }
  }
  ~ScopedMutex() {
    if (m && acquired) xSemaphoreGive(m);
  }
};

enum OutboundEventType : uint8_t { EVT_OCCUPANCY = 1, EVT_RFID = 2 };

struct OutboundEvent {
  uint8_t type;
  char sensorIdentifier[32];
  char sensorSecret[64];

  // Occupancy fields
  int8_t change;
  float distanceCm;
  int localCount;

  // RFID fields
  char rfidUid[32];

  uint32_t queuedAtMs;
};

static QueueHandle_t outboundQueue = nullptr;
static void senderTask(void*);

static void resetPending() {
  pendingDir = PENDING_NONE;
  pendingSinceMs = 0;
  pendingDistanceCm = -1.0;
}

static void disarmBothAndCooldown(unsigned long now) {
  entryArmed = false;
  exitArmed = false;
  entryFarTimerRunning = false;
  exitFarTimerRunning = false;
  entryCloseCount = 0;
  exitCloseCount = 0;
  resetPending();
  lastDoorEventMs = now;
}

static bool enqueueOccupancyEvent(const char* sensorIdentifier, const char* sensorSecret, int change, float distanceCm, int localCount) {
  if (!outboundQueue) return false;

  // Drop rapid duplicate occupancy events to reduce queue pressure.
  const unsigned long now = millis();
  if ((int8_t)change == lastOccupancyQueuedChange && (now - lastOccupancyQueuedAtMs) < 1200) {
    if (DEBUG_HTTP) {
      Serial.println("Occupancy dedupe: dropped rapid duplicate event");
    }
    return false;
  }

  OutboundEvent ev;
  memset(&ev, 0, sizeof(ev));
  ev.type = EVT_OCCUPANCY;
  strncpy(ev.sensorIdentifier, sensorIdentifier, sizeof(ev.sensorIdentifier) - 1);
  strncpy(ev.sensorSecret, sensorSecret, sizeof(ev.sensorSecret) - 1);
  ev.change = (int8_t)change;
  ev.distanceCm = distanceCm;
  ev.localCount = localCount;
  ev.queuedAtMs = millis();

  if (xQueueSend(outboundQueue, &ev, 0) != pdTRUE) {
    Serial.println("Occupancy queue full; dropping event");
    return false;
  }
  lastOccupancyQueuedChange = (int8_t)change;
  lastOccupancyQueuedAtMs = now;
  return true;
}

static bool enqueueRfidScanEvent(const char* sensorIdentifier, const char* sensorSecret, const char* uidHex) {
  if (!outboundQueue) return false;
  if (!uidHex || uidHex[0] == '\0') return false;

  OutboundEvent ev;
  memset(&ev, 0, sizeof(ev));
  ev.type = EVT_RFID;
  strncpy(ev.sensorIdentifier, sensorIdentifier, sizeof(ev.sensorIdentifier) - 1);
  strncpy(ev.sensorSecret, sensorSecret, sizeof(ev.sensorSecret) - 1);
  strncpy(ev.rfidUid, uidHex, sizeof(ev.rfidUid) - 1);
  ev.queuedAtMs = millis();

  if (xQueueSend(outboundQueue, &ev, 0) != pdTRUE) {
    Serial.println("RFID queue full; dropping scan");
    return false;
  }
  return true;
}

static bool buildSupabasePayload(char* out, size_t outLen, const char* sensorIdentifier, const char* sensorSecret, int change, float distanceCm, int localCount) {
  if (!out || outLen == 0) return false;
  const int n = snprintf(
    out,
    outLen,
    "{\"p_sensor_identifier\":\"%s\",\"p_secret\":\"%s\",\"p_change\":%d,\"p_payload\":{\"distance_cm\":%.2f,\"local_count\":%d}}",
    sensorIdentifier,
    sensorSecret,
    change,
    distanceCm,
    localCount
  );
  return (n > 0) && (static_cast<size_t>(n) < outLen);
}

static bool buildSupabaseMaskedPayload(char* out, size_t outLen, const char* sensorIdentifier, int change, float distanceCm, int localCount) {
  if (!out || outLen == 0) return false;
  const int n = snprintf(
    out,
    outLen,
    "{\"p_sensor_identifier\":\"%s\",\"p_secret\":\"***\",\"p_change\":%d,\"p_payload\":{\"distance_cm\":%.2f,\"local_count\":%d}}",
    sensorIdentifier,
    change,
    distanceCm,
    localCount
  );
  return (n > 0) && (static_cast<size_t>(n) < outLen);
}

float readDistanceCm(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 12000); // faster timeout
  if (duration == 0) return -1.0;
  return duration / 58.0;
}

static bool ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return true;

  if (DEBUG_WIFI) {
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    if (DEBUG_WIFI) Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println("\nWiFi connect timeout");
      return false;
    }
  }

  if (DEBUG_WIFI) {
    Serial.println("\nWiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
  }
  return true;
}

static size_t sanitizeJwtKey(char* out, size_t outLen, const char* in) {
  if (!out || outLen == 0) return 0;
  size_t j = 0;
  if (!in) {
    out[0] = '\0';
    return 0;
  }
  for (size_t i = 0; in[i] != '\0'; i++) {
    const char c = in[i];
    if (c == ' ' || c == '\r' || c == '\n' || c == '\t') continue;
    if (j + 1 >= outLen) break;
    out[j++] = c;
  }
  out[j] = '\0';
  return j;
}

static int countChar(const char* s, char ch) {
  if (!s) return 0;
  int n = 0;
  for (size_t i = 0; s[i] != '\0'; i++) {
    if (s[i] == ch) n++;
  }
  return n;
}

static void printJwtShapeDebug(const char* label, const char* jwt) {
  if (!DEBUG_HTTP) return;
  if (!jwt) {
    Serial.print(label);
    Serial.println(" JWT: <null>");
    return;
  }
  const size_t len = strlen(jwt);
  const int dots = countChar(jwt, '.');
  Serial.print(label);
  Serial.print(" JWT len: ");
  Serial.print(len);
  Serial.print(" | dots: ");
  Serial.print(dots);
  Serial.print(" | tail: ");
  if (len <= 10) {
    Serial.println(jwt);
  } else {
    Serial.println(jwt + (len - 10));
  }
}

static bool allowHttpAttempt(const char* tag) {
  const unsigned long now = millis();
  if (now < nextHttpAttemptAtMs) {
    if (DEBUG_HTTP) {
      Serial.print("HTTP throttled for ");
      Serial.print(tag ? tag : "event");
      Serial.print(" | wait ms: ");
      Serial.println(nextHttpAttemptAtMs - now);
    }
    return false;
  }
  nextHttpAttemptAtMs = now + HTTP_MIN_GAP_MS;
  return true;
}

static void noteHttpResult(int httpCode) {
  if (httpCode >= 200 && httpCode < 300) return;
  if (httpCode < 0) {
    const unsigned long until = millis() + HTTP_FAIL_BACKOFF_MS;
    if (until > nextHttpAttemptAtMs) nextHttpAttemptAtMs = until;
  }
}

static bool sendOccupancyChangeToSupabase(const char* sensorIdentifier, const char* sensorSecret, int change, float distanceCm, int localCount) {
  if (!allowHttpAttempt("occupancy")) return false;
  ScopedMutex lock(httpMutex, pdMS_TO_TICKS(8000));
  if (!lock.acquired) {
    Serial.println("HTTP busy; dropping occupancy event");
    return false;
  }

  if (!ensureWiFiConnected()) return false;

  if (DEBUG_HTTP) {
    Serial.println("\n--- Supabase RPC request ---");
    Serial.print("URL: ");
    Serial.println(SUPABASE_INGEST_URL);
    Serial.print("sensor_identifier: ");
    Serial.println(sensorIdentifier);
    Serial.print("change: ");
    Serial.println(change);
    Serial.print("distance_cm: ");
    Serial.println(distanceCm, 2);
    Serial.print("local_count: ");
    Serial.println(localCount);
    Serial.print("Free heap: ");
    Serial.println(ESP.getFreeHeap());
  }

  // Build JSON using fixed buffers to reduce heap fragmentation.
  // Must match function args in SQL: p_sensor_identifier, p_secret, p_change, p_payload
  char body[256];
  if (!buildSupabasePayload(body, sizeof(body), sensorIdentifier, sensorSecret, change, distanceCm, localCount)) {
    Serial.println("Supabase payload too large; dropping event");
    return false;
  }
  if (DEBUG_HTTP) {
    char masked[256];
    if (buildSupabaseMaskedPayload(masked, sizeof(masked), sensorIdentifier, change, distanceCm, localCount)) {
      Serial.print("Payload (masked): ");
      Serial.println(masked);
    }
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(10);

  HTTPClient https;
  if (!https.begin(client, SUPABASE_INGEST_URL)) {
    Serial.println("Supabase HTTPS begin failed");
    return false;
  }

  https.setTimeout(HTTP_TIMEOUT_MS);

  const char* headerKeys[] = {"content-type", "content-range"};
  https.collectHeaders(headerKeys, 2);

  https.addHeader("Content-Type", "application/json");

  // Sanitize the JWT in case copy/paste introduced hidden whitespace.
  char jwtKey[512];
  const size_t jwtLen = sanitizeJwtKey(jwtKey, sizeof(jwtKey), SUPABASE_ANON_KEY);
  printJwtShapeDebug("Supabase", jwtKey);
  if (jwtLen < 50 || countChar(jwtKey, '.') != 2) {
    Serial.println("Supabase key looks malformed (len too small or wrong segment count). Re-copy the anon key from Supabase settings.");
    https.end();
    return false;
  }

  https.addHeader("apikey", jwtKey);
  // Supabase anon key is a JWT and can exceed 200 chars; avoid truncation.
  char auth[600];
  const int authN = snprintf(auth, sizeof(auth), "Bearer %s", jwtKey);
  if (authN <= 0 || authN >= (int)sizeof(auth)) {
    Serial.println("Supabase Authorization header too long; check SUPABASE_ANON_KEY");
    https.end();
    return false;
  }
  https.addHeader("Authorization", auth);

  const int httpCode = https.POST(reinterpret_cast<uint8_t*>(body), strlen(body));
  const bool ok = (httpCode >= 200 && httpCode < 300);
  noteHttpResult(httpCode);

  if (DEBUG_HTTP) {
    Serial.print("HTTP status: ");
    Serial.println(httpCode);
    Serial.print("HTTPClient: ");
    Serial.println(HTTPClient::errorToString(httpCode));
    String ct = https.header("content-type");
    if (ct.length() > 0) {
      Serial.print("Response content-type: ");
      Serial.println(ct);
    }
  }

  if (!ok) {
    Serial.print("Supabase POST failed, code: ");
    Serial.println(httpCode);
    String resp = https.getString();
    if (resp.length() > 0) {
      Serial.print("Response: ");
      Serial.println(resp);
    }
  } else {
    if (DEBUG_HTTP) {
      // Many Supabase RPCs return 204 No Content. Reading the body can block.
      if (httpCode == 204) {
        Serial.println("Response (204): <no content>");
      } else {
        String resp = https.getString();
        if (resp.length() > 0) {
          Serial.print("Response (2xx): ");
          Serial.println(resp);
        } else {
          Serial.println("Response (2xx): <empty>");
        }
      }
    }
  }

  https.end();

  if (DEBUG_HTTP) {
    Serial.println("Supabase RPC done");
  }

  return ok;
}

static bool sendRfidScanToSupabase(const char* sensorIdentifier, const char* sensorSecret, const char* uidHex) {
  if (!uidHex || uidHex[0] == '\0') return false;
  if (!allowHttpAttempt("rfid")) return false;

  ScopedMutex lock(httpMutex, pdMS_TO_TICKS(8000));
  if (!lock.acquired) {
    if (DEBUG_RFID) Serial.println("HTTP busy; dropping RFID scan");
    return false;
  }

  if (!ensureWiFiConnected()) return false;

  if (DEBUG_HTTP) {
    Serial.println("\n--- Supabase RFID RPC request ---");
    Serial.print("URL: ");
    Serial.println(SUPABASE_RFID_INGEST_URL);
    Serial.print("sensor_identifier: ");
    Serial.println(sensorIdentifier);
    Serial.print("uid: ");
    Serial.println(uidHex);
  }

  // Minimal JSON; p_scanned_at and p_payload are optional (defaults).
  char body[256];
  const int n = snprintf(
    body,
    sizeof(body),
    "{\"p_sensor_identifier\":\"%s\",\"p_secret\":\"%s\",\"p_tag_uid\":\"%s\"}",
    sensorIdentifier,
    sensorSecret,
    uidHex
  );
  if (n <= 0 || n >= (int)sizeof(body)) {
    Serial.println("RFID payload too large; dropping scan");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(10);

  HTTPClient https;
  if (!https.begin(client, SUPABASE_RFID_INGEST_URL)) {
    Serial.println("Supabase RFID HTTPS begin failed");
    return false;
  }

  https.setTimeout(HTTP_TIMEOUT_MS);
  https.addHeader("Content-Type", "application/json");

  char jwtKey[512];
  const size_t jwtLen = sanitizeJwtKey(jwtKey, sizeof(jwtKey), SUPABASE_ANON_KEY);
  if (jwtLen < 50 || countChar(jwtKey, '.') != 2) {
    Serial.println("Supabase key looks malformed; cannot send RFID scan");
    https.end();
    return false;
  }

  https.addHeader("apikey", jwtKey);
  char auth[600];
  const int authN = snprintf(auth, sizeof(auth), "Bearer %s", jwtKey);
  if (authN <= 0 || authN >= (int)sizeof(auth)) {
    Serial.println("Supabase Authorization header too long; cannot send RFID scan");
    https.end();
    return false;
  }
  https.addHeader("Authorization", auth);

  const int httpCode = https.POST(reinterpret_cast<uint8_t*>(body), strlen(body));
  const bool ok = (httpCode >= 200 && httpCode < 300);
  noteHttpResult(httpCode);

  if (DEBUG_HTTP) {
    Serial.print("RFID HTTP status: ");
    Serial.println(httpCode);
    if (!ok) {
      String resp = https.getString();
      if (resp.length() > 0) {
        Serial.print("RFID response: ");
        Serial.println(resp);
      }
    }
    Serial.println("Supabase RFID RPC done");
  }

  https.end();
  return ok;
}

static void senderTask(void*) {
  OutboundEvent ev;
  for (;;) {
    if (!outboundQueue) {
      vTaskDelay(pdMS_TO_TICKS(250));
      continue;
    }
    if (xQueueReceive(outboundQueue, &ev, portMAX_DELAY) != pdTRUE) continue;

    // Prevent occupancy flood from starving RFID events.
    if (ev.type == EVT_OCCUPANCY && uxQueueMessagesWaiting(outboundQueue) > 0) {
      if (xQueueSend(outboundQueue, &ev, 0) == pdTRUE) {
        vTaskDelay(pdMS_TO_TICKS(50));
        continue;
      }
    }

    bool ok = false;
    if (ev.type == EVT_OCCUPANCY) {
      ok = sendOccupancyChangeToSupabase(ev.sensorIdentifier, ev.sensorSecret, ev.change, ev.distanceCm, ev.localCount);
    } else if (ev.type == EVT_RFID) {
      ok = sendRfidScanToSupabase(ev.sensorIdentifier, ev.sensorSecret, ev.rfidUid);
    }

    if (!ok) {
      vTaskDelay(pdMS_TO_TICKS(250));
    }
  }
}

static void rfidTask(void*) {
  // Poll RFID frequently so brief taps are not missed.
  for (;;) {
    const unsigned long now = millis();
    pollRfid(now);
    rfidDiagnostics(now);
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void setup() {
  Serial.begin(115200);

  httpMutex = xSemaphoreCreateMutex();

  ensureWiFiConnected();

  if (RFID_ENABLED) {
    pinMode(RFID_SS_PIN, OUTPUT);
    digitalWrite(RFID_SS_PIN, HIGH);
    pinMode(RFID_RST_PIN, OUTPUT);
    digitalWrite(RFID_RST_PIN, HIGH);
    delay(10);

    // Init SPI + RC522
    SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
    SPI.setFrequency(1000000); // 1 MHz (slower = more tolerant)
    rfid.PCD_Init();
    // Improve read range / robustness
    rfid.PCD_AntennaOn();
    rfid.PCD_SetAntennaGain(rfid.RxGain_max);
    if (DEBUG_RFID) {
      Serial.println("RC522 init...");
      Serial.print("SPI pins | SCK: ");
      Serial.print(RFID_SCK_PIN);
      Serial.print(" | MISO: ");
      Serial.print(RFID_MISO_PIN);
      Serial.print(" | MOSI: ");
      Serial.print(RFID_MOSI_PIN);
      Serial.print(" | SS: ");
      Serial.print(RFID_SS_PIN);
      Serial.print(" | RST: ");
      Serial.println(RFID_RST_PIN);
      Serial.println("RC522 version dump:");
      rfid.PCD_DumpVersionToSerial();

      // RF/antenna diagnostics
      byte txCtrl = rfid.PCD_ReadRegister(MFRC522::TxControlReg);
      Serial.print("RC522 TxControlReg: 0x");
      if (txCtrl < 0x10) Serial.print("0");
      Serial.println(txCtrl, HEX);

      byte gain = rfid.PCD_GetAntennaGain();
      Serial.print("RC522 antenna gain (mask): 0x");
      if (gain < 0x10) Serial.print("0");
      Serial.println(gain, HEX);

      bool selfTestOk = rfid.PCD_PerformSelfTest();
      Serial.print("RC522 self-test: ");
      Serial.println(selfTestOk ? "PASS" : "FAIL");
      if (!selfTestOk) {
        Serial.println("RFID WARNING: Self-test failed. Module/antenna/power may be bad even if VersionReg is OK.");
      }

      byte v = rfid.PCD_ReadRegister(MFRC522::VersionReg);
      Serial.print("RC522 VersionReg raw: 0x");
      if (v < 0x10) Serial.print("0");
      Serial.println(v, HEX);
      if (v == 0x00 || v == 0xFF) {
        Serial.println("RFID WARNING: RC522 not responding (VersionReg is 0x00/0xFF). Check wiring, power (3.3V), and SS/RST pins.");
      }
    } else {
      Serial.println("RC522 initialized");
    }
  } else {
    Serial.println("Occupancy-only diagnostics mode: RFID disabled");
  }

  // Queue + sender task so sensor reads keep running even during HTTPS calls.
  // Includes occupancy events + RFID scans.
  outboundQueue = xQueueCreate(20, sizeof(OutboundEvent));
  if (outboundQueue) {
    xTaskCreatePinnedToCore(senderTask, "sbSender", 12288, nullptr, 1, nullptr, 1);
  } else {
    Serial.println("Failed to create occupancy queue; will send inline");
  }

  // Dedicated RFID polling task keeps scanning even if loop() is busy.
  // Use low priority and core 1 to avoid competing with WiFi/system tasks on core 0.
  if (RFID_ENABLED) {
    xTaskCreatePinnedToCore(rfidTask, "rfid", 4096, nullptr, 0, nullptr, 1);
  }

  pinMode(ENTRY_TRIG_PIN, OUTPUT);
  pinMode(ENTRY_ECHO_PIN, INPUT);
  pinMode(EXIT_TRIG_PIN, OUTPUT);
  pinMode(EXIT_ECHO_PIN, INPUT);

  digitalWrite(ENTRY_TRIG_PIN, LOW);
  digitalWrite(EXIT_TRIG_PIN, LOW);
}

void loop() {
  unsigned long now = millis();

  if (DEBUG_HEARTBEAT && (now - lastHeartbeatMs) > 3000) {
    lastHeartbeatMs = now;
    Serial.print("Heartbeat | WiFi: ");
    Serial.print(WiFi.status() == WL_CONNECTED ? "OK" : "DOWN");
    Serial.print(" | Count: ");
    Serial.println(peopleInside);
  }

  float entryDistance = readDistanceCm(ENTRY_TRIG_PIN, ENTRY_ECHO_PIN);
  float exitDistance = readDistanceCm(EXIT_TRIG_PIN, EXIT_ECHO_PIN);

  bool entryClose = (entryDistance > 0 && entryDistance <= DETECT_THRESHOLD_CM);
  bool exitClose = (exitDistance > 0 && exitDistance <= DETECT_THRESHOLD_CM);

  // Update hit counters
  if (entryClose) entryCloseCount++; else entryCloseCount = 0;
  if (exitClose) exitCloseCount++; else exitCloseCount = 0;

  // Start/advance rearm timers only when far
  if (!entryArmed && !entryClose) {
    if (!entryFarTimerRunning) {
      entryFarSince = now;
      entryFarTimerRunning = true;
    } else if (now - entryFarSince >= REARM_DELAY_MS) {
      entryArmed = true;
      entryFarTimerRunning = false;
    }
  }
  if (!exitArmed && !exitClose) {
    if (!exitFarTimerRunning) {
      exitFarSince = now;
      exitFarTimerRunning = true;
    } else if (now - exitFarSince >= REARM_DELAY_MS) {
      exitArmed = true;
      exitFarTimerRunning = false;
    }
  }

  // Door cooldown: prevents +1 and -1 from firing back-to-back from the same person standing in the doorway.
  // Qualified hits (for decision making)
  bool entryQualified = (entryCloseCount >= REQUIRED_HITS);
  bool exitQualified = (exitCloseCount >= REQUIRED_HITS);

  // If we have a pending decision, either cancel (if other sensor triggers soon) or commit after a short window.
  if (pendingDir != PENDING_NONE) {
    // Cancel if the opposite sensor also triggers within the ambiguous window.
    if ((now - pendingSinceMs) <= AMBIGUOUS_WINDOW_MS) {
      if (pendingDir == PENDING_ENTRY && exitQualified) {
        Serial.println("Entry then exit within window; cancel (no count change)");
        disarmBothAndCooldown(now);
      } else if (pendingDir == PENDING_EXIT && entryQualified) {
        Serial.println("Exit then entry within window; cancel (no count change)");
        disarmBothAndCooldown(now);
      }
    }

    // If not cancelled, commit after the window expires.
    if (pendingDir != PENDING_NONE && (now - pendingSinceMs) >= AMBIGUOUS_WINDOW_MS) {
      if (pendingDir == PENDING_ENTRY) {
        peopleInside++;
        Serial.print("Person entered | Count: ");
        Serial.println(peopleInside);

        const int countAtEvent = peopleInside;
        if (outboundQueue) {
          enqueueOccupancyEvent(ENTRY_SENSOR_IDENTIFIER, ENTRY_SENSOR_SECRET, 1, pendingDistanceCm, countAtEvent);
        } else {
          sendOccupancyChangeToSupabase(ENTRY_SENSOR_IDENTIFIER, ENTRY_SENSOR_SECRET, 1, pendingDistanceCm, countAtEvent);
        }
        disarmBothAndCooldown(now);
      } else if (pendingDir == PENDING_EXIT) {
        if (peopleInside > 0) peopleInside--;
        Serial.print("Person left | Count: ");
        Serial.println(peopleInside);

        const int countAtEvent = peopleInside;
        if (outboundQueue) {
          enqueueOccupancyEvent(EXIT_SENSOR_IDENTIFIER, EXIT_SENSOR_SECRET, -1, pendingDistanceCm, countAtEvent);
        } else {
          sendOccupancyChangeToSupabase(EXIT_SENSOR_IDENTIFIER, EXIT_SENSOR_SECRET, -1, pendingDistanceCm, countAtEvent);
        }
        disarmBothAndCooldown(now);
      }
    }
  } else {
    // No pending: start a decision if we're past cooldown.
    if (now - lastDoorEventMs >= DOOR_EVENT_COOLDOWN_MS) {
      bool entryTrigger = entryArmed && entryQualified;
      bool exitTrigger = exitArmed && exitQualified;

      // If both are already triggered, ignore as ambiguous and disarm until clear.
      if (entryTrigger && exitTrigger) {
        Serial.println("Both sensors triggered; ignoring (no count change)");
        disarmBothAndCooldown(now);
      } else if (entryTrigger) {
        // Delay commit briefly: if the other sensor triggers within AMBIGUOUS_WINDOW_MS, we'll cancel.
        pendingDir = PENDING_ENTRY;
        pendingSinceMs = now;
        pendingDistanceCm = entryDistance;
        // Prevent repeatedly re-triggering while someone is still close.
        entryArmed = false;
        entryFarTimerRunning = false;
        Serial.println("Entry triggered; pending...");
      } else if (exitTrigger) {
        pendingDir = PENDING_EXIT;
        pendingSinceMs = now;
        pendingDistanceCm = exitDistance;
        exitArmed = false;
        exitFarTimerRunning = false;
        Serial.println("Exit triggered; pending...");
      }
    }
  }

  delay(10);
}

static void pollRfid(unsigned long now) {
  // Look for new card
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) {
    if (DEBUG_RFID) Serial.println("RFID: PICC_ReadCardSerial() failed");
    return;
  }

  if (DEBUG_RFID) {
    MFRC522::PICC_Type piccType = rfid.PICC_GetType(rfid.uid.sak);
    Serial.print("RFID tag detected | UID bytes: ");
    Serial.print(rfid.uid.size);
    Serial.print(" | SAK: 0x");
    if (rfid.uid.sak < 0x10) Serial.print("0");
    Serial.print(rfid.uid.sak, HEX);
    Serial.print(" | Type: ");
    Serial.println(rfid.PICC_GetTypeName(piccType));

    if (piccType == MFRC522::PICC_TYPE_UNKNOWN) {
      Serial.println("RFID note: Tag type is UNKNOWN. If this is a 125kHz ID card (HID/EM), RC522 will never read it.");
    }
  }

  String uidHex = formatUidHex(rfid.uid);
  if (uidHex.length() == 0) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  // Debounce: don't spam if card is held to the reader
  if (uidHex == lastRfidUid && (now - lastRfidSeenMs) < RFID_DEBOUNCE_MS) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastRfidUid = uidHex;
  lastRfidSeenMs = now;

  Serial.print("RFID scan UID: ");
  Serial.println(uidHex);

  // Log the scan to Supabase (hashed server-side) so it appears in public.rfid_scans.
  // IMPORTANT: Don't do HTTPS inside the RFID task (stack overflow). Enqueue instead.
  if (outboundQueue) {
    (void)enqueueRfidScanEvent(ENTRY_SENSOR_IDENTIFIER, ENTRY_SENSOR_SECRET, uidHex.c_str());
  } else {
    if (DEBUG_RFID) Serial.println("RFID log skipped (no outbound queue)");
  }

  // Hook for later:
  // - if you add a secure Supabase RPC (recommended), you can send uidHex (or a hash)
  //   without opening up table inserts via anon key.

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

static void rfidDiagnostics(unsigned long now) {
  if (!DEBUG_RFID) return;
  if (now - lastRfidDiagMs < RFID_DIAG_EVERY_MS) return;
  lastRfidDiagMs = now;

  // Quick wiring/communication check. If this is 0x00 or 0xFF, SPI/SS/RST/power is usually wrong.
  byte v = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("RFID diag | VersionReg: 0x");
  if (v < 0x10) Serial.print("0");
  Serial.print(v, HEX);
  const bool bad = (v == 0x00 || v == 0xFF);
  if (bad) {
    Serial.print(" | RC522 NOT RESPONDING");
    if (rfidBadReads < 255) rfidBadReads++;
  } else {
    rfidBadReads = 0;
  }
  Serial.println(" | Present tag: (tap card now)");

  // Auto-recover: if the reader is unresponsive for several consecutive diagnostics,
  // toggle reset and re-init. This helps with intermittent power/noise issues.
  if (bad && rfidBadReads >= 3 && (now - lastRfidRecoverMs) > 3000) {
    lastRfidRecoverMs = now;
    Serial.println("RFID recover: toggling RC522 reset + re-init");
    digitalWrite(RFID_SS_PIN, HIGH);
    digitalWrite(RFID_RST_PIN, LOW);
    delay(50);
    digitalWrite(RFID_RST_PIN, HIGH);
    delay(50);
    SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
    SPI.setFrequency(1000000);
    rfid.PCD_Init();
    rfid.PCD_AntennaOn();
    rfid.PCD_SetAntennaGain(rfid.RxGain_max);
    rfidBadReads = 0;
  }
}

static String formatUidHex(const MFRC522::Uid& uid) {
  String out;
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) out += "0";
    out += String(uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}