'use strict'

const { spawn } = require('child_process')
const { once } = require('events')
const { saveState, getState, getInput, error, info } = require('@actions/core')
const { saveCache, restoreCache } = require('@actions/cache')

const stateCacheKey = 'anz8sx6yyk'
const stateExactMatch = 'yctvb1ynp1'
const prefix = 'd8ubf9owv2-'

const sudoShell = async script => {
  const shell = spawn('sudo', ['-n', 'sh', '-ceu', script], { stdio: 'inherit' })
  const [code] = await once(shell, 'exit')
  if (code != 0) { throw new Error(`sudoShell exited with code ${code}`) }
}

const stopDocker = async () => {
  info('Stopping docker service')
  await sudoShell(`systemctl stop docker.service docker.socket`)
}

const startDocker = async () => {
  info('Starting docker service')
  await sudoShell(`systemctl start docker.service docker.socket`)
}

const main = async () => {
  await stopDocker()

  info('Restoring /var/lib/docker')

  await sudoShell(`mv /var/lib/docker /var/lib/docker.bak && ( setsid rm -rf /var/lib/docker.bak </dev/null >/dev/null 2>&1 & )`)

  const cacheKey = prefix + getInput('key', { required: true })
  saveState(stateCacheKey, cacheKey)

  const cacheHit = await restoreCache(['/var/tmp/docker-state.tar'], cacheKey, [prefix])
  if (cacheHit) {
    if (cacheHit == cacheKey) { saveState(stateExactMatch, true) }
    await sudoShell(`cd / && tar --numeric-owner -x -P -f /var/tmp/docker-state.tar && ( setsid rm -rf /var/tmp/docker-state.tar </dev/null >/dev/null 2>&1 & )`)
  }

  await startDocker()
}

const post = async () => {
  if (getState(stateExactMatch)) {
    info('Not saving /var/lib/docker because previous cache is available')
    return
  }

  await stopDocker()

  info('Saving /var/lib/docker')

  await sudoShell(`rm -rf /var/tmp/docker-state.tar && tar --numeric-owner -c -P -f /var/tmp/docker-state.tar /var/lib/docker`)
  await saveCache(['/var/tmp/docker-state.tar'], getState(stateCacheKey))

  await startDocker()
}

const entry = async () => {
  try {
    switch (getState('entryNext')) {
      case '':
        saveState('entryNext', 'post')
        return await main()
      case 'post':
        return await post()
    }
  } catch (e) {
    error(`[global error handler]: ${e}`)
    process.exit(1)
  }
}

entry()
