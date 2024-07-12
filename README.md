# Project Setup Guide

## Backend Setup

### Requirements
- Python

### Steps

1. **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2. **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

3. **Set up environment variables:**
    Replace placeholders with your actual values in the environment configuration file (e.g., `.env`):
    ```
    MYSQL_DATABASE=YOUR_DATABASE
    MYSQL_USER=YOUR_USER
    MYSQL_PASSWORD=YOUR_PASSWORD
    MYSQL_HOST=YOUR_HOST
    ```

4. **Run the backend:**
    ```bash
    python main.py
    ```

## Frontend Setup

### Requirements
- Node.js

### Steps

1. **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2. **Install the required Node.js packages:**
    ```bash
    npm install
    ```

3. **Run the frontend development server:**
    ```bash
    npm run dev
    ```

## Using DevContainer

If you are using DevContainer, you can simply open the repository in Visual Studio Code. Both frontend and backend will be set up in the DevContainer automatically.

1. **Open the repository in Visual Studio Code.**
2. **Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and select `Remote-Containers: Reopen in Container`.**

This will automatically set up both the frontend and backend environments.
