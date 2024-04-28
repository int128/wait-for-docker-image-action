import { retry } from '../src/run.js'

describe('retry', () => {
  test('suceeded', async () => {
    const satisfied = jest.fn<Promise<boolean>, []>()
    satisfied.mockResolvedValue(true)
    expect(await retry(() => satisfied(), 100, 30)).toBeTruthy()
  })

  test('failure', async () => {
    const satisfied = jest.fn<Promise<boolean>, []>()
    satisfied.mockResolvedValue(false)
    expect(await retry(() => satisfied(), 100, 30)).toBeFalsy()
    expect(satisfied).toHaveBeenCalledTimes(4)
  })

  test('recovered at 3rd call', async () => {
    const satisfied = jest.fn<Promise<boolean>, []>()
    satisfied.mockResolvedValueOnce(false)
    satisfied.mockResolvedValueOnce(false)
    satisfied.mockResolvedValueOnce(true)
    expect(await retry(() => satisfied(), 100, 30)).toBeTruthy()
    expect(satisfied).toHaveBeenCalledTimes(3)
  })
})
