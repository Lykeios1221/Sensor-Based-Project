#include <Arduino.h>
#include <EEPROM.h>
#include <WiFiManager.h>
#include <WebServerManager.h>
#include <Communication.h>
#include <SensorManager.h>

const uint EEPROM_SIZE = 1024;

void setup() {
    Serial.begin(115200);
    while (!Serial);

    Serial.println("\n\nSerial monitor is ready.\n");
    delay(500);

    Serial.println("Checking memory for network configuration...");
    delay(500);
    WiFiClass::mode(WIFI_AP_STA);

    EEPROM.begin(EEPROM_SIZE);
    if (readWiFiFromMemory()) {
        beginWiFi();
        Serial.println("Network configuration is valid. Network connected and try to ping servers...");
        delay(500);
        String token = EEPROM.readString(TOKEN_ADDRESS);
        beginCommunication(token);
        Serial.println("All server is up. Authenticated with token :" + token);
        delay(500);
        Serial.println("All set. Begin to sample sensor data...");
        beginSensors();
    } else {
        Serial.println("Network configuration is not found. Opening web server to upload configuration.");
        delay(3000);
        beginWebServer();
    }
}

void loop() {
    loopWebServer();
    loopReconnect();
    loopCommunication();
    loopSensors();
}