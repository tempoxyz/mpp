"use client";

import { useMutation } from "@tanstack/react-query";
import { Challenge, Receipt } from "mpay";
import { tempo } from "mpay/client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Chain, Client, Transport } from "viem";
import { formatUnits } from "viem";
import { Actions } from "viem/tempo";
import {
	useAccount,
	useClient,
	useConnect,
	useConnectors,
	useDisconnect,
	useReadContract,
	useWalletClient,
} from "wagmi";
import { PaymentProviders } from "./PaymentProviders";
import { alphaUsd } from "./wagmi.config";

interface ProtocolData {
	challengeHeader: string | null;
	challenge: Challenge.Challenge | null;
	credential: string | null;
	receiptHeader: string | null;
	receipt: Receipt.Receipt | null;
	responseBody: string | null;
}

const balanceOfAbi = [
	{
		name: "balanceOf",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "", type: "uint256" }],
	},
] as const;

function PaymentDemoInner() {
	const [isLoading, setIsLoading] = useState<
		"signin" | "signup" | "request" | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [protocolData, setProtocolData] = useState<ProtocolData>({
		challenge: null,
		challengeHeader: null,
		credential: null,
		receipt: null,
		receiptHeader: null,
		responseBody: null,
	});

	const { address, isConnected } = useAccount();
	const { connect } = useConnect();
	const { disconnect } = useDisconnect();
	const connectors = useConnectors();
	const { data: walletClient } = useWalletClient();
	const { data: balance, refetch: refetchBalance } = useReadContract({
		address: alphaUsd,
		abi: balanceOfAbi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: { enabled: !!address },
	});

	// Refs for request sequencing and faucet guard
	const requestSeqRef = useRef(0);
	const faucetAttemptedRef = useRef<string | null>(null);

	const webAuthnConnector = connectors.find((c) => c.type === "webAuthn");
	const publicClient = useClient();

	const faucet = useMutation({
		async mutationFn() {
			if (!address) throw new Error("No address available");
			if (!publicClient) throw new Error("Client not found");

			await Actions.faucet.fundSync(
				publicClient as unknown as Client<Transport, Chain>,
				{ account: address },
			);
			await new Promise((resolve) => setTimeout(resolve, 400));
			refetchBalance();
		},
		onError: (err) =>
			setError(err instanceof Error ? err.message : "Faucet request failed"),
	});

	const handleConnect = async (mode: "signin" | "signup") => {
		if (!webAuthnConnector) return;
		setIsLoading(mode);
		setError(null);
		try {
			await connect({
				connector: webAuthnConnector,
				...(mode === "signup" && { capabilities: { type: "sign-up" } }),
			} as Parameters<typeof connect>[0]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection failed");
		} finally {
			setIsLoading(null);
		}
	};

	const handleSignOut = () => {
		disconnect();
		setError(null);
		setProtocolData({
			challenge: null,
			challengeHeader: null,
			credential: null,
			receipt: null,
			receiptHeader: null,
			responseBody: null,
		});
		faucetAttemptedRef.current = null;
	};

	const handlePaidRequest = useCallback(async () => {
		if (!walletClient || !walletClient.account) return;

		const seq = ++requestSeqRef.current;
		const controller = new AbortController();

		setIsLoading("request");
		setError(null);
		setProtocolData({
			challenge: null,
			challengeHeader: null,
			credential: null,
			receipt: null,
			receiptHeader: null,
			responseBody: null,
		});

		try {
			const res1 = await fetch("/ping/paid", { signal: controller.signal });

			if (seq !== requestSeqRef.current) return;

			if (res1.status !== 402) {
				throw new Error(`Expected 402, got ${res1.status}`);
			}

			const challengeHeader = res1.headers.get("WWW-Authenticate");
			if (!challengeHeader) {
				throw new Error("Missing WWW-Authenticate header");
			}

			const method = tempo({
				account: walletClient.account,
			});
			const challenge = Challenge.fromResponse(res1, { method });
			const credential = await method.createCredential({
				challenge,
				context: {},
			});

			if (seq !== requestSeqRef.current) return;

			setProtocolData((prev) => ({
				...prev,
				challenge,
				challengeHeader,
				credential,
			}));

			const res2 = await fetch("/ping/paid", {
				headers: { Authorization: credential },
				signal: controller.signal,
			});

			if (seq !== requestSeqRef.current) return;

			if (!res2.ok) {
				const body = await res2.text().catch(() => "");
				throw new Error(
					`Paid request failed (${res2.status}): ${body || res2.statusText}`,
				);
			}

			const receiptHeader = res2.headers.get("Payment-Receipt");
			const receipt = receiptHeader ? Receipt.deserialize(receiptHeader) : null;
			const responseBody = await res2.text();

			if (seq !== requestSeqRef.current) return;

			setProtocolData((prev) => ({
				...prev,
				receipt,
				receiptHeader,
				responseBody,
			}));

			await refetchBalance();
		} catch (err) {
			if (seq !== requestSeqRef.current) return;
			if (err instanceof Error && err.name === "AbortError") return;
			setError(err instanceof Error ? err.message : "Payment request failed");
		} finally {
			if (seq === requestSeqRef.current) {
				setIsLoading(null);
			}
		}
	}, [walletClient, refetchBalance]);

	const balanceValue = balance ?? 0n;
	const hasFunds = balanceValue > 0n;

	const formattedBalance =
		balance !== undefined
			? `${Number(formatUnits(balance, 6)).toFixed(2)} aUSD`
			: null;

	// Auto-fund when connected but balance is low (once per address)
	useEffect(() => {
		if (!isConnected || !address || balance === undefined) return;
		if (balanceValue >= 100000n) return;
		if (faucet.isPending) return;
		if (faucetAttemptedRef.current === address) return;

		faucetAttemptedRef.current = address;
		faucet.mutate();
	}, [
		isConnected,
		address,
		balance,
		balanceValue,
		faucet,
	]);

	return (
		<div className="vocs:mt-6 vocs:mx-auto vocs:max-w-[90%] vocs:border vocs:border-[var(--vocs-color-border)] vocs:rounded vocs:overflow-hidden vocs:not-prose vocs:divide-y vocs:divide-[var(--vocs-color-border)]">
			{/* Header */}
			<div className="vocs:flex vocs:h-11 vocs:items-center vocs:justify-between vocs:px-4">
				<h4 className="vocs:-tracking-[1%] vocs:font-normal vocs:text-[14px] vocs:text-[var(--vocs-color-text)] vocs:leading-none">
					Make a request with payment
				</h4>
				<span className="vocs:flex vocs:h-[19px] vocs:items-center vocs:justify-center vocs:rounded-[30px] vocs:bg-[var(--vocs-color-accent-tint)] vocs:px-1.5 vocs:text-center vocs:font-medium vocs:text-[9px] vocs:text-[var(--vocs-color-accent)] vocs:uppercase vocs:leading-none vocs:tracking-[2%]">
					demo
				</span>
			</div>

			{/* Steps */}
			<div className="vocs:p-4 vocs:space-y-4">
				{error && (
					<div className="vocs:px-3 vocs:py-2 vocs:rounded vocs:bg-[var(--vocs-color-destructive-tint)] vocs:text-[var(--vocs-color-destructive)] vocs:text-[14px]">
						{error}
					</div>
				)}

				{/* Step 1: Connect & Fund */}
				<Step
					active={!isConnected || !hasFunds}
					completed={isConnected && !!hasFunds}
					number={1}
					title={
						isConnected ? (
							<div className="vocs:flex vocs:flex-col vocs:gap-1">
								<div className="vocs:flex vocs:items-center">
									Connected as{" "}
									<a
										href={`https://explore.tempo.xyz/address/${address}`}
										target="_blank"
										rel="noopener noreferrer"
										className="vocs:-tracking-[1%] vocs:flex vocs:items-center vocs:gap-1 vocs:ml-1 vocs:text-[13px] vocs:text-[var(--vocs-color-accent)] hover:vocs:underline"
									>
										{address?.slice(0, 6)}⋅⋅⋅{address?.slice(-4)}
										<ExternalLinkIcon />
									</a>
								</div>
								<div>
									{hasFunds ? (
										<>
											Balance:{" "}
											<code className="vocs:text-xs vocs:bg-[var(--vocs-color-background-2)] vocs:px-1.5 vocs:py-0.5 vocs:rounded">
												{formattedBalance}
											</code>
										</>
									) : faucet.isPending ? (
										"Adding funds..."
									) : (
										"Waiting for funds..."
									)}
								</div>
							</div>
						) : (
							"Create an account, or use an existing one."
						)
					}
					actions={
						isConnected ? (
							<Button variant="dashed" onClick={handleSignOut}>
								Sign out
							</Button>
						) : (
							<div className="vocs:flex vocs:gap-1">
								<Button
									variant="primary"
									onClick={() => handleConnect("signin")}
									disabled={isLoading !== null}
								>
									{isLoading === "signin" ? "..." : "Sign in"}
								</Button>
								<Button
									variant="dashed"
									onClick={() => handleConnect("signup")}
									disabled={isLoading !== null}
								>
									{isLoading === "signup" ? "..." : "Sign up"}
								</Button>
							</div>
						)
					}
				/>

				{/* Step 2: Make Request */}
				<Step
					active={!!hasFunds && !protocolData.receipt}
					completed={!!protocolData.receipt}
					number={2}
					title={
						<>
							Make request to{" "}
							<code className="vocs:text-xs vocs:bg-[var(--vocs-color-background-2)] vocs:px-1.5 vocs:py-0.5 vocs:rounded">
								/ping/paid
							</code>
						</>
					}
					actions={
						<Button
							variant={hasFunds ? "primary" : "dashed"}
							onClick={handlePaidRequest}
							disabled={!hasFunds || isLoading !== null}
						>
							{isLoading === "request" ? "..." : "Make request"}
						</Button>
					}
				/>
			</div>

			{/* Response Details */}
			{(protocolData.challengeHeader || protocolData.receiptHeader) && (
				<div className="vocs:bg-[var(--vocs-color-background-2)] vocs:divide-y vocs:divide-[var(--vocs-color-border)]">
					<div className="vocs:px-4 vocs:py-3 vocs:text-[13px] vocs:font-medium vocs:text-[var(--vocs-color-text-2)]">
						Response Details
					</div>

					{protocolData.challengeHeader && (
						<div className="vocs:p-4 vocs:font-mono vocs:text-xs vocs:leading-relaxed vocs:overflow-x-auto">
							<ResponseSection title="Challenge" statusCode="402">
								<HeaderLine
									name="WWW-Authenticate"
									value={protocolData.challengeHeader}
								/>
								{protocolData.challenge && (
									<JsonBlock value={protocolData.challenge} />
								)}
							</ResponseSection>
						</div>
					)}

					{protocolData.credential && (
						<div className="vocs:p-4 vocs:font-mono vocs:text-xs vocs:leading-relaxed vocs:overflow-x-auto">
							<ResponseSection title="Credential">
								<HeaderLine
									name="Authorization"
									value={protocolData.credential}
									truncate
								/>
							</ResponseSection>
						</div>
					)}

					{(protocolData.receiptHeader || protocolData.responseBody) && (
						<div className="vocs:p-4 vocs:font-mono vocs:text-xs vocs:leading-relaxed vocs:overflow-x-auto vocs:space-y-4">
							{protocolData.receiptHeader && (
								<ResponseSection title="Receipt" statusCode="200">
									<HeaderLine
										name="Payment-Receipt"
										value={protocolData.receiptHeader}
									/>
									{protocolData.receipt && (
										<JsonBlock value={protocolData.receipt} />
									)}
								</ResponseSection>
							)}

							{protocolData.responseBody && (
								<ResponseSection title="Response">
									<ResponseBody value={protocolData.responseBody} />
								</ResponseSection>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function StepNumber({
	number,
	complete,
}: {
	number: number;
	complete: boolean;
}) {
	if (complete) {
		return (
			<div className="vocs:w-7 vocs:h-7 vocs:rounded-full vocs:flex vocs:items-center vocs:justify-center vocs:text-[13px] vocs:shrink-0 vocs:bg-[#d3f9d8] dark:vocs:bg-[#1a4d2e] vocs:tabular-nums">
				<CheckIcon />
			</div>
		);
	}
	return (
		<div className="vocs:w-7 vocs:h-7 vocs:rounded-full vocs:flex vocs:items-center vocs:justify-center vocs:text-[13px] vocs:shrink-0 vocs:border vocs:border-dashed vocs:border-[var(--vocs-color-border)] vocs:text-[var(--vocs-color-text-4)] vocs:tabular-nums">
			{number}
		</div>
	);
}

function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="vocs:text-[#2f9e44] dark:vocs:text-[#69db7c]"
			aria-hidden="true"
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function ExternalLinkIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="vocs:size-3"
			aria-hidden="true"
		>
			<path d="M15 3h6v6" />
			<path d="M10 14 21 3" />
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		</svg>
	);
}

function Step({
	active,
	completed,
	number,
	title,
	actions,
	children,
}: {
	active: boolean;
	completed: boolean;
	number: number;
	title: React.ReactNode;
	actions?: React.ReactNode;
	children?: React.ReactNode;
}) {
	return (
		<div data-active={active} data-completed={completed} className="vocs:group">
			<header className="vocs:flex vocs:items-center vocs:justify-between vocs:gap-4 max-sm:vocs:flex-col max-sm:vocs:items-start max-sm:vocs:justify-start">
				<div className="vocs:flex vocs:items-center vocs:gap-3.5">
					<StepNumber number={number} complete={completed} />
					<div className="vocs:-tracking-[1%] vocs:text-[14px] vocs:text-[var(--vocs-color-text)] group-data-[active=false]:vocs:opacity-40">
						{title}
					</div>
				</div>
				{actions}
			</header>
			{children}
		</div>
	);
}

function Button({
	variant,
	onClick,
	disabled,
	children,
}: {
	variant: "primary" | "secondary" | "dashed";
	onClick: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	const baseClasses =
		"vocs:relative vocs:inline-flex vocs:items-center vocs:justify-center vocs:gap-2 vocs:whitespace-nowrap vocs:rounded-md vocs:font-normal vocs:transition-colors vocs:h-8 vocs:px-3.5 vocs:text-[14px] vocs:-tracking-[2%] vocs:min-w-[110px]";

	const variantClasses = {
		primary:
			"vocs:bg-[var(--vocs-color-accent)] vocs:text-white vocs:border vocs:border-[var(--vocs-color-accent)]",
		secondary:
			"vocs:border vocs:border-dashed vocs:border-[var(--vocs-color-border)] vocs:text-[var(--vocs-color-text)]",
		dashed:
			"vocs:border vocs:border-dashed vocs:border-[var(--vocs-color-border)] vocs:text-[var(--vocs-color-text-4)]",
	}[variant];

	const disabledClasses = disabled
		? "vocs:pointer-events-none vocs:opacity-50"
		: "";

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
		>
			{children}
		</button>
	);
}

function ResponseSection({
	title,
	statusCode,
	children,
}: {
	title: string;
	statusCode?: "402" | "200";
	children: React.ReactNode;
}) {
	const statusColors = {
		"402": "vocs:text-[var(--vocs-color-destructive)]",
		"200": "vocs:text-[#16a34a] vocs:dark:text-[#4ade80]",
	};

	return (
		<div>
			<div className="vocs:text-[11px] vocs:font-semibold vocs:uppercase vocs:tracking-wider vocs:text-[var(--vocs-color-text-3)] vocs:mb-2 vocs:font-sans">
				{title}
				{statusCode && (
					<span className={statusColors[statusCode]}> ({statusCode})</span>
				)}
			</div>
			{children}
		</div>
	);
}

function HeaderLine({
	name,
	value,
	truncate = false,
}: {
	name: string;
	value: string;
	truncate?: boolean;
}) {
	const displayValue =
		truncate && value.length > 60 ? `${value.slice(0, 60)}...` : value;
	return (
		<div className="vocs:py-3 vocs:pr-4 vocs:bg-[var(--vocs-color-background)] vocs:rounded-lg vocs:mb-3 vocs:break-all vocs:text-[13px] vocs:leading-[1.7] vocs:text-left">
			<span className="vocs:text-[var(--vocs-color-accent)] vocs:font-medium">
				{name}:
			</span>{" "}
			<span className="vocs:text-[var(--vocs-color-text-2)]">
				{displayValue}
			</span>
		</div>
	);
}

function ResponseBody({ value }: { value: string }) {
	try {
		const parsed = JSON.parse(value);
		return <JsonBlock value={parsed} />;
	} catch {
		return (
			<div className="vocs:py-3 vocs:pr-4 vocs:bg-[var(--vocs-color-background)] vocs:rounded-lg vocs:text-[13px] vocs:text-[var(--vocs-color-text-2)] vocs:text-left">
				{value}
			</div>
		);
	}
}

function JsonBlock({ value }: { value: unknown }) {
	return (
		<pre className="vocs:py-3 vocs:pr-4 vocs:bg-[var(--vocs-color-background)] vocs:rounded-lg vocs:m-0 vocs:overflow-auto vocs:text-[13px] vocs:leading-[1.7] vocs:text-left">
			<JsonSyntaxHighlight value={value} />
		</pre>
	);
}

function JsonSyntaxHighlight({ value }: { value: unknown }) {
	const highlightJson = (obj: unknown, indent = 0): React.ReactNode[] => {
		const spaces = "  ".repeat(indent);
		const nodes: React.ReactNode[] = [];

		if (obj === null) {
			nodes.push(
				<span key="null" className="vocs:text-[var(--vocs-color-text-2)]">
					null
				</span>,
			);
		} else if (typeof obj === "boolean") {
			nodes.push(
				<span key="bool" className="vocs:text-[var(--vocs-color-text-2)]">
					{obj.toString()}
				</span>,
			);
		} else if (typeof obj === "number") {
			nodes.push(
				<span key="num" className="vocs:text-[var(--vocs-color-text-2)]">
					{obj}
				</span>,
			);
		} else if (typeof obj === "string") {
			nodes.push(
				<span key="str" className="vocs:text-[var(--vocs-color-text-2)]">
					"{obj}"
				</span>,
			);
		} else if (Array.isArray(obj)) {
			if (obj.length === 0) {
				nodes.push(<span key="empty-arr">[]</span>);
			} else {
				nodes.push(<span key="arr-open">[{"\n"}</span>);
				obj.forEach((item, i) => {
					nodes.push(
						// biome-ignore lint/suspicious/noArrayIndexKey: JSON array indices are stable
						<span key={`arr-${indent}-${i}`}>
							{spaces}
							{"  "}
							{highlightJson(item, indent + 1)}
							{i < obj.length - 1 ? "," : ""}
							{"\n"}
						</span>,
					);
				});
				nodes.push(<span key="arr-close">{spaces}]</span>);
			}
		} else if (typeof obj === "object") {
			const entries = Object.entries(obj);
			if (entries.length === 0) {
				nodes.push(<span key="empty-obj">{"{}"}</span>);
			} else {
				nodes.push(
					<span key="obj-open">
						{"{"}
						{"\n"}
					</span>,
				);
				entries.forEach(([key, val], i) => {
					nodes.push(
						<span key={`obj-${key}`}>
							{spaces}
							{"  "}
							<span className="vocs:text-[var(--vocs-color-accent)]">
								"{key}"
							</span>
							<span className="vocs:text-[var(--vocs-color-text-3)]">: </span>
							{highlightJson(val, indent + 1)}
							{i < entries.length - 1 ? "," : ""}
							{"\n"}
						</span>,
					);
				});
				nodes.push(
					<span key="obj-close">
						{spaces}
						{"}"}
					</span>,
				);
			}
		}

		return nodes;
	};

	return <>{highlightJson(value)}</>;
}

export function PaymentDemo() {
	return (
		<PaymentProviders>
			<PaymentDemoInner />
		</PaymentProviders>
	);
}
