import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Centro de Corte Mosquera - Sistema de Gestión",
  description: "Sistema de gestión y medición de rendimiento para centro de corte y enchape",
  authors: [{ name: "Miguel Angel Pardo" }],
  creator: "Miguel Angel Pardo",
  publisher: "Centro de Corte Mosquera",
  generator: "v0.app",
  other: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#FF6900",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <Script id="cache-buster" strategy="beforeInteractive">
          {`
            const APP_VERSION = '${Date.now()}';
            const STORED_VERSION = localStorage.getItem('app_version');
            
            if (STORED_VERSION !== APP_VERSION) {
              console.log('[v0] Nueva versión detectada. Limpiando cache...');
              localStorage.setItem('app_version', APP_VERSION);
              
              if (STORED_VERSION && performance.navigation.type !== 1) {
                window.location.reload();
              }
            }
          `}
        </Script>
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <footer className="border-t border-border bg-card mt-auto">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="text-center md:text-left">
                <p>&copy; {new Date().getFullYear()} Centro de Corte Mosquera. Todos los derechos reservados.</p>
                <p className="text-xs mt-1">Desarrollado por Miguel Angel Pardo</p>
              </div>
              <div className="flex gap-4 text-xs">
                <button className="hover:text-foreground transition-colors">Política de Privacidad</button>
                <button className="hover:text-foreground transition-colors">Términos de Uso</button>
                <button className="hover:text-foreground transition-colors">Política de Cookies</button>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
