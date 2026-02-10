/**
 * Server-side SSE (Server-Sent Events) adapter for streaming payments.
 *
 * Unlike {@link ./Stream}, which charges once per HTTP request, this module
 * keeps a single HTTP connection open and charges per emitted event (tick).
 * This is the right choice for LLM token streaming, real-time feeds, or any
 * use case where the server produces a variable number of paid units within
 * one response.
 *
 * The adapter handles mid-stream balance exhaustion: when the channel runs
 * out of funds it emits an `mpay-need-voucher` event and polls storage until
 * the client tops up, then resumes charging and emitting data.
 */
import type { Hex } from 'viem'
import * as Credential from '../../Credential.js'
import { InsufficientBalanceError } from '../../Errors.js'
import { createStreamReceipt } from '../stream/Receipt.js'
import {
  computeRequiredCumulative,
  formatNeedVoucherEvent,
  formatReceiptEvent,
  pollForBalance,
} from '../stream/Sse.js'
import type { ChannelStorage } from '../stream/Storage.js'
import type { StreamCredentialPayload } from '../stream/Types.js'
import { charge } from './Stream.js'

export type StreamController = {
  charge(): Promise<void>
}

export function from(parameters: from.Parameters): from.ReturnType {
  const { request, storage, tickCost: tickCostOverride } = parameters
  const { challengeId, channelId, tickCost: tickCostFromCredential } = extractContext(request)

  const tickCost = tickCostOverride ?? tickCostFromCredential

  function emitReceipt(
    ctrl: ReadableStreamDefaultController<Uint8Array>,
    encoder: TextEncoder,
  ): Promise<void> {
    return storage.getChannel(channelId).then((channel) => {
      if (!channel) return
      const receipt = createStreamReceipt({
        acceptedCumulative: channel.highestVoucherAmount,
        challengeId,
        channelId,
        spent: channel.spent,
        units: channel.units,
      })
      ctrl.enqueue(encoder.encode(formatReceiptEvent(receipt)))
    })
  }

  function chargeWithRetry(
    ctrl: ReadableStreamDefaultController<Uint8Array>,
    encoder: TextEncoder,
    pollIntervalMs: number,
    signal?: AbortSignal,
  ): () => Promise<void> {
    return async () => {
      try {
        await charge(storage, channelId, tickCost)
      } catch (e) {
        if (!(e instanceof InsufficientBalanceError)) throw e

        const channel = await storage.getChannel(channelId)
        if (!channel) throw new Error('channel not found')

        const requiredCumulative = computeRequiredCumulative(
          channel.spent,
          tickCost,
          channel.highestVoucherAmount,
        )
        ctrl.enqueue(
          encoder.encode(
            formatNeedVoucherEvent({
              acceptedCumulative: channel.highestVoucherAmount.toString(),
              channelId,
              requiredCumulative: requiredCumulative.toString(),
            }),
          ),
        )

        await pollForBalance(storage, channelId, tickCost, pollIntervalMs, signal)
        await charge(storage, channelId, tickCost)
      }
    }
  }

  function toSseResponse(body: ReadableStream<Uint8Array>): Response {
    return new Response(body, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
      },
    })
  }

  return {
    sseText(generate, options) {
      const { pollIntervalMs = 100, signal } = options ?? {}
      const encoder = new TextEncoder()

      const body = new ReadableStream<Uint8Array>({
        async start(ctrl) {
          const doCharge = chargeWithRetry(ctrl, encoder, pollIntervalMs, signal)
          try {
            for await (const value of generate) {
              if (signal?.aborted) break
              await doCharge()
              ctrl.enqueue(encoder.encode(`event: message\ndata: ${value}\n\n`))
            }
            if (!signal?.aborted) await emitReceipt(ctrl, encoder)
          } catch (e) {
            if (!signal?.aborted) ctrl.error(e)
          } finally {
            ctrl.close()
          }
        },
      })

      return toSseResponse(body)
    },

    sse(generate, options) {
      const { pollIntervalMs = 100, signal } = options ?? {}
      const encoder = new TextEncoder()

      const controller: StreamController = {
        charge: async () => {},
      }

      const body = new ReadableStream<Uint8Array>({
        async start(ctrl) {
          controller.charge = chargeWithRetry(ctrl, encoder, pollIntervalMs, signal)

          try {
            for await (const value of generate(controller)) {
              if (signal?.aborted) break
              ctrl.enqueue(encoder.encode(`event: message\ndata: ${value}\n\n`))
            }
            if (!signal?.aborted) await emitReceipt(ctrl, encoder)
          } catch (e) {
            if (!signal?.aborted) ctrl.error(e)
          } finally {
            ctrl.close()
          }
        },
      })

      return toSseResponse(body)
    },
  }
}

export declare namespace from {
  type Parameters = {
    request: Request
    storage: ChannelStorage
    tickCost?: bigint | undefined
  }

  type ReturnType = {
    sseText(generate: AsyncIterable<string>, options?: SseOptions | undefined): Response
    sse(
      generate: (stream: StreamController) => AsyncIterable<string>,
      options?: SseOptions | undefined,
    ): Response
  }
}

export type SseOptions = {
  pollIntervalMs?: number | undefined
  signal?: AbortSignal | undefined
}

function extractContext(request: Request): {
  challengeId: string
  channelId: Hex
  tickCost: bigint
} {
  const header = request.headers.get('Authorization')
  if (!header) throw new Error('Missing Authorization header.')

  const payment = Credential.extractPaymentScheme(header)
  if (!payment) throw new Error('Missing Payment credential in Authorization header.')

  const credential = Credential.deserialize(payment)
  const payload = credential.payload as StreamCredentialPayload
  const challengeId = credential.challenge.id
  const channelId = payload.channelId
  const tickCost = BigInt(credential.challenge.request.amount as string)

  return { challengeId, channelId, tickCost }
}
