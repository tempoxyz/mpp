declare namespace NodeJS {
	interface ProcessEnv {
		AUTH_PASS: string;
		FEE_PAYER_PRIVATE_KEY: string;
		RPC_AUTH_PASS: string;
		RPC_AUTH_USER: string;
	}
}
