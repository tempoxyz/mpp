/**
 * Shared SSE utilities used by both the high-level server adapter
 * ({@link ../server/Sse}) and the lower-level `serve()` function.
 *
 * Provides event formatting/parsing, balance polling, and the core
 * `serve()` loop that meters an async iterable into a ReadableStream
 * of SSE events.
 */
import type { Hex } from 'viem'
import { createStreamReceipt } from './Receipt.js'
import type { ChannelStorage } from './Storage.js'
import { deductFromChannel } from './Storage.js'
import type { NeedVoucherEvent, StreamReceipt } from './Types.js'

/**
 * Format a stream receipt as a Server-Sent Event.
 *
 * Produces a valid SSE event string with `event: payment-receipt`
 * and the receipt JSON as the `data` field.
 */
export function formatReceiptEvent(receipt: StreamReceipt): string {
  return `event: payment-receipt\ndata: ${JSON.stringify(receipt)}\n\n`
}

/**
 * Format a need-voucher event as a Server-Sent Event.
 *
 * Emitted when the channel balance is exhausted mid-stream.
 * The client responds by sending a new voucher credential to
 * any mpay-protected endpoint.
 */
export function formatNeedVoucherEvent(params: NeedVoucherEvent): string {
  return `event: mpay-need-voucher\ndata: ${JSON.stringify(params)}\n\n`
}

/**
 * Parsed SSE event (discriminated union by `type`).
 */
export type SseEvent =
  | { type: 'message'; data: string }
  | { type: 'mpay-need-voucher'; data: NeedVoucherEvent }
  | { type: 'payment-receipt'; data: StreamReceipt }

/**
 * Parse a raw SSE event string into a typed event.
 *
 * Handles the three event types used by mpay streaming:
 * - `message` (default / no event field) — application data
 * - `mpay-need-voucher` — balance exhausted, client should send voucher
 * - `payment-receipt` — final receipt
 */
export function parseEvent(raw: string): SseEvent | null {
  let eventType = 'message'
  const dataLines: string[] = []

  for (const line of raw.split('\n')) {
    if (line.startsWith('event: ')) {
      eventType = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6))
    } else if (line === 'data:') {
      dataLines.push('')
    }
  }

  if (dataLines.length === 0) return null
  const data = dataLines.join('\n')

  switch (eventType) {
    case 'message':
      return { type: 'message', data }
    case 'mpay-need-voucher':
      return { type: 'mpay-need-voucher', data: JSON.parse(data) as NeedVoucherEvent }
    case 'payment-receipt':
      return { type: 'payment-receipt', data: JSON.parse(data) as StreamReceipt }
    default:
      return { type: 'message', data }
  }
}

/**
 * Wrap an async iterable with payment metering, producing an SSE stream.
 *
 * For each value yielded by `generate`:
 * 1. Deducts `tickCost` from the channel balance atomically.
 * 2. If balance is sufficient, emits `event: message` with the value.
 * 3. If balance is exhausted, emits `event: mpay-need-voucher`
 *    and polls storage until the client tops up the channel.
 * 4. On generator completion, emits a final `event: payment-receipt`.
 *
 * Returns a `ReadableStream<Uint8Array>` suitable for use as an HTTP response body.
 */
export function serve(options: serve.Options): ReadableStream<Uint8Array> {
  const {
    storage,
    channelId,
    challengeId,
    tickCost,
    generate,
    pollIntervalMs = 100,
    signal,
  } = options

  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const aborted = () => signal?.aborted ?? false

      try {
        for await (const value of generate) {
          if (aborted()) break

          let result = await deductFromChannel(storage, channelId, tickCost)

          while (!result.ok) {
            const requiredCumulative = computeRequiredCumulative(
              result.channel.spent,
              tickCost,
              result.channel.highestVoucherAmount,
            )
            controller.enqueue(
              encoder.encode(
                formatNeedVoucherEvent({
                  channelId,
                  requiredCumulative: requiredCumulative.toString(),
                  acceptedCumulative: result.channel.highestVoucherAmount.toString(),
                }),
              ),
            )

            await pollForBalance(storage, channelId, tickCost, pollIntervalMs, signal)
            result = await deductFromChannel(storage, channelId, tickCost)
          }

          controller.enqueue(encoder.encode(`event: message\ndata: ${value}\n\n`))
        }

        if (!aborted()) {
          const channel = await storage.getChannel(channelId)
          if (channel) {
            const receipt = createStreamReceipt({
              challengeId,
              channelId,
              acceptedCumulative: channel.highestVoucherAmount,
              spent: channel.spent,
              units: channel.units,
            })
            controller.enqueue(encoder.encode(formatReceiptEvent(receipt)))
          }
        }
      } catch (e) {
        if (!aborted()) controller.error(e)
      } finally {
        controller.close()
      }
    },
  })
}

export declare namespace serve {
  type Options = {
    storage: ChannelStorage
    channelId: Hex
    challengeId: string
    tickCost: bigint
    generate: AsyncIterable<string>
    pollIntervalMs?: number | undefined
    signal?: AbortSignal | undefined
  }
}

export function computeRequiredCumulative(
  spent: bigint,
  tickCost: bigint,
  highestVoucherAmount: bigint,
): bigint {
  const needed = spent + tickCost
  return needed > highestVoucherAmount ? needed : highestVoucherAmount
}

export async function pollForBalance(
  storage: ChannelStorage,
  channelId: Hex,
  tickCost: bigint,
  pollIntervalMs: number,
  signal?: AbortSignal,
): Promise<void> {
  while (!(signal?.aborted ?? false)) {
    await sleep(pollIntervalMs)
    if (signal?.aborted) throw new Error('Aborted while waiting for voucher')

    const channel = await storage.getChannel(channelId)
    if (channel && channel.highestVoucherAmount - channel.spent >= tickCost) {
      return
    }
  }

  throw new Error('Aborted while waiting for voucher')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
