# Panel Gauge Audit

Audit date: 2026-09-25

The customer-facing selector is generated exclusively from each `PanelProfile.materials[].gauges` declaration in `app/panel-config.ts`. `specialOrderGauges` records inquiry-only options and is deliberately excluded from the normal selector.

| Portal panel | Standard selectable gauge or thickness by finish | Special order / inquiry only | Taylor Metal source |
|---|---|---|---|
| StreamLine™ 12/16 | ArmorTech™: 26 ga | — | [StreamLine™](https://taylormetal.com/products/standing-seam-panels/streamline/) and [StreamLine™ 12IN](https://taylormetal.com/products/standing-seam-panels/streamline-12in/) |
| Slim-Lock™ | Kynar 500®: 24, 22 ga; aluminum: .032″ | Copper | [Slim-Lock™](https://taylormetal.com/products/standing-seam-panels/slim-lock-produced-in-or/) |
| Easy-Lock™ 12/16 | Kynar 500®: 26, 24, 22 ga; aluminum: .032″ | Copper | [Easy-Lock™](https://taylormetal.com/products/standing-seam-panels/easy-lock/) |
| Versa-Span™ 12/14/16/18 | Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga; .040″, .050″, .063″ aluminum | [Versa-Span™](https://taylormetal.com/products/standing-seam-panels/versa-span-produced-in-salem/) |
| MS-100™ 13/17/21 | Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga; .040″, .050″, .063″ aluminum | [MS-100™](https://taylormetal.com/products/mechanically-seamed-panels/ms-100/) |
| MS-150™ 12/16/20 | Kynar 500®: 26, 24, 22 ga; aluminum: .032″ | Copper and zinc require inquiry | [MS-150™](https://taylormetal.com/products/mechanically-seamed-panels/ms-150/) |
| MS-200™ 12/14/16/18 | Kynar 500®: 26, 24, 22 ga; aluminum: .032″ | .040″ aluminum is listed in features but is not a normal material-spec selection | [MS-200™](https://taylormetal.com/products/mechanically-seamed-panels/ms-200/) |
| Board and Batten Siding Panel 12/16 | ArmorTech™: 26 ga; Kynar 500®: 26, 24, 22 ga; aluminum: .032″ | Zinc on special request | [Board and Batten](https://taylormetal.com/products/concealed-fastener-panels/board-batten/) |
| SmoothWall™ / Lifetime Soffit™ / ShadowLine™ | Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga; .040″, .050″, .063″ aluminum | [SmoothWall™](https://taylormetal.com/products/concealed-fastener-panels/smoothwall/), [Lifetime Soffit™](https://taylormetal.com/products/concealed-fastener-panels/lifetime-soffit/), [ShadowLine™](https://taylormetal.com/products/concealed-fastener-panels/shadowline/) |
| Contour Classic Series™ 12/16 | Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga; .040″, .050″, .063″ aluminum | [Contour C-5](https://taylormetal.com/products/contour/c-5/) and [Contour C8-B](https://taylormetal.com/products/contour/c8-b/) |
| Tuff Rib | ArmorTech™: 29, 26 ga | .032″ aluminum is inquiry-only and is not selectable | [Tuff Rib](https://taylormetal.com/products/exposed-fastener-panels/tuff-rib/) |
| T-3™ | ArmorTech™: 29, 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | .040″ aluminum | [T-3™](https://taylormetal.com/products/exposed-fastener-panels/t-3/) |
| GR-7™ | ArmorTech™: 29, 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga | [GR-7™](https://taylormetal.com/products/exposed-fastener-panels/gr-7/) |
| PBR | ArmorTech™: 29, 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | .040″ aluminum | [PBR](https://taylormetal.com/products/exposed-fastener-panels/pbr/) |
| Marion “R” Panel™ | ArmorTech™: 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | .040″ aluminum | [Marion “R” Panel™](https://taylormetal.com/products/exposed-fastener-panels/marion-r-panel/) |
| HR-34™ | ArmorTech™: 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga; .040″, .050″, .063″ aluminum | [HR-34™ OR](https://taylormetal.com/products/exposed-fastener-panels/hr-34-produced-in-or/) and [HR-34™ CA](https://taylormetal.com/products/exposed-fastener-panels/hr-34-produced-in-ca/) |
| Max Corr™ 34-5/8 | ArmorTech™: 29 ga only | — | [Max Corr™](https://taylormetal.com/products/exposed-fastener-panels/max-corr/) |
| Max Corr™ 37-1/4 | ArmorTech™: 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | .040″ aluminum | [Max Corr™](https://taylormetal.com/products/exposed-fastener-panels/max-corr/) |
| Classic 7/8″ Corrugated™ (Salem portal profile) | ArmorTech™: 26 ga; Kynar 500®: 24, 22 ga; aluminum: .032″ | 20, 18 ga; .040″, .050″, .063″ aluminum | [Salem](https://taylormetal.com/products/exposed-fastener-panels/classic-7-8-corrugated-produced-in-salem/), [Riverside](https://taylormetal.com/products/exposed-fastener-panels/classic-7-8-corrugated-produced-in-riverside/), [Spokane](https://taylormetal.com/products/exposed-fastener-panels/classic-7-8-corrugated-produced-in-spokane/) |
| 2-1/2″ Corrugated | Unpainted ZINCALUME® Plus / Galvanized: 29, 26 ga | — | [2-1/2″ Corrugated](https://taylormetal.com/products/exposed-fastener-panels/2-1-2-corrugated/) |
| Flat Sheet | Kynar 500®: 24, 22 ga; aluminum: .032″ | — | [Flat Sheet data sheet](https://taylormetal.com/wp-content/uploads/2021/11/Flat-Sheet.pdf) |

## Audit decisions

- Internal panel IDs remain unchanged for saved-order compatibility.
- Exposed-fastener painted steel follows the corrected rule: 29 and 26 ga use ArmorTech™; 24 and 22 ga use Kynar 500®. A gauge is selectable only when the profile's Features & Benefits and Material Specifications establish a standard offering.
- The portal's Classic 7/8″ Corrugated™ entry uses its existing Salem source page rather than combining regional variants. Riverside and Spokane publish different standard gauges, so those variants remain flagged for a future location-aware product split.
- .040″, .050″, and .063″ aluminum never appear in the normal selector when the product page says “please inquire.”
- 20 and 18 ga steel never appear in the normal selector when listed as custom, special request, heavier gauge, or inquiry-only.
- 2-1/2″ Corrugated uses an unpainted-steel finish because its current material specifications list bare ZINCALUME® Plus and Galvanized rather than ArmorTech™.

## Exposed-fastener items requiring review

- **User-confirmed correction:** T-3™, GR-7™, and PBR include standard 29 ga ArmorTech™. This operational confirmation takes precedence where the public Material Specifications omit 29 ga.
- **HR-34™ regional difference:** the existing portal profile and source are the Oregon product, which lists 26 ga ArmorTech™ as standard. The California page starts at 24 ga. A location-aware split is needed if the same selector must serve both plants.
- **Classic 7/8″ Corrugated™ regional difference:** Salem, Riverside, and Spokane publish different standard gauges. The existing portal profile remains tied to Salem; the other branches are not merged into it.
- **2-1/2″ Corrugated:** this is a documented product-specific exception to the painted-finish mapping. Its page lists only bare 29/26 ga ZINCALUME® Plus and Galvanized, so those existing unpainted choices remain.

