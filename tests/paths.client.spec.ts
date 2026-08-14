/**
 * Path helper unit coverage, including the envelope-walk fallback arms.
 */

import { describe, expect, test } from 'vitest'
import { getPath, hasPath, nodeAtPath } from '../src/client/paths.ts'

describe('getPath', () => {
  test('walks objects and arrays', () => {
    const value = { a: { b: [{ c: 1 }] } }
    expect(getPath(value, ['a', 'b', '0', 'c'])).toBe(1)
    expect(getPath(value, [])).toBe(value)
  })

  test('non-object mid-path yields undefined', () => {
    expect(getPath({ a: 1 }, ['a', 'b'])).toBeUndefined()
    expect(getPath(null, ['a'])).toBeUndefined()
  })

  test('array index out of range yields undefined', () => {
    expect(getPath({ a: [1] }, ['a', '9'])).toBeUndefined()
  })
})

describe('hasPath', () => {
  test('an empty path asks about the value itself', () => {
    expect(hasPath(1, [])).toBe(true)
    expect(hasPath(undefined, [])).toBe(false)
  })

  test('object and array presence both count', () => {
    expect(hasPath({ a: 1 }, ['a'])).toBe(true)
    expect(hasPath({ a: 1 }, ['b'])).toBe(false)
    expect(hasPath([1], ['0'])).toBe(true)
    expect(hasPath([], ['0'])).toBe(false)
  })

  test('a non-container parent denies', () => {
    expect(hasPath(5, ['a'])).toBe(false)
  })
})

describe('nodeAtPath', () => {
  test('walks object.dict and dict/array.inner', () => {
    const root = { type: 'object', dict: { a: { type: 'dict', inner: { type: 'array', inner: { type: 'string' } } } } }
    expect(nodeAtPath(root, ['a', 'x'])).toEqual({ type: 'array', inner: { type: 'string' } })
    expect(nodeAtPath(root, ['a', 'x', '0'])).toEqual({ type: 'string' })
  })

  test('unknown steps yield undefined', () => {
    expect(nodeAtPath({ type: 'object', dict: {} }, ['missing'])).toBeUndefined()
    expect(nodeAtPath({ type: 'string' }, ['x'])).toBeUndefined()
    expect(nodeAtPath('junk', ['x'])).toBeUndefined()
    expect(nodeAtPath(null, ['x'])).toBeUndefined()
  })
})
