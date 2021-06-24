import { saveState, getState, error, info } from '@actions/core'
import { saveCache, restoreCache } from '@actions/cache'

import { startDocker, stopDocker } from './docker'
import { sudobash } from './sudobash'

const stateEntryNext = 'tlw1z4drqd'
const stateCacheKey = 'anz8sx6yyk'
const stateExactMatch = 'yctvb1ynp1'
const prefix = 'd8ubf9owv2-'

const main = async () => {
  if (process.platform != 'linux') { throw new Error('only support linux') }

  await stopDocker()

  info('Restoring /var/lib/docker')

  // delete /var/lib/docker, don't wait until the deletion completed
  await sudobash(`mv /var/lib/docker /var/lib/docker.bak && ( setsid rm -rf /var/lib/docker.bak </dev/null >/dev/null 2>&1 & )`)

  const cacheKey = prefix + process.env.GITHUB_SHA
  saveState(stateCacheKey, cacheKey)

  const cacheHit = await restoreCache(['/var/tmp/docker-state.tar'], cacheKey, [prefix])
  if (cacheHit) {
    if (cacheHit == cacheKey) { saveState(stateExactMatch, true) }
    await sudobash(`cd / && tar --numeric-owner -x -P -f /var/tmp/docker-state.tar && ( setsid rm -rf /var/tmp/docker-state.tar </dev/null >/dev/null 2>&1 & )`)
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

  await sudobash(`rm -rf /var/tmp/docker-state.tar && tar --numeric-owner -c -P -f /var/tmp/docker-state.tar /var/lib/docker`)
  await saveCache(['/var/tmp/docker-state.tar'], getState(stateCacheKey))

  await startDocker()
}

const entry = async () => {
  try {
    switch (getState(stateEntryNext)) {
      case '':
        saveState(stateEntryNext, 'post')
        return await main()
      case 'post':
        return await post()
    }
  } catch (e) {
    error(`[error]: ${e}`)
    process.exit(1)
  }
}

entry()
