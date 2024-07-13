#include <WiFi.h>
#include <esp_wifi.h>

// stored validated ssid and password for reconnect
String wifi_ssid;
String wifi_password;

// Setup for attempting to connect WiFi
const uint CONNECTION_ATTEMPTS = 5;
const ulong ATTEMPT_TIMEOUT_MS = 10 * 1000;

// Interval between each wake to reconnect WiFi
const ulong TIMER_WAKEUP_US = 60 * 1000000;
ulong wifiTimer;

// Memory settings for ssid and password
const int SSID_ADDRESS = 0;
const int PASSWORD_ADDRESS = 256;

/**
* @brief Attempt to connect to WiFi with defined number of ATTEMPTS and TIMEOUT_PER_ATTEMPT.
*
* @param ssid
* @param password
*
* @return true if WiFi.status() == WL_CONNECTED, else false
*/
bool connectWiFi(const String& ssid, const String& password) {
    WiFi.disconnect(true, true);
    for (int i = 0; i < CONNECTION_ATTEMPTS; ++i) {
        WiFi.begin(ssid, password);
        if (WiFi.waitForConnectResult(ATTEMPT_TIMEOUT_MS) == WL_CONNECTED) {
            return true;
        }
        WiFi.disconnect(false, true);
        delay(150);
    }
    return false;
}

/**
* @brief To be placed in loop() to handle reconnect in async manner.
 * Enter light sleep mode and wake up periodically to reconnect if first attempt failed.
*
* @param None
*
* @return true if WiFi.status() == WL_CONNECTED, else false
*/
bool loopReconnect() {
    if (WiFiClass::status() != WL_CONNECTED && !wifi_ssid.isEmpty() && !wifi_password.isEmpty()) {
        Serial.print("Connection lost. Reconnecting to WiFi...");
        delay(500);
        WiFi.disconnect();
        if (!connectWiFi(wifi_ssid, wifi_password)) {
            Serial.println("Connection failed!");
            delay(1000);
            esp_sleep_enable_timer_wakeup(TIMER_WAKEUP_US);
            esp_light_sleep_start();
            return false;
        }
        Serial.println("Reestablished WiFi connection. Resume to previous operation");
    }
    return true;
}

/**
* @brief Begin to connect to WiFi. Enter deep sleep mode and wake up periodically to reconnect
 * until memory is reset.
*
* @param None
*
* @return None
*/
void beginWiFi() {
    WiFi.setAutoReconnect(false);
    if (!connectWiFi(wifi_ssid.c_str(), wifi_password.c_str())) {
        // Configuration exists but somehow invalid
        Serial.println("Network configuration is invalid.");
        delay(1000);
        esp_deep_sleep(TIMER_WAKEUP_US);
    }
    int chan;
    if (int32_t n = WiFi.scanNetworks()) {
        for (uint8_t i=0; i<n; i++) {
            if (!strcmp(wifi_ssid.c_str(), WiFi.SSID(i).c_str())) {
                chan = WiFi.channel(i); } } }

    esp_wifi_set_channel(chan, WIFI_SECOND_CHAN_NONE);

}

/**
* @brief Attempt to read ssid and password from memory.
*
* @param None
*
* @return true if ssid and password exists, else false
*/
bool readWiFiFromMemory() {
    const String ssid = EEPROM.readString(SSID_ADDRESS);
    const String password = EEPROM.readString(PASSWORD_ADDRESS);
    if (ssid.isEmpty() || password.isEmpty()) {
        // If read failed or returned junk data
        return false;
    }
    wifi_ssid = ssid;
    wifi_password = password;
    return true;
}
