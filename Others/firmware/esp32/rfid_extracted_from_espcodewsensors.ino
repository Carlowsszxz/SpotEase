// Extracted RFID code from espcodewsensors.ino
// This file is for reference only and is not compiled.

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/semphr.h"

// Standalone compatibility for this extracted sketch.
static const bool OCCUPANCY_ONLY_DIAGNOSTICS = false;
const char* ENTRY_SENSOR_IDENTIFIER = "doorA_entry";
const char* ENTRY_SENSOR_SECRET = "ENTRY_SECRET";

enum OutboundEventType : uint8_t { EVT_OCCUPANCY = 1, EVT_RFID = 2, EVT_BLE = 3 };

struct OutboundEvent {
  uint8_t type;
  uint8_t retryCount;
  char sensorIdentifier[32];
  char sensorSecret[64];
  char rfidUid[32];
  uint32_t queuedAtMs;
};

static QueueHandle_t outboundQueue = nullptr;
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

// --------- WIFI ---------
const char* WIFI_SSID = "JOSHUA 24:15/ 4G";
const char* WIFI_PASSWORD = "Tend@wifi";

// --------- SUPABASE ---------
// NOTE: The anon key is public for client-side apps, but any sensor secrets must be kept private.
const char* SUPABASE_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3ltanprdWlvaHNxYWxycWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjk2NjMsImV4cCI6MjA4ODIwNTY2M30.CKZoZbIu0MDZplXl_8Qf-K6n5nFaPMvp4ZHp7TcdIkM";
static const uint32_t HTTP_TIMEOUT_MS = 5000;
static const bool DEBUG_WIFI = true;
static const bool DEBUG_HTTP = true;

static unsigned long nextHttpAttemptAtMs = 0;

static size_t sanitizeJwtKey(char* out, size_t outLen, const char* in);
static int countChar(const char* s, char ch);
static bool allowHttpAttempt(const char* tag);
static void noteHttpResult(int httpCode);
static bool ensureWiFiConnected();

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

static const char* SUPABASE_RFID_INGEST_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co/rest/v1/rpc/ingest_rfid_scan";
static const bool RFID_ENABLED = !OCCUPANCY_ONLY_DIAGNOSTICS;
static const bool DEBUG_RFID = false;
static const unsigned long RFID_ENTRY_SUPPRESS_MS = 2500;
static unsigned long lastRfidDiagMs = 0;
static const unsigned long RFID_DIAG_EVERY_MS = 2000;
static volatile unsigned long lastRfidScanMs = 0;
static volatile bool suppressNextEntryFromRfid = false;

static bool sendRfidScanToSupabase(const char* sensorIdentifier, const char* sensorSecret, const char* uidHex);
static void pollRfid(unsigned long now);
static String formatUidHex(const MFRC522::Uid& uid);
static void rfidDiagnostics(unsigned long now);
static void rfidTask(void*);

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
    if (DEBUG_WIFI) Serial.print('.');
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

static bool allowHttpAttempt(const char* tag) {
  const unsigned long now = millis();
  if (now < nextHttpAttemptAtMs) {
    if (DEBUG_HTTP) {
      Serial.print("HTTP throttled for ");
      Serial.println(tag ? tag : "unknown");
    }
    return false;
  }
  return true;
}

static void noteHttpResult(int httpCode) {
  if (httpCode >= 200 && httpCode < 300) {
    nextHttpAttemptAtMs = millis();
    return;
  }
  nextHttpAttemptAtMs = millis() + 1200;
}

// Outbound event variant used by RFID
// enum OutboundEventType : uint8_t { EVT_OCCUPANCY = 1, EVT_RFID = 2, EVT_BLE = 3 };
// char rfidUid[32];

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

static void rfidTask(void*) {
  for (;;) {
    const unsigned long now = millis();
    pollRfid(now);
    rfidDiagnostics(now);
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// setup() block originally used for RC522 init:
// if (RFID_ENABLED) {
//   pinMode(RFID_SS_PIN, OUTPUT);
//   digitalWrite(RFID_SS_PIN, HIGH);
//   pinMode(RFID_RST_PIN, OUTPUT);
//   digitalWrite(RFID_RST_PIN, HIGH);
//   delay(10);
//   SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
//   SPI.setFrequency(1000000);
//   rfid.PCD_Init();
//   rfid.PCD_AntennaOn();
//   rfid.PCD_SetAntennaGain(rfid.RxGain_max);
// }

static void pollRfid(unsigned long now) {
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
  }

  String uidHex = formatUidHex(rfid.uid);
  if (uidHex.length() == 0) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  if (uidHex == lastRfidUid && (now - lastRfidSeenMs) < RFID_DEBOUNCE_MS) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastRfidUid = uidHex;
  lastRfidSeenMs = now;
  lastRfidScanMs = now;
  suppressNextEntryFromRfid = true;

  Serial.print("RFID scan UID: ");
  Serial.println(uidHex);

  if (outboundQueue) {
    (void)enqueueRfidScanEvent(ENTRY_SENSOR_IDENTIFIER, ENTRY_SENSOR_SECRET, uidHex.c_str());
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
  } else {
    rfidBadReads = 0;
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

static String formatUidHex(const MFRC522::Uid& uid) {
  String out;
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) out += "0";
    out += String(uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}

void setup() {
  Serial.begin(115200);
  delay(100);

  if (RFID_ENABLED) {
    pinMode(RFID_SS_PIN, OUTPUT);
    digitalWrite(RFID_SS_PIN, HIGH);
    pinMode(RFID_RST_PIN, OUTPUT);
    digitalWrite(RFID_RST_PIN, HIGH);
    delay(10);

    SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
    SPI.setFrequency(1000000);
    rfid.PCD_Init();
    rfid.PCD_AntennaOn();
    rfid.PCD_SetAntennaGain(rfid.RxGain_max);
  }

  ensureWiFiConnected();
}

void loop() {
  const unsigned long now = millis();
  pollRfid(now);
  rfidDiagnostics(now);
  delay(50);
}
