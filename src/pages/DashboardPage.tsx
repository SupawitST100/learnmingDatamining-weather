// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Cloud, Loader2, Brain, CheckCircle } from 'lucide-react'
import { fetchStats, fetchMetrics, StatsResponse, ModelMetrics, weatherIcon, weatherLabel } from '../services/weatherApi'
import { Thermometer, Wind, ScatterChart } from 'lucide-react'

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
        {/*Heatmap อุณหภูมิรายเดือน/ปี*/}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            Heatmap อุณหภูมิสูงสุดเฉลี่ยรายเดือน (°C)
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            ความเข้มสีแสดงระดับอุณหภูมิ — เข้ม = ร้อน, อ่อน = เย็น
          </p>
          {(() => {
            const years = [2012, 2013, 2014, 2015]
            // 📌 แทนด้วย stats.yearly_monthly_temp_max[year][month] เมื่อ expose API จริง
            const getTemp = (year: number, month: number) => {
              return stats.yearly_monthly_temp_max?.[year]?.[month] ?? null
            }
            const allTemps = years.flatMap(y => MONTHS_SHORT.map((_, i) => getTemp(y, i + 1)))
            const minT = Math.min(...allTemps), maxT = Math.max(...allTemps)
            const heatColor = (val: number) => {
              const r = (val - minT) / (maxT - minT)
              return `rgb(${Math.round(30 + r*220)},${Math.round(120 - r*60)},${Math.round(220 - r*200)})`
            }
            return (
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="flex gap-1 mb-1">
                    <div className="w-12 shrink-0" />
                    {MONTHS_SHORT.map(m => (
                      <div key={m} className="flex-1 text-center text-[10px] text-muted-foreground">{m}</div>
                    ))}
                  </div>
                  {years.map(year => (
                    <div key={year} className="flex gap-1 mb-1">
                      <div className="w-12 shrink-0 text-xs text-muted-foreground flex items-center">{year}</div>
                      {MONTHS_SHORT.map((_, i) => {
                        const val = getTemp(year, i + 1)
                        return (
                          <div key={i} className="flex-1 aspect-square rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                            style={{ backgroundColor: heatColor(val), opacity: 0.85 }} title={`${year} ${MONTHS_SHORT[i]}: ${val}°C`}>
                            <span className="text-[9px] font-bold text-white drop-shadow">{val}</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">เย็น</span>
                    <div className="flex-1 h-2 rounded-full" style={{
                      background: 'linear-gradient(to right, rgb(30,120,220), rgb(255,200,30), rgb(250,60,20))'
                    }} />
                    <span className="text-xs text-muted-foreground">ร้อน</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
        {/*Scatter — Correlation อุณหภูมิ vs ฝน + R²*/}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ScatterChart className="w-5 h-5 text-violet-500" />
            Correlation: อุณหภูมิสูงสุด vs ปริมาณฝน
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            แต่ละจุดคือ 1 วัน · สีตามสภาพอากาศ · เส้นประ = trend line
          </p>
          {(() => {
            const data = stats!.recent_30
            if (!data.length) return null
            const temps = data.map(d => d.temp_max), precips = data.map(d => d.precipitation)
            const minTemp = Math.min(...temps), maxTemp = Math.max(...temps)
            const maxP = Math.max(...precips, 1)
            const W = 420, H = 220, PAD = { top: 10, right: 10, bottom: 30, left: 35 }
            const pW = W - PAD.left - PAD.right, pH = H - PAD.top - PAD.bottom
            const xS = (v: number) => PAD.left + ((v - minTemp) / (maxTemp - minTemp || 1)) * pW
            const yS = (v: number) => PAD.top + pH - (v / maxP) * pH
            const dotColor: Record<string, string> = {
              sun: '#f59e0b', fog: '#94a3b8', drizzle: '#60a5fa', rain: '#3b82f6', snow: '#e2e8f0'
            }
            const n = data.length
            const mX = temps.reduce((a,b) => a+b,0)/n, mY = precips.reduce((a,b) => a+b,0)/n
            const slope = temps.reduce((s,x,i) => s+(x-mX)*(precips[i]-mY),0) / temps.reduce((s,x) => s+(x-mX)**2,1)
            const intercept = mY - slope * mX
            const ssRes = data.reduce((s,_,i) => s+(precips[i]-(slope*temps[i]+intercept))**2,0)
            const ssTot = data.reduce((s,_,i) => s+(precips[i]-mY)**2,0)
            const r2 = ssTot > 0 ? (1 - ssRes/ssTot) : 0
            return (
              <div className="overflow-x-auto">
                <svg width={W} height={H} className="min-w-[340px]">
                  {[0,0.25,0.5,0.75,1].map(t => (
                    <g key={t}>
                      <line x1={PAD.left} x2={W-PAD.right} y1={PAD.top+pH*(1-t)} y2={PAD.top+pH*(1-t)}
                        stroke="currentColor" strokeOpacity={0.08} />
                      <text x={PAD.left-4} y={PAD.top+pH*(1-t)+4} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.5}>
                        {(maxP*t).toFixed(0)}
                      </text>
                    </g>
                  ))}
                  {[minTemp,(minTemp+maxTemp)/2,maxTemp].map((v,i) => (
                    <text key={i} x={xS(v)} y={H-4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.5}>
                      {v.toFixed(0)}°C
                    </text>
                  ))}
                  <line x1={xS(minTemp)} y1={yS(slope*minTemp+intercept)} x2={xS(maxTemp)} y2={yS(slope*maxTemp+intercept)}
                    stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.8} />
                  <text x={W-PAD.right-4} y={PAD.top+14} textAnchor="end" fontSize={10} fill="#a78bfa">
                    R² = {r2.toFixed(3)}
                  </text>
                  {data.map((d, i) => (
                    <circle key={i} cx={xS(d.temp_max)} cy={yS(d.precipitation)} r={5}
                      fill={dotColor[d.weather] ?? '#888'} fillOpacity={0.75} stroke="white" strokeWidth={0.5}>
                      <title>{`${d.date_str}\n${d.temp_max}°C · ${d.precipitation}mm · ${d.weather}`}</title>
                    </circle>
                  ))}
                  <text x={W/2} y={H} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>อุณหภูมิสูงสุด (°C)</text>
                  <text x={12} y={H/2} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}
                    transform={`rotate(-90, 12, ${H/2})`}>ฝน (mm)</text>
                </svg>
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(dotColor).map(([w, c]) => (
                    <span key={w} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-3 h-3 rounded-full border border-white/20 inline-block" style={{ background: c }} />{w}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
        {/*  Trend Line + Scatter 30 วัน (7-day MA) */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Trend อุณหภูมิ 30 วันล่าสุด
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            จุดโปร่ง = ค่าจริงรายวัน · เส้นทึบ = 7-day moving average
          </p>
          {(() => {
            const data = stats!.recent_30
            if (!data.length) return null
            const all = [...data.map(d => d.temp_max), ...data.map(d => d.temp_min)]
            const minV = Math.min(...all)-2, maxV = Math.max(...all)+2
            const W = 560, H = 180, PAD = { top: 10, right: 10, bottom: 40, left: 35 }
            const pW = W-PAD.left-PAD.right, pH = H-PAD.top-PAD.bottom
            const xS = (i: number) => PAD.left + (i/(data.length-1))*pW
            const yS = (v: number) => PAD.top + pH - ((v-minV)/(maxV-minV))*pH
            const path = (vals: number[]) => vals.map((v,i) => `${i===0?'M':'L'}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ')
            const ma = (arr: number[], w=7) => arr.map((_,i) => {
              const sl = arr.slice(Math.max(0,i-w+1),i+1)
              return sl.reduce((a,b) => a+b,0)/sl.length
            })
            const maMax = ma(data.map(d => d.temp_max))
            const maMin = ma(data.map(d => d.temp_min))
            const revPath = data.slice().reverse().map((d,i) =>
              `L${xS(data.length-1-i).toFixed(1)},${yS(d.temp_min).toFixed(1)}`).join(' ')
            return (
              <div className="overflow-x-auto">
                <svg width={W} height={H} className="min-w-[400px]">
                  <defs>
                    <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {[minV,(minV+maxV)/2,maxV].map((v,i) => (
                    <g key={i}>
                      <line x1={PAD.left} x2={W-PAD.right} y1={yS(v)} y2={yS(v)} stroke="currentColor" strokeOpacity={0.08} />
                      <text x={PAD.left-4} y={yS(v)+4} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.5}>{v.toFixed(0)}°</text>
                    </g>
                  ))}
                  <path d={`${path(data.map(d => d.temp_max))} ${revPath} Z`} fill="url(#tGrad)" />
                  {data.map((d,i) => (
                    <g key={i}>
                      <circle cx={xS(i)} cy={yS(d.temp_max)} r={2.5} fill="#f87171" fillOpacity={0.45}>
                        <title>{`${d.date_str}: ${d.temp_max}°C`}</title>
                      </circle>
                      <circle cx={xS(i)} cy={yS(d.temp_min)} r={2.5} fill="#60a5fa" fillOpacity={0.45}>
                        <title>{`${d.date_str}: ${d.temp_min}°C`}</title>
                      </circle>
                    </g>
                  ))}
                  <path d={path(maMax)} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
                  <path d={path(maMin)} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
                  {data.map((_,i) => (i%5===0||i===data.length-1) && (
                    <text key={i} x={xS(i)} y={H-4} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.5}>
                      {data[i].date_str.slice(5)}
                    </text>
                  ))}
                </svg>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-400 inline-block rounded"/>สูงสุด (7-day MA)</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-400 inline-block rounded"/>ต่ำสุด (7-day MA)</span>
                </div>
              </div>
            )
          })()}
        </div>
        
        {/* Scatter แยกตามฤดูกาล */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Wind className="w-5 h-5 text-sky-500" />
            Weather Pattern แยกตามฤดูกาล
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Scatter: อุณหภูมิสูงสุด vs ฝน · แต่ละสีคือฤดูกาล
          </p>
          {(() => {
            const data = stats!.recent_30
            if (!data.length) return null
            const getSeason = (dateStr: string) => {
              const m = parseInt(dateStr.split('-')[1] ?? '1')
              if ([12,1,2].includes(m)) return 'Winter ❄️'
              if ([3,4,5].includes(m))  return 'Spring 🌸'
              if ([6,7,8].includes(m))  return 'Summer ☀️'
              return 'Fall 🍂'
            }
            const seasons = ['Winter ❄️','Spring 🌸','Summer ☀️','Fall 🍂']
            const sColors: Record<string,string> = {
              'Winter ❄️':'#93c5fd','Spring 🌸':'#86efac','Summer ☀️':'#fcd34d','Fall 🍂':'#fdba74'
            }
            const grouped: Record<string, typeof data> = {}
            data.forEach(d => { const s=getSeason(d.date_str); if(!grouped[s]) grouped[s]=[]; grouped[s].push(d) })
            const temps = data.map(d => d.temp_max), precips = data.map(d => d.precipitation)
            const minT = Math.min(...temps)-1, maxT = Math.max(...temps)+1, maxP = Math.max(...precips,1)
            const W=480, H=220, PAD={top:10,right:10,bottom:30,left:35}
            const pW=W-PAD.left-PAD.right, pH=H-PAD.top-PAD.bottom
            const xS=(v:number)=>PAD.left+((v-minT)/(maxT-minT||1))*pW
            const yS=(v:number)=>PAD.top+pH-(v/maxP)*pH
            return (
              <div className="overflow-x-auto">
                <svg width={W} height={H} className="min-w-[380px]">
                  {[0,0.5,1].map(t=>(
                    <g key={t}>
                      <line x1={PAD.left} x2={W-PAD.right} y1={PAD.top+pH*(1-t)} y2={PAD.top+pH*(1-t)}
                        stroke="currentColor" strokeOpacity={0.08}/>
                      <text x={PAD.left-4} y={PAD.top+pH*(1-t)+4} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.5}>
                        {(maxP*t).toFixed(0)}
                      </text>
                    </g>
                  ))}
                  {[minT,(minT+maxT)/2,maxT].map((v,i)=>(
                    <text key={i} x={xS(v)} y={H-4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.5}>
                      {v.toFixed(0)}°C
                    </text>
                  ))}
                  {seasons.map(season=>(grouped[season]??[]).map((d,i)=>(
                    <circle key={`${season}-${i}`} cx={xS(d.temp_max)} cy={yS(d.precipitation)} r={6}
                      fill={sColors[season]} fillOpacity={0.75} stroke="white" strokeWidth={0.8}>
                      <title>{`${season} · ${d.date_str}: ${d.temp_max}°C · ${d.precipitation}mm`}</title>
                    </circle>
                  )))}
                  <text x={W/2} y={H} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>อุณหภูมิสูงสุด (°C)</text>
                  <text x={12} y={H/2} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}
                    transform={`rotate(-90, 12, ${H/2})`}>ฝน (mm)</text>
                </svg>
                <div className="flex flex-wrap gap-4 mt-3">
                  {seasons.map(s=>(
                    <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-3 rounded-full border border-white/20 inline-block" style={{background:sColors[s]}}/>
                      {s} <span className="opacity-50">({grouped[s]?.length??0} วัน)</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
        {/* Fourier Transform Demo */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            🧠 Mapping Data to Frequency Space
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            ตัวอย่าง Fourier Transform: Time Domain → Frequency Domain
          </p>

          {(() => {

            // -------- สร้างข้อมูล --------
            const N = 256
            const t = Array.from({length:N}, (_,i)=> i/N)
            const f1 = 5
            const f2 = 12

            const signal = t.map(x =>
              Math.sin(2*Math.PI*f1*x) +
              Math.sin(2*Math.PI*f2*x) +
              (Math.random()-0.5)*0.5 // noise
            )

            // -------- FFT แบบง่าย (DFT Manual สำหรับ demo) --------
            const fftMag: number[] = []
            for(let k=0;k<N/2;k++){
              let re=0, im=0
              for(let n=0;n<N;n++){
                const angle = (2*Math.PI*k*n)/N
                re += signal[n]*Math.cos(angle)
                im -= signal[n]*Math.sin(angle)
              }
              fftMag.push(Math.sqrt(re*re+im*im)/N)
            }

            // -------- scale --------
            const W=480, H=220
            const PAD={top:10,right:10,bottom:30,left:35}
            const pW=W-PAD.left-PAD.right
            const pH=H-PAD.top-PAD.bottom

            const minY = Math.min(...signal)
            const maxY = Math.max(...signal)
            const maxF = Math.max(...fftMag)

            const xTime = (i:number)=> PAD.left + (i/(N-1))*pW
            const yTime = (v:number)=> PAD.top + pH - ((v-minY)/(maxY-minY||1))*pH

            const xFreq = (i:number)=> PAD.left + (i/(fftMag.length-1))*pW
            const yFreq = (v:number)=> PAD.top + pH - (v/(maxF||1))*pH

            return (
              <div className="overflow-x-auto space-y-8">

                {/* -------- Time Domain -------- */}
                <svg width={W} height={H} className="min-w-[380px]">
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    points={signal.map((v,i)=>`${xTime(i)},${yTime(v)}`).join(" ")}
                  />
                  <text x={W/2} y={H} textAnchor="middle" fontSize={10}
                    fill="currentColor" opacity={0.6}>
                    Time Domain
                  </text>
                </svg>

                {/* -------- Frequency Domain -------- */}
                <svg width={W} height={H} className="min-w-[380px]">
                  <polyline
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.5"
                    points={fftMag.map((v,i)=>`${xFreq(i)},${yFreq(v)}`).join(" ")}
                  />
                  <text x={W/2} y={H} textAnchor="middle" fontSize={10}
                    fill="currentColor" opacity={0.6}>
                    Frequency Domain
                  </text>
                </svg>

              </div>
            )
          })()}
        </div>
        {/* Discretization: Binning vs Clustering */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            📊 Discretization Without Class Labels
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            เปรียบเทียบ Equal Frequency (Binning) กับ Clustering (K-means)
          </p>

          {(() => {

            // -------- สร้างข้อมูลตัวอย่าง --------
            const N = 120
            const clusters = [
              {mean: 5,  color: "#3b82f6"},
              {mean: 8,  color: "#22d3ee"},
              {mean: 10, color: "#eab308"},
              {mean: 15, color: "#f97316"},
            ]

            const data = clusters.flatMap(c =>
              Array.from({length:N/4}, () => ({
                x: c.mean + (Math.random()-0.5)*1.2,
                y: Math.random(),
                color: c.color
              }))
            )

            // outlier
            data.push({x:20, y:0.5, color:"#7c2d12"})

            // -------- scale --------
            const W=480, H=220
            const PAD={top:10,right:10,bottom:30,left:30}
            const pW=W-PAD.left-PAD.right
            const pH=H-PAD.top-PAD.bottom

            const minX = 0
            const maxX = 22

            const xS=(v:number)=>PAD.left+((v-minX)/(maxX-minX))*pW
            const yS=(v:number)=>PAD.top+pH-(v*pH)

            // -------- Binning (Equal width) --------
            const bins = [7, 11, 14] // เส้นแบ่ง

            // -------- Clustering centers (mock K-means result) --------
            const kCenters = [5,8,10,15]

            return (
              <div className="grid md:grid-cols-2 gap-8">

                {/* -------- Equal Frequency Binning -------- */}
                <div>
                  <svg width={W} height={H} className="min-w-[380px]">
                    
                    {/* เส้นแบ่ง bin */}
                    {bins.map((b,i)=>(
                      <line key={i}
                        x1={xS(b)} x2={xS(b)}
                        y1={PAD.top} y2={PAD.top+pH}
                        stroke="currentColor"
                        strokeDasharray="4 3"
                        opacity={0.4}
                      />
                    ))}

                    {/* จุดข้อมูล */}
                    {data.map((d,i)=>(
                      <circle key={i}
                        cx={xS(d.x)}
                        cy={yS(d.y)}
                        r={4}
                        fill={d.color}
                        fillOpacity={0.8}
                      />
                    ))}

                    <text x={W/2} y={H} textAnchor="middle"
                      fontSize={10} fill="currentColor" opacity={0.6}>
                      Equal Width Binning
                    </text>
                  </svg>
                </div>

                {/* -------- Clustering -------- */}
                <div>
                  <svg width={W} height={H} className="min-w-[380px]">

                    {/* center lines */}
                    {kCenters.map((c,i)=>(
                      <line key={i}
                        x1={xS(c)} x2={xS(c)}
                        y1={PAD.top} y2={PAD.top+pH}
                        stroke="black"
                        strokeWidth="1.5"
                        opacity={0.5}
                      />
                    ))}

                    {/* จุดข้อมูล */}
                    {data.map((d,i)=>(
                      <circle key={i}
                        cx={xS(d.x)}
                        cy={yS(d.y)}
                        r={4}
                        fill={d.color}
                        fillOpacity={0.8}
                      />
                    ))}

                    <text x={W/2} y={H} textAnchor="middle"
                      fontSize={10} fill="currentColor" opacity={0.6}>
                      K-means Clustering
                    </text>
                  </svg>
                </div>

              </div>
            )
          })()}
        </div>
        {/* Discretization: Binning vs Clustering (Real Weather Data) */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            📊 Discretization Without Class Labels
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            เปรียบเทียบ Equal Width Binning กับ K-means (ใช้ temp_max จริง)
          </p>

          {(() => {

            // ====== ใส่ temp_max จาก CSV ของคุณ ======
            const rawTemp = [
              15,11.7,19.4,30,3.3,29.4,16.1,20,22.2,25.6,
              33.3,21.1,26.1,30.6,12.8,27.8,5.6,0,6.7,7.2,
              9.4,14.4,18.3,23.3
            ]

            // ====== ลบ duplicate ======
            const tempData = Array.from(new Set(rawTemp))

            // ====== scale ======
            const W=480, H=220
            const PAD={top:10,right:10,bottom:30,left:30}
            const pW=W-PAD.left-PAD.right
            const pH=H-PAD.top-PAD.bottom

            const minX = Math.min(...tempData)
            const maxX = Math.max(...tempData)

            const xS=(v:number)=>PAD.left+((v-minX)/(maxX-minX))*pW
            const yS=(v:number)=>PAD.top+pH-(Math.random()*pH)

            // ====== Equal Width Binning ======
            const k = 4
            const width = (maxX-minX)/k
            const bins = Array.from({length:k-1},(_,i)=>minX+width*(i+1))

            // ====== K-means จริง ======
            function kmeans1D(data:number[], k:number, iter=15){
              let centroids = data.slice(0,k)

              for(let t=0;t<iter;t++){
                const clusters:number[][] = Array.from({length:k},()=>[])

                data.forEach(d=>{
                  const distances = centroids.map(c=>Math.abs(d-c))
                  const idx = distances.indexOf(Math.min(...distances))
                  clusters[idx].push(d)
                })

                centroids = clusters.map(c=>{
                  if(c.length===0) return 0
                  return c.reduce((a,b)=>a+b,0)/c.length
                })
              }

              return centroids
            }

            const kCenters = kmeans1D(tempData,k)

            return (
              <div className="grid md:grid-cols-2 gap-8">

                {/* -------- Equal Width Binning -------- */}
                <div>
                  <svg width={W} height={H} className="min-w-[380px]">
                    
                    {bins.map((b,i)=>(
                      <line key={i}
                        x1={xS(b)} x2={xS(b)}
                        y1={PAD.top} y2={PAD.top+pH}
                        stroke="currentColor"
                        strokeDasharray="4 3"
                        opacity={0.4}
                      />
                    ))}

                    {tempData.map((d,i)=>(
                      <circle key={i}
                        cx={xS(d)}
                        cy={yS(d)}
                        r={4}
                        fill="#3b82f6"
                        fillOpacity={0.8}
                      />
                    ))}

                    <text x={W/2} y={H} textAnchor="middle"
                      fontSize={10} fill="currentColor" opacity={0.6}>
                      Equal Width Binning
                    </text>
                  </svg>
                </div>

                {/* -------- K-means -------- */}
                <div>
                  <svg width={W} height={H} className="min-w-[380px]">

                    {kCenters.map((c,i)=>(
                      <line key={i}
                        x1={xS(c)} x2={xS(c)}
                        y1={PAD.top} y2={PAD.top+pH}
                        stroke="black"
                        strokeWidth="1.5"
                        opacity={0.5}
                      />
                    ))}

                    {tempData.map((d,i)=>(
                      <circle key={i}
                        cx={xS(d)}
                        cy={yS(d)}
                        r={4}
                        fill="#f97316"
                        fillOpacity={0.8}
                      />
                    ))}

                    <text x={W/2} y={H} textAnchor="middle"
                      fontSize={10} fill="currentColor" opacity={0.6}>
                      K-means Clustering
                    </text>
                  </svg>
                </div>

              </div>
            )
          })()}
        </div>
      </div>
    </div>
    
  )
}
