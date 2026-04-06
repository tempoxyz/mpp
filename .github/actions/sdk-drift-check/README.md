# SDK Manifest Drift Check

A composite GitHub Action that validates vocs.config sidebar SDK references match actual TypeScript SDK exports.

## Usage

### In a workflow

```yaml
- name: Run SDK drift check
  uses: ./.github/actions/sdk-drift-check
  with:
    sdk-package: mppx
    sdk-version: latest
    output-dir: ./drift-results

- name: Upload results
  uses: actions/upload-artifact@v4
  with:
    name: drift-check-results
    path: drift-results/
```

### Locally

```bash
pnpm check:sdk-drift
pnpm check:sdk-drift --output results.json
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `sdk-package` | npm package name to check | `mppx` |
| `sdk-version` | SDK version to check | `latest` |
| `vocs-config` | Path to vocs config file | `./vocs.config.ts` |
| `sdk-path-prefix` | Sidebar path prefix for SDK references | `/sdk/typescript` |
| `output-dir` | Directory to write results | `./drift-results` |

## Outputs

| Output | Description |
|--------|-------------|
| `status` | Check status (`passed` or `failed`) |
| `total` | Total references checked |
| `valid` | Valid references |
| `invalid` | Invalid references |

## Output Files

The action writes two files to `output-dir`:

- `drift-report.json` - Structured JSON with full results
- `drift-report.txt` - Human-readable console output

## Generalizing to Other Repos

Copy the `.github/actions/sdk-drift-check` directory to your repo and configure:

```yaml
- uses: ./.github/actions/sdk-drift-check
  with:
    sdk-package: your-sdk-package
    sdk-path-prefix: /docs/api  # your sidebar prefix
```

Environment variables also work:

```bash
SDK_PACKAGE=viem SDK_PATH_PREFIX=/docs/api pnpm check:sdk-drift
```
