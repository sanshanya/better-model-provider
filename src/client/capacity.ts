/**
 * Token-capacity spellings (`contextWindow` / `maxTokens`): the user types
 * `380K` or `1M` and the profile stores a plain count. The vocabulary is the
 * official Models page's — `K` is 1000, `M` is 1000K — so a value this page
 * writes reads identically there, and vice versa. The wire schema admits
 * positive integers only (`step(1).min(1)`), which `capacityError` enforces
 * before any write.
 *
 * @module better-model-provider/capacity
 */

/** Accepted capacity spellings: a decimal count with an optional K/M suffix. */
const CAPACITY_PATTERN = /^(\d+(?:\.\d+)?)([km])?$/i

/** Decimal suffix scales — `1M` is 1000K, matching how model capacities are quoted. */
const CAPACITY_SCALE = { k: 1_000, m: 1_000_000 } as const

/** Per-field placeholder hints, spelled as the adapter's route-level fallbacks. */
export const CAPACITY_HINT = { contextWindow: '256K', maxTokens: '32K' } as const

/**
 * Read a typed capacity.
 * @param text - raw field text.
 * @returns the count; `undefined` when blank (inherit); `NaN` when
 *   unreadable (the row refuses the write and names the field).
 */
export function parseCapacity(text: string): number | undefined {
  const trimmed = text.trim()
  if (trimmed.length === 0) return undefined
  const match = CAPACITY_PATTERN.exec(trimmed)
  if (match === null) return Number.NaN
  const suffix = match[2]?.toLowerCase()
  const scale = suffix === 'k' || suffix === 'm' ? CAPACITY_SCALE[suffix] : 1
  const scaled = Number(match[1]) * scale
  // A decimal multiple is exact in intent but not in binary floating point
  // (2.3 * 1e6 lands a few ULPs high), so an integral intent snaps back.
  const rounded = Math.round(scaled)
  return Math.abs(scaled - rounded) < 1e-6 ? rounded : scaled
}

/**
 * Spell a stored count back in the shortest form that round-trips through
 * {@link parseCapacity}; a count that is not a whole number of thousands
 * stays written out.
 */
export function formatCapacity(value: unknown): string {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return typeof value === 'number' || typeof value === 'string' ? String(value) : ''
  }
  if (value % CAPACITY_SCALE.m === 0) return `${String(value / CAPACITY_SCALE.m)}M`
  if (value % CAPACITY_SCALE.k === 0) return `${String(value / CAPACITY_SCALE.k)}K`
  return String(value)
}

/**
 * Whether a parsed capacity is writeable: the schema admits positive
 * integers (`z.number().step(1).min(1)`); `undefined` is inheritance, not a
 * value, and always passes.
 */
export function validCapacity(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 1)
}
