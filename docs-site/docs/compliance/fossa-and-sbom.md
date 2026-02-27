---
sidebar_position: 1
title: FOSSA & SBOM
---

# FOSSA and SBOM Compliance

DeployMate supports a company-owned compliance model:

1. **BYO FOSSA policy** using your own `.fossa.yml` and your org's rules.
2. **Vendor-neutral artifacts** generated in CI for every build:
   - SBOM (CycloneDX JSON)
   - License inventory JSON

For maintainability and AI-code quality controls, see [Code Quality and Slop Detection](./code-quality-and-slop-detection.md).

## FOSSA: Bring Your Own Policy

To use FOSSA with your company policy:

1. Add your `.fossa.yml` file to the repo root.
2. Add `FOSSA_API_KEY` as a GitHub Actions secret.
3. (Optional) set workflow variables:
   - `FOSSA_ANALYZE_FLAGS`
   - `FOSSA_TEST_FLAGS`

The workflow will run your policy as configured in your FOSSA org. DeployMate does not hardcode your policy.

## SBOM and License Artifacts

The compliance workflow also generates:

- `sbom.cdx.json` (CycloneDX)
- `licenses.json`

These artifacts can be consumed by internal security/compliance tools even if FOSSA is not used.

## Optional License Policy Gate

You can define `DISALLOWED_LICENSES` (comma-separated) as a repository variable to fail CI when any dependency matches a blocked license expression.

Example:

```text
GPL-3.0,AGPL-3.0
```

## Notes

- FOSSA job only runs when both `.fossa.yml` exists and `FOSSA_API_KEY` is configured.
- This keeps the open-source project flexible while allowing enterprise policy enforcement.
