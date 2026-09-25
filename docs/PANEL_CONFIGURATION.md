# Panel Configuration Ownership

## Authoritative file

`app/panel-config.ts` is the only source of truth for panel compatibility.

Each `PanelProfile` entry declares the stable panel ID, customer-facing name, coverage, available material systems, permitted gauges or thickness, coil width, optional per-gauge color overrides, notes, and manufacturing group.

`panelImageCatalog` maps a stable panel ID to its local asset and original Taylor Metal source URL. Image lookup must use the ID, not fuzzy display-name matching.

## Safe update procedure

1. Obtain confirmed availability from an authorized Taylor Metal product owner or current controlled catalog.
2. Identify the exact panel ID and coverage entry.
3. Change only that profile’s material list; never broaden every panel to simplify the UI.
4. Add `colorsByGauge` when a gauge has a narrower palette.
5. Add or update the official local preview asset without editing the source image.
6. Run `npm test`.
7. Manually exercise the affected profile, including changing away from it and back.
8. Inspect the print view, PDF, and Excel output for one representative order.
9. Record the rule source and decision in `docs/DECISIONS.md` if it changes established availability.

## Configuration invariants

- Every profile has an ID, name, coverage, and at least one material.
- Every material has at least one gauge or thickness.
- Material IDs are limited to `armortech`, `kynar500`, and `kynar500-aluminum`.
- ArmorTech™ entries expose only `26 ga`.
- Painted aluminum entries expose only `.032″ Aluminum`.
- Every returned color list is nonempty.
- Every configured image path is local and names an existing asset.
- Missing images stay missing visibly; they are never replaced with an unrelated profile.

## Saved-order compatibility

Panel IDs and material IDs are stable data contracts. Renaming customer-facing labels is safe only when IDs remain stable. If a future persisted order contains a no-longer-valid combination, the application should retain the original values for review, identify the incompatibility, and require the user to reselect a valid combination rather than silently changing the order.
