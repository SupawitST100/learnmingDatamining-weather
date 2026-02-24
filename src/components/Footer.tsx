import { Cloud } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          {/* Logo & Copyright */}
          {/* <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              © {currentYear} SkyCast. All rights reserved.
            </span>
          </div> */}

          {/* Links */}
          {/* <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="#"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div> */}

          {/* Credit */}
          {/* <div className="text-sm text-muted-foreground">
            Powered by{' '}
            <span className="text-primary font-medium">Weather API</span>
          </div> */}
        </div>
      </div>
    </footer>
  )
}
