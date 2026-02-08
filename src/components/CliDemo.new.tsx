"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useConnectorClient } from "wagmi";
import { fetch } from "../mpay.client";
import { alphaUsd } from "../wagmi.config";
import * as Cli from "./Cli";

type ApiCall = {
	description: string;
	endpoint: string;
	name: string;
	params?: Record<string, string>;
	price: string;
};

type QueryPreset = {
	calls: ApiCall[];
	id: string;
	label: string;
	prompt: string;
	response: string;
};

const presets: QueryPreset[] = [
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Search nearby coffee shops",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "coffee" },
				price: "$0.002",
			},
			{
				description: "Aggregate reviews for top result",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "place_001" },
				price: "$0.003",
			},
			{
				description: "Get walking directions",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "The Coffee Movement" },
				price: "$0.002",
			},
		],
		id: "coffee",
		label: "Coffee Shop",
		prompt: "Find the best coffee shop nearby",
		response:
			'"The Coffee Movement is the top-rated coffee shop nearby (4.6★, 0.4mi). Known for specialty pour-overs and single-origin beans. It\'s an 8 minute walk — head north on Market St to Nob Hill, 1030 Washington St."',
	},
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Search Italian restaurants",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "italian restaurant" },
				price: "$0.002",
			},
			{
				description: "Check ratings and availability",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "place_002" },
				price: "$0.003",
			},
			{
				description: "Get directions to restaurant",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "Flour + Water" },
				price: "$0.002",
			},
		],
		id: "restaurant",
		label: "Restaurant",
		prompt: "Find a highly-rated Italian restaurant",
		response:
			'"Flour + Water is an excellent choice — 4.7★ with 2,400+ reviews. Known for house-made pasta. It\'s 0.8mi away, about 15 min walk or 5 min drive."',
	},
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Search parking garages",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "parking garage Union Square" },
				price: "$0.002",
			},
			{
				description: "Check availability and rates",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "place_003" },
				price: "$0.003",
			},
			{
				description: "Get driving directions",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "Union Square Garage" },
				price: "$0.002",
			},
		],
		id: "parking",
		label: "Parking",
		prompt: "Find available parking near Union Square",
		response:
			'"Union Square Garage has spots available — $8/hr or $32 max daily. 450 Post St entrance. Turn right on Geary, 2 blocks, garage on left. ~3 min drive."',
	},
	{
		calls: [
			{
				description: "Get current location",
				endpoint: "/api/agent/location",
				name: "location.lookup",
				price: "$0.001",
			},
			{
				description: "Get weather data",
				endpoint: "/api/agent/search",
				name: "places.search",
				params: { q: "weather forecast" },
				price: "$0.002",
			},
			{
				description: "Aggregate hourly forecast",
				endpoint: "/api/agent/reviews",
				name: "reviews.aggregate",
				params: { place: "weather_001" },
				price: "$0.003",
			},
			{
				description: "Check precipitation timing",
				endpoint: "/api/agent/directions",
				name: "directions.get",
				params: { to: "forecast" },
				price: "$0.002",
			},
		],
		id: "weather",
		label: "Weather",
		prompt: "What's the weather today?",
		response:
			'"Currently 62°F and partly cloudy in San Francisco. 20% chance of light rain after 4pm. I\'d suggest bringing a light jacket — umbrella optional."',
	},
];

function SelectQuery() {
	const { data: client } = useConnectorClient();

	const [results, setResults] = useState<
		{
			calls: ApiCall[];
			query: QueryPreset;
			status: "pending" | "done" | "error";
		}[]
	>([]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (queryId: string) => {
			const query = presets.find((q) => q.id === queryId);
			if (!query) throw new Error("Unknown query");

			const index = results.length;
			setResults((r) => [...r, { calls: [], query, status: "pending" }]);

			for (const call of query.calls) {
				const url = new URL(call.endpoint, window.location.origin);
				if (call.params) {
					for (const [key, value] of Object.entries(call.params)) {
						url.searchParams.set(key, value);
					}
				}

				setResults((r) =>
					r.map((item, i) =>
						i === index ? { ...item, calls: [...item.calls, call] } : item,
					),
				);

				await fetch(url.toString(), {
					context: { account: client?.account },
				});

				await new Promise((r) => setTimeout(r, 800));
			}

			setResults((r) =>
				r.map((item, i) => (i === index ? { ...item, status: "done" } : item)),
			);
		},
		onError: (_err, _vars, _ctx) => {
			setResults((r) => {
				const last = r.length - 1;
				return r.map((item, i) =>
					i === last ? { ...item, status: "error" } : item,
				);
			});
		},
	});

	return (
		<>
			{results.map((result, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: stable list
				<QueryResult key={i} {...result} />
			))}
			{!isPending && (
				<Cli.Block>
					<Cli.Line variant="info">Select a query to run:</Cli.Line>
					<Cli.Select autoFocus onSubmit={(v) => mutate(v)}>
						{presets.map((query) => (
							<Cli.Select.Option key={query.id} value={query.id}>
								{query.prompt}
							</Cli.Select.Option>
						))}
					</Cli.Select>
				</Cli.Block>
			)}
		</>
	);
}

function QueryResult({
	calls,
	query,
	status,
}: {
	calls: ApiCall[];
	query: QueryPreset;
	status: "pending" | "done" | "error";
}) {
	return (
		<Cli.Block>
			<Cli.Line variant="input" prefix="❯">
				agent.query("{query.prompt}")
			</Cli.Line>
			<Cli.Line variant="info">
				Planning: {query.calls.length} API calls, ~$
				{query.calls
					.reduce((sum, c) => sum + Number.parseFloat(c.price.slice(1)), 0)
					.toFixed(3)}{" "}
				total
			</Cli.Line>
			<Cli.Blank />
			{calls.map((call, i) => (
				<div key={call.name}>
					<Cli.Line variant="warning" prefix="→">
						[{i + 1}/{query.calls.length}] {call.name} — {call.price}
					</Cli.Line>
					{i === calls.length - 1 && status === "pending" ? (
						<Cli.Line variant="loading">{call.description}...</Cli.Line>
					) : (
						<Cli.Line variant="success" prefix="✓">
							{call.description}
						</Cli.Line>
					)}
				</div>
			))}
			{status === "done" && (
				<>
					<Cli.Blank />
					<Cli.Line variant="success" prefix="✓">
						Complete — {query.calls.length} calls
					</Cli.Line>
					<Cli.Blank />
					<Cli.Line>{query.response}</Cli.Line>
				</>
			)}
			{status === "error" && (
				<>
					<Cli.Blank />
					<Cli.Line variant="error" prefix="✗">
						Query failed
					</Cli.Line>
				</>
			)}
		</Cli.Block>
	);
}

export function CliDemo() {
	return (
		<Cli.Demo title="agent-demo" token={alphaUsd} height={400}>
			<Cli.Startup />
			<Cli.ConnectWallet />
			<Cli.Faucet />
			<SelectQuery />
		</Cli.Demo>
	);
}
