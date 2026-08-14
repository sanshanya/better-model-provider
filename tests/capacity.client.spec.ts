/**
 * Capacity-spelling coverage: the K/M vocabulary is the official Models
 * page's, so every case here is a compatibility case — a value one surface
 * writes must read back identically on the other.
 */

import { describe, expect, test } from 'vitest'
import { formatCapacity, parseCapacity, validCapacity } from '../src/client/capacity.ts'

describe('parseCapacity', () => {
  test.each<{ label: string; text: string; expected: number | undefined }>([
    { label: 'blank inherits', text: '', expected: undefined },
    { label: 'whitespace inherits', text: '   ', expected: undefined },
    { label: 'plain count', text: '256', expected: 256 },
    { label: 'K thousands', text: '380K', expected: 380000 },
    { label: 'lowercase k', text: '32k', expected: 32000 },
    { label: 'M millions', text: '1M', expected: 1000000 },
    { label: 'decimal K', text: '1.5K', expected: 1500 },
    { label: 'decimal M snaps ULPs', text: '2.3M', expected: 2300000 },
    { label: 'surrounding space', text: ' 32K ', expected: 32000 },
    { label: 'non-integral plain stays fractional', text: '1.5', expected: 1.5 },
  ])('$label', ({ text, expected }) => {
    expect(parseCapacity(text)).toBe(expected)
  })

  test.each(['abc', '10T', '1kk', 'K10', '-5', '1e5'])('unreadable spelling %s parses to NaN', (text) => {
    expect(Number.isNaN(parseCapacity(text))).toBe(true)
  })
})

describe('validCapacity (schema admits positive integers only)', () => {
  test.each<{ label: string; value: number | undefined; valid: boolean }>([
    { label: 'inherit always passes', value: undefined, valid: true },
    { label: 'whole count', value: 380000, valid: true },
    { label: 'one', value: 1, valid: true },
    { label: 'zero fails min(1)', value: 0, valid: false },
    { label: 'negative fails', value: -5, valid: false },
    { label: 'fraction fails step(1)', value: 1.5, valid: false },
    { label: 'NaN fails', value: Number.NaN, valid: false },
  ])('$label', ({ value, valid }) => {
    expect(validCapacity(value)).toBe(valid)
  })
})

describe('formatCapacity', () => {
  test.each<{ label: string; value: unknown; expected: string }>([
    { label: 'whole thousands spell K', value: 380000, expected: '380K' },
    { label: 'whole millions spell M', value: 2000000, expected: '2M' },
    { label: 'non-thousand integer stays plain', value: 256, expected: '256' },
    { label: 'zero stays plain', value: 0, expected: '0' },
    { label: 'negative stays plain', value: -1, expected: '-1' },
    { label: 'fraction stays plain', value: 1.5, expected: '1.5' },
    { label: 'absent is empty', value: undefined, expected: '' },
    { label: 'string passes through', value: '380K', expected: '380K' },
    { label: 'exotic value is empty', value: { weird: true }, expected: '' },
  ])('$label', ({ value, expected }) => {
    expect(formatCapacity(value)).toBe(expected)
  })

  test.each([256, 32000, 380000, 1000000, 2300000])('round trip preserves %s', (value) => {
    expect(parseCapacity(formatCapacity(value))).toBe(value)
  })
})
