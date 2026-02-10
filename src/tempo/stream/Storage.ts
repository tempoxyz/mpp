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
 * Storage interface for channel state persistence.
 *
 * ## Atomicity contract
 *
 * The `updateChannel` method uses an atomic read-modify-write callback.
 * The callback receives the current state (or `null` if none exists), and
 * returns the next state (or `null` to delete). Implementations must
 * guarantee that no concurrent mutation occurs between reading `current`
 * and writing the return value.
 *
 * Backends implement this via their native mechanisms:
 * - **In-memory / JS single-thread**: Synchronous callback execution
 * - **Durable Objects**: Single-threaded execution model
 * - **D1 / SQL**: Database transactions
 */
export interface ChannelStorage {
  getChannel(channelId: Hex): Promise<ChannelState | null>

  /**
   * Atomic read-modify-write for channel state.
   * Return `null` from `fn` to delete the channel.
   */
  updateChannel(
    channelId: Hex,
    fn: (current: ChannelState | null) => ChannelState | null,
  ): Promise<ChannelState | null>
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
  storage: ChannelStorage,
  channelId: Hex,
  amount: bigint,
): Promise<DeductResult> {
  let deducted = false
  const channel = await storage.updateChannel(channelId, (current) => {
    if (!current) return null
    if (current.highestVoucherAmount - current.spent >= amount) {
      deducted = true
      return { ...current, spent: current.spent + amount, units: current.units + 1 }
    }
    return current
  })
  if (!channel) throw new Error('channel not found')
  return { ok: deducted, channel }
}

/** In-memory channel storage backed by a simple Map. Useful for development and testing. */
export function memoryStorage(): ChannelStorage {
  const channels = new Map<string, ChannelState>()

  return {
    async getChannel(channelId) {
      return channels.get(channelId) ?? null
    },
    async updateChannel(channelId, fn) {
      const current = channels.get(channelId) ?? null
      const next = fn(current)
      if (next) channels.set(channelId, next)
      else channels.delete(channelId)
      return next
    },
  }
}
