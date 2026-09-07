import { spawn } from 'node:child_process'
import { closeSync, mkdtempSync, openSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logs = mkdtempSync(join(tmpdir(), 'campuscare-local-'))
const alive = async url => fetch(url, { signal: AbortSignal.timeout(1500) }).then(response => response.ok).catch(() => false)
async function ensure(name, url, args) {
  if (await alive(url)) { console.log(name + ' already running at ' + url); return }
  const out = openSync(join(logs, name + '.stdout.log'), 'a')
  const err = openSync(join(logs, name + '.stderr.log'), 'a')
  const child = spawn(process.execPath, args, { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', out, err] })
  child.once('error', error => console.error(name + ' failed to start: ' + error.code))
  child.unref()
  closeSync(out); closeSync(err)
  // Cold Vite dependency optimization can take longer than ten seconds.
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (await alive(url)) { console.log(name + ' ready at ' + url + ' (process ' + child.pid + ')'); return }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(name + ' did not become ready. Check ' + logs)
}
// Vite now owns the API process. Do not launch a competing detached API here.
await ensure('web', 'http://localhost:5173/', [join(root, 'node_modules/vite/bin/vite.js'), '--config', 'vite.config.ts', '--host', 'localhost', '--port', '5173', '--strictPort'])
let apiReady = false
for (let attempt = 0; attempt < 20; attempt++) {
  if (await alive('http://localhost:5173/health')) { apiReady = true; break }
  await new Promise(resolve => setTimeout(resolve, 500))
}
if (!apiReady) throw new Error('Website is running but chat is unavailable. Restart npm run dev and check its chat-server logs.')
console.log('Chat server ready through http://localhost:5173/api')
console.log('Local logs: ' + logs)
