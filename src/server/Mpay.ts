import type { IncomingMessage, ServerResponse } from 'node:http'
import * as Challenge from '../Challenge.js'
import * as Credential from '../Credential.js'
import * as Errors from '../Errors.js'
import type * as Method from '../Method.js'
import type * as MethodIntent from '../MethodIntent.js'
import * as Receipt from '../Receipt.js'
import type * as z from '../zod.js'
import * as Request from './Request.js'
import * as Response from './Response.js'

/**
 * Payment handler.
 */
export type Mpay<method extends Method.Server<any, any, any> = Method.Server> = {
  /** The payment method. */
  method: method
  /** Server realm (e.g., hostname). */
  realm: string
} & {
  [intent in keyof Method.IntentsOf<method>]: IntentFn<
    Method.IntentsOf<method>[intent],
    Method.ContextOf<method>
  >
}

/**
 * Creates a server-side payment handler from a method.
 *
 * @example
 * ```ts
 * import { Mpay, tempo } from 'mpay/server'
 *
 * const payment = Mpay.create({
 *   method: tempo({
 *     rpcUrl: 'https://rpc.tempo.xyz',
 *     chainId: 42431,
 *   }),
 *   realm: 'api.example.com',
 *   secretKey: process.env.PAYMENT_SECRET_KEY,
 * })
 * ```
 */
export function create<const method extends Method.Server<any, any, any>>(
  config: create.Config<method>,
): Mpay<method> {
  const { method, realm, secretKey } = config
  const { intents, request, verify } = method

  const intentFns: Record<string, IntentFn<MethodIntent.MethodIntent, Record<string, unknown>>> = {}
  for (const [name, intent] of Object.entries(intents as Record<string, MethodIntent.MethodIntent>))
    intentFns[name] = createIntentFn({
      intent,
      realm,
      request: request as never,
      secretKey,
      verify: verify as never,
    })

  return { method, realm, ...intentFns } as never
}

export declare namespace create {
  type Config<method extends Method.Server<any, any, any> = Method.Server> = {
    /** Payment method (e.g., tempo({ ... })). */
    method: method
    /** Server realm (e.g., hostname). */
    realm: string
    /** Secret key for HMAC-bound challenge IDs (required for stateless verification). */
    secretKey: string
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function createIntentFn<intent extends MethodIntent.MethodIntent, context>(
  parameters: createIntentFn.Parameters<intent, context>,
): createIntentFn.ReturnType<intent, context> {
  const { intent, realm, secretKey, verify } = parameters

  return (options) => {
    const { description, expires, request: request_, ...context } = options

    // Transform request if method provides a `request` function
    const request = (
      parameters.request ? parameters.request(options as never) : request_
    ) as typeof request_

    // Recompute challenge from options. The HMAC-bound ID means we don't need to
    // store challenges server-side—if the client echoes back a credential with
    // a matching ID, we know it was issued by us with these exact parameters.
    const challenge = Challenge.fromIntent(intent, {
      description,
      expires,
      realm,
      request,
      secretKey,
    })

    async function handleFetch(request: globalThis.Request): Promise<IntentFn.Response> {
      // No credential provided—issue challenge
      const header = request.headers.get('Authorization')
      if (!header)
        return {
          challenge: Response.requirePayment({
            challenge,
            error: new Errors.PaymentRequiredError({ realm, description }),
          }),
          status: 402,
        }

      // Parse credential from Authorization header
      let credential: Credential.Credential
      try {
        credential = Credential.deserialize(header)
      } catch (e) {
        return {
          challenge: Response.requirePayment({
            challenge,
            error: new Errors.MalformedCredentialError({ reason: (e as Error).message }),
          }),
          status: 402,
        }
      }

      // Verify the echoed challenge was issued by us by recomputing its HMAC.
      // This is stateless—no database lookup needed.
      if (!Challenge.verify(credential.challenge, { secretKey }))
        return {
          challenge: Response.requirePayment({
            challenge,
            error: new Errors.InvalidChallengeError({
              id: credential.challenge.id,
              reason: 'challenge was not issued by this server',
            }),
          }),
          status: 402,
        }

      // Validate payload structure against intent schema
      try {
        intent.schema.credential.payload.parse(credential.payload)
      } catch (e) {
        return {
          challenge: Response.requirePayment({
            challenge,
            error: new Errors.InvalidPayloadError({ reason: (e as Error).message }),
          }),
          status: 402,
        }
      }

      // User-provided verification (e.g., check signature, submit tx, verify payment)
      let receiptData: Receipt.Receipt
      try {
        receiptData = await verify({ context, credential, request } as never)
      } catch (e) {
        return {
          challenge: Response.requirePayment({
            challenge,
            error: new Errors.VerificationFailedError({ reason: (e as Error).message }),
          }),
          status: 402,
        }
      }

      return {
        status: 200,
        withReceipt(response: globalThis.Response) {
          const headers = new Headers(response.headers)
          headers.set('Payment-Receipt', Receipt.serialize(receiptData))
          return new globalThis.Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        },
      }
    }

    async function handleNode(
      req: IncomingMessage,
      res: ServerResponse,
    ): Promise<IntentFn.Response> {
      const response = await handleFetch(Request.fromNodeListener(req, res))

      if (response.status === 402) {
        // 402: write full response and end—caller should not continue
        res.writeHead(402, Object.fromEntries(response.challenge.headers))
        const body = await response.challenge.text()
        if (body) res.write(body)
        res.end()
      } else {
        // 200: set receipt header—caller handles body and calls res.end()
        const wrapped = response.withReceipt(new globalThis.Response())
        res.setHeader('Payment-Receipt', wrapped.headers.get('Payment-Receipt')!)
      }

      return response
    }

    return ((first: globalThis.Request | IncomingMessage, second?: ServerResponse) =>
      first instanceof globalThis.Request
        ? handleFetch(first)
        : handleNode(first, second!)) as IntentFn.Handler
  }
}

declare namespace createIntentFn {
  type Parameters<intent extends MethodIntent.MethodIntent, context> = {
    intent: intent
    realm: string
    request?: Method.RequestFn<Record<string, intent>, context>
    secretKey: string
    verify: Method.VerifyFn<Record<string, intent>, context>
  }

  type ReturnType<intent extends MethodIntent.MethodIntent, context> = IntentFn<intent, context>
}

/** @internal */
type IntentFn<intent extends MethodIntent.MethodIntent, context> = (
  options: IntentFn.Options<intent, context>,
) => IntentFn.Handler

/** @internal */
declare namespace IntentFn {
  export type Options<intent extends MethodIntent.MethodIntent, context> = {
    /** Optional human-readable description of the payment. */
    description?: string | undefined
    /** Optional challenge expiration timestamp (ISO 8601). */
    expires?: string | undefined
    /** Payment request parameters. */
    request: z.input<intent['schema']['request']>
  } & ([keyof context] extends [never] ? unknown : context)

  export type Handler = FetchFn & NodeFn

  export type FetchFn = (request: globalThis.Request) => Promise<IntentFn.Response>

  export type NodeFn = (
    request: IncomingMessage,
    response: ServerResponse,
  ) => Promise<IntentFn.Response>

  /**
   * Response returned by an intent function (Fetch API).
   */
  export type Response =
    | { challenge: globalThis.Response; status: 402 }
    | { status: 200; withReceipt: (response: globalThis.Response) => globalThis.Response }
}
