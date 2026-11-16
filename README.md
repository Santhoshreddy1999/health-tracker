# Health Tracker (family edition)

Free, offline health tracker for the whole family. Expo (React Native + TypeScript); all data stays on the device.
Full user guide and install steps: see `docs/health-app-plan.md` in the Project store.

## Install on your phone (free)

Every push to `main` runs `.github/workflows/build-apps.yml`, which publishes a **Release → latest** with:

| File | Phone | How to install |
|---|---|---|
| `HealthTracker-android.apk` | Android | Open the release page on the phone, download, tap the file, allow "Install unknown apps". |
| `HealthTracker-ios-unsigned.ipa` | iPhone | On a Windows/Mac PC install [Sideloadly](https://sideloadly.io) (or AltStore), connect the iPhone, drag in the .ipa, sign in with your free Apple ID. On the iPhone: Settings → General → VPN & Device Management → trust your Apple ID; also turn on Settings → Privacy & Security → Developer Mode. Free signing lasts **7 days** — re-sideload weekly (AltStore can auto-refresh over Wi-Fi). |
| `HealthTracker-web-pwa.zip` | Any | Host the folder (Netlify Drop, GitHub Pages…), open in Safari → Share → Add to Home Screen. |

There is no such thing as an iPhone APK; the App Store/TestFlight route needs a paid Apple Developer account ($99/yr).

## Develop

```bash
npm install
npm run typecheck        # tsc --noEmit
npm start                # Expo dev server (scan QR with Expo Go)
npm run build:web        # static PWA in dist/
npx serve dist           # or any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages)
eas build -p android --profile preview   # free-tier APK
```

Web deep links for previews: `?demo=1` (sample family), `&tab=meds|records|family|track`, `&screen=vitals|checkups|...`, `&theme=dark`.

## Layout

- `App.tsx` – tabs, stack routing, reminder sync, PIN lock, in-app reminder banner
- `src/store.tsx` – app state in AsyncStorage (localStorage on web), migrations, backup/restore
- `src/types.ts` – data model (profiles, medical info, logs, check-ups, reports, vitals, appointments…)
- `src/labs.ts` – ~45 lab tests with sex-specific reference ranges and high/low flags
- `src/vitals.ts` – BP / sugar / pulse / SpO₂ / temperature classification
- `src/selectors.ts` – daily totals, adherence, cycle prediction, lab history, insights
- `src/reminders/` – reminder planner; `scheduler.ts` (native, expo-notifications) and `scheduler.web.ts` (in-app only)
- `src/files/` – report file storage; `storage.ts` (app documents folder) and `storage.web.ts` (IndexedDB)
- `src/screens/` – one file per screen
- `public/` – PWA manifest, service worker, icons, `index.html` template
