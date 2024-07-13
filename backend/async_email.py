import asyncio
import json
import os
from rich_logger import log
from pathlib import Path
import aiofiles
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from jinja2 import Template

conf = ConnectionConfig(
    MAIL_FROM=os.environ["MAIL_USERNAME"],
    MAIL_USERNAME=os.environ["MAIL_USERNAME"],
    MAIL_PASSWORD=os.environ["MAIL_PASSWORD"],
    MAIL_PORT=465,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_SSL_TLS=True,
    MAIL_STARTTLS=False,
)

cached_recipients = []
recipients_file_path = Path("data/recipients.json")
file_lock = asyncio.Lock()
email_body = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warning Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #ff4c4c;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Warning Notification</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We have detected an anomaly in the environment data:</p>
            <ul>
                <li><strong>Environment Anomaly:</strong> {{enviroment_anamoly}}</li>
                <li><strong>Full Data:</strong> {{full_data}}</li>
            </ul>
            <p>Please take the necessary actions to address this issue.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
template = Template(email_body)

async def get_recipients():
    global cached_recipients
    if not cached_recipients:
        async with file_lock:
            async with aiofiles.open(recipients_file_path, mode="r") as f:
                cached_recipients = json.loads(await f.read())
    return cached_recipients


async def change_recipients_json(recipients: list[str]):
    global cached_recipients
    async with file_lock:
        async with aiofiles.open(recipients_file_path, mode="w") as f:
            await f.write(json.dumps(recipients))
    cached_recipients = recipients
    log.info(f"Recipients have changed to the following: {recipients}")
    return {"result": True, "message": "Recipients updated"}


async def send_warning_email(result, data):
    global cached_recipients
    
    await get_recipients()

    email_body = template.render(
        enviroment_anamoly=result, full_data=json.dumps(data, indent=4)
    )
    message = MessageSchema(
        subject="Warning: Anomaly Detected",
        recipients=cached_recipients,
        body=email_body,
        subtype=MessageType.html,
    )
    log.info(f"Warning email has been sent to {cached_recipients}")
    fm = FastMail(conf)
    await fm.send_message(message=message)
    return {"result": True, "message": "Test email sent"}
