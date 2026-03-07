const DISABLED_VALUES = new Set(['0', 'false', 'off', 'no']);

export function isBackgroundSyncEnabled(): boolean {
  const rawValue = process.env.ENABLE_BACKGROUND_SYNC;

  if (!rawValue) {
    return true;
  }

  return !DISABLED_VALUES.has(rawValue.trim().toLowerCase());
}
