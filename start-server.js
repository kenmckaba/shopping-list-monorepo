import { spawn } from 'child_process'

// Simple server launcher without debugger issues
const server = spawn(
  'yarn',
  ['workspace', 'shopping-list-server', 'run', 'dev'],
  {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  },
)

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`)
})
