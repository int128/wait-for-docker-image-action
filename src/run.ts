import * as core from '@actions/core'
import * as exec from '@actions/exec'

type Inputs = {
  tags: string[]
  expectedRevisions: string[]
  timeoutSeconds: number
  pollingSeconds: number
}

export const run = async (inputs: Inputs): Promise<void> => {
  const ok = await retry(
    () => checkIfDockerImageRevisionIsExpected(inputs),
    inputs.timeoutSeconds * 1000,
    inputs.pollingSeconds * 1000,
  )
  if (!ok) {
    throw new Error(`timed out until the Docker image is available`)
  }
}

const checkIfDockerImageRevisionIsExpected = async (inputs: Inputs): Promise<boolean> => {
  for (const tag of inputs.tags) {
    const revision = await getDockerImageRevision(tag)
    if (revision && inputs.expectedRevisions.includes(revision)) {
      continue
    }
    return false
  }
  return true
}

const getDockerImageRevision = async (tag: string): Promise<string | undefined> => {
  const code = await core.group(`Pulling ${tag}`, () => exec.exec('docker', ['pull', tag], { ignoreReturnCode: true }))
  if (code !== 0) {
    return
  }
  const output = await exec.getExecOutput('docker', [
    'image',
    'inspect',
    '-f',
    '{{index .Config.Labels "org.opencontainers.image.revision"}}',
    tag,
  ])
  return output.stdout.trim()
}

export const retry = async (satisfied: () => Promise<boolean>, timeout: number, polling: number): Promise<boolean> => {
  const startedAt = Date.now()
  while ((await satisfied()) === false) {
    await new Promise((resolve) => setTimeout(resolve, polling))
    const elapsed = Date.now() - startedAt
    if (elapsed > timeout) {
      return false
    }
  }
  return true
}
