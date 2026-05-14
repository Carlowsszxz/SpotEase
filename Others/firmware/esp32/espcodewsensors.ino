he#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/semphr.h"

// --------- PIN DOCUMENTATION ---------
// Entry #2 ultrasonic
//   TRIG: GPIO 23
//   ECHO: GPIO 22
// Entry #1 ultrasonic
//   TRIG: GPIO 26
//   ECHO: GPIO 34
// Exit #1 ultrasonic
//   TRIG: GPIO 25
//   ECHO: GPIO 32
// Exit #2 ultrasonic
//   TRIG: GPIO 27
//   ECHO: GPIO 35
// RFID RC522 (SPI)
//   SDA/SS -> GPIO 5
//   SCK    -> GPIO 18
//   MOSI   -> GPIO 13
//   MISO   -> GPIO 19
//   RST    -> GPIO 21
// RFID status LEDs
//   GREEN  -> GPIO 16
//   RED    -> GPIO 17
// Power is 3.3V + GND.

#define ENTRY_TRIG_PIN 23
#define ENTRY_ECHO_PIN 22
#define ENTRY2_TRIG_PIN 26
#define ENTRY2_ECHO_PIN 34

#define EXIT_TRIG_PIN 25
#define EXIT_ECHO_PIN 32
#define EXIT2_TRIG_PIN 27
#define EXIT2_ECHO_PIN 35

// --------- WIFI ---------
const char* WIFI_SSID = "HPSB Guest";
const char* WIFI_PASSWORD = "carlos1234";

// --------- SUPABASE ---------
// NOTE: The anon key is public for client-side apps, but any sensor secrets must be kept private.
const char* SUPABASE_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3ltanprdWlvaHNxYWxycWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjk2NjMsImV4cCI6MjA4ODIwNTY2M30.CKZoZbIu0MDZplXl_8Qf-K6n5nFaPMvp4ZHp7TcdIkM";
const char* SUPABASE_INGEST_RPC_PATH = "/rest/v1/rpc/ingest_occupancy_change";
static const char* SUPABASE_INGEST_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co/rest/v1/rpc/ingest_occupancy_change";
static const char* SUPABASE_RFID_INGEST_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co/rest/v1/rpc/ingest_rfid_scan";

// --------- DIAGNOSTIC CONFIGURATION ---------
// Enable/disable specific components for testing
static const bool ENABLE_ENTRY_SENSORS = true;  // Set to false to disable entry sensors
static const bool ENABLE_EXIT_SENSORS = true;  // Set to false to disable exit sensors
static const bool ENABLE_RFID = true;          // Set to false to disable RFID reader

// Occupancy-only diagnostics mode: reduce device load and isolate ultrasonic -> Supabase transport.
static const bool OCCUPANCY_ONLY_DIAGNOSTICS = false;
// Temporary debug mode: process entry sensors only, ignore exit sensors.
static const bool ENTRY_DEBUG_ONLY = false;

// These must match rows in public.sensors (sensor_identifier + secret used to generate ingest_secret_hash)
const char* ENTRY_SENSOR_IDENTIFIER = "doorA_entry";
const char* ENTRY_SENSOR_SECRET = "ENTRY_SECRET";
const char* EXIT_SENSOR_IDENTIFIER = "doorA_exit";
const char* EXIT_SENSOR_SECRET = "EXIT_SECRET";

// --------- RFID (RC522) ---------
// SDA/SS -> GPIO 5
// SCK    -> GPIO 18
// MOSI   -> GPIO 13
// MISO   -> GPIO 19
// RST    -> GPIO 21
#define RFID_SS_PIN 5
#define RFID_SCK_PIN 18
#define RFID_MOSI_PIN 13
#define RFID_MISO_PIN 19
#define RFID_RST_PIN 21

// RFID status LED (red only)
// OFF = ready/idle
// ON  = tap/processing/error pulse
#define RFID_RED_LED_PIN 17

// --------- SENSOR LOGIC ---------
const float DETECT_THRESHOLD_CM = 25.0;
const int REQUIRED_HITS = 1;
const unsigned long REARM_DELAY_MS = 500;
const unsigned long DOOR_EVENT_COOLDOWN_MS = 250;
const unsigned long AMBIGUOUS_WINDOW_MS = 200;  // if both sensors trigger within this window, treat as no-op
const unsigned long SEQUENCE_CONFIRM_MS = 1200;

// --------- DEBUG ---------
static const bool DEBUG_HTTP = true;
static const bool DEBUG_WIFI = true;
static const bool DEBUG_HEARTBEAT = true;
static const bool DEBUG_RFID = false;

static const uint32_t HTTP_TIMEOUT_MS = 5000;
static const uint32_t HTTP_MIN_GAP_MS = 1200;
static const uint32_t HTTP_FAIL_BACKOFF_MS = 7000;
static const unsigned long RFID_DEBOUNCE_MS = 2500;
static const unsigned long RFID_DIAG_EVERY_MS = 2000;
static const unsigned long RFID_ENTRY_SUPPRESS_MS = 2500;
static const bool RFID_RED_SAMPLE_BLINK_ON_BOOT = true;

static unsigned long lastHeartbeatMs = 0;
static unsigned long lastDoorEventMs = 0;
static unsigned long nextHttpAttemptAtMs = 0;
static int8_t lastOccupancyQueuedChange = 0;
static unsigned long lastOccupancyQueuedAtMs = 0;
static unsigned long lastRfidDiagMs = 0;
static unsigned long lastRfidSeenMs = 0;
static unsigned long lastRfidRecoverMs = 0;
static unsigned long lastRfidScanMs = 0;
static String lastRfidUid = "";
static uint8_t rfidBadReads = 0;
static volatile bool suppressNextEntryFromRfid = false;

enum PendingDir : uint8_t { PENDING_NONE = 0,
                            PENDING_ENTRY = 1,
                            PENDING_EXIT = 2 };
static PendingDir pendingDir = PENDING_NONE;
static unsigned long pendingSinceMs = 0;
static float pendingDistanceCm = -1.0;

int entryCloseCount = 0;
int exitCloseCount = 0;
int entry2CloseCount = 0;
int exit2CloseCount = 0;

enum SideSeqState : uint8_t { SEQ_IDLE = 0,
                              SEQ_WAIT_SECOND = 1 };
SideSeqState entrySeqState = SEQ_IDLE;
SideSeqState exitSeqState = SEQ_IDLE;
unsigned long entrySeqSinceMs = 0;
unsigned long exitSeqSinceMs = 0;
float entrySeqDistanceCm = -1.0;
float exitSeqDistanceCm = -1.0;
bool entrySeqFirstWasPrimary = true;
bool exitSeqFirstWasPrimary = true;

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
static void pollRfid(unsigned long now);
static void rfidDiagnostics(unsigned long now);
static String formatUidHex(const MFRC522::Uid& uid);
static void setRfidReadyLed(bool ready);
static void flashRfidSuccessLed();
static void flashRfidErrorLed();
static void sampleBlinkRed(uint8_t times, uint16_t onMs, uint16_t offMs);

static size_t sanitizeJwtKey(char* out, size_t outLen, const char* in);
static int countChar(const char* s, char ch);
static void printJwtShapeDebug(const char* label, const char* jwt);
static bool allowHttpAttempt(const char* tag);
static void noteHttpResult(int httpCode);

static SemaphoreHandle_t httpMutex = nullptr;

struct ScopedMutex {
  SemaphoreHandle_t m;
  bool acquired;
  ScopedMutex(SemaphoreHandle_t mutex, TickType_t waitTicks)
    : m(mutex), acquired(false) {
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

enum OutboundEventType : uint8_t { EVT_OCCUPANCY = 1,
                                   EVT_RFID = 2 };

struct OutboundEvent {
  uint8_t type;
  uint8_t retryCount;
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
static MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

static void setRfidReadyLed(bool ready) {
  digitalWrite(RFID_RED_LED_PIN, ready ? LOW : HIGH);
}

static void flashRfidSuccessLed() {
  digitalWrite(RFID_RED_LED_PIN, HIGH);
  delay(120);
  digitalWrite(RFID_RED_LED_PIN, LOW);
}

static void flashRfidErrorLed() {
  digitalWrite(RFID_RED_LED_PIN, HIGH);
  delay(220);
  digitalWrite(RFID_RED_LED_PIN, LOW);
}

static void sampleBlinkRed(uint8_t times, uint16_t onMs, uint16_t offMs) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(RFID_RED_LED_PIN, HIGH);
    delay(onMs);
    digitalWrite(RFID_RED_LED_PIN, LOW);
    delay(offMs);
  }
  setRfidReadyLed(true);
}

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
  entry2CloseCount = 0;
  exit2CloseCount = 0;
  entrySeqState = SEQ_IDLE;
  exitSeqState = SEQ_IDLE;
  entrySeqSinceMs = 0;
  exitSeqSinceMs = 0;
  entrySeqDistanceCm = -1.0;
  exitSeqDistanceCm = -1.0;
  entrySeqFirstWasPrimary = true;
  exitSeqFirstWasPrimary = true;
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
  ev.retryCount = 0;
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
  ev.retryCount = 0;
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
    localCount);
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
    localCount);
  return (n > 0) && (static_cast<size_t>(n) < outLen);
}

static bool buildRfidPayload(char* out, size_t outLen, const char* sensorIdentifier, const char* sensorSecret, const char* uidHex) {
  if (!out || outLen == 0) return false;
  const int n = snprintf(
    out,
    outLen,
    "{\"p_sensor_identifier\":\"%s\",\"p_secret\":\"%s\",\"p_tag_uid\":\"%s\"}",
    sensorIdentifier,
    sensorSecret,
    uidHex);
  return (n > 0) && (static_cast<size_t>(n) < outLen);
}

float readDistanceCm(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 12000);  // faster timeout
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

  const char* headerKeys[] = { "content-type", "content-range" };
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

  char body[256];
  if (!buildRfidPayload(body, sizeof(body), sensorIdentifier, sensorSecret, uidHex)) {
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
    } else {
      Serial.println("Supabase RFID RPC done");
    }
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

    // Prevent occupancy flood from causing queue churn.
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
      setRfidReadyLed(false);  // red ON while RFID upload is in progress
      ok = sendRfidScanToSupabase(ev.sensorIdentifier, ev.sensorSecret, ev.rfidUid);
      if (ok) {
        setRfidReadyLed(true);  // red OFF when upload succeeds
      } else {
        flashRfidErrorLed();  // brief error pulse, then back to ready
        setRfidReadyLed(true);
      }
    }

    if (!ok) {
      vTaskDelay(pdMS_TO_TICKS(350));
    }
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

static void pollRfid(unsigned long now) {
  if ((now - lastRfidScanMs) < 100) return;

  if (!rfid.PICC_IsNewCardPresent()) return;

  // Red-only UX: turn red on while processing a tap.
  setRfidReadyLed(false);

  if (!rfid.PICC_ReadCardSerial()) {
    if (DEBUG_RFID) Serial.println("RFID: PICC_ReadCardSerial() failed");
    flashRfidErrorLed();
    setRfidReadyLed(true);  // Reset LED to ready if read fails
    return;
  }

  String uidHex = formatUidHex(rfid.uid);
  if (uidHex.length() == 0) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    flashRfidErrorLed();
    setRfidReadyLed(true);  // Reset LED to ready if UID is empty
    return;
  }

  if (uidHex == lastRfidUid && (now - lastRfidSeenMs) < RFID_DEBOUNCE_MS) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    setRfidReadyLed(true);  // Reset LED to ready if debounced
    return;
  }

  lastRfidUid = uidHex;
  lastRfidSeenMs = now;
  lastRfidScanMs = now;
  suppressNextEntryFromRfid = true;

  Serial.print("RFID scan UID: ");
  Serial.println(uidHex);

  if (outboundQueue) {
    if (!enqueueRfidScanEvent(ENTRY_SENSOR_IDENTIFIER, ENTRY_SENSOR_SECRET, uidHex.c_str())) {
      flashRfidErrorLed();
      setRfidReadyLed(true);
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      return;
    }
  } else {
    setRfidReadyLed(false);  // red ON while RFID upload is in progress
    sendRfidScanToSupabase(ENTRY_SENSOR_IDENTIFIER, ENTRY_SENSOR_SECRET, uidHex.c_str());
    setRfidReadyLed(true);  // red OFF when done
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

static void rfidDiagnostics(unsigned long now) {
  if (!DEBUG_RFID) return;
  if (now - lastRfidDiagMs < RFID_DIAG_EVERY_MS) return;
  lastRfidDiagMs = now;

  byte v = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("RFID diag | VersionReg: 0x");
  if (v < 0x10) Serial.print("0");
  Serial.print(v, HEX);

  const bool bad = (v == 0x00 || v == 0xFF);
  if (bad) {
    Serial.print(" | RC522 NOT RESPONDING");
    if (rfidBadReads < 255) rfidBadReads++;
    digitalWrite(RFID_RED_LED_PIN, HIGH);
  } else {
    rfidBadReads = 0;
    setRfidReadyLed(true);
  }
  Serial.println(" | Present tag: (tap card now)");

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

void setup() {
  Serial.begin(115200);

  httpMutex = xSemaphoreCreateMutex();

  // RFID initialization (conditional on ENABLE_RFID)
  if (ENABLE_RFID) {
    pinMode(RFID_SS_PIN, OUTPUT);
    digitalWrite(RFID_SS_PIN, HIGH);
    pinMode(RFID_RST_PIN, OUTPUT);
    digitalWrite(RFID_RST_PIN, HIGH);
    pinMode(RFID_RED_LED_PIN, OUTPUT);
    setRfidReadyLed(true);
    if (RFID_RED_SAMPLE_BLINK_ON_BOOT) {
      sampleBlinkRed(3, 180, 140);
    }
    delay(10);

    SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
    SPI.setFrequency(1000000);
    rfid.PCD_Init();
    rfid.PCD_AntennaOn();
    rfid.PCD_SetAntennaGain(rfid.RxGain_max);
    setRfidReadyLed(true);
    Serial.println("RFID enabled");
  } else {
    Serial.println("RFID disabled (diagnostic mode)");
  }

  ensureWiFiConnected();

  // Queue + sender task so sensor reads keep running even during HTTPS calls.
  // Includes occupancy events.
  outboundQueue = xQueueCreate(40, sizeof(OutboundEvent));
  if (outboundQueue) {
    xTaskCreatePinnedToCore(senderTask, "sbSender", 12288, nullptr, 1, nullptr, 1);
  } else {
    Serial.println("Failed to create occupancy queue; will send inline");
  }

  // Sensor initialization (conditional on ENABLE_ENTRY_SENSORS and ENABLE_EXIT_SENSORS)
  if (ENABLE_ENTRY_SENSORS) {
    pinMode(ENTRY_TRIG_PIN, OUTPUT);
    pinMode(ENTRY_ECHO_PIN, INPUT);
    pinMode(ENTRY2_TRIG_PIN, OUTPUT);
    pinMode(ENTRY2_ECHO_PIN, INPUT);
    digitalWrite(ENTRY_TRIG_PIN, LOW);
    digitalWrite(ENTRY2_TRIG_PIN, LOW);
    Serial.println("Entry sensors enabled");
  } else {
    Serial.println("Entry sensors disabled (diagnostic mode)");
  }

  if (ENABLE_EXIT_SENSORS && !ENTRY_DEBUG_ONLY) {
    pinMode(EXIT_TRIG_PIN, OUTPUT);
    pinMode(EXIT_ECHO_PIN, INPUT);
    pinMode(EXIT2_TRIG_PIN, OUTPUT);
    pinMode(EXIT2_ECHO_PIN, INPUT);
    digitalWrite(EXIT_TRIG_PIN, LOW);
    digitalWrite(EXIT2_TRIG_PIN, LOW);
    Serial.println("Exit sensors enabled");
  } else {
    Serial.println("Exit sensors disabled (diagnostic mode)");
  }
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

  if (ENABLE_RFID) {
    rfidDiagnostics(now);
    pollRfid(now);
  }

  float entryDistance = -1.0;
  float entry2Distance = -1.0;
  float exitDistance = -1.0;
  float exit2Distance = -1.0;

  if (ENABLE_ENTRY_SENSORS) {
    entryDistance = readDistanceCm(ENTRY_TRIG_PIN, ENTRY_ECHO_PIN);
    entry2Distance = readDistanceCm(ENTRY2_TRIG_PIN, ENTRY2_ECHO_PIN);
  }

  if (ENABLE_EXIT_SENSORS && !ENTRY_DEBUG_ONLY) {
    exitDistance = readDistanceCm(EXIT_TRIG_PIN, EXIT_ECHO_PIN);
    exit2Distance = readDistanceCm(EXIT2_TRIG_PIN, EXIT2_ECHO_PIN);
  }

  bool entryClose = (entryDistance > 0 && entryDistance <= DETECT_THRESHOLD_CM);
  bool entry2Close = (entry2Distance > 0 && entry2Distance <= DETECT_THRESHOLD_CM);
  bool exitClose = (exitDistance > 0 && exitDistance <= DETECT_THRESHOLD_CM);
  bool exit2Close = (exit2Distance > 0 && exit2Distance <= DETECT_THRESHOLD_CM);

  // Update hit counters
  if (entryClose) entryCloseCount++;
  else entryCloseCount = 0;
  if (entry2Close) entry2CloseCount++;
  else entry2CloseCount = 0;
  if (!ENTRY_DEBUG_ONLY) {
    if (exitClose) exitCloseCount++;
    else exitCloseCount = 0;
    if (exit2Close) exit2CloseCount++;
    else exit2CloseCount = 0;
  } else {
    exitCloseCount = 0;
    exit2CloseCount = 0;
  }

  // Start/advance rearm timers only when far
  if (!entryArmed && !entryClose && !entry2Close) {
    if (!entryFarTimerRunning) {
      entryFarSince = now;
      entryFarTimerRunning = true;
    } else if (now - entryFarSince >= REARM_DELAY_MS) {
      entryArmed = true;
      entryFarTimerRunning = false;
    }
  }
  if (!ENTRY_DEBUG_ONLY && !exitArmed && !exitClose && !exit2Close) {
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
  bool entryPrimaryQualified = (entry2CloseCount >= REQUIRED_HITS);
  bool entrySecondaryQualified = (entryCloseCount >= REQUIRED_HITS);
  bool exitPrimaryQualified = (exitCloseCount >= REQUIRED_HITS);
  bool exitSecondaryQualified = (exit2CloseCount >= REQUIRED_HITS);

  if (entrySeqState == SEQ_WAIT_SECOND && (now - entrySeqSinceMs) > SEQUENCE_CONFIRM_MS) {
    entrySeqState = SEQ_IDLE;
    entrySeqSinceMs = 0;
    entrySeqDistanceCm = -1.0;
    Serial.println("Entry sequence timed out (no second sensor confirmation)");
  }
  if (!ENTRY_DEBUG_ONLY && exitSeqState == SEQ_WAIT_SECOND && (now - exitSeqSinceMs) > SEQUENCE_CONFIRM_MS) {
    exitSeqState = SEQ_IDLE;
    exitSeqSinceMs = 0;
    exitSeqDistanceCm = -1.0;
    Serial.println("Exit sequence timed out (no second sensor confirmation)");
  }

  int8_t entrySequenceChange = 0;
  int8_t exitSequenceChange = 0;

  if (entryArmed) {
    if (entrySeqState == SEQ_IDLE) {
      if (entryPrimaryQualified && !entrySecondaryQualified) {
        entrySeqState = SEQ_WAIT_SECOND;
        entrySeqSinceMs = now;
        entrySeqDistanceCm = entry2Distance;
        entrySeqFirstWasPrimary = true;
      } else if (entrySecondaryQualified && !entryPrimaryQualified) {
        entrySeqState = SEQ_WAIT_SECOND;
        entrySeqSinceMs = now;
        entrySeqDistanceCm = entryDistance;
        entrySeqFirstWasPrimary = false;
      }
    } else if (entrySeqState == SEQ_WAIT_SECOND) {
      if (entrySeqFirstWasPrimary && entrySecondaryQualified) {
        entrySequenceChange = 1;
        entrySeqState = SEQ_IDLE;
        entrySeqSinceMs = 0;
      } else if (!entrySeqFirstWasPrimary && entryPrimaryQualified) {
        entrySequenceChange = -1;
        entrySeqState = SEQ_IDLE;
        entrySeqSinceMs = 0;
      }
    }
  }

  if (!ENTRY_DEBUG_ONLY && exitArmed) {
    if (exitSeqState == SEQ_IDLE) {
      if (exitPrimaryQualified && !exitSecondaryQualified) {
        exitSeqState = SEQ_WAIT_SECOND;
        exitSeqSinceMs = now;
        exitSeqDistanceCm = exitDistance;
        exitSeqFirstWasPrimary = true;
      } else if (exitSecondaryQualified && !exitPrimaryQualified) {
        exitSeqState = SEQ_WAIT_SECOND;
        exitSeqSinceMs = now;
        exitSeqDistanceCm = exit2Distance;
        exitSeqFirstWasPrimary = false;
      }
    } else if (exitSeqState == SEQ_WAIT_SECOND) {
      if (exitSeqFirstWasPrimary && exitSecondaryQualified) {
        exitSequenceChange = 1;
        exitSeqState = SEQ_IDLE;
        exitSeqSinceMs = 0;
      } else if (!exitSeqFirstWasPrimary && exitPrimaryQualified) {
        exitSequenceChange = -1;
        exitSeqState = SEQ_IDLE;
        exitSeqSinceMs = 0;
      }
    }
  }

  // If we have a pending decision, either cancel (if other sensor triggers soon) or commit after a short window.
  if (pendingDir != PENDING_NONE) {
    // Cancel if the opposite sensor also triggers within the ambiguous window.
    if ((now - pendingSinceMs) <= AMBIGUOUS_WINDOW_MS) {
      if (pendingDir == PENDING_ENTRY && !ENTRY_DEBUG_ONLY && exitSequenceChange != 0) {
        Serial.println("Entry then exit within window; cancel (no count change)");
        disarmBothAndCooldown(now);
      } else if (pendingDir == PENDING_EXIT && entrySequenceChange != 0) {
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
        if (ENTRY_DEBUG_ONLY) {
          disarmBothAndCooldown(now);
          delay(10);
          return;
        }
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
      if (suppressNextEntryFromRfid && (now - lastRfidScanMs) > RFID_ENTRY_SUPPRESS_MS) {
        suppressNextEntryFromRfid = false;
      }

      bool entryTrigger = entryArmed && (entrySequenceChange != 0);
      if (suppressNextEntryFromRfid) {
        entryTrigger = false;
      }
      bool exitTrigger = (!ENTRY_DEBUG_ONLY) && exitArmed && (exitSequenceChange != 0);

      // If both are already triggered, ignore as ambiguous and disarm until clear.
      if (entryTrigger && exitTrigger) {
        Serial.println("Both sensors triggered; ignoring (no count change)");
        disarmBothAndCooldown(now);
      } else if (entryTrigger) {
        // Delay commit briefly: if the other sensor triggers within AMBIGUOUS_WINDOW_MS, we'll cancel.
        pendingDir = (entrySequenceChange > 0) ? PENDING_ENTRY : PENDING_EXIT;
        pendingSinceMs = now;
        pendingDistanceCm = entrySeqDistanceCm;
        // Prevent repeatedly re-triggering while someone is still close.
        entryArmed = false;
        entryFarTimerRunning = false;
        if (pendingDir == PENDING_ENTRY) {
          Serial.println("Entry sequence confirmed; pending...");
        } else {
          Serial.println("Reversed entry sequence confirmed; pending exit...");
        }
      } else if (exitTrigger) {
        pendingDir = (exitSequenceChange > 0) ? PENDING_EXIT : PENDING_ENTRY;
        pendingSinceMs = now;
        pendingDistanceCm = exitSeqDistanceCm;
        exitArmed = false;
        exitFarTimerRunning = false;
        if (pendingDir == PENDING_EXIT) {
          Serial.println("Exit sequence confirmed; pending...");
        } else {
          Serial.println("Reversed exit sequence confirmed; pending entry...");
        }
      }
    }
  }

  delay(10);
}can