import json

import numpy as np
from pydantic import BaseModel, EmailStr, field_validator
from rich_logger import log
from pathlib import Path
import joblib
import pandas as pd
from sklearn.discriminant_analysis import StandardScaler
from sklearn.svm import OneClassSVM


class AnomalyModel:
    def __init__(self, name, path, features, scaler_path, offset, enabled=True):
        self.name = name
        self.path = Path(path)
        self.features = features
        self.enabled = enabled
        self.clf = None
        self.scaler_path = Path(scaler_path)
        self.scaler = None
        self.offset = offset

    def load_model(self):
        if self.path.exists() and self.scaler_path.exists():
            self.clf = joblib.load(self.path)
            self.scaler = joblib.load(self.scaler_path)
            log.info(f"Loaded {self.name} model from {self.path}.")
        else:
            log.error(f"Model {self.name} not found at {self.path} or scaler not found on {self.scaler_path}")

    def rebuild_model(self, dataset_path):

        df = pd.read_csv(dataset_path)
        df_filtered = df[self.features]
        if not self.scaler:
            self.scaler = StandardScaler()
        df_new = self.scaler.fit_transform(df_filtered.to_numpy(dtype="float"))

        self.clf = OneClassSVM(kernel="rbf", degree=3, gamma=0.1, nu=0.01) 
        self.clf.fit(df_new)
    
        joblib.dump(self.clf, self.path)
        joblib.dump(self.scaler, self.scaler_path)
        log.info(f"Rebuilt {self.name} model with features: {self.features}")

    def predict(self, data):
        if not self.enabled:
            raise ValueError(
                f"Model {self.name} is disabled and cannot make predictions."
            )

        data_filtered = {key: data[key] for key in self.features}
        data_array = np.array(list(data_filtered.values()), dtype="float")
        new_data = self.scaler.transform(data_array.reshape(1, -1))

        if self.clf:
            score = self.clf.decision_function(new_data) + self.offset
            prediction = bool(score < 0)
            return prediction
        else:
            log.error(f"Model {self.name} has not been loaded or trained.")
            return None


class EnvironmentModel(AnomalyModel):
    def __init__(
        self,
    ):
        super().__init__(
            name="Environment",
            path="env.joblib",
            features=["temperature", "pressure", "humidity", "gas_concentration"],
            scaler_path="env_scaler.joblib",
            offset=2.5,
        )
        self.path


class LightModel(AnomalyModel):
    def __init__(self):
        super().__init__(
            name="Light",
            path="light.joblib",
            features=["lux"],
            scaler_path="light_scaler.joblib",
            offset=3,
        )


class VibrationModel(AnomalyModel):
    def __init__(self):
        super().__init__(
            name="Vibration",
            path="vib.joblib",
            features=[
                "x_acceleration",
                "y_acceleration",
                "z_acceleration",
                "x_rotation",
                "y_rotation",
                "z_rotation",
            ],
            scaler_path="vib_scaler.joblib",
            offset=0.95,
        )


environment_model = EnvironmentModel()
vibration_model = VibrationModel()
light_model = LightModel()


class ModelForm(BaseModel):
    size: int
    models: str | list[str]

    @field_validator("models")
    def must_be_anomaly_model(cls, models: str | list[str]):
        exist_models = {
            environment_model.name,
            vibration_model.name,
            light_model.name,
        }
        if len(set(models).intersection(exist_models)) != len(models):
            raise ValueError(f"Model(s) must be one of the following: {exist_models}.")
        return models

    @field_validator("size")
    def within_range(cls, size: int):
        if size < 0 or size > 1000:
            raise ValueError(f"{size} is not within valid range.")
        return size


class RecipientForm(BaseModel):
    recipients:EmailStr| list[EmailStr]