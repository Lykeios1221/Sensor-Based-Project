import asyncio
from datetime import datetime
import json
from pathlib import Path

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from anomaly_detection import build_dataset, classify_new_data, rebuild_model
from async_email import change_recipients_json, get_recipients, send_warning_email
from database import get_latest_sensor_data, init_db, insert_sensor_data
from models import ModelForm, RecipientForm
from rich_logger import log
from contextlib import asynccontextmanager
import os
from fastapi import Body, Depends, FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from gmqtt import Client as MQTTClient
from fastapi_mqtt import FastMQTT, MQTTConfig
import aiofiles
import time

OUT_TOPIC = "287707/inEsp32Topic"
IN_TOPIC = "287707/outEsp32Topic"

mqtt_config = MQTTConfig(host=os.environ["MQTT_IP"])
fast_mqtt = FastMQTT(config=mqtt_config)

security = HTTPBearer()
token_path = Path("token.txt")
token = None


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    await fast_mqtt.mqtt_startup()
    await init_db()
    yield
    await fast_mqtt.mqtt_shutdown()


app = FastAPI(lifespan=_lifespan)

origins = [
    "*",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

user_disabled = False

counter = 0
saving_skip = 5

generating_dataset = False

queue = asyncio.Queue()
off_timer_task = None


@fast_mqtt.on_connect()
def connect(client: MQTTClient, flags: int, rc: int, properties: any):
    log.info("MQTT connected. Start receiving data.")


@fast_mqtt.subscribe(IN_TOPIC + "/token", qos=0)
async def replace_token(
    client: MQTTClient, topic: str, payload: bytes, qos: int, propertiews: any
):
    token = payload.decode()
    log.info(f"Received token: [blue]{token}[/blue]. Ovewritting existing token...")
    async with aiofiles.open("token.txt", mode="w") as f:
        await f.write(token)


async def turn_off_after_delay(delay):
    await asyncio.sleep(delay)
    fast_mqtt.publish(message_or_topic=OUT_TOPIC + "/relay", payload="off")


async def schedule_off_timer():
    global off_timer_task
    if off_timer_task:
        off_timer_task.cancel()  # Cancel the previous task if exists
    off_timer_task = asyncio.create_task(turn_off_after_delay(10.0))


@fast_mqtt.subscribe(IN_TOPIC + "/data", qos=0)
async def sensor_message(
    client: MQTTClient, topic: str, payload: bytes, qos: int, propertiews: any
):
    global counter, queue, user_disabled
    if not generating_dataset and not user_disabled:
        data = json.loads(payload.decode())
        data["create_time"] = datetime.now().isoformat()
        counter += 1
        result = await classify_new_data(data)
        if any(value for value in result.values()):
            log.critical(f"Anomaly detected: {result} \nData: {data}")
            await send_warning_email(result, data)
            fast_mqtt.publish(message_or_topic=OUT_TOPIC + "/relay", payload="on")
            await schedule_off_timer()
            data = {**data, **result}
            counter = 0

        elif counter % saving_skip == 0:
            log.info(f"Saving new data with no anomaly.")
            counter = 0

    if counter == 0:
        await insert_sensor_data(data)
        await queue.put(data)


@fast_mqtt.subscribe(IN_TOPIC + "/dataset/+/#", qos=0)
async def get_dataset(
    client: MQTTClient, topic: str, payload: bytes, qos: int, propertiews: any
):
    data = payload.decode()
    await build_dataset(data)


@fast_mqtt.on_disconnect()
def disconnect(client: MQTTClient, packet, exc=None):
    log.info("MQTT disconnected. Stop receiving data.")


@app.get("/validate_token")
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    global token_path
    if token_path.exists():
        async with aiofiles.open(token_path, mode="r") as f:
            token = await f.read()
    log.info(f"Validating token: {credentials.credentials}")
    return {"result": credentials.credentials == token}


@app.post("/change_recipients")
async def change_recipients(request: RecipientForm):
    return await change_recipients_json(request.recipients)


@app.post("/build_model")
async def build_model(request: ModelForm):
    global generating_dataset
    if generating_dataset:
        return {
            "result": False,
            "message": "Model rebuild in progress. Please try again later.",
        }
    generating_dataset = True

    log.info(f"Sending request for {request.size} of data at {OUT_TOPIC}/dataset")
    fast_mqtt.publish(
        message_or_topic=OUT_TOPIC + "/dataset", payload=str(request.size)
    )
    result = await rebuild_model(request.size, request.models)
    generating_dataset = False
    return {"result": True, "message": "Model has been rebuild."}


@app.post("/change_saving_skip")
def change_saving_skip(skip: int = Body(embed=True)):
    global saving_skip
    saving_skip = skip
    log.info(f"Saving rate has been changed to per {skip} data")
    return {
        "result": True,
        "message": f"Saving rate has been changed to per {skip} data",
    }


@app.post("/change_user_disabled")
def change_user_disabled(disabled: bool = Body(embed=True)):
    global user_disabled
    user_disabled = disabled
    if user_disabled:
        fast_mqtt.publish(message_or_topic=OUT_TOPIC + "/relay", payload="off")
    log.info(f"User has change the status of detection to: {user_disabled}")
    return {
        "result": True,
        "message": f"User has change the status of detection to: {user_disabled}",
    }


@app.get("/get_setting")
async def get_setting():
    return {
        "disabled": user_disabled,
        "skip": saving_skip,
        "recipients": await get_recipients(),
    }


@app.get("/query_data")
async def query_data():
    sensor_data_list = await get_latest_sensor_data(100)
    for data in sensor_data_list:
        data['create_time'] = data['create_time'].isoformat()
    json_data = json.dumps(sensor_data_list, default=str)
    return json_data


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global queue
    await websocket.accept()
    while True:
        data = await queue.get()
        await websocket.send_text(f"{json.dumps(data)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8080, log_config=None)
