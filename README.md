# Eco Note — Native iOS & Android App

A real cross-platform mobile app built with **Expo + React Native + TypeScript** —
one codebase that runs on both iPhone and Android. Eco Note grew from the
BioGlow Field Notebook web prototype.

## What it is

An **offline field notebook for ecologists working in the rainforest**, created for
the FLL BioGlow challenge. Ecologists told the team they discover new findings
unexpectedly — a new plant, a reptile, an animal, something about the carbon cycle —
but carrying a laptop is a burden, a paper notebook is ruined by rain, and their
backpacks are already heavy. This app runs on the phone they already carry:

- **6 guided templates** — New Plant Species, Animal / Reptile Sighting, BioGlow
  Finding (glow colour picker + brightness), Carbon Cycle Observation, Quick Photo +
  Voice Capture, General Field Note
- **4 notebooks** — Species, BioGlow, Carbon, Daily Field Journal — with live counts,
  search and filters
- **Auto date/time**, **GPS location + accuracy** (with permission fallback to typing
  the place), **durable photo attachments** (in-app camera preview or library), and **real voice-note
  recording and playback** (expo-audio — it records audio; it does *not* fake speech-to-text)
- **100% offline saving** on the device with versioned AsyncStorage records and
  app-owned media files addressed by stable relative references, so normal app
  upgrades can change the native sandbox path without breaking attachments
- Edit, star, inspect and delete entries with their associated media
- Export one complete **research ZIP** containing photos, audio, a readable
  spreadsheet CSV, and a Darwin Core-compatible occurrence CSV. An unavailable
  attachment from an older install is reported without blocking the rest of the export.
- **History → Archive workflow** — new observations remain in History;
  after a research ZIP is saved or sent, the user can confirm moving those notes to
  Archive. Editing does not change that status, and the observations and their media
  remain on the device.
- **Observation Map** — plots usable GPS coordinates from History and Archive on one
  embedded native map, with category-coloured markers, a selected-note card, a
  large Fit All control, and an accessible companion list. Notes without GPS remain
  safe in their original lists.
- One-tap **sample data** adds six labeled observations, two synthetic photos, and
  a sample voice note for repeatable testing; it can be reset or removed without
  changing real field notes.
- **Rain / Glove Mode** — bigger buttons and text for wet hands
- **More tab** — an offline how-to guide, a five-question biodiversity trivia round,
  and a direct feedback action
- Modern **Journal Stream** layout: a day-based observation timeline, dedicated
  icon-led New Note screen, searchable date-grouped archive, and glossy category
  colours that remain legible outdoors
- Native stack navigation for entry details and forms, including the standard iOS
  left-edge swipe-back gesture and Android system back behavior

## Project structure

```
App.tsx                     Native stack, bottom tabs, export/archive flow, and app state
src/types.ts                Entry, template and notebook types
src/templates.ts            All 6 templates (guided fields) and 4 notebook definitions
src/entryModel.ts           Persisted-entry schema and migration
src/observationMap.ts       Valid-coordinate selection for the Observation Map
src/storage.ts              Awaited, serialized AsyncStorage load/save
src/media.ts                Durable photo/audio files and cleanup
src/export.ts               Spreadsheet and Darwin Core-compatible CSV builders
src/exportArchive.ts        Self-contained research ZIP builder
src/exportArchiveCore.ts    Tested archive policy for unavailable old attachments
src/sampleData.ts           Clearly labeled sample observations for repeatable tests
src/sampleMedia.ts          Bundled sample attachment setup and durable copying
src/components/ui.tsx       GlossyCard, BigButton, Chip, shared colours
src/screens/HomeScreen.tsx        Journal timeline, recent notes, Rain/Glove toggle
src/screens/CaptureScreen.tsx     Icon-led picker for all six observation templates
src/screens/EntryFormScreen.tsx   Guided form: GPS, photo, voice recording
src/screens/NotebookScreen.tsx    Date-grouped archive, search, filters, star, export
src/screens/EntryDetailScreen.tsx Full entry view, star, delete
src/screens/ObservationMapScreen.tsx Embedded map, marker selection, and companion list
src/screens/MoreScreen.tsx        Help, trivia, and feedback hub
src/screens/InfoScreen.tsx        Offline in-app usage and privacy guide
src/screens/TriviaScreen.tsx      Native five-question biodiversity quiz
src/trivia.ts                     Bundled trivia content model and round selection
src/content/biodiversityQuiz.json Offline biodiversity questions and explanations
app.json                    App identity, bundle IDs, permission usage strings
eas.json                    EAS Build + Submit profiles (preview APK, production store)
STORE_SUBMISSION.md         Step-by-step App Store / Play Store submission checklist
```

## Run it on a real phone (fastest — no store, no developer account)

You need Node.js 20+ on a computer on the same Wi-Fi as the phone.

```bash
cd bioglow-field-notebook
npm install
npx expo start
```

1. Install **Expo Go** on the phone (free, from the App Store / Play Store).
2. Scan the QR code shown in the terminal with the phone camera (iPhone) or in the
   Expo Go app (Android).
3. The app opens on the phone. Shake the phone / tap the Expo Go menu for dev options.

Run the automated checks at any time:

```bash
npm run typecheck   # tsc --noEmit
npm test            # storage migration and export checks
```

## Install directly on an iPhone with Xcode

This creates a standalone Release app on the iPhone, with the camera, GPS and
microphone features available without Metro or a JavaScript development banner.

1. Connect the unlocked iPhone to the Mac with a data-capable cable, tap **Trust**
   on both devices if asked, and enable **Developer Mode** on the iPhone if iOS
   prompts for it.
2. In Xcode, open **Settings → Accounts** and add the Apple ID that will sign the app.
3. Generate the native project and install its dependencies:

   ```bash
   npx expo prebuild --platform ios
   cd ios && pod install && cd ..
   open ios/EcoNote.xcworkspace
   ```

4. In Xcode, select the **EcoNote** app target, open **Signing &
   Capabilities**, keep **Automatically manage signing** enabled, and select your
   Personal Team or paid Apple Developer team.
5. Use Xcode to configure signing once. For an everyday install without development
   UI, use the Release command below rather than Xcode's default Debug Run action.

After that one-time signing setup, reconnect the phone and run:

```bash
npm run ios:device
```

`npm run ios:device` builds Release with an embedded JavaScript bundle and does not
leave a Metro development server running. For live JavaScript development, use
`npm run ios:device:dev`; that Debug build intentionally starts Metro and shows
React Native development UI.

Always open `EcoNote.xcworkspace`, not the similarly named
`.xcodeproj`, because the workspace includes the installed native dependencies.

The embedded Observation Map uses Apple Maps on iOS without an additional key.
Expo Go provides its own development map configuration on Android; a standalone
Android release still needs its own restricted Google Maps SDK key supplied at build
time. No map key is stored in this repository.

## Build installable apps with EAS Build

EAS (Expo Application Services) builds the native binaries in the cloud — no Xcode or
Android Studio needed on your computer.

```bash
npm install -g eas-cli
eas login                 # your own free Expo account
eas build:configure       # links the project to your Expo account (writes projectId)
```

| Purpose | Command | Output |
| --- | --- | --- |
| Android test APK (install directly) | `eas build -p android --profile preview` | `.apk` |
| Android store build | `eas build -p android --profile production` | `.aab` (required by Google Play) |
| iOS store build | `eas build -p ios --profile production` | `.ipa` (requires Apple Developer account) |
| iOS simulator build (dev only) | `eas build -p ios --profile preview` with simulator enabled | simulator app |

Signing is handled by EAS: for iOS it creates/manages the distribution certificate and
provisioning profile using **your Apple Developer account**; for Android it generates
and stores the upload keystore for **your Google Play app**. Never share those
accounts' passwords — log in yourself when EAS prompts.

## Publishing to the stores — honest notes

**Yes, this codebase is structured to become a real App Store / Play Store app**
(single Expo project, production EAS profiles, bundle IDs and permission strings set).
Publishing itself can only be done by the account owner:

- **Apple App Store:** Apple Developer Program — **$99/year**. Submit via
  `eas submit -p ios --profile production` or upload the `.ipa` in Transporter to
  App Store Connect, then complete the listing and pass Apple review.
- **Google Play:** Play Console developer account — **$25 one-time**. Submit via
  `eas submit -p android --profile production` or upload the `.aab` manually in Play
  Console. **New personal accounts created after Nov 2023 must first run a closed
  test with at least 12 testers opted in for 14 continuous days** before Google
  grants production access.
- Both stores need a listing (screenshots, description, content rating / privacy
  questionnaires) and a **public privacy policy URL**. This app collects nothing and
  sends nothing off the device — say exactly that in the policy and the store
  privacy forms, and keep it true.

Full step-by-step: see **STORE_SUBMISSION.md**.

## Known V1 choices / limits

- Voice notes are real audio recordings stored on the phone (expo-audio). There is no
  speech-to-text in V1 — that is deliberately listed as a V2 item, not faked.
- Brightness uses a 1–5 selector instead of a continuous slider, to keep the app
  dependency-light and easy to tap with gloves.
- Entries and their managed media live on one device. There is no cloud sync in V1
  (that is the point — offline first); the complete research ZIP is the explicit way
  to move data off the phone.
- The placeholder app icon/splash in `assets/` should be replaced with final artwork
  before a store submission.
