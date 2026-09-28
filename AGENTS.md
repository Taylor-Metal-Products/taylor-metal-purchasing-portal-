# Baseline Development Standards

These standards apply to all work on this application unless the user explicitly overrides them for a specific request.

## Change isolation

- Modify only the feature, component, function, or area identified in the request.
- Treat requests as targeted modifications, not permission for global changes.
- Leave out-of-scope improvement opportunities unchanged; mention them separately when relevant.

## Preserve existing behavior and appearance

- Preserve existing functionality unless the user specifically requests a change. This includes controls, navigation, forms, calculations, persistence, PDF/export, workflows, styling/layout, stored-data behavior, and integrations.
- Do not redesign, reorganize, rename, remove, or otherwise improve unrelated areas.
- Do not change existing UI appearance or behavior—including size, position, color, text, hover behavior, and control behavior—unless required by the request.

## Minimize implementation changes

- Make the smallest safe code change that fulfills the request.
- Avoid unnecessary refactoring of working code.

## Regression protection

- Verify the requested feature and related behavior before considering work complete.
- Check that related existing functionality continues to behave as it did before the change.

When these standards conflict with an explicit instruction in a specific user request, follow the specific instruction only for the scope it identifies.
