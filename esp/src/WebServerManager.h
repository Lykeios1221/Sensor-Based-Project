#include <ESPAsyncWebServer.h>
#include <AsyncJson.h>
#include <HTTPClient.h>

// AP config
const char *AP_SSID = "sensor_project";
const char *AP_PASSWORD = "";

// Web server static files
const char *TEMPLATE = R"###(
<!doctypehtml><html lang=en><meta charset=UTF-8><title>Network Configuration</title><meta content="width=device-width,initial-scale=1"name=viewport><link href=index.min.css rel=stylesheet><header><h1>Network Configuration</h1></header><main><div><table id=networkTable><thead><tr><th scope=col><div><span>SSID</span> <span>Strength</span></div><tbody><tr id=scanningRowContent><th colspan=2><span><svg viewBox="0 0 24 24"xmlns=http://www.w3.org/2000/svg height=24 width=24><style>.spinner_kpYo{animation:spinner_cQNQ 1.55s linear infinite;fill:#6495ed}.spinner_Esax{animation:spinner_sZau 1.55s linear infinite;fill:#6495ed}.spinner_o8QU{animation:spinner_aBcq 1.55s linear infinite;fill:#6495ed}@keyframes spinner_cQNQ{0%,100%,87.1%{opacity:0}16.13%,80.65%{opacity:1}}@keyframes spinner_sZau{0%,100%,16.13%,87.1%{opacity:0}32.26%,80.65%{opacity:1}}@keyframes spinner_aBcq{0%,100%,32.26%,87.1%{opacity:0}48.39%,80.65%{opacity:1}}</style><path class=spinner_kpYo d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21"opacity=0 /><path class="spinner_kpYo spinner_Esax"d="M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z"opacity=0 /><path class="spinner_kpYo spinner_o8QU"d="M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3"opacity=0 /></svg> Scanning for networks</span></table><form id=networkConfigForm><div class=input-group><label for=ssid>SSID:</label> <input id=ssid name=ssid required></div><div class=input-group><label for=password>Password:</label> <input id=password name=password type=password></div><footer><button class=btn-danger type=reset>Reset</button> <button class=btn-info type=submit>Submit</button></footer></form></div></main><template id=networkRow><tr><th scope=row><div><span></span> <span><svg viewBox="0 0 100 100"xmlns=http://www.w3.org/2000/svg class=wifi-svg stroke=#000 stroke-width=7><circle class=wifi-0 cx=50 cy=80 r=5 stroke=none /><path class=wifi-1 d="M35 70q15-10 30 0"fill=none /><path class=wifi-2 d="M25 60q25-20 50 0"fill=none /><path class=wifi-3 d="M15 50q35-30 70 0"fill=none /><path class=wifi-4 d="M5 40q45-40 90 0"fill=none /><path class=wifi-none d="M5 40q45-40 90 0L50 82.5Z"fill=none stroke=none /></svg></span></div></template><dialog><div class=dialog-title></div><div class=dialog-body></div><div class=dialog-footer><button class="btn-danger btn-close">Close</button></div></dialog><script src=index.min.js></script>
)###";

const char *STYLESHEET = R"###(
.btn-danger,.btn-info,table tbody tr{transition:.2s}.btn-info:hover,table tbody tr:nth-child(odd){background:#fff}dialog[open],main>div{box-shadow:1px 2px 8px 1px rgba(0,0,0,.2)}.input-group label,button{font-weight:700}*{box-sizing:border-box}body,html{font-size:16px;height:100%;margin:0}body{display:flex;flex-direction:column}header{display:flex;justify-content:center;background:#6495ed;color:#fff}main{height:100%;padding-block:30px;padding-inline:5%}main>div{border-radius:32px;padding:36px 5%}.input-group{display:flex;flex-direction:column;margin-bottom:16px}.input-group input{margin-block:5px;padding:5px;border-radius:4px;border:1px solid rgba(0,0,0,.3)}.input-group input:focus{outline:0;border-color:#6495ed;box-shadow:0 0 2px #6495ed}footer{display:flex;justify-content:center;gap:8px}button{padding:8px 16px;border-radius:6px;cursor:pointer;outline:0}.btn-danger,.btn-info,button:focus{border:1px solid transparent}button:focus{box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 3px 10px 0 rgba(0,0,0,.19)}.btn-danger{background:#dc3545;color:#fff}.btn-info,table thead{background:#6495ed;color:#fff}.btn-danger:hover{border:1px solid #dc3545;color:#dc3545;background:#fff}.btn-info:hover{border:1px solid #6495ed;color:#6495ed}table{height:100%;width:100%;margin-bottom:20px;border-collapse:collapse;border-radius:10px;box-shadow:0 0 1.5px #6495ed;overflow:clip;display:block}table *{display:inline-block;width:100%}table th>div{display:flex;align-items:center;margin-block:8px;background:0 0}table th>div>span:first-child{flex:7;text-align:start;padding-left:20px}table th>div>span:nth-child(2){flex:3}table th>div svg{width:30px!important}table tbody{height:150pX;overflow-y:auto}table tbody tr:nth-child(2n){background:rgba(100,149,237,.25)}table tbody tr:hover{cursor:pointer;background:#4169e1;color:#fff}table #scanningRowContent{pointer-events:none;height:100%}table #scanningRowContent th{display:flex;align-items:center;height:100%;width:100%;padding-inline:0;padding-block:5%}table #scanningRowContent th span{display:flex;width:100%;align-items:center;flex-direction:column;gap:12px}dialog[open]{border:none;padding:0;border-radius:8px;display:flex;flex-direction:column;align-items:stretch;width:60%;max-width:400px}dialog[open] :not(button){padding:12px 20px}dialog[open] .dialog-title{font-weight:700;border-bottom:1px solid #000}dialog[open] .dialog-body{text-wrap:pretty;overflow:clip}dialog[open] .dialog-body .tokenContainer{background:rgba(100,149,237,.78);margin-block:12px;padding:0 2px;color:#ececec;display:flex}dialog[open] .dialog-body .tokenContainer .token{overflow-x:hidden}dialog[open] .dialog-body .tokenContainer .token div{flex:2;font-size:14px;color:#ececec;overflow-x:scroll;padding:0}dialog[open] .dialog-body .tokenContainer .token div::-webkit-scrollbar{display:none}dialog[open] .dialog-body .tokenContainer button{all:initial;flex:1;text-align:center;cursor:pointer;background:#6495ed;padding-inline:6px;border:none;color:#fff}dialog[open] .dialog-footer{margin-top:6px;display:flex;justify-content:center}
)###";

const char *JAVASCRIPT = R"###(
const dialog=document.querySelector("dialog");function copyText(e){let o=document.createElement("textarea");dialog.appendChild(o),console.log(e),o.value=e,o.select(),o.focus(),document.execCommand("copy"),dialog.removeChild(o)}window.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelector("dialog button");let o=null;function t(e,t,n){o&&dialog.removeEventListener("close",o),dialog.querySelector(".dialog-title").textContent=e,dialog.querySelector(".dialog-body").innerHTML=t,n&&(o=n,dialog.addEventListener("close",o)),dialog.showModal()}e.addEventListener("click",(()=>{dialog.close()}));const n=document.querySelector("#networkTable"),a=document.querySelector("#networkRow"),i=(document.querySelector("#ssid"),document.querySelector("#networkConfigForm"));let l=!1;const s=new WebSocket("ws://"+window.location.hostname+"/ws");s.addEventListener("open",(e=>{console.log("Websocket connection established.")})),s.addEventListener("message",(e=>{if(n.tBodies[0].innerHTML="",console.log(e.data),JSON.parse(e.data).forEach((e=>{!function(e,o){const t=a.content.cloneNode(!0).firstElementChild;t.querySelector("span").textContent=e;let i=0;switch(!0){case o>-30:i=4;break;case o>-67:i=3;break;case o>-70:i=2;break;case o>-80:i=1}for(let e=4-i;e>0;e--)t.querySelector(".wifi-"+(4-e+1)).style.opacity="30%";t.addEventListener("click",(o=>{this.ssid.value=e})),n.tBodies[0].append(t)}(e.ssid,e.strength)})),!n.tBodies[0].hasChildNodes()){const e=document.createElement("tr");e.style.height="150px",e.style.display="flex",e.style.alignItems="center";const o=document.createElement("th");o.textContent="No network found",e.append(o),n.tBodies[0].append(e)}return!1})),s.addEventListener("close",(e=>{console.log("Websocket connection disconnected."),alert("Connection is lost. Please refresh page and try again.")})),i.addEventListener("submit",(async e=>{if(e.preventDefault(),l)return void t("Info","Previous form is still processing. Please try again later");let o=new FormData(e.target),n={};o.forEach(((e,o)=>n[o]=e));let a=JSON.stringify(n);console.log("Submitting form data: "+a);try{t("Info","Form submitted. Validation may take up to max 1 minute."),l=!0;const e=await fetch("/submitForm",{method:"POST",mode:"cors",body:a,headers:{Accept:"application/json","Content-Type":"application/json"}}),o=await e.text();console.log(o);t(o?"Info":"Error",o?`Configuration is saved and web server will be closed. Token for login:<div class=tokenContainer><div class=token><div>${o}</div></div><button onclick="copyText('${o}')">Copy</button></div>It will only be displayed once upon config, please save it somewhere.`:"Invalid configuration. Please check again.",(()=>{o&&(window.location.href="about:home")}))}catch(e){alert("Error: "+e),console.error("Error: ",e)}finally{l=!1}}))}));
)###";


// Create the web server and socket object
AsyncWebServer webServer(80);
AsyncWebSocket webSocket("/ws");

// Temporary storage for long polling request
JsonDocument formData;
AsyncWebServerRequest *processingRequest;

// Flags for operations in loop
bool isProcessingForm = false;
bool isClientConnected = false;

// Timer for non-blocking WiFi scanning
ulong webTimer = 0;
ulong MIN_SCANNING_INTERVAL_MS = 4000;

const int TOKEN_ADDRESS = 513;
const int TOKEN_LENGTH = 16;

void handleSubmit(AsyncWebServerRequest *request, JsonVariant json) {
    // Timeout need to be adjusted for long polling to avoid stored request being discarded internally
    request->client()->setRxTimeout(60000);
    processingRequest = request;

    if (json.is<JsonArray>()) {
        formData = json.as<JsonArray>();
    } else if (json.is<JsonObject>()) {
        formData = json.as<JsonObject>();
    }
    isProcessingForm = true;
}

void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data,
                      size_t len) {
    switch (type) {
        case WS_EVT_CONNECT:
            Serial.println("\nWebSocket client connected");
            isClientConnected = true;
            break;
        case WS_EVT_DISCONNECT:
            Serial.println("\nWebSocket client disconnected");
            isClientConnected = false;
            WiFi.scanDelete();
            break;
        case WS_EVT_DATA:
        case WS_EVT_PONG:
        case WS_EVT_ERROR:
            break;
    }
}

/**
 * @brief Begin web server with AP_SSID' and AP_PASSWORD.
 *
 * @param  None
 *
 * @return None
 */
void beginWebServer() {
    // Start the access point
    WiFi.softAP(AP_SSID, AP_PASSWORD, 1, 0, 1);
    Serial.println(String("\nStarted access point with SSID | Password: '") + AP_SSID + "' | '" + AP_PASSWORD + "'");
    delay(2000);
    Serial.println("Web server IP address: http://" + WiFi.softAPIP().toString());

    webServer.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(200, "text/html", TEMPLATE);
    });

    webServer.on("/index.min.css", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(200, "text/css", STYLESHEET);
    });

    webServer.on("/index.min.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send(200, "text/javascript", JAVASCRIPT);
    });

    auto *formHandler = new AsyncCallbackJsonWebHandler("/submitForm", handleSubmit);
    webServer.addHandler(formHandler);
    webSocket.onEvent(onWebSocketEvent);
    webServer.addHandler(&webSocket);
    webServer.begin();
}

/**
 * @brief Use passed parameters to generate a hashed token as login credential
 *
 * @param ssid
 * @param password
 *
 * @return token: Login credential
 */
String generateToken(const String& ssid, const String& password) {
    randomSeed(millis() + analogRead(39));
    String payload = ssid + password + random();

    byte shaResult[32]; // SHA-256 produces a 32-byte hash
    mbedtls_md_context_t ctx;
    mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

    // Initialize and setup the SHA-256 context
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 0);
    mbedtls_md_starts(&ctx);
    // Update the context with the payload
    mbedtls_md_update(&ctx, (const unsigned char *) payload.c_str(), payload.length());
    mbedtls_md_finish(&ctx, shaResult); // Finish the hashing process
    mbedtls_md_free(&ctx); // Free the context

    // Convert the first TOKEN_LENGTH bytes of hash to a hexadecimal string
    String hashString;
    for (int i = 0; i < TOKEN_LENGTH; i++) {
        char str[3];
        sprintf(str, "%02X", (int)shaResult[i]);
        hashString += str;
    }

    return hashString;
}

/**
 * @brief To be placed in loop() for form processing and network scanning.
 *
 * @param  None
 *
 * @return None
 */
void loopWebServer() {
    if (isProcessingForm) {
        Serial.println("\nProcessing submitted form...");
        const String ssid = formData["ssid"];
        const String password = formData["password"];
        const bool networkConnected = connectWiFi(ssid, password);
        if (processingRequest->client()->connected()) {
            if (networkConnected) {
                Serial.println("Network configuration of submitted form is valid. Generate token for login...");
                delay(500);
                String token = generateToken(ssid, password);
                Serial.println("Generated token: " + token);
                processingRequest->send(200, "text/plain",  token);
                // Wait for request reached
                delay(6000);
                Serial.println("Saving all configuration to memory...");
                EEPROM.writeString(SSID_ADDRESS, ssid);
                EEPROM.writeString(PASSWORD_ADDRESS, password);
                EEPROM.writeString(TOKEN_ADDRESS, token);
                EEPROM.commit();
                delay(2000);
                WiFi.softAPdisconnect();
                // Use deep sleep instead of ESP.restart() ensure PWM signal is cut during reboot.
                esp_deep_sleep(1);
            } else {
                Serial.println("Network configuration of submitted form is invalid.");
                processingRequest->send(200, "text/plain", "");
            }
        } else {
            Serial.println("Abandon form process result as client has been disconnected.");
        }
        formData.clear();
        isProcessingForm = false;
    }

    if (isClientConnected) {
        const ulong current = millis();
        // Scan not triggered
        if (WiFi.scanComplete() == -2 && current - webTimer >= MIN_SCANNING_INTERVAL_MS) {
            webTimer = current;
            WiFi.scanNetworks(true, false, true, 100U);
        } else if (WiFi.scanComplete() >= 0) {
            JsonDocument doc;
            JsonArray arr = doc.to<JsonArray>();
            for (int i = 0; i < WiFi.scanComplete(); i++) {
                JsonObject entry = arr.add<JsonObject>();
                entry["ssid"] = WiFi.SSID(i);
                entry["strength"] = WiFi.RSSI(i);
            }
            WiFi.scanDelete();
            String json;
            serializeJson(doc, json);
            webSocket.textAll(json);
        }
    }
}