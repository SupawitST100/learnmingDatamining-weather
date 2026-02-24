// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Cloud, Loader2, Brain, CheckCircle } from 'lucide-react'
import { fetchStats, fetchMetrics, StatsResponse, ModelMetrics, weatherIcon, weatherLabel } from '../services/weatherApi'

const MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export default function DashboardPage() {
  const [stats, setStats]     = useState<StatsResponse | null>(null)
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    Promise.all([fetchStats(), fetchMetrics()])
      .then(([s, m]) => { setStats(s); setMetrics(m) })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ — ตรวจสอบว่า backend กำลัง run อยู่'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (error || !stats) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  )

  const totalWeather = Object.values(stats.weather_counts).reduce((a, b) => a + b, 0)
  const maxTempMax   = Math.max(...Object.values(stats.monthly_avg_temp_max))
  const maxPrecip    = Math.max(...Object.values(stats.monthly_avg_precip))

  const accuracyColor = (acc: number) =>
    acc >= 80 ? 'text-green-500' : acc >= 65 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">📊 Dashboard</h1>
          <p className="text-muted-foreground">
            สถิติจาก Seattle Weather Dataset (2012–2015) · {totalWeather} วัน
          </p>
        </div>

        {/* Model Metrics Card */}
        {metrics && (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> ประสิทธิภาพ ML Model
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Accuracy */}
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">CV Accuracy (10-fold)</p>
                <p className={`text-4xl font-bold ${accuracyColor(metrics.cv_accuracy_mean)}`}>
                  {metrics.cv_accuracy_mean}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ± {metrics.cv_accuracy_std}%
                </p>
              </div>

              {/* Overfitting risk */}
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">ความเสี่ยง Overfitting</p>
                <p className={`text-4xl font-bold ${
                  metrics.cv_accuracy_std < 5 ? 'text-green-500'
                  : metrics.cv_accuracy_std < 10 ? 'text-yellow-500'
                  : 'text-red-500'
                }`}>
                  {metrics.cv_accuracy_std < 5 ? 'ต่ำ' : metrics.cv_accuracy_std < 10 ? 'กลาง' : 'สูง'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  std ={metrics.cv_accuracy_std}%
                </p>
              </div>

              {/* Classes */}
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Class ที่ทำนายได้</p>
                <p className="text-4xl font-bold text-primary">{metrics.classes.length}/5</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.classes.join(', ')}
                </p>
              </div>
            </div>

            {/* CV scores bar chart */}
            <div className="mb-5">
              <p className="text-sm text-muted-foreground mb-3">Accuracy แต่ละ Fold (10-fold CV)</p>
              <div className="flex items-end gap-2 h-20">
                {metrics.cv_scores.map((score, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 ${
                          score >= 80 ? 'bg-green-400/70' : score >= 65 ? 'bg-yellow-400/70' : 'bg-red-400/70'
                        }`}
                        style={{ height: `${(score / 100) * 100}%` }}
                        title={`Fold ${i+1}: ${score}%`}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground">F{i+1}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Model parameters */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'จำนวน Trees', value: metrics.n_estimators },
                { label: 'Max Depth', value: metrics.max_depth },
                { label: 'Min Samples Leaf', value: metrics.min_samples_leaf },
              ].map((p) => (
                <div key={p.label} className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="text-xl font-bold mt-1">{p.value}</p>
                </div>
              ))}
            </div>

            {/* Interpretation */}
            <div className="mt-4 flex items-start gap-2 bg-primary/5 rounded-xl p-4">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                ใช้ <span className="text-foreground font-medium">Stratified 10-fold Cross-Validation</span> วัดความแม่นที่แท้จริง
                — ค่า std ต่ำ หมายถึง model เสถียรและไม่ overfit ครับ
              </p>
            </div>
          </div>
        )}

        {/* Weather distribution */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" /> สัดส่วนสภาพอากาศทั้งหมด
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(stats.weather_counts)
              .sort((a, b) => b[1] - a[1])
              .map(([w, count]) => (
              <div key={w} className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform">
                <span className="text-4xl">{weatherIcon(w)}</span>
                <p className="font-semibold mt-2">{weatherLabel(w)}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {((count / totalWeather) * 100).toFixed(1)}%
                </p>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / totalWeather) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" /> อุณหภูมิเฉลี่ยรายเดือน (°C)
            </h2>
            <div className="flex items-end gap-1" style={{ height: 100 }}>
              {MONTHS_SHORT.map((m, i) => {
                const tmax = stats.monthly_avg_temp_max[i+1] ?? 0
                const tmin = stats.monthly_avg_temp_min[i+1] ?? 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col items-center" style={{ height: 80 }}>
                      <div className="w-full rounded-t bg-red-400/70" style={{ height: `${(tmax/maxTempMax)*100}%` }} title={`สูงสุด: ${tmax}°C`}/>
                      <div className="w-full bg-blue-400/70" style={{ height: `${(tmin/maxTempMax)*100}%` }} title={`ต่ำสุด: ${tmin}°C`}/>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{m}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400/70 inline-block"/>สูงสุด</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400/70 inline-block"/>ต่ำสุด</span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> ฝนเฉลี่ยรายเดือน (mm)
            </h2>
            <div className="flex items-end gap-1" style={{ height: 100 }}>
              {MONTHS_SHORT.map((m, i) => {
                const p = stats.monthly_avg_precip[i+1] ?? 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex items-end" style={{ height: 80 }}>
                      <div className="w-full rounded-t bg-cyan-400/70" style={{ height: `${(p/maxPrecip)*100}%`, minHeight: 2 }} title={`${p} mm`}/>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{m}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent 30 days */}
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-4">📅 ข้อมูลย้อนหลัง 30 วันล่าสุดใน Dataset</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 pr-4">วันที่</th>
                  <th className="text-center py-2 pr-4">สภาพ</th>
                  <th className="text-right py-2 pr-4">สูงสุด</th>
                  <th className="text-right py-2 pr-4">ต่ำสุด</th>
                  <th className="text-right py-2">ฝน (mm)</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_30.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-2 pr-4 text-muted-foreground">{r.date_str}</td>
                    <td className="py-2 pr-4 text-center">{weatherIcon(r.weather)} {weatherLabel(r.weather)}</td>
                    <td className="py-2 pr-4 text-right text-red-400 font-medium">{r.temp_max}°C</td>
                    <td className="py-2 pr-4 text-right text-blue-400 font-medium">{r.temp_min}°C</td>
                    <td className="py-2 text-right text-cyan-400">{r.precipitation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
