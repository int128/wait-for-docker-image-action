import { describe, expect, it, vi } from 'vitest'
import { retry } from '../src/run.js'

describe('retry', () => {
  it('suceeded', async () => {
    const satisfied = vi.fn<() => Promise<boolean>>()
    satisfied.mockResolvedValue(true)
    expect(await retry(() => satisfied(), 100, 30)).toBeTruthy()
  })

  it('failure', async () => {
    const satisfied = vi.fn<() => Promise<boolean>>()
    satisfied.mockResolvedValue(false)
    expect(await retry(() => satisfied(), 100, 30)).toBeFalsy()
    expect(satisfied).toHaveBeenCalledTimes(4)
  })

  it('recovered at 3rd call', async () => {
    const satisfied = vi.fn<() => Promise<boolean>>()
    satisfied.mockResolvedValueOnce(false)
    satisfied.mockResolvedValueOnce(false)
    satisfied.mockResolvedValueOnce(true)
    expect(await retry(() => satisfied(), 100, 30)).toBeTruthy()
    expect(satisfied).toHaveBeenCalledTimes(3)
  })
})
