# Risk Register

| ID | Severity | Risk | Evidence / Trigger | Mitigation | Verification |
|---|---|---|---|---|---|
| POR-001 | High | A panel may expose an unconfirmed material, gauge, thickness, or color combination. | Product configuration changes. | Require profile-specific declarations and product-owner confirmation. | Configuration tests plus affected-profile manual QA. |
| POR-002 | High | Screen, PDF, and Excel output may disagree. | Changes to order payloads or export routes. | Keep shared terminology helpers and output contract checks. | Representative cross-output comparison before release. |
| POR-003 | High | A configuration change may invalidate an older order. | IDs removed or stored combinations narrowed. | Preserve stable IDs and add an explicit migration/incompatibility path before durable saved orders are introduced. | Load fixtures from each supported serialized version. |
| POR-004 | High | Pricing may become stale or be mistaken for a final quote. | Accessory price updates or new pricing logic. | Assign an owner and effective date to future price imports; label provisional pricing clearly. | Compare against the approved source and test totals. |
| POR-005 | Medium | A panel preview may be missing or mapped to the wrong profile. | Image additions or filename changes. | ID-based mappings, local assets, and no substitution. | Asset-existence tests and visual review. |
| POR-006 | Medium | Mobile controls may become difficult to use. | Dense form or navigation changes. | Maintain touch targets, spacing, readable labels, and responsive layouts. | Phone- and tablet-width manual QA. |
| POR-007 | Medium | Browser/session order state can be lost. | Refresh, browser storage clearing, or device change. | Do not claim durable saving; define server-side persistence and migration before relying on stored orders operationally. | Recovery and reload tests when persistence is implemented. |
| POR-008 | Medium | A deployment may publish incomplete source or an invalid artifact. | Release packaging changes. | Clean Git checkpoint, build validation, exact-source deployment, and rollback reference. | CI/local tests and hosting deployment status. |
| POR-009 | Low | Engineering decisions may exist only in chat. | Rule or architecture changes without documentation. | Update this register and decision log for material changes. | Release checklist review. |
| POR-010 | Low | The application intentionally uses unoptimized `<img>` elements for protected product drawings and the supplied brand artwork. | ESLint reports four `no-img-element` warnings and zero errors. | Preserve source assets without transformation; reconsider only if an approved lossless image pipeline is introduced. | `npm run lint` exits successfully with zero errors. |
| POR-011 | High | Persistent order records are currently available to anyone allowed to open the private Site. | D1 order API has no per-user ownership model. | Keep the Site owner-private until an explicit Taylor Metal user/role policy is approved and enforced server-side. | Test allowed and denied users before expanding Site access. |

Severity meanings: High can create an incorrect order or break a critical workflow; Medium can impair reliability or maintainability; Low is limited but worth tracking.
