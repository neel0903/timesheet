# Installing Work Tracker on your iPhone

Once you've deployed the new files to GitHub Pages, you can install the app on your phone in about 30 seconds.

## Deploying the updated files

Replace these files in your repo (in addition to `firestore.rules` from before):

```
index.html        ← updated with PWA support
manifest.json     ← NEW
sw.js             ← NEW
icon-180.png      ← NEW (iOS home screen icon)
icon-192.png      ← NEW
icon-512.png      ← NEW
icon-167.png      ← NEW (iPad)
icon-152.png      ← NEW (iPad legacy)
icon-120.png      ← NEW (iPhone legacy)
favicon-32.png    ← NEW (browser tab favicon)
```

All these files must sit in the **same folder** as `index.html` on GitHub Pages.

```bash
git add index.html manifest.json sw.js *.png
git commit -m "Add PWA support — installable on iOS"
git push
```

GitHub Pages takes 1–2 minutes to redeploy.

---

## Installing on your iPhone

1. Open **Safari** on your iPhone (this **must** be Safari — Chrome and Firefox on iOS can't install PWAs)
2. Navigate to your GitHub Pages URL: `https://YOUR-USERNAME.github.io/YOUR-REPO/`
3. Tap the **Share** button at the bottom (square with an arrow pointing up)
4. Scroll down in the share sheet and tap **"Add to Home Screen"**
5. You'll see a preview — keep the name "Work Tracker" or rename if you like
6. Tap **Add** in the top right

The app icon now sits on your home screen. Tap it and it opens fullscreen with no Safari address bar — just like a native app.

## What you get vs. just visiting the website

- **Full-screen app**: No Safari chrome, no tabs
- **Own app icon**: Sage-to-terracotta gradient with "WT" monogram
- **Own entry in app switcher**: Shows up in iOS multitasking like any app
- **Loads instantly**: The shell is cached on your device after first visit
- **Works offline**: You can open the app without signal — it'll show your existing data and queue any changes until you're back online
- **Respects the notch**: Top bar sits below the status bar properly

## What it does NOT do (limitations of PWAs on iOS)

- **No push notifications** — Apple still doesn't support web push for home-screen PWAs (Android does)
- **No App Store presence** — only you have it; can't share via the App Store
- **Limited background tasks** — auto-fill of past Sundays only runs when you open the app, not in the background

If any of these become deal-breakers, the next step is wrapping this in **Capacitor** to get a real `.ipa` for TestFlight or the App Store. The web code stays the same; you just gain native APIs.

---

## Updating the app later

When you change `index.html` and push a new version:
1. Bump `CACHE_VERSION` in `sw.js` (e.g. `'wt-v1'` → `'wt-v2'`)
2. Commit & push

Next time you open the app it'll grab the fresh code. The old cache is deleted automatically.

If for some reason an old version is "stuck", you can force refresh:
- Delete the app from your home screen
- Open the GitHub Pages URL in Safari again
- Re-add to home screen

---

## Troubleshooting

**"Add to Home Screen" doesn't appear in the share sheet**
You're using Chrome or Firefox on iOS. Both reuse Apple's WebKit but neither exposes the install option. Open the URL in Safari instead.

**App opens in Safari instead of fullscreen**
You probably tapped a link to it instead of the home screen icon. Always launch from the home screen icon.

**Icon looks blurry**
iOS sometimes uses a stale icon. Delete from home screen, refresh in Safari, re-add.

**Service worker errors in console**
Service workers only run over **HTTPS** (or localhost). GitHub Pages is HTTPS by default, so this should just work. If you preview locally with `file://` URLs, the SW won't register — that's expected, it doesn't break anything.
