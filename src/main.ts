import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    tags: core.getMultilineInput('tags', { required: true }),
    expectedRevisions: core.getMultilineInput('expected-revision', { required: true }),
    timeoutSeconds: parseInt(core.getInput('timeout-seconds', { required: true })),
    pollingSeconds: parseInt(core.getInput('polling-seconds', { required: true })),
  })
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
