import { waitForRegistration } from './registrationPoll';

describe('waitForRegistration', () => {
  /**
   * Fake monotonic clock. Only sleep() advances it, so a test controls elapsed
   * time exactly and the suite never waits in real time.
   */
  const makeClock = () => {
    let t = 0;
    return {
      now: () => t,
      sleep: async (ms: number) => {
        t += ms;
      },
      advance: (ms: number) => {
        t += ms;
      },
    };
  };

  test('returns true without sleeping when approval is already granted', async () => {
    const clock = makeClock();
    const slept: number[] = [];
    const check = jest.fn().mockResolvedValue(true);

    const approved = await waitForRegistration({
      check,
      sleep: async (ms) => {
        slept.push(ms);
        await clock.sleep(ms);
      },
      now: clock.now,
    });

    expect(approved).toBe(true);
    expect(check).toHaveBeenCalledTimes(1);
    expect(slept).toEqual([]);
  });

  test('backs off 2s, 4s, 8s, 16s then caps at 30s', async () => {
    const clock = makeClock();
    const slept: number[] = [];
    // Approve on the 7th poll so six backoff waits are observable.
    let calls = 0;
    const check = async () => {
      calls += 1;
      return calls === 7;
    };

    const approved = await waitForRegistration({
      check,
      sleep: async (ms) => {
        slept.push(ms);
        await clock.sleep(ms);
      },
      now: clock.now,
    });

    expect(approved).toBe(true);
    expect(slept).toEqual([2000, 4000, 8000, 16000, 30000, 30000]);
  });

  test('gives up once the poll budget is spent', async () => {
    const clock = makeClock();
    const check = jest.fn().mockResolvedValue(false);

    const approved = await waitForRegistration({
      check,
      sleep: async (ms) => {
        await clock.sleep(ms);
      },
      now: clock.now,
      maxPollMs: 10000,
      baseDelayMs: 4000,
      maxDelayMs: 4000,
    });

    expect(approved).toBe(false);
    // 0ms, 4000ms and 8000ms are inside the 10s budget; 12000ms is not.
    expect(check).toHaveBeenCalledTimes(3);
  });

  test('does not poll at all when the budget is already spent', async () => {
    const clock = makeClock();
    const check = jest.fn().mockResolvedValue(false);

    const approved = await waitForRegistration({
      check,
      sleep: async (ms) => {
        await clock.sleep(ms);
      },
      now: clock.now,
      maxPollMs: 0,
    });

    expect(approved).toBe(false);
    expect(check).not.toHaveBeenCalled();
  });

  test('is driven by the injected clock, not the wall clock', async () => {
    // A device whose RTC steps forward during registration must not be treated
    // as having exhausted the budget. The deadline reads only `now`.
    const clock = makeClock();
    const realNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(realNow + 5 * 60 * 60 * 1000);

    let calls = 0;
    const approved = await waitForRegistration({
      check: async () => {
        calls += 1;
        return calls === 2;
      },
      sleep: clock.sleep,
      now: clock.now,
    });

    expect(approved).toBe(true);
    (Date.now as jest.Mock).mockRestore();
  });
});
