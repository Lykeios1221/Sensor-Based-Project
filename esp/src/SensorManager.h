#include <Wire.h>
#include <SPI.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_MPU6050.h>
#include <MQ135.h>

const uint8_t TEMT6000_PIN = 36;
const uint8_t MQ135_PIN = 33;
MQ135 mq135(MQ135_PIN);

Adafruit_BME280 bme;
Adafruit_MPU6050 mpu;

const ulong SAMPLING_RATE_MS = 1000;
ulong sensorTimer = 0;
bool isSensorsReady = false;
JsonDocument sensorData;
String sensorDataStr;

void getBMEData() {
    // Retrieve BME280 sensor data
    sensorData["temperature"] = bme.readTemperature(); // Degree celsius
    sensorData["pressure"] = bme.readPressure(); // Pa
    sensorData["humidity"] = bme.readHumidity(); // Relative humidity
}

void getTEMT6000Data(){
    // Retrieve TEMT6000 sensor data
    // Limit readings to 0-1024 due to sensor limit
    analogReadResolution(10);
    float volts =  analogRead(TEMT6000_PIN) * 5 / 1024.0;
    float amps = volts / 10000.0;  // em 10,000 Ohms
    float microamps = amps * 1000000; // Convert to Microamps
    float lux = microamps * 2.0;
    sensorData["lux"] = lux;
}

void getMPU6050Data() {
    // Retrieve MPU6050 sensor data
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    // Acceleration (ms^-2)
    sensorData["x_acceleration"] = a.acceleration.x;
    sensorData["y_acceleration"] = a.acceleration.y;
    sensorData["z_acceleration"] = a.acceleration.z;
    // Angular velocity (rad/s)
    sensorData["x_rotation"] = g.gyro.x;
    sensorData["y_rotation"] = g.gyro.y;
    sensorData["z_rotation"] = g.gyro.z;
}

void getMQ135Data() {
    // Retrieve MQ135 sensor data
    analogReadResolution(12);
    sensorData["gas_concentration"] = (analogRead(MQ135_PIN) - 0) * (100.0 - 0.0) / (4095 - 0) + 0;;
}

void getSensorData() {
    // Aggregate all sensor data
    getBMEData();
    getMPU6050Data();
    getBMEData(); // Calling BME function again
    getTEMT6000Data();
    getMQ135Data();
    serializeJson(sensorData, Serial);
    Serial.println();
}

void beginSensors() {
    // Initialize sensors
    bme.begin(0x76);
    pinMode(TEMT6000_PIN, INPUT);
    mpu.begin(0x68);
    isSensorsReady = true;
}

void loopSensors() {
    // Main sensor sampling loop
    const ulong current = millis();

    // Check if there are requested data points
    if (numRequestedData != 0) {
        Serial.println("Received request for " + String(numRequestedData) + " of data");
        randomSeed(millis() + analogRead(39));
        const String session = String(random());
        for (; numRequestedData > 0; numRequestedData--) {
            Serial.println("Remaining data: " + String(numRequestedData));
            getSensorData();
            serializeJson(sensorData, sensorDataStr);
            sensorData.clear();
            publishMQTTMessage(sensorDataStr, "/dataset/" + session);
            delay(1000);
        }
        Serial.println("Sampling for dataset is finished. Resume to normal operation.");
    }

    // Regular sensor sampling based on sampling rate
    if (isSensorsReady && current - sensorTimer > SAMPLING_RATE_MS) {
        sensorTimer = current;
        getSensorData();
        serializeJson(sensorData, sensorDataStr);
        publishMQTTMessage(sensorDataStr, "/data");
        sensorData.clear();
    }
}
