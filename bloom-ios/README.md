# Bloom — iOS app 🌸

A native **iOS app** for [Bloom](https://bloom-habit-tracker.netlify.app), built with
[Capacitor](https://capacitorjs.com). It runs the exact same Bloom web app inside a native
iOS shell (WKWebView), so it **reuses 100% of the working code — including the end-to-end
encryption** — with zero risk of data incompatibility. It's a real, App-Store-shippable app
(`com.opticald.bloom`), not a bookmark.

> The web app itself is untouched — this project only *embeds a build* of it.

---

## What you need (one-time)

1. **Xcode** — install the full app from the Mac App Store (Command Line Tools alone aren't
   enough). Then run once:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```
2. **CocoaPods**:
   ```bash
   sudo gem install cocoapods
   ```
3. **Node** (already installed if you built the web app).
4. A free **Apple ID** (to run on the Simulator or your own iPhone). An Apple Developer
   account ($99/yr) is only needed to publish to the App Store.

## Build & run

```bash
cd bloom-ios
npm install

# Build the latest web app and copy it into the iOS project, then sync Capacitor.
# (This uses ../habit-mood-tracker — run it from inside the monorepo. If you only have
#  this repo, the last embedded build is already committed, so you can skip to `pod install`.)
npm run sync

# Install native dependencies
cd ios/App && pod install && cd ../..

# Open in Xcode
npx cap open ios
```

In **Xcode**:
1. Pick a simulator (e.g. *iPhone 15 Pro*) or plug in your iPhone.
2. Select the **App** target → **Signing & Capabilities** → set **Team** to your Apple ID
   (Xcode → Settings → Accounts to add it). Xcode will auto-manage a provisioning profile.
3. Press **▶ Run**.

That's it — Bloom launches natively, signs in against the same Supabase backend, and your
encrypted data works exactly as on the web.

## Updating the app when the web app changes

The iOS app embeds a *snapshot* of the web build. To pull in web changes:

```bash
npm run sync      # rebuilds ../habit-mood-tracker and re-copies it in
```

then rebuild in Xcode. (`npm run build:web` just does the build+copy without `cap sync`.)

## Publishing to the App Store

In Xcode: **Product → Archive**, then use the Organizer to upload to App Store Connect
(requires a paid Apple Developer account and an app record in App Store Connect).

---

### How it works / notes
- `capacitor.config.ts` sets the app id (`com.opticald.bloom`), name (**Bloom**), dark
  background (no white launch flash), and the splash/status-bar styling.
- The built web app lives at `ios/App/App/public/` (embedded) and `www/` (intermediate copy).
- **Encryption & data**: the WKWebView provides the Web Crypto API (iOS 15+), so Bloom's
  PBKDF2/AES-GCM envelope encryption and Supabase auth run unchanged. Login and the cached
  encryption key persist in the WebView's `localStorage` across launches.
- App icon & splash were generated from `assets/` via `@capacitor/assets`. To change them,
  edit `gen_assets.py` (or drop your own `assets/icon-only.png` 1024×1024) and run
  `python3 gen_assets.py && npx @capacitor/assets generate --ios`.
