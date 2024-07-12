const dialog = document.querySelector("dialog");

function copyText(text) {
    let textarea = document.createElement('textarea');
    dialog.appendChild(textarea);
    console.log(text);
    textarea.value = text;
    textarea.select();
    textarea.focus();
    document.execCommand('copy');
    dialog.removeChild(textarea);
}

window.addEventListener("DOMContentLoaded", () => {
    const closeButton = document.querySelector("dialog button");
    let callback = null;

    function showModal(title, content, onCloseCallback) {
        if (callback) {
            dialog.removeEventListener("close", callback);
        }
        dialog.close()
        dialog.querySelector(".dialog-title").textContent = title;
        dialog.querySelector(".dialog-body").innerHTML = content;
        if (onCloseCallback) {
            callback = onCloseCallback;
            dialog.addEventListener("close", callback);
        }
        dialog.showModal();
    }

    closeButton.addEventListener("click", () => {
        dialog.close();
    });

    const networkTable = document.querySelector("#networkTable");
    const networkRowTemplate = document.querySelector("#networkRow");
    const ssid = document.querySelector("#ssid");
    const networkConfigForm = document.querySelector("#networkConfigForm");
    let isWaiting = false;

    function populateNetworkTableRow(ssid, strength) {
        const row = networkRowTemplate.content.cloneNode(true).firstElementChild;
        row.querySelector("span").textContent = ssid;
        let level = 0;

        switch (true) {
            case strength > -30:
                level = 4;
                break;
            case strength > -67:
                level = 3;
                break;
            case strength > -70:
                level = 2;
                break;
            case strength > -80:
                level = 1;
                break;
        }

        for (let i = 4 - level; i > 0; i--) {
            row.querySelector('.wifi-' + (4 - i + 1)).style.opacity = "30%";
        }
        row.addEventListener("click", (evt) => {
            this.ssid.value = ssid;
        });
        networkTable.tBodies[0].append(row);
    }

    const socket = new WebSocket("ws://" + window.location.hostname + "/ws");

    socket.addEventListener("open", (evt) => {
        console.log("Websocket connection established.");
    });

    socket.addEventListener("message", (evt) => {
        networkTable.tBodies[0].innerHTML = "";
        console.log(evt.data);
        JSON.parse(evt.data).forEach((network) => {
            populateNetworkTableRow(network.ssid, network.strength);
        });
        if (!networkTable.tBodies[0].hasChildNodes()) {
            const tr = document.createElement("tr");
            tr.style.height = "150px";
            tr.style.display = "flex";
            tr.style.alignItems = "center";
            const th = document.createElement("th");
            th.textContent = "No network found"
            tr.append(th);
            networkTable.tBodies[0].append(tr);
        }
        return false;
    });

    socket.addEventListener("close", (evt) => {
        console.log("Websocket connection disconnected.");
        alert("Connection is lost. Please refresh page and try again.");
    });

    networkConfigForm.addEventListener("submit", async (evt) => {
        evt.preventDefault();
        if (isWaiting) {
            showModal("Info", "Previous form is still processing. Please try again later");
            return;
        }
        let formData = new FormData(evt.target);
        let object = {};
        formData.forEach((value, key) => object[key] = value);
        let json = JSON.stringify(object);
        console.log("Submitting form data: " + json);
        try {
            showModal("Info", "Form submitted. Validation may take up to max 1 minute.");
            isWaiting = true;
            const response = await fetch("/submitForm", {
                method: "POST",
                mode: "cors",
                body: json,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            const data = await response.text();
            console.log(data);
            const onCloseCallback = () => {
                if (data) {
                    window.location.href = "about:home";
                }
            }
            showModal(data ? "Info" : "Error",
                data ?
                    `Configuration is saved and web server will be closed. Token for login:<div class=tokenContainer><div class=token><div>${data}</div></div><button onclick="copyText('${data}')">Copy</button></div>It will only be displayed once upon config, please save it somewhere.` :
                    "Invalid configuration. Please check again.",
                onCloseCallback);
        } catch (e) {
            alert("Error: " + e);
            console.error("Error: ", e);
        } finally {
            isWaiting = false;
        }
    });

})