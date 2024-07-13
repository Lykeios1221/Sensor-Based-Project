import asyncio
import json
from pathlib import Path

import pandas as pd  # For handling dataframes and CSV files
from rich.progress import Progress  # For displaying progress bars

from models import environment_model, light_model, vibration_model  # Import models for anomaly detection
from rich_logger import log  # Logger for debugging and info messages

# Initialize global variables
progress = Progress(expand=True, transient=True)
task = None
data_event = asyncio.Event()
dataset_path = Path("data/dataset.csv")
dataset_size = 0
dataset = []

# Function to build dataset from incoming JSON data
async def build_dataset(json_data: str):
    global task, data_event
    if not task:
        # Start a new progress task if not already started
        task = progress.add_task("[green]Building dataset...", total=dataset_size)
        progress.start()
    # Parse JSON data and add to dataset
    data = json.loads(json_data)
    dataset.append(data)
    # Update progress bar
    progress.update(task, advance=1)
    if len(dataset) == dataset_size:
        # Save dataset to CSV file when the desired size is reached
        pd.DataFrame(dataset).to_csv(dataset_path, index=False)
        progress.stop()
        progress.remove_task(task)
        progress.refresh()
        task = None
        data_event.set()  # Signal that dataset is ready

# Function to rebuild models with the new dataset
async def rebuild_model(size: int, models: str | list[str]):
    global dataset_size, progress, task, data_event
    try:
        if not size == 0:
            dataset_size = size
            # Wait for the dataset to be built within a specified timeout
            await asyncio.wait_for(data_event.wait(), timeout=(dataset_size * 1.5 + 60))
        if isinstance(models, str):
            models = [models]

        # Rebuild each specified model
        for model_name in models:
            for model in [environment_model, light_model, vibration_model]:
                if model.name == model_name:
                    model.rebuild_model(dataset_path)

        return True

    except asyncio.TimeoutError:
        log.error("Timeout occurred while waiting for data.")
        progress.stop()
        progress.remove_task(task)
        progress.refresh()
        task = None
    except Exception as e:
        log.error(f"Unknown error: {e}")
    finally:
        # Reset state after attempting to rebuild models
        data_event.clear()
        dataset_size = 0
        dataset.clear()
        return False

# Function to classify new data using the trained models
async def classify_new_data(data):
    environment_anomaly = {}
    for model in [environment_model, light_model, vibration_model]:
        try:
            if not model.clf:
                model.load_model()  # Load model if not already loaded
            result = model.predict(data)  # Predict anomalies
            environment_anomaly[f"{model.name.lower()}_anomaly"] = result
        except Exception as e:
            log.error(e)
            environment_anomaly[f"{model.name.lower()}_anomaly"] = None
    return environment_anomaly
