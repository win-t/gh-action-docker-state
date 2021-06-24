import { spawn } from 'child_process'
import { once } from 'events'

export const sudobash = async (script: string) => {
  const shell = spawn('sudo', ['-n', 'bash', '-c', script], { stdio: 'inherit' })
  const [code, signal] = await once(shell, 'exit') as [number | null, NodeJS.Signals | null]
  if (code !== 0 || signal) {
    throw new Error(`sudobash exited with code ${code}, signal ${signal}`)
  }
}
