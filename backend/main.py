"""
Weather Prediction API
Pipeline: SpreadSubsample → Resample → RandomForest (เหมือน Weka)
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.utils import resample
import os

app = FastAPI(title="Weather Prediction API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global models ──────────────────────────────────────────────
weather_clf = None
temp_max_reg = None
temp_min_reg = None
humidity_reg = None
le = LabelEncoder()
dataset_stats = {}


def spread_subsample(df: pd.DataFrame, label_col: str) -> pd.DataFrame:
    """
    เทียบเท่า Weka SpreadSubsample
    ลดทุก class ให้เท่ากับ class ที่มีน้อยที่สุด
    """
    min_count = df[label_col].value_counts().min()
    parts = []
    for cls in df[label_col].unique():
        subset = df[df[label_col] == cls]
        parts.append(subset.sample(n=min_count, random_state=1))
    return pd.concat(parts).reset_index(drop=True)


def resample_balance(df: pd.DataFrame, label_col: str) -> pd.DataFrame:
    """
    เทียบเท่า Weka Resample (biasToUniformClass=1.0)
    เพิ่มข้อมูลกลุ่มน้อยด้วยการสุ่มซ้ำให้ทุก class เท่ากับ class ใหญ่สุด
    """
    max_count = df[label_col].value_counts().max()
    parts = []
    for cls in df[label_col].unique():
        subset = df[df[label_col] == cls]
        upsampled = resample(subset, replace=True, n_samples=max_count, random_state=1)
        parts.append(upsampled)
    return pd.concat(parts).reset_index(drop=True)


def load_and_train():
    """Load CSV และ train ด้วย pipeline เดียวกับ Weka"""
    global weather_clf, temp_max_reg, temp_min_reg, humidity_reg, dataset_stats

    df = pd.read_csv("seattle-weather.csv", parse_dates=["date"])
    df = df.dropna()

    # Feature engineering
    df["month"]       = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["season"]      = df["month"].apply(lambda m:
        0 if m in [12,1,2] else 1 if m in [3,4,5] else 2 if m in [6,7,8] else 3)

    FEATURES = ["month", "day_of_year", "season", "precipitation", "wind"]

    # ── Weka Pipeline สำหรับ Classification ──────────────────
    # Step 1: SpreadSubsample — ทำให้ทุก class มีจำนวนเท่ากัน
    df_spread = spread_subsample(df, "weather")
    print(f"📊 หลัง SpreadSubsample: {len(df_spread)} instances")
    print(df_spread["weather"].value_counts().to_dict())

    # Step 2: Resample — เพิ่มข้อมูลซ้ำให้ครบ
    df_resampled = resample_balance(df_spread, "weather")
    print(f"📊 หลัง Resample: {len(df_resampled)} instances")
    print(df_resampled["weather"].value_counts().to_dict())

    # Step 3: Train RandomForest (Classification)
    X_clf = df_resampled[FEATURES]
    y_weather = le.fit_transform(df_resampled["weather"])
    weather_clf = RandomForestClassifier(n_estimators=100, random_state=1)
    weather_clf.fit(X_clf, y_weather)

    # ── Regression models ใช้ข้อมูลต้นฉบับทั้งหมด ──────────
    X_all = df[FEATURES]

    temp_max_reg = RandomForestRegressor(n_estimators=100, random_state=1)
    temp_max_reg.fit(X_all, df["temp_max"])

    temp_min_reg = RandomForestRegressor(n_estimators=100, random_state=1)
    temp_min_reg.fit(X_all, df["temp_min"])

    humidity_reg = RandomForestRegressor(n_estimators=100, random_state=1)
    humidity_reg.fit(df[["month", "day_of_year", "season", "wind"]], df["precipitation"])

    # Dataset stats สำหรับ Dashboard
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
    recent = df.tail(30)[["date_str", "temp_max", "temp_min", "precipitation", "weather"]].copy()
    dataset_stats["recent_30"] = recent.to_dict(orient="records")

    print(f"✅ Train เสร็จ — Weather classes: {list(le.classes_)}")


load_and_train()


# ── Schemas ────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    month: int
    day_of_year: int
    precipitation: float
    wind: float


class PredictResponse(BaseModel):
    weather: str
    weather_probabilities: dict
    temp_max: float
    temp_min: float
    precipitation_forecast: float
    rain_chance: float


# ── Endpoints ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Weather Prediction API is running"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    season = (
        0 if req.month in [12, 1, 2]
        else 1 if req.month in [3, 4, 5]
        else 2 if req.month in [6, 7, 8]
        else 3
    )
    X = [[req.month, req.day_of_year, season, req.precipitation, req.wind]]
    X_no_precip = [[req.month, req.day_of_year, season, req.wind]]

    proba = weather_clf.predict_proba(X)[0]
    class_idx = int(np.argmax(proba))
    weather_label = le.classes_[class_idx]
    proba_dict = {
        le.classes_[i]: round(float(p) * 100, 1)
        for i, p in enumerate(proba)
    }

    t_max = round(float(temp_max_reg.predict(X)[0]), 1)
    t_min = round(float(temp_min_reg.predict(X)[0]), 1)
    precip = max(0.0, round(float(humidity_reg.predict(X_no_precip)[0]), 1))
    rain_chance = round(
        proba_dict.get("rain", 0) + proba_dict.get("drizzle", 0), 1
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
    results = []
    for i in range(days):
        month = ((start_month - 1 + i // 30) % 12) + 1
        doy = min(365, (start_month - 1) * 30 + i + 1)
        season = (
            0 if month in [12, 1, 2]
            else 1 if month in [3, 4, 5]
            else 2 if month in [6, 7, 8]
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
            sum(float(proba[j]) for j, c in enumerate(le.classes_)
                if c in ["rain", "drizzle"]) * 100, 1
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
    return dataset_stats
