# Architecture and Business Rules

## Purpose

The portal collects purchasing and project details, builds one or more valid panel configurations, adds accessories and flashings, and produces consistent on-screen, printable, PDF, and Excel order summaries.

## Architecture

- `app/page.tsx` composes the order workflow, state, calculations, and printable summary.
- `app/panel-config.ts` is the product-configuration source of truth.
- `app/api/order-pdf/route.ts` creates PDF order summaries.
- `app/api/order-excel/route.ts` fills the approved Excel template.
- `public/panel-profiles/` stores official panel preview assets locally.
- `public/TMP Quote.xlsx` is the Excel output template.
- `tests/` contains automated configuration and rendered-output checks.
- `.openai/hosting.json` identifies the managed production Site. Secrets must never be stored there or elsewhere in source control.

Persistent order records are stored in the existing Cloudflare D1 layer through `/api/orders`. A stable record ID controls updates, while the customer account participates in server-generated order numbering. Loading, editing, saving, and resubmitting update the same record and increment its revision. The private Site access policy is currently the security boundary; per-user record ownership is not yet implemented.

## Critical business rules

1. The valid selection path is Panel Profile → Material/Finish → Gauge or Thickness → Color.
2. A profile exposes only combinations declared for that profile in `panel-config.ts`.
3. Changing a parent selection must reset any child selection that is no longer valid.
4. Armortech™ uses 26 ga in the current configuration.
5. Kynar 500® steel may use 24 ga or 22 ga only where the selected profile declares it.
6. Kynar 500® Painted Aluminum uses `.032″ Aluminum` only where declared.
7. A missing preview image must produce “Panel image not available”; another panel image must not be substituted.
8. Terminology must be normalized in UI and generated output: `Armortech™`, `Kynar 500®`, and `Kynar 500® Painted Aluminum`.
9. Panel quantity is the sum of length-row quantities.
10. Linear feet is the sum of `(feet + inches / 12) × quantity` for each length row.
11. Coverage area is rounded from `(coverage inches / 12) × total linear feet`.
12. UI, print view, PDF, and Excel must describe the same order without silently changing material, gauge, color, quantity, or options.

## Verification boundaries

- A successful build proves compilation and artifact shape, not business-rule correctness.
- Configuration tests prove declared combinations are internally valid, not that Taylor Metal manufactures every declared combination. Manufacturing availability requires product-owner confirmation.
- Desktop verification does not prove phone or tablet usability.
- UI totals do not prove PDF or Excel agreement; generated outputs require their own checks.
- A successful current-order test does not prove compatibility with an older serialized order shape.

## Change-risk levels

- Low: color, spacing, typography, shadows, copy that does not change meaning.
- Medium: layout, preview presentation, form control behavior, new nonfinancial fields.
- High: product availability, pricing, calculations, serialized order shape, document generation, authentication, data storage, and deployment configuration.

High-risk work requires a checkpoint, affected-path tests, manual output inspection, and a recorded rollback path.
