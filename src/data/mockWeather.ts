import { WeatherData, WeatherMetrics, DailyForecast, HourlyForecast } from '../types/weather'

// Mock weather data - ready to be replaced with real API calls
export const mockCurrentWeather: WeatherData = {
  city: 'กรุงเทพมหานคร',
  country: 'Thailand',
  timezone: 'Asia/Bangkok',
  current: {
    temp: 32,
    feels_like: 36,
    temp_min: 28,
    temp_max: 35,
    humidity: 72,
    pressure: 1009,
    wind_speed: 3.5,
    wind_deg: 180,
    visibility: 10000,
    clouds: 40,
    uv_index: 6,
    sunrise: 1704067200,
    sunset: 1704106800,
    condition: {
      id: 801,
      main: 'Clouds',
      description: 'few clouds',
      icon: '02d',
    },
    description: 'ท้องฟ้าแจ่มใส',
    dt: Date.now() / 1000,
  },
  hourly: generateHourlyForecast(),
  daily: generateDailyForecast(),
}

function generateHourlyForecast(): HourlyForecast[] {
  const hours: HourlyForecast[] = []
  const conditions = [
    { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
    { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' },
    { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' },
  ]

  for (let i = 0; i < 24; i++) {
    hours.push({
      dt: Date.now() / 1000 + i * 3600,
      temp: 28 + Math.sin(i / 4) * 5,
      condition: conditions[i % 3],
      pop: Math.random() * 0.3,
    })
  }

  return hours
}

function generateDailyForecast(): DailyForecast[] {
  const days: DailyForecast[] = []
  const conditions = [
    { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
    { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' },
    { id: 500, main: 'Rain', description: 'light rain', icon: '10d' },
    { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' },
    { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' },
  ]

  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    days.push({
      dt: date.getTime() / 1000,
      temp: 30 + Math.random() * 5,
      temp_min: 24 + Math.random() * 3,
      temp_max: 35 + Math.random() * 3,
      condition: conditions[i % 5],
      humidity: 60 + Math.random() * 30,
      wind_speed: 2 + Math.random() * 4,
      pop: Math.random() * 0.5,
    })
  }

  return days
}

export const mockWeatherMetrics: WeatherMetrics = {
  windSpeed: 3.5,
  windDirection: 180,
  humidity: 72,
  visibility: 10000,
  pressure: 1009,
  uvIndex: 6,
  sunrise: 1704067200,
  sunset: 1704106800,
}

// Helper function to format temperature
export const formatTemperature = (temp: number, unit: 'C' | 'F' = 'C'): string => {
  if (unit === 'F') {
    return `${Math.round(temp * 9 / 5 + 32)}°F`
  }
  return `${Math.round(temp)}°C`
}

// Helper function to format wind direction
export const formatWindDirection = (deg: number): string => {
  const directions = ['เหนือ', 'ตะวันออกเฉียงเหนือ', 'ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ']
  const index = Math.round(deg / 45) % 8
  return directions[index]
}

// Helper function to format time
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper function to format date
export const formatDate = (timestamp: number, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(timestamp * 1000)

  if (format === 'short') {
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Helper function to get weather icon
export const getWeatherIcon = (condition: string): string => {
  const iconMap: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
  }

  return iconMap[condition] || '🌤️'
}
