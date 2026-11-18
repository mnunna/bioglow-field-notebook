# Idea: Offline regional species and fungi guide

- **Status:** planned
- **Created:** 2026-11-18
- **Decision:** approved as the second V2 project, queued after the Observation Map
- **Related roadmap item:** [Offline species guide](../../ROADMAP.md#next--approved-v2-sequence)
- **Priority:** 2 of 2

## Decision summary

Build a curated, searchable offline reference for a defined pilot region. The first version helps a researcher compare an observation with reference material; it does not claim to identify a species automatically.

Implementation is queued until the Observation Map is complete. Content production must not begin at scale until the pilot geography, taxa, scientific reviewer, image-license policy, and distribution model are decided.

## Problem in the field

Researchers may need a quick reference while they are away from cellular service. Leaving BioGlow for a website or a large external field guide breaks the capture flow and may not work at all. A small offline guide could help narrow a field identification and consistently enter common and scientific names.

The global set of species and fungi is too large and context-dependent for a useful bundled guide. A regional guide is more relevant, smaller, faster, and easier to review.

## Evidence

- The user selected the offline species guide as the second V2 feature.
- BioGlow already has plant, animal/reptile, and BioGlow templates with species-name fields.
- The app's core promise is local, offline field operation.
- The current entry store serializes observations as one AsyncStorage JSON value, which is not appropriate for a large searchable reference catalog.
- Reference images require explicit reusable licenses and attribution; taxonomy and common names also change over time.

## Intended outcome

A researcher can browse or search likely regional taxa without a network connection, compare distinguishing traits and reference images, and copy a provisional name into a field note without BioGlow uploading the observation.

## Product principles for the guide

- **Regional before global:** usefulness comes from a relevant, reviewed shortlist.
- **Reference, not diagnosis:** never present a comparison as a confirmed identification.
- **Offline by design:** after installation of a guide pack, all content and search work without a signal.
- **Traceable content:** every image and factual record has a source, license, attribution, and content-version identifier.
- **Small by default:** thumbnails and concise field traits take priority over galleries and long articles.
- **Separate data domains:** reference content is not mixed into the user's observation store or export unless the user explicitly applies a name.

## Primary user stories

1. As a researcher, I can browse likely plants, animals, fungi, and bioluminescent organisms for my expedition region.
2. As a researcher, I can search by common name, scientific name, and a small set of controlled traits.
3. As a researcher, I can compare one or two licensed images and distinguishing field traits offline.
4. As a researcher, I can copy a provisional species name into the note I am creating or editing.
5. As a researcher, I can see the source and attribution for reference content.
6. As a device owner, I understand how much storage a guide uses and can remove optional packs without affecting observations.

## Smallest useful version

### In scope

- One named pilot geography and habitat context.
- Approximately 100–300 reviewed taxa selected for field relevance, not completeness.
- Common name, scientific name, taxonomic group, concise description, distinguishing traits, habitat, seasonality when useful, caution/look-alike note, and source metadata.
- One compressed thumbnail per taxon by default; a second image only when it materially helps comparison.
- Offline browse by major group and offline text search.
- Detail screen with explicit **Possible match — verify before reporting** language.
- A deliberate action to apply the common/scientific name to a compatible observation field; never overwrite existing text without confirmation.
- An attribution/license view available offline.
- A versioned content pack that can be rebuilt reproducibly from a reviewed manifest.
- iOS and Android support with Rain / Glove Mode applied to app-owned controls.

### Explicitly out of scope

- Camera-based or ML species identification.
- A global catalog.
- Community identifications, accounts, comments, or uploads.
- Live iNaturalist/GBIF queries in the field.
- Background synchronization.
- Unreviewed bulk scraping of website or API content.
- Full-resolution image galleries, audio-call recognition, or range-map downloads.
- Editing the scientific reference catalog inside the mobile app.

## Proposed experience

### Entry points

- A **Species guide** item in More for browsing.
- A **Compare with guide** action from compatible plant, animal, and BioGlow note forms once the standalone guide is stable.

The browse-only guide should ship before form integration if that reduces risk.

### Browse and search

- Default to major groups appropriate to the selected region.
- Search common names, scientific names, aliases, and a reviewed keyword list.
- Keep results concise and image-light; load thumbnails only as rows become visible.
- Make “no result” clear and safe: absence from the guide does not mean the organism is absent from the region.

### Applying a possible match

- Show exactly which field will be updated.
- Preserve any existing value unless the user confirms replacement.
- Store ordinary text in the observation rather than a fragile foreign-key dependency on the guide pack.
- Optionally retain a stable reference ID in a later schema only if a validated workflow needs provenance.

## Content model

Each taxon record should have, at minimum:

```text
id
pack_id
scientific_name
common_name
aliases
taxonomic_group
description
distinguishing_traits
habitat
seasonality
look_alikes_or_cautions
search_keywords
source_name
source_url
content_license
content_attribution
reviewed_at
reviewed_by
```

Each media record should separately track:

```text
id
taxon_id
local_asset_path
source_url
creator
license
attribution_text
checksum
pixel_width
pixel_height
```

Do not accept records or media whose source and reuse rights cannot be demonstrated.

## Technical approach

### Storage

- Use a prebuilt, read-only SQLite content database with full-text search rather than loading the catalog into AsyncStorage or one large JavaScript object.
- Keep user observations in their existing store; reference content and user data have separate lifecycle and deletion rules.
- Bundle the pilot pack if it can meet the agreed release-size budget. Otherwise, provide an explicit pre-expedition download/import flow in a later iteration.
- Store images as compressed local files/assets referenced by the content database, not as database blobs.
- Version the schema and pack independently from the `FieldEntry` schema.

### Content build pipeline

Create a reproducible developer-side pipeline that:

1. Reads a reviewed CSV or structured manifest.
2. Validates required taxonomy, sources, licenses, and attribution.
3. Rejects duplicate IDs, missing local files, unsupported licenses, and oversized media.
4. Produces normalized thumbnails without removing attribution metadata from the manifest.
5. Builds the SQLite database and search index.
6. Emits a manifest with pack version, geography, taxon count, byte size, and checksums.
7. Runs deterministic validation in CI or the repository test command.

Do not use the mobile app or a public API to assemble the catalog at runtime.

## Offline, privacy, and device constraints

- Once a pack is installed, browse, search, detail, attribution, and apply-to-note actions work in airplane mode.
- Opening the guide must not request location, camera, photo, microphone, or account permissions.
- The guide must not upload a user's photo, coordinates, search query, or possible match.
- Applying a name changes only the local draft/entry chosen by the user.
- Optional pack deletion must never delete or rewrite field observations, attached media, or exported research archives.
- If packs are downloadable later, show download size and require explicit user action before using cellular data.

## Performance and size budgets

Initial targets for the pilot pack:

- 100–300 taxa.
- No more than 80 MB additional compressed application size for a bundled starter pack.
- Search results begin within 250 ms after the database is ready on the physical iPhone test device.
- Guide screen becomes interactive within one second on warm open.
- Do not decode full-size images for browse rows; thumbnails should be sized for their rendered use.
- Do not preload the entire catalog or all thumbnails into JavaScript memory.
- Normal app startup, capture, History, Archive, and export remain unchanged when the guide has not been opened.

If reviewed content cannot meet the binary-size target, switch to removable regional packs rather than silently expanding the core app.

## Content and licensing policy

- Prefer public-domain, CC0, CC BY, or another explicitly approved reusable source.
- Treat CC BY-NC as a product/distribution decision, not an automatic approval; confirm that BioGlow's intended distribution complies before inclusion.
- Exclude all-rights-reserved media.
- Preserve creator attribution and license terms in the offline pack and in any required notices.
- Use official datasets or documented bulk-data channels rather than scraping public web pages.
- Record taxonomy source/version and schedule an explicit review cadence; do not imply that the catalog is permanently current.
- Have a qualified reviewer approve the selected taxa and field traits before release.

## Accessibility and field use

- Search, group filters, apply actions, and back navigation use accessible labels and outdoor-readable contrast.
- App-owned controls meet at least 44-by-44 points and grow in Rain / Glove Mode.
- Reference images include useful accessibility descriptions based on reviewed content, not inferred visual labels.
- Scientific names remain selectable/readable and are not conveyed by styling alone.
- Safety or toxic-look-alike cautions use text and iconography, not color alone.

## Acceptance criteria

- [ ] The approved pilot region, taxa list, reviewer, and license policy are recorded.
- [ ] The pack contains 100–300 reviewed taxa and stays within the agreed size budget.
- [ ] Browse, search, detail, attribution, and applying a name work in airplane mode.
- [ ] Search covers common names, scientific names, aliases, and reviewed keywords.
- [ ] Every taxon and image has offline source/license/attribution metadata.
- [ ] All-rights-reserved or unverifiable media is rejected by the build pipeline.
- [ ] The guide states that matches are provisional and absence from the guide is not proof of absence.
- [ ] Applying a match never overwrites entered text without confirmation.
- [ ] Removing or replacing a guide pack cannot delete or corrupt an observation.
- [ ] The guide does not request new runtime permissions or upload user data.
- [ ] Performance and release-size budgets are measured on release builds.
- [ ] Typecheck and content validation pass.
- [ ] iOS and Android release builds are exercised; browse/search/apply and offline behavior are verified on a physical iPhone.
- [ ] Existing capture, media, GPS, persistence, export, and Rain / Glove Mode workflows remain intact.

## Smallest useful experiment

Before building the full pack, create a reviewed 20-taxon prototype for the chosen region with representative text, licenses, attributions, and compressed thumbnails. Ask field users to complete these tasks offline:

1. Find a named organism by common name.
2. Find it by scientific name or alias.
3. Narrow an unknown organism using a major group and traits.
4. Explain why the result is only a possible match.
5. Apply the name to a draft without losing existing notes.

Measure usefulness and content gaps before expanding to 100–300 taxa.

## Success measures

- Testers find relevant reference entries offline without leaving BioGlow.
- The guide reduces time spent typing or consulting a separate reference.
- Testers understand that the guide supports, but does not confirm, identification.
- Search misses reveal actionable taxonomy/alias gaps rather than performance failures.
- The starter pack stays inside its size and responsiveness budgets.
- No privacy, licensing, or observation-data coupling is introduced.

## Risks and tradeoffs

- Content selection and scientific review may take longer than mobile implementation.
- A narrow regional guide can disappoint users outside the pilot geography unless scope is prominent.
- Taxonomy, common names, ranges, and seasons change and require versioned maintenance.
- Licensed images create attribution and distribution obligations.
- Bundled images increase store download size; downloadable packs require a pack manager and pre-expedition connectivity.
- Trait-based comparison may create false confidence without careful uncertainty language.
- Deep form integration could couple observations to removable content; storing applied names as text avoids that failure mode.

## Effort estimate

- Product/content decisions and 20-taxon prototype: 1–2 weeks.
- SQLite, browse/search/detail, and form integration: 2–4 engineering weeks.
- Content preparation/review for 100–300 taxa: approximately 2–6 weeks and potentially ongoing.
- Cross-platform release-build and field hardening: 3–5 engineering days.
- Expected engineering total after content decisions: approximately 3–6 weeks.

## Open questions that block implementation

- What exact geography and habitat define the first pack?
- Which taxa groups and count are most useful for that expedition?
- Who is the named scientific/content reviewer?
- Is BioGlow's intended distribution compatible with CC BY-NC material, or must packs use more permissive licenses?
- Should the first pack be bundled, sideloaded, or downloaded explicitly before a trip?
- Is browse-only enough for the first release, or is apply-to-note required to prove value?
- Who owns future taxonomy and content-pack updates?

## Decision record

- **2026-11-18:** Approved a regional offline reference guide as the second V2 project, after the Observation Map. Automatic identification and a global catalog are rejected for this scope. Implementation remains gated on geography, content, review, and licensing decisions.

