// Global CSS declarations for Next.js
declare module '*.css'
declare module '*.scss'
declare module '*.sass'
declare module '*.less'

// CSS Module declarations (for files with .module.css extension)
declare module '*.module.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.module.scss' {
  const content: Record<string, string>
  export default content
}
