// Weather data types - ready for API integration
// These interfaces mimic popular weather APIs like OpenWeatherMap

export interface WeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface CurrentWeather {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  humidity: number
  pressure: number
  wind_speed: number
  wind_deg: number
  visibility: number
  clouds: number
  uv_index: number
  sunrise: number
  sunset: number
  condition: WeatherCondition
  description: string
  dt: number
}

export interface DailyForecast {
  dt: number
  temp: number
  temp_min: number
  temp_max: number
  condition: WeatherCondition
  humidity: number
  wind_speed: number
  pop: number // Probability of precipitation
}

export interface HourlyForecast {
  dt: number
  temp: number
  condition: WeatherCondition
  pop: number
}

export interface WeatherData {
  city: string
  country: string
  timezone: string
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
}

export interface WeatherMetrics {
  windSpeed: number
  windDirection: number
  humidity: number
  visibility: number
  pressure: number
  uvIndex: number
  sunrise: number
  sunset: number
}

// API Response types (for future integration)
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}
