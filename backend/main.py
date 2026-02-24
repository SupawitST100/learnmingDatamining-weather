"""
Weather Prediction API
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import json

app = FastAPI(title="Weather Prediction API")

# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global models ──────────────────────────────────────────────
weather_clf = None      # predicts weather class
temp_max_reg = None     # predicts temp_max
temp_min_reg = None     # predicts temp_min
humidity_reg = None     # predicts precipitation (proxy for humidity)
le = LabelEncoder()
dataset_stats = {}


def load_and_train():
    """Load CSV and train all models on startup."""
    global weather_clf, temp_max_reg, temp_min_reg, humidity_reg, dataset_stats

    df = pd.read_csv("seattle-weather.csv", parse_dates=["date"])
    df = df.dropna()

    # Feature engineering
    df["month"]      = df["date"].dt.month
    df["day_of_year"]= df["date"].dt.dayofyear
    df["season"]     = df["month"].apply(lambda m:
        0 if m in [12,1,2] else 1 if m in [3,4,5] else 2 if m in [6,7,8] else 3)
    df["rain_flag"]  = (df["precipitation"] > 0).astype(int)

    FEATURES = ["month", "day_of_year", "season", "precipitation", "wind"]

    X = df[FEATURES]

    # 1) Weather classification (sun/rain/drizzle/fog/snow)
    y_weather = le.fit_transform(df["weather"])
    weather_clf = RandomForestClassifier(n_estimators=100, random_state=42)
    weather_clf.fit(X, y_weather)

    # 2) Temp max regression
    temp_max_reg = RandomForestRegressor(n_estimators=100, random_state=42)
    temp_max_reg.fit(X, df["temp_max"])

    # 3) Temp min regression
    temp_min_reg = RandomForestRegressor(n_estimators=100, random_state=42)
    temp_min_reg.fit(X, df["temp_min"])

    # 4) Precipitation regression (used as humidity proxy)
    humidity_reg = RandomForestRegressor(n_estimators=100, random_state=42)
    humidity_reg.fit(df[["month","day_of_year","season","wind"]], df["precipitation"])

    # Dataset stats for frontend charts
    df["date_str"] = df["date"].dt.strftime("%Y-%m-%d")
    dataset_stats["weather_counts"] = df["weather"].value_counts().to_dict()
    dataset_stats["monthly_avg_temp_max"] = (
        df.groupby("month")["temp_max"].mean().round(1).to_dict()
    )
    dataset_stats["monthly_avg_temp_min"] = (
        df.groupby("month")["temp_min"].mean().round(1).to_dict()
    )
    dataset_stats["monthly_avg_precip"] = (
        df.groupby("month")["precipitation"].mean().round(1).to_dict()
    )
    # Last 30 days for trend chart
    recent = df.tail(30)[["date_str","temp_max","temp_min","precipitation","weather"]].copy()
    dataset_stats["recent_30"] = recent.to_dict(orient="records")

    print("✅ Models trained successfully")
    print(f"   Weather classes: {list(le.classes_)}")


# Train on startup
load_and_train()


# ── Request / Response schemas ─────────────────────────────────
class PredictRequest(BaseModel):
    month: int           # 1–12
    day_of_year: int     # 1–365
    precipitation: float # mm (0 if unknown, use 0)
    wind: float          # m/s


class PredictResponse(BaseModel):
    weather: str
    weather_probabilities: dict
    temp_max: float
    temp_min: float
    precipitation_forecast: float
    rain_chance: float   # 0–100 %


# ── Endpoints ─────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Weather Prediction API is running"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    season = (
        0 if req.month in [12,1,2]
        else 1 if req.month in [3,4,5]
        else 2 if req.month in [6,7,8]
        else 3
    )
    X = [[req.month, req.day_of_year, season, req.precipitation, req.wind]]
    X_no_precip = [[req.month, req.day_of_year, season, req.wind]]

    # Predict weather class
    proba = weather_clf.predict_proba(X)[0]
    class_idx = int(np.argmax(proba))
    weather_label = le.classes_[class_idx]
    proba_dict = {le.classes_[i]: round(float(p)*100, 1) for i, p in enumerate(proba)}

    # Predict temperatures
    t_max = round(float(temp_max_reg.predict(X)[0]), 1)
    t_min = round(float(temp_min_reg.predict(X)[0]), 1)

    # Predict precipitation
    precip = round(float(humidity_reg.predict(X_no_precip)[0]), 1)
    precip = max(0.0, precip)

    # Rain chance = sum of rain + drizzle probabilities
    rain_chance = round(
        (proba_dict.get("rain", 0) + proba_dict.get("drizzle", 0)), 1
    )

    return PredictResponse(
        weather=weather_label,
        weather_probabilities=proba_dict,
        temp_max=t_max,
        temp_min=t_min,
        precipitation_forecast=precip,
        rain_chance=rain_chance,
    )


@app.get("/predict/range")
def predict_range(start_month: int = 1, days: int = 7):
    """Predict weather for next N days starting from a given month."""
    results = []
    for i in range(days):
        month = ((start_month - 1 + i // 30) % 12) + 1
        doy   = min(365, (start_month - 1) * 30 + i + 1)
        season = (
            0 if month in [12,1,2]
            else 1 if month in [3,4,5]
            else 2 if month in [6,7,8]
            else 3
        )
        X = [[month, doy, season, 0.0, 3.0]]
        X_np = [[month, doy, season, 3.0]]

        proba = weather_clf.predict_proba(X)[0]
        class_idx = int(np.argmax(proba))
        weather_label = le.classes_[class_idx]
        t_max = round(float(temp_max_reg.predict(X)[0]), 1)
        t_min = round(float(temp_min_reg.predict(X)[0]), 1)
        precip = max(0.0, round(float(humidity_reg.predict(X_np)[0]), 1))
        rain_chance = round(
            sum(float(proba[i]) for i, c in enumerate(le.classes_) if c in ["rain","drizzle"]) * 100, 1
        )

        results.append({
            "day": i + 1,
            "weather": weather_label,
            "temp_max": t_max,
            "temp_min": t_min,
            "precipitation": precip,
            "rain_chance": rain_chance,
        })
    return results


@app.get("/stats")
def stats():
    """Return dataset statistics for dashboard charts."""
    return dataset_stats
