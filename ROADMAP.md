# BioGlow roadmap

This is the working product roadmap. It records priorities and decisions; exploratory thinking belongs in [`docs/ideas/`](docs/ideas/README.md).

Roadmap placement is not a promise or release date. Move an item into **Now** only when its intended outcome and smallest useful version are understood.

## Shipped baseline

- Offline field-entry capture using six guided templates.
- Four searchable notebooks with filters, starring, detail view, and deletion.
- Durable photo attachment, GPS tagging with accuracy, and voice-note recording/playback.
- Editing for saved entries with safe media replacement and cleanup.
- One complete research ZIP containing media, a spreadsheet CSV, and a Darwin Core-compatible CSV.
- Versioned entry migration, awaited/serialized storage writes, and focused storage/export tests.
- Rain / Glove Mode for larger outdoor controls.
- Direct installation and operation on a physical iPhone.

## Now — stabilize the working baseline

- Commit and preserve the known-good physical-iPhone build configuration.
- Keep setup instructions reproducible from a clean checkout.
- Verify the highest-risk field workflows on a physical iPhone: permissions, photo capture, GPS, voice notes, offline persistence, and export.
- Replace placeholder icon and splash artwork before public distribution.

## Next — candidate improvements

These are candidates, not approved implementation tasks. Explore each in `docs/ideas/` and rank it by field value, effort, data risk, and offline reliability.

- Backup and restore that does not compromise the offline-first privacy model.
- Faster quick capture with less typing.
- A map of observations using saved GPS coordinates.
- Offline species and fungi reference material.
- On-device speech-to-text for voice notes.
- Reminders to revisit a site after dark or after rain.
- A polished expedition report format beyond the shipped CSV and research ZIP exports.

## Later — team and companion workflows

- Local expedition sync over nearby Wi-Fi.
- Optional, explicitly enabled cloud backup.
- Smartwatch quick-capture companion.
- Shared expedition notebooks and researcher-ready reports.

## Planning process

1. Capture a problem or opportunity using [`docs/ideas/_template.md`](docs/ideas/_template.md).
2. Gather evidence and compare at least the smallest viable option with doing nothing.
3. Define success, privacy/offline constraints, risks, and open questions.
4. Promote the idea to **Now** or **Next** only after a decision is recorded.
5. Implement it in a focused `codex/<topic>` branch and update this roadmap when its status changes.
