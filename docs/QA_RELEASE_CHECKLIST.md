# QA and Release Checklist

Record pass, failure, not applicable, or not verified. Never convert “not verified” into a pass.

## Every change

- [ ] Scope and risk level are stated.
- [ ] Unrelated functionality remains unchanged.
- [ ] `npm test` passes.
- [ ] `npm run lint` passes, or existing unrelated findings are recorded.
- [ ] Browser console has no new errors in the changed path.
- [ ] Loading, error, empty, and disabled states remain understandable.
- [ ] Documentation is updated when a business rule, risk, assumption, or interface changes.

## Panel configuration changes

- [ ] Exact panel ID and coverage were changed intentionally.
- [ ] Manufacturing availability source was confirmed by the product owner.
- [ ] Only declared material systems appear.
- [ ] Only declared gauges or thicknesses appear.
- [ ] Colors update when profile, material, or gauge changes.
- [ ] An invalid prior child selection is cleared automatically.
- [ ] Panel preview uses the correct official local asset.
- [ ] Missing images show “Panel image not available.”

## Calculation and output changes

- [ ] Multiple length rows calculate panel quantity correctly.
- [ ] Feet and inches calculate linear feet correctly.
- [ ] Coverage area matches the documented formula.
- [ ] UI and print summary agree.
- [ ] PDF opens and matches the representative order.
- [ ] Excel opens without repair warnings and matches the representative order.
- [ ] ArmorTech™ and Kynar 500® terminology is correct everywhere.
- [ ] No field is silently dropped from generated output.

## Compatibility and persistence

- [ ] Current order state survives all supported navigation within the workflow.
- [ ] Older supported fixtures load correctly, if persisted orders exist.
- [ ] Invalid legacy combinations are identified rather than silently replaced.
- [ ] No claim of durable saving is made unless server-side persistence exists and is tested.

## Responsive QA

- [ ] Desktop layout verified.
- [ ] Tablet-width layout verified.
- [ ] Phone-width layout verified.
- [ ] Touch targets are comfortably selectable.
- [ ] Dropdowns, modals, previews, and summaries do not overflow.

## Release

- [ ] Working tree and intended diff were reviewed.
- [ ] High-risk work has a pre-change checkpoint and named rollback target.
- [ ] Production build completed successfully.
- [ ] The exact tested commit is the exact deployed commit.
- [ ] Production deployment reports success.
- [ ] Live smoke test covers the changed path.
- [ ] Known limitations and unverified boundaries are recorded.
