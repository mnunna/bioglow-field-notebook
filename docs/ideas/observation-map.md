# Idea: Offline-resilient observation map

- **Status:** implemented; physical-device verification pending
- **Created:** 2026-11-18
- **Decision:** approved as the first V2 implementation
- **Related roadmap item:** [Observation map](../../ROADMAP.md#now--stabilize-the-working-baseline)
- **Priority:** 1 of 2

## Decision summary

Build an **Observation Map** that plots saved field notes from their existing GPS coordinates. The first version is a view of observations, not a recorder of the route a researcher walked. It must preserve local-only data handling and must not make capture, browsing, or export depend on a network connection.

Start implementation only after a short map-library spike confirms the required behavior on the repository's supported iOS and Android versions. Do not raise the iOS deployment target merely to gain map interactions.

## Problem in the field

BioGlow records where an observation was made, but researchers can currently revisit that location only as a label and latitude/longitude pair inside an entry. During or after an expedition, they cannot see spatial patterns, nearby observations, repeated visits, or gaps in coverage.

Calling this a "trail map" risks implying continuous route tracking. The immediate user need is narrower: **show where saved observations occurred**.

## Evidence

- The user selected this as the first V2 feature to pursue.
- `FieldEntry` already stores `latitude`, `longitude`, `horizontalAccuracy`, and `locationLabel`.
- GPS-tagged observations exist in both History and Archive, so the map must not be limited to export state.
- Field use may have weak or no connectivity; a basemap cannot be the only way to find a saved observation.
- Continuous trail recording has not been requested or validated.

## Intended outcome

A researcher can open one map, understand where all GPS-tagged observations are located, and open the corresponding entry with a few large, outdoor-friendly interactions. Entries without GPS remain safe and visible elsewhere in the app.

## Primary user stories

1. As a researcher, I can see all locally saved observations that have coordinates.
2. As a researcher, I can distinguish observation types without opening every marker.
3. As a researcher, I can open the full entry represented by a marker or its companion list row.
4. As a researcher without a signal, I can still access my saved observations even if detailed basemap tiles are unavailable.
5. As a Rain / Glove Mode user, I can operate the map's app-owned controls with large tap targets.

## Smallest useful version

### In scope

- A single `ObservationMapScreen` reachable from both History and Archive, or from one clearly discoverable shared entry point.
- Plot all entries with valid finite latitude and longitude, regardless of `exportedAt`.
- Fit the initial viewport to the plotted observations; use a sensible local default when there is only one point.
- Give markers a visual category based on the existing notebook or template color.
- Provide an accessible companion list or selected-entry card so opening an entry never depends solely on tapping a small marker.
- Open the existing entry-detail screen from the map.
- Show the number of entries plotted and the number that lack coordinates.
- Reuse existing local entry state; do not copy observation records into a second store.
- Preserve existing History and Archive search, export, edit, star, and delete behavior.
- Support iOS and Android release builds and the existing iOS 17 deployment target.

### Explicitly out of scope

- Continuous route or breadcrumb recording.
- Background location access.
- Turn-by-turn navigation or directions.
- Editing coordinates by dragging a marker.
- Live sharing or cloud-hosted maps.
- Automatic species identification.
- Downloadable offline regions in the first implementation.
- Heatmaps, clustering, polygons, transects, or GIS file import/export.

## Proposed experience

### Entry point

Prefer a reusable stack screen opened by a clearly labeled **Map** action. If the action appears in both History and Archive, both must open the same all-observations dataset rather than applying an implicit export-status filter.

### Map states

- **No observations:** explain that GPS can be added while creating or editing a note.
- **No GPS observations:** show how many notes exist without coordinates and link back to the list.
- **One observation:** center at a useful neighborhood zoom without implying high GPS precision.
- **Many observations:** fit all points with padding that leaves controls visible.
- **Basemap unavailable:** keep the local observation count and companion list usable; state that map detail is unavailable offline rather than showing an indefinite spinner.
- **Invalid legacy coordinate:** omit the point, keep the entry intact, and include it in the missing/unavailable count.

### Outdoor interaction

- App-owned buttons meet at least 44-by-44 points and grow in Rain / Glove Mode.
- Do not require pinch gestures for core navigation; provide a recenter or fit-all control.
- Selected-entry information uses high contrast and does not obscure the entire map.
- Marker color is not the only category cue; include an icon or text in the selected-entry card.

## Technical approach

### Data flow

1. Pass the current in-memory `FieldEntry[]` from `App.tsx` to the map screen.
2. Derive valid mapped entries with a memoized selector.
3. Render coordinates without persisting map-specific copies.
4. Navigate by `entry.id` to the existing detail screen.
5. Recompute markers when an entry is edited or deleted.

No entry-schema migration is expected for the MVP.

### Map-library spike

Before full implementation, create a disposable spike that renders sample markers and verifies:

- iOS 17 and the current Xcode toolchain.
- A physical iPhone release build.
- A representative Android device or emulator release build.
- Marker rendering, viewport fitting, dark styling, accessibility, and navigation through the companion card/list.
- Behavior in airplane mode with an empty and previously viewed map cache.
- A safe Android API-key configuration with no secret committed to the repository.
- Compatibility with Expo prebuild and all existing persistent config plugins.

`react-native-maps` was selected for the MVP because it provides the required marker interactions on the existing iOS 17 deployment target. It embeds Apple Maps on iOS and the native Google Maps view on Android. The map has no external Maps-app handoff, and existing approximate GPS capture remains unchanged for the demo-focused MVP. Physical-device release verification and the release-binary size delta remain pending.

### Offline behavior

Observation data, coordinates, selected-entry details, and navigation to the entry must remain local and available offline. Native basemap tiles may be absent when a region was not viewed previously. The MVP may communicate that limitation, but it must not lose, hide, upload, or block access to observations.

A later decision can add intentionally downloaded MapLibre regions if field testing shows that an offline topographic basemap is essential. That is a separate storage, licensing, provider, and UX project.

## Performance and storage budgets

- Do not initialize the native map until the map screen is opened.
- Do not change normal app startup behavior or start location services in the background.
- Opening the map with 250 sample observations should remain responsive on the physical iPhone test device.
- Marker derivation should be memoized and should not reread AsyncStorage.
- Images in the companion list/card should be lazy and optional.
- Record release IPA/APK or AAB size before and after adding the map dependency.
- If marker count becomes a measured problem, add clustering as a follow-up rather than preloading it into the MVP.

## Privacy and permissions

- Do not request a new permission merely to view already-saved coordinates.
- Do not send observation coordinates to analytics, a BioGlow server, or a map search/geocoding API.
- A third-party basemap provider will receive ordinary tile requests and network metadata when online; document the chosen provider and avoid embedding observation data in request parameters.
- Preserve the existing location permission explanation used during capture.
- Never commit an Android map API key or signing material.

## Acceptance criteria

- [ ] All valid GPS-tagged History and Archive entries appear on one map.
- [ ] Entries without GPS are not modified or deleted and their count is explained.
- [ ] A user can reach the existing entry-detail screen without relying on a precision marker tap.
- [ ] Editing or deleting an entry updates the map without restarting the app.
- [ ] App-owned controls remain usable in Rain / Glove Mode.
- [ ] The app handles zero, one, overlapping, widely separated, and invalid coordinates.
- [ ] Airplane mode does not block access to saved entry information or cause an endless loading state.
- [ ] No background-location permission or service is introduced.
- [ ] No observation coordinate is uploaded by BioGlow.
- [ ] iOS and Android typecheck/build verification passes.
- [ ] Camera, GPS capture, audio, offline persistence, and export regressions are checked.
- [ ] A physical iPhone release build verifies map opening, marker display, entry navigation, offline behavior, and Glove Mode.
- [ ] The release-binary size delta and any Android map-provider cost/configuration are recorded.

## Smallest useful experiment

Use the existing sample observations plus a test set containing overlapping and distant points. On a physical iPhone, ask a tester to:

1. Find the observations closest to one another.
2. Open a particular observation from the map.
3. Repeat the task in airplane mode.
4. Repeat it with Rain / Glove Mode enabled.

Do not add offline-region downloads during this experiment.

## Success measures

- A tester can locate and open a requested mapped observation without instruction.
- The map makes a spatial relationship visible that was not obvious in the chronological/archive lists.
- No saved observation becomes inaccessible when the basemap is unavailable.
- Normal startup, capture, and browsing feel unchanged when the map is not open.
- The map produces no new continuous location or privacy concern.

## Risks and tradeoffs

- Platform-native basemaps are not a guarantee of offline field detail.
- Map-provider setup and billing restrictions may complicate Android distribution.
- Marker interactions differ by OS version and library.
- Dense or coincident observations can be hard to select without a companion list or later clustering.
- A world-scale fit can become meaningless when one coordinate is erroneous; validate coordinate ranges and provide fit/recenter behavior.
- Calling the feature a trail map could create an expectation of route recording, so product copy should use **Observation Map**.

## Effort estimate

- Library/configuration spike: 1–2 engineering days.
- MVP implementation and automated coverage: 1–2 weeks.
- Cross-platform release-build and physical-device hardening: 3–5 days.
- Expected total: approximately 2–3 weeks, excluding offline-region downloads.

## Open questions

- Which production basemap provider and Android key/billing arrangement will be used?
- Does the chosen library meet all interactions on iOS 17, or must the companion list carry selection on that version?
- Should the first entry point live in History, Archive, both, or More after a quick usability check?
- What observation count should trigger clustering based on measured device performance?

## Decision record

- **2026-11-18:** Approved the Observation Map as the first V2 feature. Scope is saved observation points only. Continuous trail recording, bundled speech transcription, and offline region downloads are not part of this implementation.
- **2026-11-18:** Implemented the map-dominant Field Focus experience with `react-native-maps`, an app-owned selected-entry card, Fit All, and an accessible companion list. The MVP does not open an installed Maps app and does not change GPS acquisition behavior. Physical iPhone and Android verification remain required.

