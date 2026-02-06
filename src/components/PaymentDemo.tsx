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
			const res1 = await fetch("/api/ping/paid", { signal: controller.signal });

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

			const res2 = await fetch("/api/ping/paid", {
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
	}, [isConnected, address, balance, balanceValue, faucet]);

	return (
		<div className="mt-6 mx-auto max-w-[90%] border border-[var(--vocs-color-border)] rounded overflow-hidden not-prose divide-y divide-[var(--vocs-color-border)]">
			{/* Header */}
			<div className="flex h-11 items-center justify-between px-4">
				<h4 className="-tracking-[1%] font-normal text-[14px] text-[var(--vocs-color-text)] leading-none">
					Make a request with payment
				</h4>
				<span className="flex h-[19px] items-center justify-center rounded-[30px] bg-[var(--vocs-color-accent-tint)] px-1.5 text-center font-medium text-[9px] text-[var(--vocs-color-accent)] uppercase leading-none tracking-[2%]">
					demo
				</span>
			</div>

			{/* Steps */}
			<div className="p-4 space-y-4">
				{error && (
					<div className="px-3 py-2 rounded bg-[var(--vocs-color-destructive-tint)] text-[var(--vocs-color-destructive)] text-[14px]">
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
							<div className="flex flex-col gap-1">
								<div className="flex items-center">
									Connected as{" "}
									<a
										href={`https://explore.tempo.xyz/address/${address}`}
										target="_blank"
										rel="noopener noreferrer"
										className="-tracking-[1%] flex items-center gap-1 ml-1 text-[13px] text-[var(--vocs-color-accent)] hover:underline"
									>
										{address?.slice(0, 6)}⋅⋅⋅{address?.slice(-4)}
										<ExternalLinkIcon />
									</a>
								</div>
								<div>
									{hasFunds ? (
										<>
											Balance:{" "}
											<code className="text-xs bg-[var(--vocs-color-background-2)] px-1.5 py-0.5 rounded">
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
							<div className="flex gap-1">
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
							<code className="text-xs bg-[var(--vocs-color-background-2)] px-1.5 py-0.5 rounded">
								/api/ping/paid
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
				<div className="bg-[var(--vocs-color-background-2)] divide-y divide-[var(--vocs-color-border)]">
					<div className="px-4 py-3 text-[13px] font-medium text-[var(--vocs-color-text-2)]">
						Response Details
					</div>

					{protocolData.challengeHeader && (
						<div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
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
						<div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
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
						<div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto space-y-4">
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
			<div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] shrink-0 bg-[#d3f9d8] dark:bg-[#1a4d2e] tabular-nums">
				<CheckIcon />
			</div>
		);
	}
	return (
		<div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] shrink-0 border border-dashed border-[var(--vocs-color-border)] text-[var(--vocs-color-text-4)] tabular-nums">
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
			className="text-[#2f9e44] dark:text-[#69db7c]"
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
			className="size-3"
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
		<div data-active={active} data-completed={completed} className="group">
			<header className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:justify-start">
				<div className="flex items-center gap-3.5">
					<StepNumber number={number} complete={completed} />
					<div className="-tracking-[1%] text-[14px] text-[var(--vocs-color-text)] group-data-[active=false]:opacity-40">
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
		"relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-normal transition-colors h-8 px-3.5 text-[14px] -tracking-[2%] min-w-[110px]";

	const variantClasses = {
		primary:
			"bg-[var(--vocs-color-accent)] text-white border border-[var(--vocs-color-accent)]",
		secondary:
			"border border-dashed border-[var(--vocs-color-border)] text-[var(--vocs-color-text)]",
		dashed:
			"border border-dashed border-[var(--vocs-color-border)] text-[var(--vocs-color-text-4)]",
	}[variant];

	const disabledClasses = disabled ? "pointer-events-none opacity-50" : "";

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
		"402": "text-[var(--vocs-color-destructive)]",
		"200": "text-[#16a34a] dark:text-[#4ade80]",
	};

	return (
		<div>
			<div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--vocs-color-text-3)] mb-2 font-sans">
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
		<div className="py-3 pr-4 bg-[var(--vocs-color-background)] rounded-lg mb-3 break-all text-[13px] leading-[1.7] text-left">
			<span className="text-[var(--vocs-color-accent)] font-medium">
				{name}:
			</span>{" "}
			<span className="text-[var(--vocs-color-text-2)]">{displayValue}</span>
		</div>
	);
}

function ResponseBody({ value }: { value: string }) {
	try {
		const parsed = JSON.parse(value);
		return <JsonBlock value={parsed} />;
	} catch {
		return (
			<div className="py-3 pr-4 bg-[var(--vocs-color-background)] rounded-lg text-[13px] text-[var(--vocs-color-text-2)] text-left">
				{value}
			</div>
		);
	}
}

function JsonBlock({ value }: { value: unknown }) {
	return (
		<pre className="py-3 pr-4 bg-[var(--vocs-color-background)] rounded-lg m-0 overflow-auto text-[13px] leading-[1.7] text-left">
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
				<span key="null" className="text-[var(--vocs-color-text-2)]">
					null
				</span>,
			);
		} else if (typeof obj === "boolean") {
			nodes.push(
				<span key="bool" className="text-[var(--vocs-color-text-2)]">
					{obj.toString()}
				</span>,
			);
		} else if (typeof obj === "number") {
			nodes.push(
				<span key="num" className="text-[var(--vocs-color-text-2)]">
					{obj}
				</span>,
			);
		} else if (typeof obj === "string") {
			nodes.push(
				<span key="str" className="text-[var(--vocs-color-text-2)]">
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
							<span className="text-[var(--vocs-color-accent)]">"{key}"</span>
							<span className="text-[var(--vocs-color-text-3)]">: </span>
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
