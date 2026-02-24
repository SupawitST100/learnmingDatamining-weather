// src/pages/PredictionPage.tsx
import { useState } from 'react'
import {
  CloudRain, Thermometer, Wind, Droplets,
  Search, AlertCircle, Loader2, BarChart3
} from 'lucide-react'
import {
  predictWeather, predictRange,
  weatherIcon, weatherLabel,
  PredictResponse, DayForecast
} from '../services/weatherApi'

const MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]

function getDayOfYear(month: number): number {
  const cumDays = [0,31,59,90,120,151,181,212,243,273,304,334]
  return cumDays[month - 1] + 15
}

export default function PredictionPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [wind, setWind] = useState(3.0)
  const [precipitation, setPrecipitation] = useState(0.0)
  const [forecastDays, setForecastDays] = useState(7)

  const [result, setResult] = useState<PredictResponse | null>(null)
  const [range, setRange] = useState<DayForecast[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePredict = async () => {
    setLoading(true)
    setError('')
    try {
      const [single, multi] = await Promise.all([
        predictWeather({
          month,
          day_of_year: getDayOfYear(month),
          precipitation,
          wind,
        }),
        predictRange(month, forecastDays),
      ])
      setResult(single)
      setRange(multi)
    } catch {
      setError('❌ ไม่สามารถเชื่อมต่อ API ได้ — ตรวจสอบว่า backend กำลัง run อยู่ที่ port 8000')
    } finally {
      setLoading(false)
    }
  }

  const rainColor = (chance: number) =>
    chance > 60 ? 'text-blue-500' : chance > 30 ? 'text-yellow-500' : 'text-green-500'

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">🔮 ทำนายสภาพอากาศ</h1>
          <p className="text-muted-foreground">
            ใช้ ML Model ที่เทรนจาก Seattle Weather Dataset (2012–2015)
          </p>
        </div>

        {/* Input Card */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> กรอกข้อมูลสภาพอากาศ
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Month */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">เดือน</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Wind */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                ความเร็วลม: <span className="font-semibold text-foreground">{wind} m/s</span>
              </label>
              <input
                type="range" min={0} max={15} step={0.5}
                value={wind}
                onChange={e => setWind(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 m/s</span><span>15 m/s</span>
              </div>
            </div>

            {/* Precipitation */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                ปริมาณน้ำฝน (ถ้ามี): <span className="font-semibold text-foreground">{precipitation} mm</span>
              </label>
              <input
                type="range" min={0} max={60} step={0.5}
                value={precipitation}
                onChange={e => setPrecipitation(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 mm</span><span>60 mm</span>
              </div>
            </div>

            {/* Forecast days */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                จำนวนวันที่ต้องการพยากรณ์: <span className="font-semibold text-foreground">{forecastDays} วัน</span>
              </label>
              <input
                type="range" min={1} max={14} step={1}
                value={forecastDays}
                onChange={e => setForecastDays(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 วัน</span><span>14 วัน</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="mt-8 w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังทำนาย...</>
              : <><CloudRain className="w-5 h-5" /> ทำนายเลย</>
            }
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <>
            {/* Main prediction card */}
            <div className="glass-card rounded-3xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-6">📊 ผลการทำนาย — {MONTHS[month-1]}</h2>

              <div className="grid md:grid-cols-4 gap-4">
                {/* Weather */}
                <div className="md:col-span-1 flex flex-col items-center justify-center bg-primary/10 rounded-2xl p-6">
                  <span className="text-6xl mb-2">{weatherIcon(result.weather)}</span>
                  <p className="text-xl font-bold">{weatherLabel(result.weather)}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-1">{result.weather}</p>
                </div>

                {/* Temp max */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-3">
                    <Thermometer className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">อุณหภูมิสูงสุด</p>
                  <p className="text-3xl font-bold text-red-500">{result.temp_max}°C</p>
                </div>

                {/* Temp min */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                    <Thermometer className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">อุณหภูมิต่ำสุด</p>
                  <p className="text-3xl font-bold text-blue-500">{result.temp_min}°C</p>
                </div>

                {/* Rain chance */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">โอกาสฝนตก</p>
                  <p className={`text-3xl font-bold ${rainColor(result.rain_chance)}`}>
                    {result.rain_chance}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ฝนคาด {result.precipitation_forecast} mm
                  </p>
                </div>
              </div>

              {/* Probability breakdown */}
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> ความน่าจะเป็นแต่ละสภาพ
                </p>
                <div className="space-y-2">
                  {Object.entries(result.weather_probabilities)
                    .sort((a,b) => b[1] - a[1])
                    .map(([w, pct]) => (
                    <div key={w}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{weatherIcon(w)} {weatherLabel(w)}</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Multi-day forecast */}
            {range.length > 0 && (
              <div className="glass-card rounded-3xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  📅 พยากรณ์ {forecastDays} วันข้างหน้า
                </h2>
                <div className="overflow-x-auto">
                  <div className="flex gap-3 min-w-max pb-2">
                    {range.map((d) => (
                      <div
                        key={d.day}
                        className="flex flex-col items-center glass-card rounded-2xl p-4 min-w-[90px] hover:scale-105 transition-transform"
                      >
                        <p className="text-xs text-muted-foreground mb-1">วันที่ {d.day}</p>
                        <span className="text-3xl mb-2">{weatherIcon(d.weather)}</span>
                        <p className="text-xs font-medium">{weatherLabel(d.weather)}</p>
                        <div className="mt-2 text-center">
                          <p className="text-sm font-bold text-red-400">{d.temp_max}°</p>
                          <p className="text-sm text-blue-400">{d.temp_min}°</p>
                        </div>
                        {d.rain_chance > 10 && (
                          <p className="text-xs text-cyan-500 mt-1">🌧️ {d.rain_chance}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
