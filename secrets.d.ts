declare namespace Cloudflare {
	interface Env {
		AUTH_CREDENTIALS: string;
		AUTH_PASS: string;
		FEE_PAYER_PRIVATE_KEY: string;
		MPAY_KV: KVNamespace;
		RPC_AUTH_PASS: string;
		RPC_AUTH_USER: string;
		SECRET_KEY: string;
	}
}
