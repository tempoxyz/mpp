import type { Address, Hex } from 'viem'
import type { SignedVoucher } from './Types.js'

/**
 * State for an on-chain payment channel, including per-session accounting.
 *
 * Tracks the channel's identity, on-chain balance, the highest voucher
 * the server has accepted, and the current session's spend counters.
 * A channel is created when a payer opens an escrow on-chain and persists
 * until the channel is finalized (closed/settled).
 *
 * One channel = one session. The client owns the key and can't race with
 * itself, so concurrent session support is unnecessary.
 *
 * Monotonicity invariants (enforced by update callbacks):
 * - `highestVoucherAmount` only increases
 * - `settledOnChain` only increases
 * - `deposit` reflects the latest on-chain value
 */
export interface ChannelState {
  channelId: Hex
  payer: Address
  payee: Address
  token: Address
  authorizedSigner: Address

  /** Current on-chain deposit in the escrow contract. */
  deposit: bigint
  /** Cumulative amount settled on-chain so far. */
  settledOnChain: bigint
  /** Highest cumulative voucher amount accepted by the server. */
  highestVoucherAmount: bigint
  /** The signed voucher corresponding to `highestVoucherAmount`. */
  highestVoucher: SignedVoucher | null

  /** Cumulative amount spent (charged) against this channel's current session. */
  spent: bigint
  /** Number of charge operations (API requests) fulfilled in the current session. */
  units: number

  /** Whether the channel has been finalized (closed) on-chain. */
  finalized: boolean
  createdAt: Date
}

/**
 * Generic key-value storage interface.
 *
 * Isomorphic across payment methods (stream, charge, etc.) and across
 * client and server. Implementations control the persistence backend;
 * callers control the domain logic on top.
 */
export interface Storage<value> {
  get(key: string): Promise<value | null>
  set(key: string, value: value): Promise<void>
  delete(key: string): Promise<void>
}

/** @deprecated Use `Storage<ChannelState>` instead. */
export type ChannelStorage = Storage<ChannelState>

/**
 * Atomic read-modify-write helper for channel state.
 *
 * Reads the current value, passes it to `fn`, and writes the result.
 * Return `null` from `fn` to delete the entry.
 *
 * For single-threaded runtimes (in-memory, Durable Objects) this is
 * naturally atomic. SQL-backed implementations should wrap calls in
 * a transaction externally.
 */
export async function updateChannel(
  storage: Storage<ChannelState>,
  channelId: Hex,
  fn: (current: ChannelState | null) => ChannelState | null,
): Promise<ChannelState | null> {
  const current = await storage.get(channelId)
  const next = fn(current)
  if (next) await storage.set(channelId, next)
  else if (current) await storage.delete(channelId)
  return next
}

export type DeductResult =
  | { ok: true; channel: ChannelState }
  | { ok: false; channel: ChannelState }

/**
 * Atomically deduct `amount` from a channel's available balance.
 *
 * Returns `{ ok: true, channel }` if the deduction succeeded, or
 * `{ ok: false, channel }` with the unchanged state if balance is
 * insufficient. Throws if the channel does not exist.
 */
export async function deductFromChannel(
  storage: Storage<ChannelState>,
  channelId: Hex,
  amount: bigint,
): Promise<DeductResult> {
  const before = await storage.get(channelId)
  if (!before) throw new Error('channel not found')
  if (before.finalized) throw new Error('channel is finalized')

  const channel = await updateChannel(storage, channelId, (current) => {
    if (!current) return null
    if (current.finalized) return current
    if (current.highestVoucherAmount - current.spent >= amount) {
      return { ...current, spent: current.spent + amount, units: current.units + 1 }
    }
    return current
  })
  if (!channel) throw new Error('channel not found')
  return { ok: channel.spent >= before.spent + amount, channel }
}

/** In-memory storage backed by a simple Map. Useful for development and testing. */
export function memoryStorage<value = ChannelState>(): Storage<value> {
  const store = new Map<string, value>()

  return {
    async get(key) {
      return store.get(key) ?? null
    },
    async set(key, value) {
      store.set(key, value)
    },
    async delete(key) {
      store.delete(key)
    },
  }
}
