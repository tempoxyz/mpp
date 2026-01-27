import * as Challenge from '../Challenge.js'
import type * as Method from '../Method.js'
import type * as z from '../zod.js'

type AnyClient = Method.Client<any, any, any>

/**
 * Client-side payment handler.
 */
export type Mpay<methods extends readonly AnyClient[] = readonly AnyClient[]> = {
  /** The configured payment methods. */
  methods: methods
  /** Creates a credential from a 402 response by routing to the correct method. */
  createCredential: (
    response: Response,
    context?: AnyContextFor<methods> | undefined,
  ) => Promise<string>
}

/**
 * Creates a client-side payment handler from an array of methods.
 *
 * @example
 * ```ts
 * import { Mpay } from 'mpay/client'
 * import { tempo } from 'mpay/tempo/client'
 *
 * const mpay = Mpay.create({
 *   methods: [
 *     tempo({
 *       rpcUrl: 'https://rpc.tempo.xyz',
 *     }),
 *   ],
 * })
 *
 * const response = await fetch('/resource')
 * if (response.status === 402) {
 *   const credential = await mpay.createCredential(response, {
 *     account: privateKeyToAccount('0x...'),
 *   })
 *   // Retry with credential
 *   await fetch('/resource', {
 *     headers: { Authorization: credential },
 *   })
 * }
 * ```
 */
export function create<const methods extends readonly AnyClient[]>(
  config: create.Config<methods>,
): Mpay<methods> {
  const { methods } = config

  return {
    methods,
    async createCredential(response: Response, context?: unknown) {
      const challenge = Challenge.fromResponse(response)

      const method = methods.find((m) => m.name === challenge.method)
      if (!method)
        throw new Error(
          `No method found for "${challenge.method}". Available: ${methods.map((m) => m.name).join(', ')}`,
        )

      const parsedContext =
        method.context && context !== undefined ? method.context.parse(context) : undefined
      return method.createCredential(
        parsedContext !== undefined
          ? { challenge, context: parsedContext }
          : ({ challenge } as never),
      )
    },
  }
}

export declare namespace create {
  type Config<methods extends readonly AnyClient[] = readonly AnyClient[]> = {
    /** Array of payment methods to use. */
    methods: methods
  }
}

/**
 * Union of all context types from all methods that have context schemas.
 * @internal
 */
type AnyContextFor<methods extends readonly AnyClient[]> = {
  [method in keyof methods]: methods[method] extends Method.Client<any, any, infer context>
    ? context extends z.ZodMiniType
      ? z.input<context>
      : undefined
    : undefined
}[number]
