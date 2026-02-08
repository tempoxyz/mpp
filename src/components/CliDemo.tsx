"use client";

import { Receipt } from "mpay";
import { Fetch, tempo } from "mpay/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AsciiLogo } from "./AsciiLogo";

// Terminal line types
interface TerminalLine {
	type:
		| "input"
		| "output"
		| "info"
		| "success"
		| "error"
		| "payment"
		| "header"
		| "blank"
		| "link"
		| "menu";
	content: string;
	href?: string;
	menuIndex?: number;
}

// Demo status
type DemoStatus =
	| "idle"
	| "funding"
	| "selecting"
	| "running"
	| "complete"
	| "error";

// API call definition for the compound query
interface ApiCall {
	name: string;
	endpoint: string;
	price: string;
	priceNum: number;
	description: string;
	params?: Record<string, string>;
}

// Query preset definition
interface QueryPreset {
	id: string;
	label: string;
	prompt: string;
	calls: ApiCall[];
	response: string[];
}

// Available query presets
const QUERY_PRESETS: QueryPreset[] = [
	{
		id: "coffee",
		label: "Coffee Shop",
		prompt: "Find the best coffee shop nearby",
		calls: [
			{
				name: "location.lookup",
				endpoint: "/api/agent/location",
				price: "$0.001",
				priceNum: 0.001,
				description: "Get current location",
			},
			{
				name: "places.search",
				endpoint: "/api/agent/search",
				price: "$0.002",
				priceNum: 0.002,
				description: "Search nearby coffee shops",
				params: { q: "coffee" },
			},
			{
				name: "reviews.aggregate",
				endpoint: "/api/agent/reviews",
				price: "$0.003",
				priceNum: 0.003,
				description: "Aggregate reviews for top result",
				params: { place: "place_001" },
			},
			{
				name: "directions.get",
				endpoint: "/api/agent/directions",
				price: "$0.002",
				priceNum: 0.002,
				description: "Get walking directions",
				params: { to: "The Coffee Movement" },
			},
		],
		response: [
			'"The Coffee Movement is the top-rated coffee shop',
			" nearby (4.6★, 0.4mi). Known for specialty pour-overs",
			" and single-origin beans. It's an 8 minute walk — head",
			' north on Market St to Nob Hill, 1030 Washington St."',
		],
	},
	{
		id: "restaurant",
		label: "Restaurant",
		prompt: "Find a highly-rated Italian restaurant",
		calls: [
			{
				name: "location.lookup",
				endpoint: "/api/agent/location",
				price: "$0.001",
				priceNum: 0.001,
				description: "Get current location",
			},
			{
				name: "places.search",
				endpoint: "/api/agent/search",
				price: "$0.002",
				priceNum: 0.002,
				description: "Search Italian restaurants",
				params: { q: "italian restaurant" },
			},
			{
				name: "reviews.aggregate",
				endpoint: "/api/agent/reviews",
				price: "$0.003",
				priceNum: 0.003,
				description: "Check ratings and availability",
				params: { place: "place_002" },
			},
			{
				name: "directions.get",
				endpoint: "/api/agent/directions",
				price: "$0.002",
				priceNum: 0.002,
				description: "Get directions to restaurant",
				params: { to: "Flour + Water" },
			},
		],
		response: [
			'"Flour + Water is an excellent choice — 4.7★ with',
			" 2,400+ reviews. Known for house-made pasta. It's",
			' 0.8mi away, about 15 min walk or 5 min drive."',
		],
	},
	{
		id: "parking",
		label: "Parking",
		prompt: "Find available parking near Union Square",
		calls: [
			{
				name: "location.lookup",
				endpoint: "/api/agent/location",
				price: "$0.001",
				priceNum: 0.001,
				description: "Get current location",
			},
			{
				name: "places.search",
				endpoint: "/api/agent/search",
				price: "$0.002",
				priceNum: 0.002,
				description: "Search parking garages",
				params: { q: "parking garage Union Square" },
			},
			{
				name: "reviews.aggregate",
				endpoint: "/api/agent/reviews",
				price: "$0.003",
				priceNum: 0.003,
				description: "Check availability and rates",
				params: { place: "place_003" },
			},
			{
				name: "directions.get",
				endpoint: "/api/agent/directions",
				price: "$0.002",
				priceNum: 0.002,
				description: "Get driving directions",
				params: { to: "Union Square Garage" },
			},
		],
		response: [
			'"Union Square Garage has spots available — $8/hr or',
			" $32 max daily. 450 Post St entrance. Turn right on",
			' Geary, 2 blocks, garage on left. ~3 min drive."',
		],
	},
	{
		id: "weather",
		label: "Weather",
		prompt: "What's the weather today?",
		calls: [
			{
				name: "location.lookup",
				endpoint: "/api/agent/location",
				price: "$0.001",
				priceNum: 0.001,
				description: "Get current location",
			},
			{
				name: "places.search",
				endpoint: "/api/agent/search",
				price: "$0.002",
				priceNum: 0.002,
				description: "Get weather data",
				params: { q: "weather forecast" },
			},
			{
				name: "reviews.aggregate",
				endpoint: "/api/agent/reviews",
				price: "$0.003",
				priceNum: 0.003,
				description: "Aggregate hourly forecast",
				params: { place: "weather_001" },
			},
			{
				name: "directions.get",
				endpoint: "/api/agent/directions",
				price: "$0.002",
				priceNum: 0.002,
				description: "Check precipitation timing",
				params: { to: "forecast" },
			},
		],
		response: [
			'"Currently 62°F and partly cloudy in San Francisco.',
			" 20% chance of light rain after 4pm. I'd suggest",
			' bringing a light jacket — umbrella optional."',
		],
	},
];

// Explorer base URL for Moderato testnet
const EXPLORER_URL = "https://explore.moderato.tempo.xyz";

// Format balance for display
const formatBalance = (value: number): string => {
	const truncated = Math.floor(value * 10000) / 10000;
	return truncated.toLocaleString("en-US", {
		minimumFractionDigits: 4,
		maximumFractionDigits: 4,
	});
};

// Truncate tx hash for display
const truncateTx = (hash: string): string => {
	return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
};

export function CliDemo() {
	const [lines, setLines] = useState<TerminalLine[]>([]);
	const [status, setStatus] = useState<DemoStatus>("idle");
	const [balance, setBalance] = useState<number | null>(null);
	const [account, setAccount] = useState<{
		address: string;
		privateKey: string;
	} | null>(null);
	const [totalSpent, setTotalSpent] = useState(0);
	const [currentCall, setCurrentCall] = useState<number>(-1);
	const [inputValue, setInputValue] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(0);

	const terminalRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fetchRef = useRef<typeof globalThis.fetch | null>(null);
	const initRef = useRef(false);

	// Add a line to the terminal
	const addLine = useCallback((line: TerminalLine) => {
		setLines((prev) => [...prev, line]);
	}, []);

	// Add multiple lines
	const addLines = useCallback((newLines: TerminalLine[]) => {
		setLines((prev) => [...prev, ...newLines]);
	}, []);

	// Scroll terminal to bottom when lines change
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on lines.length change
	useEffect(() => {
		if (terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
		}
	}, [lines.length]);

	// Focus input when clicking terminal
	const handleTerminalClick = useCallback(() => {
		if (inputRef.current && status === "selecting") {
			inputRef.current.focus();
		}
	}, [status]);

	// Show menu after initialization
	const showMenu = useCallback(() => {
		addLines([
			{ type: "blank", content: "" },
			{ type: "header", content: "Select a query to run:" },
			{ type: "blank", content: "" },
		]);

		QUERY_PRESETS.forEach((query, index) => {
			addLine({
				type: "menu",
				content: `  [${index + 1}] ${query.prompt}`,
				menuIndex: index,
			});
		});
	}, [addLine, addLines]);

	// Initialize wallet and fund it
	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;

		const WALLET_STORAGE_KEY = "mpp-demo-wallet";

		const init = async () => {
			try {
				// Dynamic imports to avoid SSR issues
				const { privateKeyToAccount, generatePrivateKey } = await import(
					"viem/accounts"
				);
				const { createClient, http } = await import("viem");
				const { tempoModerato } = await import("viem/chains");

				// Initial terminal output
				addLines([
					{ type: "info", content: "Initializing payment-enabled agent..." },
				]);

				// Check for cached wallet in sessionStorage
				let acc!: ReturnType<typeof privateKeyToAccount>;
				let privateKey!: `0x${string}`;
				let needsFunding = true;

				const cached = sessionStorage.getItem(WALLET_STORAGE_KEY);
				if (cached) {
					try {
						const { privateKey: cachedKey } = JSON.parse(cached);
						privateKey = cachedKey as `0x${string}`;
						acc = privateKeyToAccount(privateKey);

						// Check if wallet still has balance
						const balRes = await fetch("/api/wallet", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ action: "balance", address: acc.address }),
						});

						if (balRes.ok) {
							const { balance: bal } = (await balRes.json()) as {
								balance: string;
							};
							if (bal && bal !== "0") {
								const balNum = Number(bal) / 1e6;
								setBalance(balNum);
								needsFunding = false;

								addLines([
									{
										type: "info",
										content: `Wallet: ${acc.address.slice(0, 10)}...${acc.address.slice(-8)}`,
									},
									{
										type: "success",
										content: `✓ Restored: $${formatBalance(balNum)} aUSD`,
									},
								]);
							}
						}
					} catch {
						// Invalid cache, will create new wallet
					}
				}

				// Create new wallet if no valid cache
				if (needsFunding) {
					privateKey = generatePrivateKey();
					acc = privateKeyToAccount(privateKey);

					// Save to sessionStorage
					sessionStorage.setItem(
						WALLET_STORAGE_KEY,
						JSON.stringify({ privateKey }),
					);

					addLines([
						{
							type: "info",
							content: `Wallet: ${acc.address.slice(0, 10)}...${acc.address.slice(-8)}`,
						},
						{ type: "info", content: "Requesting testnet funds..." },
					]);
					setStatus("funding");

					// Fund the wallet via our faucet endpoint
					const fundRes = await fetch("/api/wallet", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ action: "fund", address: acc.address }),
					});

					if (!fundRes.ok) {
						const err = (await fundRes.json()) as { error?: string };
						throw new Error(err.error || "Faucet request failed");
					}

					// Poll for balance
					let retries = 0;
					const maxRetries = 20;
					let funded = false;

					while (retries < maxRetries && !funded) {
						await new Promise((r) => setTimeout(r, 1500));

						const balRes = await fetch("/api/wallet", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ action: "balance", address: acc.address }),
						});

						if (balRes.ok) {
							const { balance: bal } = (await balRes.json()) as {
								balance: string;
							};
							if (bal && bal !== "0") {
								const balNum = Number(bal) / 1e6;
								setBalance(balNum);
								funded = true;
								addLine({
									type: "success",
									content: `✓ Funded: $${formatBalance(balNum)} aUSD`,
								});
							}
						}
						retries++;
					}

					if (!funded) {
						throw new Error("Funding timeout - please refresh");
					}
				}

				setAccount({ address: acc.address, privateKey });

				// Set up mpay fetch with the account
				const customFetch = Fetch.from({
					methods: [
						tempo.charge({
							account: acc,
							client: () =>
								createClient({
									chain: tempoModerato,
									transport: http("/api/rpc"),
								}),
						}),
					],
				});
				fetchRef.current = customFetch;

				addLine({ type: "success", content: "✓ Agent ready" });
				setStatus("selecting");
				showMenu();

				// Focus input after a short delay
				setTimeout(() => inputRef.current?.focus(), 100);
			} catch (err) {
				console.error("Init error:", err);
				addLine({
					type: "error",
					content: `✗ Error: ${err instanceof Error ? err.message : "Initialization failed"}`,
				});
				setStatus("error");
			}
		};

		init();
	}, [addLine, addLines, showMenu]);

	// Run a query by index
	const runQuery = useCallback(
		async (queryIndex: number) => {
			if (status !== "selecting" || !fetchRef.current || !account) return;

			const query = QUERY_PRESETS[queryIndex];
			if (!query) return;

			setStatus("running");
			const mpayFetch = fetchRef.current;

			// Show the selected query
			addLines([
				{ type: "blank", content: "" },
				{
					type: "input",
					content: `> agent.query("${query.prompt}")`,
				},
				{ type: "blank", content: "" },
				{ type: "info", content: "Decomposing query into paid API calls..." },
				{ type: "blank", content: "" },
			]);

			// Show the query plan
			const totalCost = query.calls.reduce(
				(sum, call) => sum + call.priceNum,
				0,
			);
			addLine({
				type: "info",
				content: `Planning: ${query.calls.length} API calls, ~$${totalCost.toFixed(3)} total`,
			});
			addLine({ type: "blank", content: "" });

			// Execute each call
			let spent = 0;
			const hashes: string[] = [];

			for (let i = 0; i < query.calls.length; i++) {
				const call = query.calls[i];
				setCurrentCall(i);

				addLine({
					type: "payment",
					content: `[${i + 1}/${query.calls.length}] ${call.name} — ${call.price}`,
				});

				try {
					// Build URL with params
					const url = new URL(call.endpoint, window.location.origin);
					if (call.params) {
						for (const [key, value] of Object.entries(call.params)) {
							url.searchParams.set(key, value);
						}
					}

					// Make the paid request, retrying if the payment credential
					// is rejected (nonce conflict from a prior in-flight tx)
					let res: Response | undefined;
					for (let attempt = 0; attempt < 3; attempt++) {
						res = await mpayFetch(url.toString());
						if (res.ok || res.status !== 402) break;
						await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
					}

					if (!res!.ok) {
						throw new Error(`API returned ${res!.status}`);
					}
					const resOk = res!;

					const data = (await resOk.json()) as {
						location?: { city: string; region: string };
						results?: { name: string }[];
						summary?: string;
						sentiment?: string;
						steps?: unknown;
						duration?: string;
						distance?: string;
					};
					spent += call.priceNum;

					// Show receipt info if available
					const receiptHeader = resOk.headers.get("Payment-Receipt");
					let txDisplay = "";
					if (receiptHeader) {
						const receipt = Receipt.deserialize(receiptHeader);
						const txHash = receipt.reference;
						hashes.push(txHash);
						txDisplay = ` • tx: ${truncateTx(txHash)}`;

						// Show result with tx link
						let resultText = "";
						if (data.location) {
							resultText = `${data.location.city}, ${data.location.region}`;
						} else if (data.results) {
							resultText = `${data.results.length} results → "${data.results[0].name}"`;
						} else if (data.summary) {
							resultText = `${data.sentiment}`;
						} else if (data.steps) {
							resultText = `${data.duration} (${data.distance})`;
						}

						addLine({
							type: "link",
							content: `    ✓ ${resultText}${txDisplay}`,
							href: `${EXPLORER_URL}/tx/${txHash}`,
						});
					} else {
						addLine({ type: "success", content: `    ✓ Complete` });
					}

					// Update balance display
					setTotalSpent(spent);
					if (balance !== null) {
						setBalance(balance - spent);
					}

					// Delay between calls to allow on-chain nonce settlement
					await new Promise((r) => setTimeout(r, 1500));
				} catch (err) {
					addLine({
						type: "error",
						content: `    ✗ Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					});
					setStatus("error");
					return;
				}
			}

			// Final summary and response
			setCurrentCall(-1);
			addLines([
				{
					type: "success",
					content: `✓ Complete — ${query.calls.length} calls, $${spent.toFixed(3)} spent, ${hashes.length} transactions`,
				},
				{ type: "blank", content: "" },
				{ type: "header", content: "Agent:" },
			]);

			// Add response lines
			for (const line of query.response) {
				addLine({ type: "output", content: `  ${line}` });
			}

			// Delay before showing menu again so user can read the response
			await new Promise((r) => setTimeout(r, 5000));

			// Show menu again for another query
			addLines([
				{ type: "blank", content: "" },
				{ type: "header", content: "Run another query:" },
			]);

			QUERY_PRESETS.forEach((q, index) => {
				addLine({
					type: "menu",
					content: `  [${index + 1}] ${q.prompt}`,
					menuIndex: index,
				});
			});

			setHighlightedIndex(0);
			setStatus("selecting");
			setTimeout(() => inputRef.current?.focus(), 100);
		},
		[status, account, balance, addLine, addLines],
	);

	// Handle keyboard input
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (status !== "selecting") return;

			if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : QUERY_PRESETS.length - 1,
				);
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < QUERY_PRESETS.length - 1 ? prev + 1 : 0,
				);
			} else if (e.key === "Enter") {
				e.preventDefault();
				const num = Number.parseInt(inputValue, 10);
				if (num >= 1 && num <= QUERY_PRESETS.length) {
					runQuery(num - 1);
				} else {
					runQuery(highlightedIndex);
				}
				setInputValue("");
			}
		},
		[status, inputValue, highlightedIndex, runQuery],
	);

	// Handle input change
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			setInputValue(val);

			// Update highlighted index if user types a number
			const num = Number.parseInt(val, 10);
			if (num >= 1 && num <= QUERY_PRESETS.length) {
				setHighlightedIndex(num - 1);
			}
		},
		[],
	);

	// Focus input when status becomes "selecting"
	useEffect(() => {
		if (status === "selecting") {
			// Small delay to ensure DOM is ready
			const timer = setTimeout(() => inputRef.current?.focus(), 50);
			return () => clearTimeout(timer);
		}
	}, [status]);

	// Refresh balance periodically
	useEffect(() => {
		if (!account || status === "idle" || status === "funding") return;

		const refreshBalance = async () => {
			try {
				const res = await fetch("/api/wallet", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "balance", address: account.address }),
				});
				if (res.ok) {
					const { balance: bal } = (await res.json()) as { balance: string };
					if (bal) {
						setBalance(Number(bal) / 1e6);
					}
				}
			} catch {
				// Ignore balance refresh errors
			}
		};

		const interval = setInterval(refreshBalance, 5000);
		return () => clearInterval(interval);
	}, [account, status]);

	// Render terminal line with appropriate styling
	const renderLine = (line: TerminalLine, index: number) => {
		if (line.type === "blank") {
			return <div key={index} className="h-4" />;
		}

		const typeStyles: Record<string, string> = {
			header: "text-gray-900 font-medium",
			input: "text-[#0166FF]",
			output: "text-gray-600",
			info: "text-gray-400",
			success: "text-green-600",
			error: "text-red-600",
			payment: "text-amber-600",
			link: "text-[#0166FF]",
			menu: "text-gray-600",
		};

		if (line.type === "link" && line.href) {
			return (
				<a
					key={index}
					href={line.href}
					target="_blank"
					rel="noopener noreferrer"
					className={`${typeStyles.link} no-underline hover:underline block leading-relaxed`}
				>
					{line.content}
				</a>
			);
		}

		// Menu item with highlighting
		if (line.type === "menu" && line.menuIndex !== undefined) {
			const isHighlighted =
				status === "selecting" && line.menuIndex === highlightedIndex;
			return (
				<button
					type="button"
					key={index}
					onClick={() => {
						setHighlightedIndex(line.menuIndex!);
						runQuery(line.menuIndex!);
					}}
					className={`block w-full text-left leading-relaxed whitespace-pre-wrap transition-colors ${
						isHighlighted
							? "bg-blue-50 text-[#0166FF]"
							: "text-gray-600 hover:bg-gray-50"
					}`}
					disabled={status !== "selecting"}
				>
					{isHighlighted ? "▸" : " "}
					{line.content.slice(1)}
				</button>
			);
		}

		return (
			<div
				key={index}
				className={`${typeStyles[line.type] || ""} leading-relaxed whitespace-pre-wrap`}
			>
				{line.content}
			</div>
		);
	};

	return (
		<div
			className="bg-white rounded-xl overflow-hidden font-mono text-sm flex flex-col flex-1"
			style={{ border: "1px solid #e5e7eb" }}
		>
			{/* Terminal header */}
			<div
				className="flex items-center justify-between px-4 py-2.5"
				style={{
					borderBottom: "1px solid #e5e7eb",
					background: "#fafafa",
				}}
			>
				<div className="flex items-center gap-2">
					<div className="flex gap-1.5">
						<span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
						<span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
						<span className="w-3 h-3 rounded-full bg-[#27c93f]" />
					</div>
					<span className="text-gray-400 text-xs ml-2">agent-demo</span>
				</div>
				<div className="flex items-center gap-3 text-xs">
					{balance !== null && (
						<span className="text-gray-500">
							Balance:{" "}
							<span className="text-green-600">${formatBalance(balance)}</span>
						</span>
					)}
					{totalSpent > 0 && (
						<span className="text-gray-400">
							Spent:{" "}
							<span className="text-amber-600">${totalSpent.toFixed(3)}</span>
						</span>
					)}
					<span
						className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
							status === "running"
								? "bg-amber-50 text-amber-600"
								: status === "complete"
									? "bg-green-50 text-green-600"
									: status === "error"
										? "bg-red-50 text-red-600"
										: "bg-gray-100 text-gray-400"
						}`}
					>
						{status === "funding"
							? "funding..."
							: status === "selecting"
								? "ready"
								: status}
					</span>
				</div>
			</div>

			{/* Terminal content - fixed height with scroll */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: terminal click-to-focus */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: terminal click-to-focus */}
			<div
				ref={terminalRef}
				onClick={handleTerminalClick}
				className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto cursor-text"
				style={{ background: "#ffffff" }}
			>
				<div className="mb-3 hidden lg:block">
					<AsciiLogo morph={false} color="#9ca3af" />
				</div>
				{lines.map(renderLine)}
				{status === "running" && currentCall >= 0 && (
					<div className="text-gray-300 animate-pulse">▊</div>
				)}
			</div>

			{/* Interactive prompt */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: click to focus input */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: click to focus input */}
			<div
				onClick={() => inputRef.current?.focus()}
				className={`flex items-center px-4 py-2.5 gap-2 cursor-text flex-1 ${
					status === "selecting" ? "bg-green-50/50" : ""
				}`}
				style={{
					borderTop: "1px solid #e5e7eb",
				}}
			>
				<span
					className={
						status === "selecting" ? "text-green-600" : "text-gray-300"
					}
				>
					❯
				</span>
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					disabled={status !== "selecting"}
					placeholder={
						status === "selecting"
							? "Type 1-4 or use ↑↓ arrows, then press Enter"
							: status === "funding"
								? "Initializing..."
								: status === "running"
									? "Running query..."
									: ""
					}
					className="flex-1 bg-transparent border-none outline-none text-gray-900 text-sm font-mono placeholder:text-gray-300 disabled:cursor-not-allowed"
					style={{ caretColor: "#16a34a" }}
				/>
				{account && (
					<a
						href={`${EXPLORER_URL}/address/${account.address}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[11px] text-gray-400 hover:text-[#0166FF] no-underline"
					>
						Tempo Moderato ↗
					</a>
				)}
			</div>
		</div>
	);
}
