# wabtec-ricochet-ui
The Mobile UI for RICOCHET

From 2.0.0 this is one image, `ricochet-ui:<version>`, for every railroad and environment, with no configuration. It is served at `/ricochet-ui` on each railroad's host and calls `/strolr-api/ricochet/mobile/*` on the same host. The railroad's marks come from strolr-api's `/ricochet/mobile/marks`, so **ricochet-ui 2.0.0 or later needs strolr-api 2.12.0 or later** at that railroad.

- Build locally: `./scripts/build-image.sh <version>`
- Verify an image: `./scripts/verify-image.sh <image-ref>`
- Decision: Datasages vault `decisions/2026-10-04-ricochet-ui-zero-config-image.md`
