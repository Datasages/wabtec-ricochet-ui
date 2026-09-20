export const BASE_DELAY_MS = 2000;
export const MAX_DELAY_MS = 30000;
// Holds the total approval window at the 1800 x 2s the attempt-counted loop
// allowed; only the retry shape changed.
export const MAX_POLL_MS = 60 * 60 * 1000;

export interface RegistrationPollDeps {
  /** Resolves true once an administrator has approved the device. */
  check: () => Promise<boolean>;
  sleep: (ms: number) => Promise<void>;
  /**
   * Monotonic elapsed-time source. Must NOT be Date.now(): field devices boot
   * with a stale RTC and NTP-step during registration, which would either end
   * the poll early or run it past the cap.
   */
  now: () => number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxPollMs?: number;
}

/**
 * Polls for registration approval with exponential backoff, bounded by an
 * elapsed-time budget measured on the injected monotonic clock. Returns true on
 * approval, false once the budget is spent.
 */
export const waitForRegistration = async ({
  check,
  sleep,
  now,
  baseDelayMs = BASE_DELAY_MS,
  maxDelayMs = MAX_DELAY_MS,
  maxPollMs = MAX_POLL_MS,
}: RegistrationPollDeps): Promise<boolean> => {
  const start = now();
  let delay = baseDelayMs;

  while (now() - start < maxPollMs) {
    if (await check()) {
      return true;
    }
    await sleep(delay);
    delay = Math.min(delay * 2, maxDelayMs);
  }

  return false;
};
