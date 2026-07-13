'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6 text-center shadow-sm">
            <h1 className="mb-3 text-2xl font-semibold text-destructive">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={reset}
              className="btn btn-primary w-full"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
