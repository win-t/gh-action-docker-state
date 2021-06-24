import { info } from '@actions/core'

import { sudobash } from './sudobash'

export const stopDocker = async () => {
  info('Stopping docker service')
  await sudobash(`systemctl stop docker.service docker.socket`)
}

export const startDocker = async () => {
  info('Starting docker service')
  await sudobash(`systemctl start docker.service docker.socket`)
}
