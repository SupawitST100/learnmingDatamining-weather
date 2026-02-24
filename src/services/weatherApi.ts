// src/services/weatherApi.ts
// Connects to the Python FastAPI backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface PredictRequest {
  month: number
  day_of_year: number
  precipitation: number
  wind: number
  humidity?: number
}

export interface PredictResponse {
  weather: string
  weather_probabilities: Record<string, number>
  temp_max: number
  temp_min: number
  precipitation_forecast: number
  rain_chance: number
}

export interface DayForecast {
  day: number
  weather: string
  temp_max: number
  temp_min: number
  precipitation: number
  rain_chance: number
}

export interface StatsResponse {
  weather_counts: Record<string, number>
  monthly_avg_temp_max: Record<string, number>
  monthly_avg_temp_min: Record<string, number>
  monthly_avg_precip: Record<string, number>
  recent_30: Array<{
    date_str: string
    temp_max: number
    temp_min: number
    precipitation: number
    weather: string
  }>
}

export async function predictWeather(req: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Prediction failed')
  return res.json()
}

export async function predictRange(startMonth: number, days = 7): Promise<DayForecast[]> {
  const res = await fetch(`${API_BASE}/predict/range?start_month=${startMonth}&days=${days}`)
  if (!res.ok) throw new Error('Range prediction failed')
  return res.json()
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) throw new Error('Stats fetch failed')
  return res.json()
}

export function weatherIcon(w: string): string {
  const map: Record<string, string> = {
    sun: '☀️',
    rain: '🌧️',
    drizzle: '🌦️',
    fog: '🌫️',
    snow: '❄️',
  }
  return map[w] ?? '🌤️'
}

export function weatherLabel(w: string): string {
  const map: Record<string, string> = {
    sun: 'แดดจัด',
    rain: 'ฝนตก',
    drizzle: 'ฝนปรอย',
    fog: 'หมอกลง',
    snow: 'หิมะตก',
  }
  return map[w] ?? w
}

export interface ModelMetrics {
  cv_accuracy_mean: number
  cv_accuracy_std: number
  cv_scores: number[]
  classes: string[]
  n_estimators: number
  max_depth: number
  min_samples_leaf: number
}

export async function fetchMetrics(): Promise<ModelMetrics> {
  const res = await fetch(`${API_BASE}/metrics`)
  if (!res.ok) throw new Error('Metrics fetch failed')
  return res.json()
}
