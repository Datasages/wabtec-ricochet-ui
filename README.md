# wabtec-ricochet-ui
The Mobile UI for RICOCHET

From 2.0.0 this is one image, `ricochet-ui:<version>`, for every railroad and environment, with no configuration. It is served at `/ricochet-ui` on each railroad's host and calls `/strolr-api/ricochet/mobile/*` on the same host. The railroad's marks come from strolr-api's `/ricochet/mobile/marks`, so **ricochet-ui 2.0.0 or later needs strolr-api 2.12.0 or later** at that railroad. Nothing enforces that pairing but the deploy: check strolr-api's version before moving a railroad's pin. On a railroad below 2.12.0 the page says it could not load the marks.

**Deploy change from 1.x:** the image reference changes from `ricochet-ui:amtk-<version>` to `ricochet-ui:<version>`, the same for every railroad and environment. Check that the Terraform module does not prepend the railroad to the version.

- Build locally: `./scripts/build-image.sh <version>`
- Verify an image: `./scripts/verify-image.sh <image-ref>`
- Decision: Datasages vault `decisions/2026-10-04-ricochet-ui-zero-config-image.md`
