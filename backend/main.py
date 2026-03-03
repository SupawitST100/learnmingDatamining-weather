"""
Weather Prediction API
Pipeline: SpreadSubsample → Resample → RandomForest
Features: month, day_of_year, season, precipitation, wind, humidity, temp_range
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.utils import resample
from sklearn.model_selection import cross_val_score, StratifiedKFold
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

weather_clf  = None
temp_max_reg = None
temp_min_reg = None
humidity_reg = None
le = LabelEncoder()
dataset_stats = {}
model_metrics = {}
HAS_HUMIDITY  = False   # จะเป็น True ถ้าโหลด seattle-weather-humidity.csv ได้


def spread_subsample(df: pd.DataFrame, label_col: str) -> pd.DataFrame:
    min_count = df[label_col].value_counts().min()
    return pd.concat([
        df[df[label_col] == cls].sample(n=min_count, random_state=1)
        for cls in df[label_col].unique()
    ]).reset_index(drop=True)


def resample_balance(df: pd.DataFrame, label_col: str) -> pd.DataFrame:
    max_count = df[label_col].value_counts().max()
    return pd.concat([
        resample(df[df[label_col] == cls],
                 replace=True, n_samples=max_count, random_state=1)
        for cls in df[label_col].unique()
    ]).reset_index(drop=True)


def load_and_train():
    global weather_clf, temp_max_reg, temp_min_reg, humidity_reg
    global dataset_stats, model_metrics, HAS_HUMIDITY

    # โหลด dataset — ลองไฟล์ที่มี humidity ก่อน ถ้าไม่มีใช้ไฟล์เดิม
    if os.path.exists("seattle-weather-humidity.csv"):
        df = pd.read_csv("seattle-weather-humidity.csv", parse_dates=["date"])
        HAS_HUMIDITY = True
        print("✅ โหลด seattle-weather-humidity.csv (มี humidity)")
    else:
        df = pd.read_csv("seattle-weather.csv", parse_dates=["date"])
        HAS_HUMIDITY = False
        print("⚠️  ไม่พบ seattle-weather-humidity.csv — ใช้ไฟล์เดิม (ไม่มี humidity)")
        print("   รัน: python add_humidity.py เพื่อเพิ่ม humidity")

    df = df.dropna()

    # Feature engineering
    df["month"]       = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["season"]      = df["month"].apply(lambda m:
        0 if m in [12,1,2] else 1 if m in [3,4,5] else 2 if m in [6,7,8] else 3)
    df["temp_range"]  = df["temp_max"] - df["temp_min"]  # ช่วยแยก sun vs fog

    FEATURES = ["month", "day_of_year", "season", "precipitation", "wind", "temp_range"]
    if HAS_HUMIDITY:
        FEATURES.append("humidity")
        print(f"   Features: {FEATURES}")

    # Weka Pipeline
    df_spread    = spread_subsample(df, "weather")
    df_resampled = resample_balance(df_spread, "weather")

    X_clf    = df_resampled[FEATURES]
    y_labels = le.fit_transform(df_resampled["weather"])

    weather_clf = RandomForestClassifier(
        n_estimators    =50,
        max_depth       =5,
        min_samples_leaf=5,
        max_features    ="sqrt",
        random_state    =1,
        n_jobs          =-1
    )
    weather_clf.fit(X_clf, y_labels)

    # Cross-validation
    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=1)
    cv_scores = cross_val_score(weather_clf, X_clf, y_labels, cv=cv, scoring="accuracy")

    model_metrics["cv_accuracy_mean"] = round(float(cv_scores.mean()) * 100, 2)
    model_metrics["cv_accuracy_std"]  = round(float(cv_scores.std())  * 100, 2)
    model_metrics["cv_scores"]        = [round(float(s)*100, 2) for s in cv_scores]
    model_metrics["classes"]          = list(le.classes_)
    model_metrics["has_humidity"]     = HAS_HUMIDITY
    model_metrics["features"]         = FEATURES

    print(f"✅ CV Accuracy: {model_metrics['cv_accuracy_mean']}% (±{model_metrics['cv_accuracy_std']}%)")

    # Regression models
    X_all = df[FEATURES]
    temp_max_reg = RandomForestRegressor(n_estimators=50, max_depth=8, min_samples_leaf=3, random_state=1, n_jobs=-1)
    temp_max_reg.fit(X_all, df["temp_max"])

    temp_min_reg = RandomForestRegressor(n_estimators=50, max_depth=8, min_samples_leaf=3, random_state=1, n_jobs=-1)
    temp_min_reg.fit(X_all, df["temp_min"])

    REG_FEATURES = ["month", "day_of_year", "season", "wind"]
    if HAS_HUMIDITY:
        REG_FEATURES.append("humidity")
    humidity_reg = RandomForestRegressor(n_estimators=50, max_depth=6, min_samples_leaf=3, random_state=1, n_jobs=-1)
    humidity_reg.fit(df[REG_FEATURES], df["precipitation"])

    # Dataset stats
    df["date_str"] = df["date"].dt.strftime("%Y-%m-%d")
    dataset_stats["weather_counts"] = df["weather"].value_counts().to_dict()
    dataset_stats["monthly_avg_temp_max"] = df.groupby("month")["temp_max"].mean().round(1).to_dict()
    dataset_stats["monthly_avg_temp_min"] = df.groupby("month")["temp_min"].mean().round(1).to_dict()
    dataset_stats["monthly_avg_precip"]   = df.groupby("month")["precipitation"].mean().round(1).to_dict()
    if HAS_HUMIDITY:
        dataset_stats["monthly_avg_humidity"] = df.groupby("month")["humidity"].mean().round(1).to_dict()
    recent = df.tail(30)[["date_str","temp_max","temp_min","precipitation","weather"]].copy()
    dataset_stats["recent_30"] = recent.to_dict(orient="records")

load_and_train()


# ── Schemas ────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    month: int
    day_of_year: int
    precipitation: float
    wind: float
    temp_range: Optional[float] = None   # ถ้าไม่กรอก ใช้ค่าเฉลี่ยตามเดือน
    humidity: Optional[float]   = None   # ถ้าไม่กรอก ใช้ค่าเฉลี่ยตามเดือน


class PredictResponse(BaseModel):
    weather: str
    weather_probabilities: dict
    temp_max: float
    temp_min: float
    precipitation_forecast: float
    rain_chance: float
    has_humidity: bool


# ── Helpers ────────────────────────────────────────────────────
MONTHLY_TEMP_RANGE = {1:6,2:7,3:8,4:9,5:10,6:11,7:12,8:12,9:10,10:8,11:7,12:6}
MONTHLY_HUMIDITY   = {1:82,2:78,3:74,4:68,5:63,6:58,7:52,8:53,9:60,10:70,11:78,12:83}


def build_features(month, day_of_year, season, precipitation, wind, temp_range, humidity):
    feats = [month, day_of_year, season, precipitation, wind,
             temp_range if temp_range is not None else MONTHLY_TEMP_RANGE.get(month, 8)]
    if HAS_HUMIDITY:
        feats.append(humidity if humidity is not None else MONTHLY_HUMIDITY.get(month, 70))
    return [feats]


# ── Endpoints ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Weather Prediction API is running", "has_humidity": HAS_HUMIDITY}


@app.get("/metrics")
def metrics():
    return model_metrics


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    season = (
        0 if req.month in [12,1,2] else
        1 if req.month in [3,4,5]  else
        2 if req.month in [6,7,8]  else 3
    )
    X = build_features(req.month, req.day_of_year, season,
                       req.precipitation, req.wind,
                       req.temp_range, req.humidity)

    proba         = weather_clf.predict_proba(X)[0]
    weather_label = le.classes_[int(np.argmax(proba))]
    proba_dict    = {le.classes_[i]: round(float(p)*100, 1) for i, p in enumerate(proba)}

    t_max  = round(float(temp_max_reg.predict(X)[0]), 1)
    t_min  = round(float(temp_min_reg.predict(X)[0]), 1)

    reg_feats = [[req.month, req.day_of_year, season, req.wind]]
    if HAS_HUMIDITY:
        h = req.humidity if req.humidity is not None else MONTHLY_HUMIDITY.get(req.month, 70)
        reg_feats = [[req.month, req.day_of_year, season, req.wind, h]]
    precip = max(0.0, round(float(humidity_reg.predict(reg_feats)[0]), 1))

    rain_chance = round(proba_dict.get("rain", 0) + proba_dict.get("drizzle", 0), 1)

    return PredictResponse(
        weather=weather_label,
        weather_probabilities=proba_dict,
        temp_max=t_max,
        temp_min=t_min,
        precipitation_forecast=precip,
        rain_chance=rain_chance,
        has_humidity=HAS_HUMIDITY,
    )


@app.get("/predict/range")
def predict_range(start_month: int = 1, days: int = 7):
    results = []
    for i in range(days):
        month  = ((start_month - 1 + i // 30) % 12) + 1
        doy    = min(365, (start_month - 1) * 30 + i + 1)
        season = (0 if month in [12,1,2] else 1 if month in [3,4,5] else 2 if month in [6,7,8] else 3)

        X    = build_features(month, doy, season, 0.0, 3.0, None, None)
        X_np = [[month, doy, season, 3.0]]
        if HAS_HUMIDITY:
            X_np = [[month, doy, season, 3.0, MONTHLY_HUMIDITY.get(month, 70)]]

        proba         = weather_clf.predict_proba(X)[0]
        weather_label = le.classes_[int(np.argmax(proba))]
        t_max         = round(float(temp_max_reg.predict(X)[0]), 1)
        t_min         = round(float(temp_min_reg.predict(X)[0]), 1)
        precip        = max(0.0, round(float(humidity_reg.predict(X_np)[0]), 1))
        rain_chance   = round(
            sum(float(proba[j]) for j, c in enumerate(le.classes_)
                if c in ["rain","drizzle"]) * 100, 1
        )
        results.append({
            "day": i+1, "weather": weather_label,
            "temp_max": t_max, "temp_min": t_min,
            "precipitation": precip, "rain_chance": rain_chance,
        })
    return results


@app.get("/stats")
def stats():
    return dataset_stats

