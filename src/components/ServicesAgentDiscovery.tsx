export function ServicesAgentDiscovery() {
  return (
    <div className="services-agent-discovery vocs:space-y-6" data-v-content="">
      <h2 data-v="">Agent discovery</h2>
      <p data-v="">
        Agents can use the MPP services catalog before choosing which paid API
        to call:
      </p>
      <table data-v="">
        <thead data-v="">
          <tr data-v="">
            <th data-v="">Surface</th>
            <th data-v="">URL</th>
            <th data-v="">Use it for</th>
          </tr>
        </thead>
        <tbody data-v="">
          <tr data-v="">
            <td data-v="">Web directory</td>
            <td data-v="">
              <a data-v="" href="https://mpp.dev/services">
                https://mpp.dev/services
              </a>
            </td>
            <td data-v="">
              Browse services, categories, providers, endpoints, and examples.
            </td>
          </tr>
          <tr data-v="">
            <td data-v="">Public catalog API</td>
            <td data-v="">
              <a data-v="" href="https://mpp.dev/api/services">
                https://mpp.dev/api/services
              </a>
            </td>
            <td data-v="">
              Fetch the JSON catalog directly from scripts, CLIs, or custom
              agents.
            </td>
          </tr>
          <tr data-v="">
            <td data-v="">Services MCP</td>
            <td data-v="">
              <a data-v="" href="https://mpp.dev/mcp/services">
                https://mpp.dev/mcp/services
              </a>
            </td>
            <td data-v="">
              Let an MCP-capable agent rank services, inspect payment offers,
              get usage recipes, and fetch advisory OpenAPI summaries.
            </td>
          </tr>
        </tbody>
      </table>
      <p data-v="">
        The services MCP server is read-only. It does not register services,
        execute payments, sign transactions, or proxy paid API calls. Runtime{" "}
        <code data-v="">402</code> Challenges from the target service remain the
        authoritative source of current payment terms.
      </p>
      <p data-v="">
        For MCP client setup, Inspector smoke tests, agent prompts, and
        recommended tool-call recipes, see{" "}
        <a
          data-v=""
          href="https://docs.tempo.xyz/guide/machine-payments/discover-services"
        >
          Discover MPP services on Tempo docs
        </a>
        .
      </p>
    </div>
  );
}
