import json

import numpy as np
from pydantic import BaseModel, EmailStr, field_validator
from sklearn.metrics import make_scorer
from sklearn.model_selection import GridSearchCV
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
        self._calculated_offset = 0

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
        shuffle_df_filtered = df_filtered.sample(frac=1)
        train_size = int(0.8 * len(shuffle_df_filtered))
        train_set = shuffle_df_filtered[:train_size]
        test_set = shuffle_df_filtered[train_size:]
        
        if not self.scaler:
            self.scaler = StandardScaler()
        train_set_scaled = self.scaler.fit_transform(train_set.to_numpy(dtype="float"))
        test_set_scaled = self.scaler.transform(test_set.to_numpy(dtype="float"))

        self.clf = OneClassSVM(kernel="rbf", gamma="auto", nu=0.01)
        self.clf.fit(train_set_scaled)
        
        decision_scores = self.clf.decision_function(test_set_scaled)
        negative_scores = decision_scores[decision_scores < 0]
        self._calculated_offset = (negative_scores.min() * -1) if len(negative_scores) > 0 else 0
        
        # Save the model and scaler
        joblib.dump(self.clf, self.path)
        joblib.dump(self.scaler, self.scaler_path)
        log.info(f"Rebuilt {self.name} model with features: {self.features}")
        log.info(f"Offset for anomaly detection set to: {self.offset}")
        
        
    def predict(self, data):
        if not self.enabled:
            raise ValueError(
                f"Model {self.name} is disabled and cannot make predictions."
            )

        data_filtered = {key: data[key] for key in self.features}
        data_array = np.array(list(data_filtered.values()), dtype="float")
        new_data = self.scaler.transform(data_array.reshape(1, -1))

        if self.clf:
            score = self.clf.decision_function(new_data) + self.offset + self._calculated_offset
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
            path="data/env.joblib",
            features=["temperature", "pressure", "humidity", "gas_concentration"],
            scaler_path="data/env_scaler.joblib",
            offset=2,
        )
        self.path


class LightModel(AnomalyModel):
    def __init__(self):
        super().__init__(
            name="Light",
            path="data/light.joblib",
            features=["lux"],
            scaler_path="data/light_scaler.joblib",
            offset=1,
        )


class VibrationModel(AnomalyModel):
    def __init__(self):
        super().__init__(
            name="Vibration",
            path="data/vib.joblib",
            features=[
                "x_acceleration",
                "y_acceleration",
                "z_acceleration",
                "x_rotation",
                "y_rotation",
                "z_rotation",
            ],
            scaler_path="data/vib_scaler.joblib",
            offset=0.3,
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
    recipients:list[EmailStr]