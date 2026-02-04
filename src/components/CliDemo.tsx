"use client";

import { Receipt } from "mpay";
import { Fetch, tempo } from "mpay/client";
import { useCallback, useEffect, useRef, useState } from "react";

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
		prompt: "Find the best coffee shop nearby and give me directions",
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
				params: { to: "Blue Bottle Coffee" },
			},
		],
		response: [
			'"Blue Bottle Coffee is the top-rated coffee shop nearby',
			" (4.8★, 0.3mi). It's a 6 minute walk — head north on",
			' Market St, then right on 4th St."',
		],
	},
	{
		id: "restaurant",
		label: "Restaurant",
		prompt: "Find a highly-rated Italian restaurant for dinner tonight",
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
		prompt: "Find available parking near Union Square with current rates",
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
		prompt: "What's the weather like and should I bring an umbrella today?",
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

		addLines([{ type: "blank", content: "" }]);
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

				// Initial terminal output
				addLines([
					{ type: "header", content: "MPP Agent Demo v0.1.0" },
					{ type: "blank", content: "" },
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
						tempo({
							account: acc,
							rpcUrl: {
								42431: "https://rpc.moderato.tempo.xyz",
							},
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

					// Make the paid request
					const res = await mpayFetch(url.toString());

					if (!res.ok) {
						throw new Error(`API returned ${res.status}`);
					}

					const data = (await res.json()) as {
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
					const receiptHeader = res.headers.get("Payment-Receipt");
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

					// Small delay between calls for visual effect
					await new Promise((r) => setTimeout(r, 400));
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

			addLines([{ type: "blank", content: "" }]);

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
			return <div key={index} className="vocs:h-4" />;
		}

		const typeStyles: Record<string, string> = {
			header: "vocs:text-[var(--vocs-color-text)] vocs:font-medium",
			input: "vocs:text-[#61afef]",
			output: "vocs:text-[var(--vocs-color-text-2)]",
			info: "vocs:text-[var(--vocs-color-text-3)]",
			success: "vocs:text-[#98c379]",
			error: "vocs:text-[var(--vocs-color-destructive)]",
			payment: "vocs:text-[#e5c07b]",
			link: "vocs:text-[var(--vocs-color-accent)]",
			menu: "vocs:text-[var(--vocs-color-text-2)]",
		};

		if (line.type === "link" && line.href) {
			return (
				<a
					key={index}
					href={line.href}
					target="_blank"
					rel="noopener noreferrer"
					className={`${typeStyles.link} vocs:no-underline hover:vocs:underline vocs:block vocs:leading-relaxed vocs:whitespace-pre-wrap vocs:break-words`}
				>
					{line.content}
				</a>
			);
		}

		// Menu item with highlighting
		if (line.type === "menu" && line.menuIndex !== undefined) {
			const isHighlighted =
				status === "selecting" && line.menuIndex === highlightedIndex;
			// Extract just the prompt text (after "[N] ")
			const promptText = line.content.replace(/^\s*\[\d+\]\s*/, "");
			const menuNum = (line.menuIndex ?? 0) + 1;
			return (
				<button
					type="button"
					key={index}
					onClick={() => {
						setHighlightedIndex(line.menuIndex!);
						runQuery(line.menuIndex!);
					}}
					className={`vocs:flex vocs:w-full vocs:text-left vocs:leading-relaxed vocs:transition-colors ${
						isHighlighted
							? "vocs:bg-[var(--vocs-color-accent)]/20 vocs:text-[var(--vocs-color-accent)]"
							: "vocs:text-[var(--vocs-color-text-2)] hover:vocs:bg-[rgba(255,255,255,0.05)]"
					}`}
					disabled={status !== "selecting"}
				>
					<span className="vocs:shrink-0 vocs:w-[6ch]">
						{isHighlighted ? "▸" : " "}[{menuNum}]{" "}
					</span>
					<span className="vocs:break-words">{promptText}</span>
				</button>
			);
		}

		return (
			<div
				key={index}
				className={`${typeStyles[line.type] || ""} vocs:leading-relaxed vocs:whitespace-pre-wrap vocs:break-words`}
			>
				{line.content}
			</div>
		);
	};

	return (
		<div
			className="vocs:bg-[#1e1e1e] vocs:rounded-xl vocs:overflow-hidden vocs:font-mono vocs:text-sm"
			style={{ border: "1px solid rgba(255,255,255,0.08)" }}
		>
			{/* Terminal header */}
			<div
				className="vocs:flex vocs:items-center vocs:justify-between vocs:px-4 vocs:py-2.5"
				style={{
					borderBottom: "1px solid rgba(255,255,255,0.08)",
					background: "rgba(255,255,255,0.02)",
				}}
			>
				<div className="vocs:flex vocs:items-center vocs:gap-1.5">
					<span className="vocs:w-3 vocs:h-3 vocs:rounded-full vocs:bg-[#ff5f56]" />
					<span className="vocs:w-3 vocs:h-3 vocs:rounded-full vocs:bg-[#ffbd2e]" />
					<span className="vocs:w-3 vocs:h-3 vocs:rounded-full vocs:bg-[#27c93f]" />
				</div>
				<div className="vocs:flex vocs:items-center vocs:gap-3 vocs:text-xs">
					{balance !== null && (
						<span className="vocs:text-[var(--vocs-color-text-2)]">
							Balance:{" "}
							<span className="vocs:text-[#98c379]">
								${formatBalance(balance)}
							</span>
						</span>
					)}
					{totalSpent > 0 && (
						<span className="vocs:text-[var(--vocs-color-text-3)]">
							Spent:{" "}
							<span className="vocs:text-[#e5c07b]">
								${totalSpent.toFixed(3)}
							</span>
						</span>
					)}
					<span
						className={`vocs:px-2 vocs:py-0.5 vocs:rounded vocs:text-[10px] vocs:uppercase vocs:tracking-wider ${
							status === "running"
								? "vocs:bg-[#e5c07b]/20 vocs:text-[#e5c07b]"
								: status === "complete"
									? "vocs:bg-[#98c379]/20 vocs:text-[#98c379]"
									: status === "error"
										? "vocs:bg-[var(--vocs-color-destructive)]/20 vocs:text-[var(--vocs-color-destructive)]"
										: "vocs:bg-[var(--vocs-color-text-3)]/20 vocs:text-[var(--vocs-color-text-3)]"
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
				className="vocs:p-4 vocs:h-[400px] vocs:overflow-y-auto vocs:cursor-text"
				style={{ background: "#1e1e1e" }}
			>
				{lines.map(renderLine)}
				{status === "running" && currentCall >= 0 && (
					<div className="vocs:text-[var(--vocs-color-text-3)] vocs:animate-pulse">
						▊
					</div>
				)}
			</div>

			{/* Mobile query buttons */}
			{status === "selecting" && (
				<div
					className="vocs:grid vocs:grid-cols-2 vocs:gap-2 vocs:p-3"
					style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
				>
					{QUERY_PRESETS.map((query, index) => (
						<button
							key={query.id}
							type="button"
							onClick={() => runQuery(index)}
							className="vocs:flex vocs:items-center vocs:gap-2 vocs:px-3 vocs:py-2.5 vocs:rounded-lg vocs:text-left vocs:transition-colors"
							style={{
								backgroundColor:
									highlightedIndex === index
										? "rgba(1, 102, 255, 0.15)"
										: "rgba(255,255,255,0.05)",
								border:
									highlightedIndex === index
										? "1px solid rgba(1, 102, 255, 0.3)"
										: "1px solid rgba(255,255,255,0.1)",
							}}
						>
							<span
								className="vocs:flex vocs:items-center vocs:justify-center vocs:w-6 vocs:h-6 vocs:rounded vocs:text-xs vocs:font-medium"
								style={{
									backgroundColor: "rgba(1, 102, 255, 0.2)",
									color: "#0166FF",
								}}
							>
								{index + 1}
							</span>
							<span className="vocs:text-xs vocs:text-[var(--vocs-color-text-2)] vocs:truncate">
								{query.label}
							</span>
						</button>
					))}
				</div>
			)}

			{/* Interactive prompt - hidden on mobile, users can use buttons */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: click to focus input */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: click to focus input */}
			<div
				onClick={() => inputRef.current?.focus()}
				className={`vocs:hidden lg:vocs:flex vocs:items-center vocs:px-4 vocs:py-2.5 vocs:gap-2 vocs:cursor-text ${
					status === "selecting" ? "vocs:bg-[rgba(152,195,121,0.05)]" : ""
				}`}
				style={{
					borderTop: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				<span
					className={
						status === "selecting"
							? "vocs:text-[#98c379]"
							: "vocs:text-[var(--vocs-color-text-4)]"
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
							? "Type 1-4 or press Enter..."
							: status === "funding"
								? "Initializing..."
								: status === "running"
									? "Running query..."
									: ""
					}
					className="vocs:flex-1 vocs:bg-transparent vocs:border-none vocs:outline-none vocs:text-[var(--vocs-color-text)] vocs:text-sm vocs:font-mono placeholder:vocs:text-[var(--vocs-color-text-4)] disabled:vocs:cursor-not-allowed"
					style={{ caretColor: "#98c379" }}
				/>
				{account && (
					<a
						href={`${EXPLORER_URL}/address/${account.address}`}
						target="_blank"
						rel="noopener noreferrer"
						className="vocs:text-[11px] vocs:text-[var(--vocs-color-text-3)] hover:vocs:text-[var(--vocs-color-accent)] vocs:no-underline"
					>
						Tempo Moderato ↗
					</a>
				)}
			</div>
		</div>
	);
}
