# Engineering Decisions

## 2026-09-24 — Centralize panel availability

Decision: `app/panel-config.ts` owns profile, material, gauge/thickness, color, and preview mappings.

Reason: duplicated dropdown lists can permit invalid orders and cause the UI, PDF, and Excel output to disagree.

## 2026-09-24 — Preserve stable IDs

Decision: business logic and image mappings use stable panel and material IDs. Display names may evolve without becoming lookup keys.

Reason: IDs make configuration maintenance and future saved-order migration safer.

## 2026-09-24 — Store official preview images locally

Decision: approved Taylor Metal product images are application assets, not hotlinks. Missing mappings show an unavailable state.

Reason: this avoids external availability failures and prevents incorrect substitutes.

## 2026-09-24 — Normalize protected product terminology

Decision: all customer-facing output uses ArmorTech™ and Kynar 500® terminology, including legacy input normalized during document generation.

Reason: the UI and exported purchasing documents must use consistent product names.

## 2026-09-24 — Use proportional engineering controls

Decision: visual changes use lightweight checks; product rules, calculations, persistence, exports, auth, and deployment use checkpoints and deeper verification.

Reason: rigor should follow business risk without adding unnecessary process to low-risk polish.

## 2026-09-24 — Keep this standard portal-specific

Decision: adopt engineering-continuity concepts from LFES without copying MaintainOps-specific Supabase, tenant, work-order, or audit history.

Reason: the reference bundle is private and its application-specific controls are not evidence about this portal.
