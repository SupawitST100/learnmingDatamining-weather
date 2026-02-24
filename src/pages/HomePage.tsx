import { useEffect, useState } from 'react'
import { Search, MapPin, Wind, Droplets, Sun, Cloud, CloudRain, Loader2, Brain } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CurrentWeather {
  temp: number
  feels_like: number
  temp_max: number
  temp_min: number
  humidity: number
  wind_speed: number
  uv_index: number
  clouds: number
  description: string
  icon: string
  city: string
}

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: 'ท้องฟ้าแจ่มใส', icon: '☀️' },
  1:  { label: 'เกือบแจ่มใส', icon: '🌤️' },
  2:  { label: 'มีเมฆบางส่วน', icon: '⛅' },
  3:  { label: 'มีเมฆมาก', icon: '☁️' },
  45: { label: 'หมอกลง', icon: '🌫️' },
  48: { label: 'หมอกน้ำแข็ง', icon: '🌫️' },
  51: { label: 'ฝนปรอยเบา', icon: '🌦️' },
  53: { label: 'ฝนปรอย', icon: '🌦️' },
  55: { label: 'ฝนปรอยหนัก', icon: '🌧️' },
  61: { label: 'ฝนเบา', icon: '🌧️' },
  63: { label: 'ฝนปานกลาง', icon: '🌧️' },
  65: { label: 'ฝนหนัก', icon: '🌧️' },
  80: { label: 'ฝนตกเป็นระยะ', icon: '🌦️' },
  81: { label: 'ฝนตกหนักเป็นระยะ', icon: '🌧️' },
  95: { label: 'พายุฝนฟ้าคะนอง', icon: '⛈️' },
}

function getWMO(code: number) {
  return WMO_CODES[code] ?? { label: 'ไม่ทราบสภาพ', icon: '🌤️' }
}

const CITIES = [
  { name: 'กรุงเทพมหานคร', lat: 13.75, lon: 100.52 },
  { name: 'เชียงใหม่', lat: 18.79, lon: 98.98 },
  { name: 'ภูเก็ต', lat: 7.89, lon: 98.40 },
  { name: 'ขอนแก่น', lat: 16.43, lon: 102.83 },
  { name: 'หาดใหญ่', lat: 7.01, lon: 100.47 },
]

export default function HomePage() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchWeather(selectedCity.lat, selectedCity.lon, selectedCity.name)
  }, [selectedCity])

  async function fetchWeather(lat: number, lon: number, cityName: string) {
    setLoading(true)
    setError('')
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,` +
        `cloud_cover,uv_index,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok&forecast_days=1`

      const res = await fetch(url)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const c = data.current
      const wmo = getWMO(c.weather_code)

      setWeather({
        temp: Math.round(c.temperature_2m),
        feels_like: Math.round(c.apparent_temperature),
        temp_max: Math.round(data.daily.temperature_2m_max[0]),
        temp_min: Math.round(data.daily.temperature_2m_min[0]),
        humidity: c.relative_humidity_2m,
        wind_speed: c.wind_speed_10m,
        uv_index: c.uv_index,
        clouds: c.cloud_cover,
        description: wmo.label,
        icon: wmo.icon,
        city: cityName,
      })
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const filteredCities = CITIES.filter(c => c.name.includes(search))

  return (
    <div className="min-h-screen">
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10 dark:from-primary/10 dark:to-accent/5" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 max-w-6xl relative">

          {/* City Selector */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาเมือง..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
              />
            </div>
            {search && (
              <div className="mt-2 glass-card rounded-xl overflow-hidden">
                {filteredCities.length > 0 ? filteredCities.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { setSelectedCity(c); setSearch('') }}
                    className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    {c.name}
                  </button>
                )) : (
                  <p className="px-4 py-3 text-muted-foreground text-sm">ไม่พบเมืองนี้</p>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {CITIES.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCity.name === c.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Display */}
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">กำลังโหลดข้อมูลอากาศ...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : weather && (
            <>
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-lg font-medium text-muted-foreground">
                    {weather.city} · ข้อมูลจริงจาก Open-Meteo
                  </span>
                </div>

                <div className="relative inline-block mb-4">
                  <h1 className="text-8xl md:text-9xl font-bold tracking-tight">
                    {weather.temp}°C
                  </h1>
                  <div className="absolute -top-4 -right-8 text-5xl">
                    {weather.icon}
                  </div>
                </div>

                <p className="text-2xl text-muted-foreground mb-2">{weather.description}</p>
                <p className="text-lg text-muted-foreground/70">
                  รู้สึกเหมือน {weather.feels_like}°C · สูงสุด {weather.temp_max}°C · ต่ำสุด {weather.temp_min}°C
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
                  <Wind className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">ลม</p>
                  <p className="text-lg font-semibold">{weather.wind_speed} km/h</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
                  <Droplets className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">ความชื้น</p>
                  <p className="text-lg font-semibold">{weather.humidity}%</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
                  <Sun className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="text-sm text-muted-foreground">UV Index</p>
                  <p className="text-lg font-semibold">{weather.uv_index}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
                  <Cloud className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">เมฆ</p>
                  <p className="text-lg font-semibold">{weather.clouds}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">ต้องการทำนายสภาพอากาศ?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            ใช้ ML Model ที่เทรนจาก Seattle Weather Dataset เพื่อทำนายอุณหภูมิ ฝน และสภาพอากาศในอนาคต
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/prediction"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Brain className="w-5 h-5" />
              ทำนายอากาศ
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
            >
              <CloudRain className="w-5 h-5" />
              ดู Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
