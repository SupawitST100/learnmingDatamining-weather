"""
Script เพิ่ม humidity จาก Open-Meteo Historical API
รัน: python add_humidity.py
ผลลัพธ์: seattle-weather-humidity.csv
"""
import requests
import pandas as pd

print("📥 โหลด seattle-weather.csv...")
df = pd.read_csv("modelseattle-weather.csv", parse_dates=["date"])
print(f"   {len(df)} rows, {df['date'].min().date()} ถึง {df['date'].max().date()}")

print("\n🌐 ดึง humidity จาก Open-Meteo Historical API...")
# Seattle coordinates
url = (
    "https://archive-api.open-meteo.com/v1/archive"
    "?latitude=47.6062&longitude=-122.3321"
    "&start_date=2012-01-01&end_date=2015-12-31"
    "&daily=relative_humidity_2m_mean"
    "&timezone=America%2FLos_Angeles"
)

res = requests.get(url)
if res.status_code != 200:
    print(f"❌ API error: {res.status_code}")
    exit(1)

data = res.json()
humidity_df = pd.DataFrame({
    "date": pd.to_datetime(data["daily"]["time"]),
    "humidity": data["daily"]["relative_humidity_2m_mean"]
})
print(f"   ได้ {len(humidity_df)} rows")

# Merge
df = df.merge(humidity_df, on="date", how="left")
df["humidity"] = df["humidity"].round(1)

# ตรวจสอบ
missing = df["humidity"].isna().sum()
if missing > 0:
    print(f"⚠️  มี {missing} rows ที่ humidity หายไป → ใช้ค่าเฉลี่ยแทน")
    df["humidity"] = df["humidity"].fillna(df["humidity"].mean().round(1))

print(f"\n✅ ตัวอย่างข้อมูล:")
print(df[["date","temp_max","temp_min","precipitation","wind","humidity","weather"]].head(5).to_string())

print(f"\n📊 สถิติ humidity:")
print(f"   เฉลี่ย: {df['humidity'].mean():.1f}%")
print(f"   ต่ำสุด: {df['humidity'].min():.1f}%")
print(f"   สูงสุด: {df['humidity'].max():.1f}%")

output = "seattle-weather-humidity.csv"
df.to_csv(output, index=False)
print(f"\n💾 บันทึกเป็น {output} เรียบร้อยแล้วครับ!")
print(f"   columns: {list(df.columns)}")
