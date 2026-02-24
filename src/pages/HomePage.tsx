import { Search, MapPin, Wind, Droplets, Sun, Cloud, CloudRain } from 'lucide-react'
import { mockCurrentWeather, formatTemperature, formatDate } from '../data/mockWeather'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const { current, daily, city, country } = mockCurrentWeather

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10 dark:from-primary/10 dark:to-accent/5" />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 max-w-6xl relative">
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาสถานที่..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Current Weather Display */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg font-medium text-muted-foreground">
                {city}, {country}
              </span>
            </div>

            {/* Main Temperature */}
            <div className="relative inline-block mb-4">
              <h1 className="text-8xl md:text-9xl font-bold tracking-tight">
                {formatTemperature(current.temp)}
              </h1>
              <div className="absolute -top-4 -right-8 text-4xl">
                ☀️
              </div>
            </div>

            <p className="text-2xl text-muted-foreground mb-2">
              {current.description}
            </p>
            <p className="text-lg text-muted-foreground/70">
              รู้สึกเหมือน {formatTemperature(current.feels_like)} • สูงสุด {formatTemperature(current.temp_max)} • ต่ำสุด {formatTemperature(current.temp_min)}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
              <Wind className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">ลม</p>
              <p className="text-lg font-semibold">{current.wind_speed} m/s</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
              <Droplets className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">ความชื้น</p>
              <p className="text-lg font-semibold">{current.humidity}%</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
              <Sun className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-sm text-muted-foreground">UV Index</p>
              <p className="text-lg font-semibold">{current.uv_index}</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200">
              <Cloud className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">เมฆ</p>
              <p className="text-lg font-semibold">{current.clouds}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Forecast Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">พยากรณ์อากาศ 7 วัน</h2>
            <Link
              to="/dashboard"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ดูเพิ่มเติม →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {daily.slice(0, 7).map((day, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer"
              >
                <p className="text-sm text-muted-foreground mb-2">
                  {index === 0 ? 'วันนี้' : formatDate(day.dt, 'short')}
                </p>
                <div className="text-3xl mb-2">
                  {day.condition.main === 'Clear' ? '☀️' :
                   day.condition.main === 'Clouds' ? '☁️' :
                   day.condition.main === 'Rain' ? '🌧️' : '🌤️'}
                </div>
                <p className="text-lg font-semibold">{formatTemperature(day.temp)}</p>
                <div className="flex justify-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>↑{formatTemperature(day.temp_max)}</span>
                  <span>↓{formatTemperature(day.temp_min)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            ต้องการดูรายละเอียดเพิ่มเติม?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            ดูข้อมูลสภาพอากาศแบบละเอียด รวมถึงความชื้น ความเร็วลม และพยากรณ์อากาศรายชั่วโมง
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <CloudRain className="w-5 h-5" />
            ไปยัง Dashboard
          </Link>
        </div>
      </section>
    </div>
  )
}
