import type { Chain, TxEvent, TxStatus } from '../types'

const SEED = 1337
const NOW_ANCHOR_MS = Date.UTC(2026, 6, 1)
const WINDOW_MS = 90 * 24 * 60 * 60 * 1000

export const CHAINS: Chain[] = ['ethereum', 'solana', 'osmosis', 'base']
export const STATUSES: TxStatus[] = ['pending', 'confirmed', 'failed']

const TOKENS_BY_CHAIN: Record<Chain, string[]> = {
  ethereum: ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'],
  solana: ['SOL', 'USDC', 'USDT', 'BONK'],
  osmosis: ['OSMO', 'ATOM', 'USDC'],
  base: ['ETH', 'USDC', 'DEGEN']
}

export const ALL_TOKENS: string[] = Array.from(new Set(Object.values(TOKENS_BY_CHAIN).flat())).sort()

const HEX_CHARS = '0123456789abcdef'
const BASE58_CHARS =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BECH32_CHARS = '023456789acdefghjklmnpqrstuvwxyz'

// a seeded PRNG (mulberry32 + a seed-mixing hash) that derives a full TxEvent purely from its index.
// No array is ever built, a row is just a function of (seed, index), so the "150k rows" cost nothing in memory.
function mulberry32(seed: number) {
  let state = seed
  return function next() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mixSeed(a: number, b: number): number {
  let h = (a ^ b) + 0x9e3779b9
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  h = h ^ (h >>> 16)
  return h >>> 0
}

function randomFromAlphabet(
  rng: () => number,
  alphabet: string,
  length: number
): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(rng() * alphabet.length)]
  }
  return out
}

function addressFor(chain: Chain, rng: () => number): string {
  switch (chain) {
    case 'ethereum':
    case 'base':
      return `0x${randomFromAlphabet(rng, HEX_CHARS, 40)}`
    case 'solana':
      return randomFromAlphabet(rng, BASE58_CHARS, 44)
    case 'osmosis':
      return `osmo1${randomFromAlphabet(rng, BECH32_CHARS, 38)}`
  }
}

function statusFor(roll: number): TxStatus {
  if (roll < 0.08) return 'failed'
  if (roll < 0.2) return 'pending'
  return 'confirmed'
}

export function generateRow(index: number): TxEvent {
  const rng = mulberry32(mixSeed(SEED, index))

  const chain = CHAINS[Math.floor(rng() * CHAINS.length)]
  const tokens = TOKENS_BY_CHAIN[chain]
  const token = tokens[Math.floor(rng() * tokens.length)]
  const status = statusFor(rng())
  const amountUsd = Math.round((rng() ** 2 * 49000 + 1) * 100) / 100
  const timestamp = NOW_ANCHOR_MS - Math.floor(rng() * WINDOW_MS)
  const sender = addressFor(chain, rng)
  const receiver = addressFor(chain, rng)

  return {
    id: `tx-${index.toString(36).padStart(6, '0')}`,
    timestamp,
    chain,
    token,
    amountUsd,
    sender,
    receiver,
    status
  }
}
