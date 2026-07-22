import { describe, expect, it } from 'vitest'
import { generateRow } from './dataGenerator'

describe('generateRow', () => {
  it('is deterministic for the same index', () => {
    expect(generateRow(42)).toEqual(generateRow(42))
  })

  it('produces different rows for different indexes', () => {
    const a = generateRow(0)
    const b = generateRow(1)
    expect(a.id).not.toBe(b.id)
    expect(a).not.toEqual(b)
  })

  it('produces valid field values', () => {
    const row = generateRow(123)
    expect(['ethereum', 'solana', 'osmosis', 'base']).toContain(row.chain)
    expect(['pending', 'confirmed', 'failed']).toContain(row.status)
    expect(row.amountUsd).toBeGreaterThan(0)
    expect(row.sender).not.toBe(row.receiver)
  })
})
