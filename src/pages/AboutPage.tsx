import { Cloud, Sun, Wind, Droplets, Code, Palette, Zap, Heart } from 'lucide-react'

const features = [
  {
    icon: Cloud,
    title: 'ข้อมูลสภาพอากาศแบบเรียลไทม์',
    description: 'แสดงข้อมูลสภาพอากาศปัจจุบัน อุณหภูมิ ความชื้น ความเร็วลม และอื่นๆ',
  },
  {
    icon: Sun,
    title: 'พยากรณ์อากาศล่วงหน้า',
    description: 'พยากรณ์อากาศรายชั่วโมงและรายวัน วางแผนกิจกรรมได้อย่างมั่นใจ',
  },
  {
    icon: Wind,
    title: 'ดีไซน์มินิมอล',
    description: 'ออกแบบที่เรียบง่าย สวยงาม ใช้งานง่าย เน้นความสะอาดตา',
  },
  {
    icon: Droplets,
    title: 'รองรับ Dark Mode',
    description: 'สลับระหว่างโหมดสว่างและมืดได้ตามต้องการ ลดความเมื่อยล้าของดวงตา',
  },
]

const techStack = [
  { name: 'React', description: 'UI Framework' },
  { name: 'TypeScript', description: 'Type Safety' },
  { name: 'Tailwind CSS', description: 'Styling' },
  { name: 'Vite', description: 'Build Tool' },
  { name: 'Lucide React', description: 'Icons' },
  { name: 'Weather API', description: 'Data Source' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
            <Cloud className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            เกี่ยวกับ <span className="text-gradient">SkyCast</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            เว็บไซต์แสดงสภาพอากาศที่ออกแบบมาเพื่อให้คุณได้รับข้อมูลอย่างรวดเร็ว
            ด้วยดีไซน์ที่เรียบง่ายและทันสมัย
          </p>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            ฟีเจอร์เด่น
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Design Philosophy */}
        <div className="mb-16">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  ปรัชญาการออกแบบ
                </h2>
                <p className="text-muted-foreground mb-4">
                  เราเชื่อว่าข้อมูลสภาพอากาศควรจะเข้าถึงได้ง่าย โดยไม่ต้องผ่านโฆษณาหรือความวุ่นวาย
                </p>
                <p className="text-muted-foreground mb-6">
                  ดีไซน์มินิมอลของเราเน้นพื้นที่ว่าง การจัดวางที่ชัดเจน และการใช้สีที่เหมาะสม
                  เพื่อให้คุณโฟกัสกับสิ่งที่สำคัญที่สุด - ข้อมูลสภาพอากาศ
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette className="w-4 h-4" />
                    <span>Minimal Design</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>Fast Performance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Code className="w-4 h-4" />
                    <span>Clean Code</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">3</p>
                  <p className="text-sm text-muted-foreground">หน้าหลัก</p>
                </div>
                <div className="bg-background/50 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">2</p>
                  <p className="text-sm text-muted-foreground">ธีมสี</p>
                </div>
                <div className="bg-background/50 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">7+</p>
                  <p className="text-sm text-muted-foreground">วันพยากรณ์</p>
                </div>
                <div className="bg-background/50 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-2">24</p>
                  <p className="text-sm text-muted-foreground">ชั่วโมงล่วงหน้า</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            เทคโนโลยีที่ใช้
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="glass-card rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200"
              >
                <p className="font-semibold mb-1">{tech.name}</p>
                <p className="text-xs text-muted-foreground">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="glass-card rounded-3xl p-8 md:p-12 max-w-2xl mx-auto">
            <Heart className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">
              พร้อมเริ่มต้นใช้งานแล้วหรือยัง?
            </h2>
            <p className="text-muted-foreground mb-6">
              สัมผัสประสบการณ์การดูสภาพอากาศแบบใหม่ที่เรียบง่ายและสวยงาม
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Cloud className="w-5 h-5" />
                ไปหน้าแรก
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
              >
                ดู Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
