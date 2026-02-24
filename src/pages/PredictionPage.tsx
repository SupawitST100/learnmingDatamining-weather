// src/pages/PredictionPage.tsx
import { useState } from 'react'
import {
  CloudRain, Thermometer, Wind, Droplets,
  Search, AlertCircle, Loader2, BarChart3, X
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

interface SliderFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
  minLabel: string
  maxLabel: string
  color?: string
}

function SliderField({ label, value, onChange, min, max, step, unit, minLabel, maxLabel, color = 'accent-primary' }: SliderFieldProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-muted-foreground">{label}</label>
        <span className="font-semibold text-foreground tabular-nums">{value} {unit}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-full ${color}`}
        />
        {/* Tick marks every 25% */}
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">{minLabel}</span>
          <span className="text-xs text-muted-foreground">{Math.round((min + max) / 2)} {unit}</span>
          <span className="text-xs text-muted-foreground">{maxLabel}</span>
        </div>
        {/* Progress indicator */}
        <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

interface OptionalTempProps {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  color: string
  textColor: string
  bgColor: string
}

function OptionalTempField({ label, value, onChange, color, textColor, bgColor }: OptionalTempProps) {
  const enabled = value !== null
  return (
    <div className={`rounded-2xl p-4 border-2 transition-colors ${enabled ? `${bgColor} border-current ${textColor}` : 'border-border bg-secondary/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <label className={`text-sm font-medium ${enabled ? textColor : 'text-muted-foreground'}`}>
          {label}
        </label>
        <div className="flex items-center gap-2">
          {enabled && (
            <button
              onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="ล้างค่า"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onChange(enabled ? null : 25)}
            className={`text-xs px-3 py-1 rounded-lg transition-colors font-medium ${
              enabled
                ? `${bgColor} ${textColor} border border-current`
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {enabled ? 'เปิดอยู่' : 'เพิ่มค่า'}
          </button>
        </div>
      </div>

      {enabled ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-3xl font-bold ${textColor}`}>{value}°C</span>
          </div>
          <input
            type="range"
            min={-10} max={45} step={0.5}
            value={value ?? 25}
            onChange={e => onChange(Number(e.target.value))}
            className={`w-full ${color}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>-10°C</span>
            <span>0°C</span>
            <span>15°C</span>
            <span>30°C</span>
            <span>45°C</span>
          </div>
          {/* Detailed tick bar */}
          <div className="mt-2 relative h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${textColor === 'text-red-500' ? 'bg-red-400/60' : 'bg-blue-400/60'}`}
              style={{ width: `${((value! + 10) / 55) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {value! >= 35 ? '🔥 ร้อนมาก' : value! >= 25 ? '☀️ อุ่น' : value! >= 15 ? '🌤️ เย็นสบาย' : value! >= 5 ? '❄️ เย็น' : '🧊 หนาวจัด'}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">ไม่กรอกก็ได้ — Model จะทำนายให้เอง</p>
      )}
    </div>
  )
}

export default function PredictionPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [wind, setWind] = useState(3.0)
  const [precipitation, setPrecipitation] = useState(0.0)
  const [forecastDays, setForecastDays] = useState(7)
  const [tempMax, setTempMax] = useState<number | null>(null)
  const [tempMin, setTempMin] = useState<number | null>(null)

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

      // ถ้าผู้ใช้กรอก temp ไว้ ให้ override ผลจาก model
      const finalResult = {
        ...single,
        temp_max: tempMax !== null ? tempMax : single.temp_max,
        temp_min: tempMin !== null ? tempMin : single.temp_min,
      }

      setResult(finalResult)
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

            {/* Forecast days */}
            <div>
              <SliderField
                label="จำนวนวันที่ต้องการพยากรณ์"
                value={forecastDays}
                onChange={setForecastDays}
                min={1} max={14} step={1}
                unit="วัน"
                minLabel="1 วัน"
                maxLabel="14 วัน"
              />
            </div>

            {/* Wind */}
            <div>
              <SliderField
                label="ความเร็วลม"
                value={wind}
                onChange={setWind}
                min={0} max={20} step={0.1}
                unit="m/s"
                minLabel="0 m/s"
                maxLabel="20 m/s"
              />
            </div>

            {/* Precipitation */}
            <div>
              <SliderField
                label="ปริมาณน้ำฝน (ถ้ามี)"
                value={precipitation}
                onChange={setPrecipitation}
                min={0} max={80} step={0.5}
                unit="mm"
                minLabel="0 mm"
                maxLabel="80 mm"
              />
            </div>
          </div>

          {/* Optional Temp Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                อุณหภูมิ <span className="text-foreground font-medium">(ไม่บังคับ)</span> — ถ้ากรอกจะใช้แทนค่าที่ Model ทำนาย
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <OptionalTempField
                label="🌡️ อุณหภูมิสูงสุด"
                value={tempMax}
                onChange={setTempMax}
                color="accent-red-500"
                textColor="text-red-500"
                bgColor="bg-red-500/5"
              />
              <OptionalTempField
                label="🌡️ อุณหภูมิต่ำสุด"
                value={tempMin}
                onChange={setTempMin}
                color="accent-blue-500"
                textColor="text-blue-500"
                bgColor="bg-blue-500/5"
              />
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
                  {tempMax !== null && (
                    <p className="text-xs text-muted-foreground mt-1">✏️ กรอกเอง</p>
                  )}
                </div>

                {/* Temp min */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                    <Thermometer className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">อุณหภูมิต่ำสุด</p>
                  <p className="text-3xl font-bold text-blue-500">{result.temp_min}°C</p>
                  {tempMin !== null && (
                    <p className="text-xs text-muted-foreground mt-1">✏️ กรอกเอง</p>
                  )}
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
                    .sort((a, b) => b[1] - a[1])
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
