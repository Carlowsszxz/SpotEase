#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

BLEScan* pBLEScan;
int scanTime = 5; // seconds

// ===== Wi-Fi config =====
const char* WIFI_SSID = "JOSHUA 24:15/ 4G";
const char* WIFI_PASSWORD = "Tend@wifi";

// ===== Supabase config =====
const char* SUPABASE_URL = "https://xsgymjzkuiohsqalrqkw.supabase.co";
const char* SUPABASE_HOST = "xsgymjzkuiohsqalrqkw.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3ltanprdWlvaHNxYWxycWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjk2NjMsImV4cCI6MjA4ODIwNTY2M30.CKZoZbIu0MDZplXl_8Qf-K6n5nFaPMvp4ZHp7TcdIkM";
const char* SUPABASE_TABLE = "ble_scans";

const unsigned long WIFI_RETRY_MS = 4000;
const unsigned long WIFI_CONNECT_WAIT_MS = 12000;
unsigned long lastWifiRetryMs = 0;
unsigned long scanBatchId = 0;
bool wifiConnectRequested = false;

String gatewayId;

const char* wifiStatusLabel(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS: return "IDLE";
    case WL_NO_SSID_AVAIL: return "NO_SSID";
    case WL_SCAN_COMPLETED: return "SCAN_COMPLETED";
    case WL_CONNECTED: return "CONNECTED";
    case WL_CONNECT_FAILED: return "CONNECT_FAILED";
    case WL_CONNECTION_LOST: return "CONNECTION_LOST";
    case WL_DISCONNECTED: return "DISCONNECTED";
    default: return "UNKNOWN";
  }
}

String toSafeAsciiText(const String& input) {
  String output;
  output.reserve(input.length());
  for (size_t i = 0; i < input.length(); i++) {
    unsigned char c = (unsigned char)input.charAt(i);
    if (c >= 32 && c <= 126) {
      output += (char)c;
    } else {
      output += '?';
    }
  }
  return output;
}

String buildPlainTextRecord(const String& gateway, unsigned long batchId, const String& address, const String& name, int rssi) {
  String line;
  line.reserve(128);
  line += "gateway_id=" + toSafeAsciiText(gateway);
  line += "|scan_batch=" + String(batchId);
  line += "|device_address=" + toSafeAsciiText(address);
  line += "|device_name=" + toSafeAsciiText(name);
  line += "|rssi=" + String(rssi);
  return line;
}

bool postPayloadToProxy(const String& endpoint, const String& payload, int maxAttempts) {
  for (int attempt = 1; attempt <= maxAttempts; attempt++) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Wi-Fi dropped before POST. Reconnecting...");
      ensureWiFiConnected();
      if (!waitForWiFiConnected(8000)) {
        Serial.println("Wi-Fi not ready for POST attempt.");
        delay(500);
        continue;
      }
    }

    Serial.print("POST attempt ");
    Serial.print(attempt);
    Serial.print(" payload bytes: ");
    Serial.println(payload.length());

    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(15000);

    HTTPClient http;
    http.setTimeout(15000);
    http.setConnectTimeout(15000);
    http.setReuse(false);
    http.useHTTP10(true);

    Serial.println("Opening HTTPS endpoint...");
    if (!http.begin(client, endpoint)) {
      Serial.print("Failed to open HTTPS connection (attempt ");
      Serial.print(attempt);
      Serial.println(").");
      delay(500);
      continue;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
    http.addHeader("Prefer", "return=minimal");
    http.addHeader("Connection", "close");

    Serial.println("Sending POST...");
    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.print("Supabase POST status: ");
      Serial.println(httpCode);
      if (httpCode >= 200 && httpCode < 300) {
        http.end();
        return true;
      }

      String responseBody = http.getString();
      Serial.println("Supabase error body:");
      Serial.println(responseBody);
    } else {
      Serial.print("HTTP POST failed (attempt ");
      Serial.print(attempt);
      Serial.print(", code ");
      Serial.print(httpCode);
      Serial.print("): ");
      Serial.println(http.errorToString(httpCode));
    }

    http.end();
    delay(500);
  }

  return false;
}

void ensureWiFiConnected() {
  wl_status_t statusNow = WiFi.status();

  if (statusNow == WL_CONNECTED) {
    wifiConnectRequested = false;
    return;
  }

  unsigned long now = millis();
  bool shouldAttempt = false;

  if (!wifiConnectRequested) {
    shouldAttempt = true;
  } else if (statusNow == WL_CONNECT_FAILED || statusNow == WL_CONNECTION_LOST || statusNow == WL_NO_SSID_AVAIL || statusNow == WL_DISCONNECTED) {
    shouldAttempt = true;
  }

  if (!shouldAttempt) {
    return;
  }

  bool isInitialAttempt = !wifiConnectRequested;
  if (!isInitialAttempt && (now - lastWifiRetryMs < WIFI_RETRY_MS)) {
    return;
  }
  lastWifiRetryMs = now;

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  wifiConnectRequested = true;
}

bool waitForWiFiConnected(unsigned long timeoutMs) {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    wl_status_t statusNow = WiFi.status();
    if (statusNow == WL_CONNECTED) {
      return true;
    }
    delay(200);
  }

  wl_status_t s = WiFi.status();
  Serial.print("Wi-Fi not ready yet. Status: ");
  Serial.print((int)s);
  Serial.print(" (");
  Serial.print(wifiStatusLabel(s));
  Serial.println(")");
  return false;
}

bool postScanResults(BLEScanResults* foundDevices) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi not connected, skipping Supabase upload.");
    return false;
  }

  int deviceCount = foundDevices->getCount();
  if (deviceCount == 0) {
    Serial.println("No BLE devices to upload.");
    return true;
  }

  Serial.print("Uploading BLE rows: ");
  Serial.println(deviceCount);

  String payload = "[";
  for (int i = 0; i < deviceCount; i++) {
    BLEAdvertisedDevice device = foundDevices->getDevice(i);
    String address = toSafeAsciiText(device.getAddress().toString().c_str());
    String name = device.haveName() ? toSafeAsciiText(String(device.getName().c_str())) : "";

    if (i > 0) {
      payload += ",";
    }

    payload += "{";
    payload += "\"gateway_id\":\"" + toSafeAsciiText(gatewayId) + "\",";
    payload += "\"scan_batch\":" + String(scanBatchId) + ",";
    payload += "\"device_address\":\"" + address + "\",";
    payload += "\"device_name\":";
    if (device.haveName()) {
      payload += "\"" + name + "\",";
    } else {
      payload += "null,";
    }
    payload += "\"rssi\":" + String(device.getRSSI());
    payload += "}";
  }

  payload += "]";

  return postPayloadToProxy(String(SUPABASE_URL) + "/rest/v1/" + SUPABASE_TABLE, payload, 2);
}

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE scanner + Supabase uploader...");

  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);
  ensureWiFiConnected();
  waitForWiFiConnected(WIFI_CONNECT_WAIT_MS);

  gatewayId = WiFi.macAddress();
  gatewayId.replace(":", "-");

  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setActiveScan(true);
}

void loop() {
  ensureWiFiConnected();

  if (!waitForWiFiConnected(8000)) {
    Serial.println("Wi-Fi still not connected, skipping scan cycle.");
    delay(1500);
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected, IP: ");
    Serial.println(WiFi.localIP());
  }

  scanBatchId++;
  Serial.println("Scanning...");
  BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);

  Serial.print("Devices found: ");
  Serial.println(foundDevices->getCount());

  for (int i = 0; i < foundDevices->getCount(); i++) {
    BLEAdvertisedDevice device = foundDevices->getDevice(i);

    Serial.print("Address: ");
    Serial.print(device.getAddress().toString().c_str());

    Serial.print("  Name: ");
    if (device.haveName()) {
      Serial.print(device.getName().c_str());
    } else {
      Serial.print("(no name)");
    }

    Serial.print("  RSSI: ");
    Serial.println(device.getRSSI());
  }

  bool uploadOk = postScanResults(foundDevices);
  Serial.print("Upload result: ");
  Serial.println(uploadOk ? "OK" : "FAILED");

  pBLEScan->clearResults();  // free memory
  delay(2000);
}