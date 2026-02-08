"use client";

import { alphaUsd } from "../wagmi.config";
import * as Cli from "./Cli";

export function CliPlayground() {
	return (
		<div className="flex flex-col gap-4">
			<Cli.Window>
				<Cli.TitleBar title="Accept Payments" />

				<Cli.Panel height={300}>
					<Cli.Block>
						<Cli.Line variant="info">Session started at 10:32:15 AM</Cli.Line>
						<Cli.Line>Loading configuration...</Cli.Line>
						<Cli.Line variant="success" prefix="✓">
							Config loaded
						</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Line variant="input" prefix="❯">
							connect wallet
						</Cli.Line>
						<Cli.Line>Connecting to Tempo network...</Cli.Line>
						<Cli.Line variant="success" prefix="✓">
							Connected: 0xf9D7E756...38E44209
						</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Line variant="input" prefix="❯">
							get balance
						</Cli.Line>
						<Cli.Line>Fetching balance...</Cli.Line>
						<Cli.Line variant="success" prefix="✓">
							Balance: $1,000,000.0000 aUSD
						</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Line variant="input" prefix="❯">
							search coffee shops
						</Cli.Line>
						<Cli.Line variant="warning" prefix="→">
							Paying $0.002 for places.search
						</Cli.Line>
						<Cli.Line>Searching nearby coffee shops...</Cli.Line>
						<Cli.Line variant="success" prefix="✓">
							Found 3 results
						</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Line variant="input" prefix="❯">
							get reviews "Blue Bottle Coffee"
						</Cli.Line>
						<Cli.Line variant="loading">
							Paying $0.003 for reviews.aggregate
						</Cli.Line>
						<Cli.Line variant="error" prefix="✗">
							Payment failed: insufficient funds
						</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Line variant="input" prefix="❯">
							retry
						</Cli.Line>
						<Cli.Line variant="loading">Retrying payment...</Cli.Line>
						<Cli.Line variant="success" prefix="✓">
							Payment successful
						</Cli.Line>
						<Cli.Line>Blue Bottle Coffee - 4.8★ (2,340 reviews)</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Line variant="loading">Fetching directions...</Cli.Line>
					</Cli.Block>

					<Cli.Block>
						<Cli.Link href="https://tempo.xyz">
							View transaction on Explorer ↗
						</Cli.Link>
					</Cli.Block>

					{/* <Cli.Block>
					<Cli.Line variant="info">Select a query to run:</Cli.Line>
					<Cli.Select
						autoFocus
						onSubmit={(v) => console.log("Submit:", v)}
					>
						<Cli.Select.Option value="coffee">
							Find the best coffee shop nearby
						</Cli.Select.Option>
						<Cli.Select.Option value="restaurant">
							Find a highly-rated Italian restaurant
						</Cli.Select.Option>
						<Cli.Select.Option value="parking">
							Find available parking near Union Square
						</Cli.Select.Option>
						<Cli.Select.Option value="weather">
							What's the weather like today?
						</Cli.Select.Option>
					</Cli.Select>
				</Cli.Block> */}

					<Cli.Block>
						<Cli.Line variant="info">Welcome to the demo:</Cli.Line>
						<Cli.Toggle autoFocus onSubmit={(v) => console.log("Submit:", v)}>
							<Cli.Toggle.Option value="signin">Sign In</Cli.Toggle.Option>
							<Cli.Toggle.Option value="signup">Sign Up</Cli.Toggle.Option>
						</Cli.Toggle>
					</Cli.Block>
				</Cli.Panel>

				<Cli.FooterBar
					left={<Cli.Hint />}
					right={
						<>
							<Cli.Balance />
							<Cli.Spent />
							<Cli.Status variant="ready">Ready</Cli.Status>
						</>
					}
				/>
			</Cli.Window>

			<Cli.Demo title="Make a request with payment" token={alphaUsd}>
				<Cli.Startup />
				<Cli.ConnectWallet />
				<Cli.Faucet />
				<Cli.Ping />
			</Cli.Demo>
		</div>
	);
}
