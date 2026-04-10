import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/components/theme-provider'
import { ApolloWrapper } from '@/lib/apollo-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shopping List App',
  description: 'A PWA for managing shopping lists',
  manifest: '/manifest.json',
  icons: {
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzFkNGVkOCIvPgo8cGF0aCBkPSJNMTAgMTBoMTJ2MkgxMHoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMCAxNGgxMnYySDE0eiIgZmlsbD0id2hpdGUiLz4KPHA+dGggZD0iTTEwIDE4aDEydjJIMTB6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shopping List',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <ApolloWrapper>{children}</ApolloWrapper>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
