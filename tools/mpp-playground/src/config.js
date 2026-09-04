/**
 * Machine Payments Protocol (MPP) Configuration
 * Co-authored by Stripe & Tempo
 */

export const MPP_CONFIG = {
  protocol: {
    name: 'Machine Payments Protocol',
    version: '1.0.0',
    rfcStatus: 'Draft Standard (HTTP 402 Extension)',
    headerChallenge: 'WWW-Authenticate',
    headerProof: 'Authorization',
  },
  network: {
    name: 'Tempo Moderato Testnet',
    chainId: 424242,
    rpcUrl: process.env.TEMPO_RPC_URL || 'https://moderato.tempo.xyz',
    explorerUrl: 'https://explore.tempo.xyz',
    currency: { name: 'Tempo USD', symbol: 'TUSD', decimals: 6 },
  },
  paymentMethods: [
    {
      id: 'mpp_tempo_moderato',
      name: 'Tempo Moderato Sub-second Channel',
      fee: '0.0001 TUSD',
      settlementTime: '< 50ms',
      type: 'onchain_stream',
    },
    {
      id: 'mpp_stripe_agent',
      name: 'Stripe Machine Token Channel',
      fee: '0.001 USD',
      settlementTime: '< 100ms',
      type: 'card_intent',
    },
  ],
};
