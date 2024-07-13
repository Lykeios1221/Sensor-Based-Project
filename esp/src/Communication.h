#include <PubSubClient.h>
#include <esp_now.h>

// MQTT Broker configuration
const char *MQTT_ADDRESS = "152.42.250.12";
const String IN_TOPIC = "287707/inEsp32Topic";
const String OUT_TOPIC = "287707/outEsp32Topic";

// WiFi client and MQTT client setup
WiFiClient espClient;
const char *MQTT_CLIENT_ID = "ESP32CLIENT";
PubSubClient mqttClient(espClient);

// MQTT connection timeout
const ulong MQTT_CONNECT_TIMEOUT_MS = 60 * 1000;
ulong mqttTimer;

// Variables for data communication and readiness
int numRequestedData = 0;
bool isCommunicationReady = false;

// ESP-NOW setup for peer communication
esp_now_peer_info_t peerInfo;
uint8_t receiverAddress[] = {0x48, 0xE7, 0x29, 0x6C, 0xB5, 0x04};

// MQTT message reception handler
void onMQTTMessage(char *topic, byte *message, uint length) {
    // Convert message to string
    String topicStr = String(topic);
    String messageStr;

    // Construct message string from byte array
    for (int i = 0; i < length; i++) {
        messageStr += (char) message[i];
    }

    // Process messages based on topic
    if (topicStr == IN_TOPIC + "/relay") {
        // Toggle relay based on message
        bool relayOn = messageStr == "on";
        esp_now_send(receiverAddress, (uint8_t *) &relayOn, sizeof(relayOn));
    } else if (topicStr == IN_TOPIC + "/dataset") {
        // Set number of requested data points
        numRequestedData = messageStr.toInt();
    }
}

// ESP-NOW message send callback
void onSentESPNOW(const uint8_t *mac_addr, esp_now_send_status_t status) {
    // Print send status
    Serial.print("\r\nLast Packet Send Status:\t");
    Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

// MQTT connection function
bool connectMQTT() {
    // Attempt to connect to MQTT broker
    mqttTimer = millis() - 1;
    while (millis() - mqttTimer <= MQTT_CONNECT_TIMEOUT_MS) {
        mqttClient.connect(MQTT_CLIENT_ID);
        if (mqttClient.connected()) {
            mqttClient.subscribe((IN_TOPIC + "/#").c_str());
            return true;
        }
        delay(150);
    }
    return false;
}

// Publish MQTT message function
void publishMQTTMessage(const String &message, const String &subtopic) {
    // Publish message to MQTT topic
    mqttClient.publish((OUT_TOPIC + subtopic).c_str(), message.c_str());
}

// Begin communication setup function
void beginCommunication(const String& token) {
    // Initialize MQTT and ESP-NOW communication
    mqttClient.setServer(MQTT_ADDRESS, 1883);
    mqttClient.setCallback(onMQTTMessage);
    mqttClient.setBufferSize(512);
    String topic = IN_TOPIC + "/#";

    // Connect to MQTT broker
    if (!connectMQTT()) {
        Serial.println("MQTT connection failed. Possible invalid configuration");
        esp_deep_sleep(TIMER_WAKEUP_US);
    }

    // Subscribe to relevant MQTT topics and publish token
    mqttClient.subscribe(topic.c_str());
    publishMQTTMessage(token, "/token");


    // Initialize ESP-NOW communication with peer
    esp_now_init();
    memcpy(peerInfo.peer_addr, receiverAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    esp_now_add_peer(&peerInfo);
    esp_now_register_send_cb(onSentESPNOW);

    // Set communication readiness flag
    isCommunicationReady = true;
}

// Communication loop function
bool loopCommunication() {
    // Check MQTT connection status
    if (isCommunicationReady && !mqttClient.connected()) {
        Serial.println("MQTT connection lost. Attempt to reconnect...");
        // Attempt to reconnect to MQTT broker
        if (connectMQTT()) {
            Serial.println("Reestablished MQTT connection. Resume to previous operation");
        } else {
            Serial.println("Connection failed!");
            esp_sleep_enable_timer_wakeup(TIMER_WAKEUP_US);
            esp_light_sleep_start();
            return false;
        }
    }
    // Maintain MQTT and ESP-NOW communication
    mqttClient.loop();
    return true;
}

