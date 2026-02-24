#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""Create a comprehensive MPP Site Metrics dashboard in PostHog.

Builds 26+ insights across 7 sections:
  1. Traffic Overview — pageviews, unique visitors, new vs returning, daily trends
  2. Top Content & Sources — top pages, entry pages, docs sections, referrers, countries
  3. Audience — browsers, OS, mobile vs desktop
  4. AI & Bot Traffic — llms.txt hits, bot vs human breakdown
  5. Landing Page Engagement — CTA clicks, agent tabs, trends
  6. Demo Funnel — 4-step funnel, event trends, variant breakdown
  7. Outbound Clicks — total, destinations, trend

Usage:
    export POSTHOG_PERSONAL_API_KEY="phx_..."
    uv run mpp/scripts/create-dashboard.py
    uv run mpp/scripts/create-dashboard.py --dashboard-id 1305674
    uv run mpp/scripts/create-dashboard.py --reference 976776
"""

import argparse
import os
import sys
import time

import httpx

HOST = "https://us.posthog.com"
MPP_HOSTS = ["mpp.sh", "mpp.dev"]


def get_client(api_key: str) -> httpx.Client:
    return httpx.Client(
        base_url=HOST,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        timeout=30.0,
    )


def hf():
    """Host filter for mpp.sh / mpp.dev."""
    return [{"key": "$host", "value": MPP_HOSTS, "operator": "exact", "type": "event"}]


def trends(series, *, interval="day", date_from="-30d", breakdown=None, display=None, filter_test=True):
    """Build an InsightVizNode wrapping a TrendsQuery."""
    source = {
        "kind": "TrendsQuery",
        "series": series,
        "interval": interval,
        "dateRange": {"date_from": date_from},
        "filterTestAccounts": filter_test,
    }
    if breakdown:
        source["breakdownFilter"] = breakdown
    if display:
        source.setdefault("trendsFilter", {})["display"] = display
    return {"kind": "InsightVizNode", "source": source}


def ev(event, math="total", *, name=None, props=None):
    """Build an EventsNode. Only $pageview gets the host filter;
    custom mpp.* events are already namespaced and may lack $host."""
    node = {"kind": "EventsNode", "event": event, "math": math}
    if props is not None:
        node["properties"] = props
    if name:
        node["name"] = name
    return node


def pv(math="total", **kwargs):
    """Pageview EventsNode — applies mpp.tempo.xyz host filter."""
    return ev("$pageview", math=math, props=hf(), **kwargs)


def breakdown(field, *, type="event", limit=10, normalize_url=False):
    b = {"breakdown": field, "breakdown_type": type, "breakdown_limit": limit}
    if normalize_url:
        b["breakdown_normalize_url"] = True
    return b


# ── Insight definitions ─────────────────────────────────────────────────────

def all_insights():
    """Returns list of (section_name_or_None, insight_name, query)."""
    insights = []

    # ── Section 1: Traffic Overview ──────────────────────────────────────

    insights.append(("📊 Traffic Overview", "MPP — Total Pageviews", trends(
        [pv()], display="BoldNumber",
    )))
    insights.append((None, "MPP — Unique Visitors", trends(
        [pv(math="dau")], display="BoldNumber",
    )))
    insights.append((None, "MPP — Daily Pageviews", trends(
        [pv(name="Pageviews")],
    )))
    insights.append((None, "MPP — Daily Unique Visitors", trends(
        [pv(math="dau", name="Unique Visitors")],
    )))
    insights.append((None, "MPP — New vs Returning Visitors", trends(
        [pv(math="dau")],
        breakdown=breakdown("$initial_referring_domain"),
    )))
    insights.append((None, "MPP — Avg Session Duration", trends(
        [ev("$pageview", math="avg_count_per_actor", props=hf(), name="Avg Pages/Session")],
    )))
    insights.append((None, "MPP — Bounce Rate (Single-Page Sessions)", {
        "kind": "InsightVizNode",
        "source": {
            "kind": "TrendsQuery",
            "series": [{
                "kind": "EventsNode",
                "event": "$pageview",
                "math": "unique_session",
                "properties": [
                    *hf(),
                    {"key": "$session_duration", "value": 10, "operator": "lt", "type": "session"},
                ],
                "name": "Bounced Sessions",
            }, {
                "kind": "EventsNode",
                "event": "$pageview",
                "math": "unique_session",
                "properties": hf(),
                "name": "All Sessions",
            }],
            "interval": "day",
            "dateRange": {"date_from": "-30d"},
            "filterTestAccounts": True,
            "trendsFilter": {"formula": "A / B * 100", "display": "ActionsLineGraph"},
        },
    }))

    # ── Section 2: Top Content & Sources ─────────────────────────────────

    insights.append(("📄 Top Content & Sources", "MPP — Top Pages", trends(
        [pv()], breakdown=breakdown("$pathname", limit=20, normalize_url=True),
    )))
    insights.append((None, "MPP — Top Entry Pages", trends(
        [pv(math="dau")], breakdown=breakdown("$entry_pathname", limit=10),
    )))
    insights.append((None, "MPP — Docs Section Breakdown", trends(
        [
            ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "^/quickstart", "operator": "regex", "type": "event"}], name="Quickstart"),
            ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "^/guide", "operator": "regex", "type": "event"}], name="Guides"),
            ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "^/protocol", "operator": "regex", "type": "event"}], name="Protocol"),
            ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "^/sdk", "operator": "regex", "type": "event"}], name="SDK"),
        ],
    )))
    insights.append((None, "MPP — Referrer Sources", trends(
        [pv(math="dau")], breakdown=breakdown("$referring_domain"),
    )))
    insights.append((None, "MPP — Countries", trends(
        [pv(math="dau")], breakdown=breakdown("$geoip_country_code"),
    )))

    # ── Section 3: Audience ──────────────────────────────────────────────

    insights.append(("👥 Audience", "MPP — Browsers", trends(
        [pv(math="dau")], breakdown=breakdown("$browser", limit=8),
    )))
    insights.append((None, "MPP — Operating Systems", trends(
        [pv(math="dau")], breakdown=breakdown("$os", limit=8),
    )))
    insights.append((None, "MPP — Mobile vs Desktop", trends(
        [pv(math="dau")], breakdown=breakdown("$device_type", limit=5),
    )))

    # ── Section 4: AI & Bot Traffic ──────────────────────────────────────

    insights.append(("🤖 AI & Bot Traffic", "MPP — llms.txt Hits", trends([
        ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "/llms.txt", "operator": "exact", "type": "event"}], name="llms.txt"),
        ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "/llms-full.txt", "operator": "exact", "type": "event"}], name="llms-full.txt"),
    ])))
    insights.append((None, "MPP — llms.txt Total Hits", trends([
        ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "/llms.txt", "operator": "exact", "type": "event"}], name="llms.txt"),
        ev("$pageview", props=[*hf(), {"key": "$pathname", "value": "/llms-full.txt", "operator": "exact", "type": "event"}], name="llms-full.txt"),
    ], display="BoldNumber")))
    insights.append((None, "MPP — Bot vs Human Traffic", trends(
        [pv(math="dau")],
        breakdown=breakdown("$browser", limit=15),
    )))

    # ── Section 5: Landing Page Engagement ───────────────────────────────

    insights.append(("🖱️ Landing Page Engagement", "MPP — CTA Clicks", trends(
        [ev("mpp.landing.cta_clicked")], display="BoldNumber",
    )))
    insights.append((None, "MPP — CTA Clicks by Label", trends(
        [ev("mpp.landing.cta_clicked")],
        breakdown=breakdown("cta_label", limit=10),
        display="ActionsBarValue",
    )))
    insights.append((None, "MPP — Agent Tab Selections", trends(
        [ev("mpp.landing.agent_tab_selected")], display="BoldNumber",
    )))
    insights.append((None, "MPP — Agent Tab by Provider", trends(
        [ev("mpp.landing.agent_tab_selected")],
        breakdown=breakdown("tab_label", limit=5),
        display="ActionsBarValue",
    )))
    insights.append((None, "MPP — Agent Command Copies", trends(
        [ev("mpp.landing.agent_cmd_copied")],
        breakdown=breakdown("agent", limit=5),
        display="ActionsBarValue",
    )))
    insights.append((None, "MPP — Landing Engagement Trends", trends([
        ev("mpp.landing.cta_clicked", name="CTA Clicked"),
        ev("mpp.landing.agent_tab_selected", name="Agent Tab Selected"),
        ev("mpp.landing.agent_cmd_copied", name="Command Copied"),
    ])))

    # ── Section 4: Demo Funnel ───────────────────────────────────────────

    insights.append(("🔄 Demo Funnel", "MPP — Demo Funnel", {
        "kind": "InsightVizNode",
        "source": {
            "kind": "FunnelsQuery",
            "series": [
                ev("mpp.demo.query_selected"),
                ev("mpp.demo.query_completed"),
                ev("mpp.demo.wallet_connected"),
                ev("mpp.demo.faucet_claimed"),
            ],
            "dateRange": {"date_from": "-30d"},
            "filterTestAccounts": True,
            "funnelsFilter": {"funnelWindowInterval": 1, "funnelWindowIntervalUnit": "day"},
        },
    }))
    insights.append((None, "MPP — Demo Events Trend", trends([
        ev("mpp.demo.query_selected", name="Query Selected"),
        ev("mpp.demo.query_completed", name="Query Completed"),
        ev("mpp.demo.wallet_connected", name="Wallet Connected"),
        ev("mpp.demo.faucet_claimed", name="Faucet Claimed"),
    ])))
    insights.append((None, "MPP — Demo Query Popularity", trends(
        [ev("mpp.demo.query_selected")],
        breakdown=breakdown("query_id", limit=10),
        display="ActionsBarValue",
    )))
    insights.append((None, "MPP — Demo Variant Breakdown", trends(
        [ev("mpp.demo.variant_selected")],
        breakdown=breakdown("variant"),
        display="ActionsBarValue",
    )))

    # ── Section 5: Outbound Clicks ───────────────────────────────────────

    insights.append(("🔗 Outbound Clicks", "MPP — Total Outbound Clicks", trends(
        [ev("mpp.outbound_click")], display="BoldNumber",
    )))
    insights.append((None, "MPP — Outbound Click Destinations", trends(
        [ev("mpp.outbound_click")],
        breakdown=breakdown("url", limit=15),
    )))
    insights.append((None, "MPP — Outbound Clicks Trend", trends(
        [ev("mpp.outbound_click", name="Outbound Clicks")],
    )))

    return insights


# ── API helpers ──────────────────────────────────────────────────────────────

def create_dashboard(client: httpx.Client, project_id: str) -> dict:
    resp = client.post(f"/api/projects/{project_id}/dashboards/", json={
        "name": "MPP Site Metrics",
        "description": "Pageviews, engagement, demo funnel, and outbound clicks for mpp.sh / mpp.dev",
        "pinned": True,
        "tags": ["mpp"],
    })
    resp.raise_for_status()
    return resp.json()


def create_insight(client: httpx.Client, project_id: str, dashboard_id: int, name: str, query: dict) -> dict:
    resp = client.post(f"/api/projects/{project_id}/insights/", json={
        "name": name,
        "query": query,
        "dashboards": [dashboard_id],
    })
    resp.raise_for_status()
    return resp.json()


def add_text_tile(client: httpx.Client, project_id: str, dashboard_id: int, body: str):
    """Add a text tile (section header) to the dashboard."""
    # Get current tiles
    resp = client.get(f"/api/projects/{project_id}/dashboards/{dashboard_id}/")
    resp.raise_for_status()
    current_tiles = resp.json().get("tiles", [])
    new_tile = {"text": {"body": body}}
    current_tiles.append(new_tile)
    resp = client.patch(f"/api/projects/{project_id}/dashboards/{dashboard_id}/", json={"tiles": current_tiles})
    resp.raise_for_status()


def read_reference(client: httpx.Client, project_id: str, dashboard_id: int):
    resp = client.get(f"/api/projects/{project_id}/dashboards/{dashboard_id}/")
    resp.raise_for_status()
    data = resp.json()
    print(f"\n📋 Reference dashboard: {data.get('name', 'Unknown')}")
    print(f"   Description: {data.get('description', '—')}")
    tiles = data.get("tiles", [])
    print(f"   Tiles: {len(tiles)}")
    for tile in tiles:
        insight = tile.get("insight") or {}
        text = tile.get("text") or {}
        if isinstance(insight, dict) and insight:
            print(f"     • {insight.get('name', 'unnamed')}")
        elif isinstance(text, dict) and text:
            print(f"     § {text.get('body', '')[:60]}")
    print()


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Create MPP PostHog dashboard")
    parser.add_argument("--reference", type=int, help="Reference dashboard ID to read first")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be created")
    args = parser.parse_args()

    api_key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    project_id = os.environ.get("POSTHOG_PROJECT_ID", "279098")

    if args.dry_run:
        print("Dry run — would create dashboard: MPP Site Metrics\n")
        for section, name, _ in all_insights():
            if section:
                print(f"\n  {section}")
            print(f"    + {name}")
        return

    if not api_key:
        print("Error: Set POSTHOG_PERSONAL_API_KEY environment variable")
        print("  Get one at: https://us.posthog.com/settings/user-api-keys")
        sys.exit(1)

    client = get_client(api_key)

    if args.reference:
        read_reference(client, project_id, args.reference)

    # Delete any existing "MPP Site Metrics" dashboards
    resp = client.get(f"/api/projects/{project_id}/dashboards/", params={"limit": 100})
    resp.raise_for_status()
    for d in resp.json().get("results", []):
        if d.get("name") == "MPP Site Metrics" and not d.get("deleted"):
            client.patch(f"/api/projects/{project_id}/dashboards/{d['id']}/", json={"deleted": True})
            print(f"🗑️  Deleted old dashboard {d['id']}")

    # Create fresh dashboard
    dashboard = create_dashboard(client, project_id)
    dashboard_id = dashboard["id"]
    print(f"📊 Created dashboard: {HOST}/project/{project_id}/dashboard/{dashboard_id}")

    insights = all_insights()
    created = 0
    seen_sections = set()

    for section, name, query in insights:
        # Add section header text tile
        if section and section not in seen_sections:
            seen_sections.add(section)
            try:
                add_text_tile(client, project_id, dashboard_id, f"## {section}")
                print(f"  📝 {section}")
            except Exception as e:
                print(f"  ⚠️  Section header failed: {e}")

        # Create insight
        try:
            result = create_insight(client, project_id, dashboard_id, name, query)
            print(f"  ✅ {name} (id={result.get('id', '?')})")
            created += 1
        except Exception as e:
            print(f"  ❌ {name}: {e}")

        time.sleep(0.15)

    print(f"\n🎉 Done! Created {created}/{len(insights)} insights on dashboard {dashboard_id}")
    print(f"   → {HOST}/project/{project_id}/dashboard/{dashboard_id}")


if __name__ == "__main__":
    main()
