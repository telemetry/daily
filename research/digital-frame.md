# Digital poster board / photo frame, driven from an iPhone

Research date: 2026-08-21

**The question:** a wall display (photo frame or "poster board") whose contents you
control from an iPhone app, backed by iCloud or Firebase. Buy, adopt, or build?

**Short answer:** there are two mature projects you can adopt today
(Immich + ImmichFrame, and the iCloud Shared Album trick), and one good reason to
build (you want a *poster board*, not a photo frame). Pick by answering one question:
**does the display show only photos, or photos plus arranged/scheduled content?**

---

## 0. The build-vs-buy line

If the goal is literally "have a nice frame on the wall by next week," a commercial
frame ends the project in 30 minutes and is not embarrassing:

| Frame | Subscription | Notes |
|---|---|---|
| **Aura** | None | Best panel, no subscription; the default recommendation |
| Skylight | $39/yr for "Plus" features | Easiest for non-technical relatives (email-in photos) |
| Nixplay | 10 GB free, then paid | Only one that plays video with sound on the base plan |

The rest of this document assumes you'd rather own the stack. Worth being honest:
everything below is more work than buying an Aura, and only two of the options give
you something an Aura can't.

---

## 1. Adopt: Immich + ImmichFrame  ← strongest "just use it"

The most complete answer to "iPhone app controls a frame," and it's free.

**How the pieces fit:**
- **Immich** — self-hosted photo server (Google Photos replacement). Its *official
  iOS app* is your iPhone app: background camera-roll upload, albums, favourites.
  No app development required.
- **ImmichFrame** — GPLv3 frame client that points at your Immich server and displays
  an album as a slideshow.

**Control loop:** add a photo to the "Frame" album on your phone → frame picks it up.

**ImmichFrame runs damn near anywhere** — this is its real advantage:

| Platform | Requirement |
|---|---|
| iOS / iPadOS | iOS 17+, iPad 6th gen or newer (App Store) |
| **Apple TV (tvOS)** | App Store |
| macOS | Apple Silicon |
| Android / Android TV | Play Store or APK; Android 12+ for screensaver mode |
| **Frameo photo frames (~$40–70)** | APK sideload over ADB — cheap purpose-built hardware |
| Browser / PWA | Any modern browser, add to home screen |
| Desktop | Windows / macOS / Linux builds |

That Frameo line is the sleeper: buy a $40–70 commodity Android photo frame, disable
the stock Frameo app, sideload ImmichFrame. Purpose-built hardware, your software.

**Cost of entry:** you must host Immich. Official requirements are 6 GB RAM minimum
(8 GB recommended), 2 CPU cores minimum / 4 recommended. 4 GB works with machine
learning disabled. So: a mini PC, a NAS, or a spare box — a Pi Zero won't do it.
Immich hit v3.0.0 stable on 2026-07-01.

**Alternative renderer:** [Immich Kiosk](https://docs.immichkiosk.app/) — browser-based,
heavily customisable (clock overlays, album pinning, video inline, layout options).
Use this instead of ImmichFrame if you want to style the display; use ImmichFrame if
you want a native app that just works.

**Verdict:** if you already self-host anything, this is the answer. If you don't, the
server requirement is the whole cost of this path.

---

## 2. Adopt: iCloud Shared Album → dumb display  ← zero backend

No server, no account credentials, no custom app, and *other people can contribute*.

**Control loop:** the built-in Photos app *is* the iPhone app. Add to a shared album
called e.g. "Frame" → it appears. Invited family members can add too, which is the
feature that makes this beat everything else for a family frame.

**How the frame reads it:** a public shared album exposes an undocumented but stable
and widely-used JSON endpoint, no authentication:

```
POST https://p{N}-sharedstreams.icloud.com/{ALBUM_TOKEN}/sharedstreams/webstream
Body: {"streamCtag": null}
```

Returns photo GUIDs and derivative sizes; a second call to `.../webasseturls` converts
GUIDs into signed download URLs. If you get a `330` response, re-issue against the host
named in the `X-Apple-MMe-Host` header. [ghostops/ICloud-Shared-Album](https://github.com/ghostops/ICloud-Shared-Album)
is a maintained Node/TS library that wraps this, so you're not parsing it by hand.

**Display options, cheapest effort first:**
1. **Apple TV + any TV/monitor — literally zero code.** Photos app → Shared Albums →
   pick album → *Set as Screen Saver*. Done. Downside: it's a screensaver on a TV, not
   a framed object, and the TV must be on.
2. **Browser kiosk on a Pi** hitting the endpoint above. ~150 lines. Full control of
   look, transitions, matting, captions.
3. **Old iPad in Guided Access.** [davidjamesmoss/photo-frame](https://github.com/davidjamesmoss/photo-frame)
   is a zero-UI iPad slideshow app that re-scans the shared album on each image change.
   Caveat: legacy — the author tested it on an iPad 3 / iOS 9 and states it has no error
   handling. Treat it as a ~200-line reference implementation to rewrite in SwiftUI, not
   as something to ship.
4. **Home Assistant users:** [eyalgal/album_slideshow](https://github.com/eyalgal/album_slideshow)
   exposes iCloud Shared Albums (plus Immich, Google Photos, Synology) as a controllable
   HA camera slideshow.

**The catch — resolution:** Shared Albums downscale to **2048 px on the long edge**
(panoramas up to 5400 px), and cap at **5,000 items per album**. 2048 px is fine for a
1080p frame, visibly soft on 4K.

**This may be about to stop mattering.** As of 2026-08-20 it's reported that **iOS 27
makes Shared Albums full-resolution** — at the cost of them counting against your iCloud
storage, which they previously did not. Treat as beta-stage reporting, not shipped
behaviour; verify before betting a build on it. If it lands, this option gets
substantially better and the resolution objection disappears.

**Other catch:** it's an unofficial endpoint. It has been stable for years and many
projects depend on it, but Apple owes you nothing.

**Not to be confused with:** pulling from your *main* iCloud Photo Library, via
[icloudpd](https://github.com/icloud-photos-downloader/icloud_photos_downloader) or
[pi-cloud-frame](https://github.com/paulknewton/pi-cloud-frame). Those get full
resolution but require your real Apple credentials and repeated 2FA re-auth, which is a
maintenance headache on a headless device. The shared-album path avoids that entirely.

---

## 3. Build: Firebase (or CloudKit) + SwiftUI + web frame

**Only worth it if you want a poster board rather than a photo frame.** If the answer to
"what does it show?" is "photos," options 1 and 2 already beat anything you'd build.

You ship iOS apps already, so the SwiftUI half is cheap for you — which moves this line
further toward "build" than it would be for most people.

### What a poster board needs that a photo frame doesn't
- Captions / titles / typography over the image
- Layout templates (full bleed, matted, split, text-only card)
- **Scheduling** — "show this Thursday," "this expires Sunday"
- Non-photo content: text posts, quotes, countdowns, a menu, a chore chart
- Multiple frames with different playlists
- Push-now / remote wipe / "jump to this item" from the phone
- Ordering that isn't shuffle

None of that fits an album-shaped source. That's the honest justification to build.

### Firebase architecture

```
SwiftUI app ──► Firebase Auth (Sign in with Apple)
            ──► Cloud Storage        originals
            ──► Firestore            frames/{id} — playlist, layout, schedule, currentItem
                     │
              Cloud Functions / "Resize Images" extension
                     │  downscales to the frame's native resolution on upload
                     ▼
Frame (Firebase Hosting page in a kiosk browser)
   onSnapshot(frames/{id}) ──► instant updates, no polling
   service worker + Cache API ──► keeps showing photos when Wi-Fi drops
```

Notes from a design standpoint:
- **Firestore `onSnapshot` already gives you instant push.** You do not need FCM for
  content updates. FCM is only for waking a display that has actually slept.
- Resize server-side on upload. A frame should never download a 12 MP HEIC to show it on
  a 1080p panel — that's the difference between a 1-second and a 15-second transition.
- Cache aggressively on the frame. The worst failure mode for a wall display is a blank
  screen because the router rebooted.
- Storage rules matter: frames should read via a narrowly-scoped token or an unlisted
  frame ID, not a wide-open bucket.
- MVP is realistically a weekend; well within free tier at family scale.

### CloudKit variant (worth considering, given you're Apple-native)
Same shape, but the SwiftUI app writes to a CloudKit database and the frame reads it with
**CloudKit JS** — Apple's JavaScript SDK over CloudKit Web Services, which supports
queries, subscriptions and assets from a browser. Trade-offs: you stay in the Apple
ecosystem with no third-party dependency and no separate auth story, but the Web Services
docs are archived (CloudKit itself is not deprecated) and the browser SDK is less
pleasant to work with than Firebase's. Choose Firebase for developer experience,
CloudKit for ecosystem purity.

**No existing open-source project does this.** Searching turned up no maintained
Firebase-backed frame with an iOS companion app — the DIY frame projects all pull from
an existing photo service rather than accepting pushes from a phone. If you build it,
you're not reinventing something; this is a genuine gap.

---

## 4. Driving the panels you already have

*(Added 2026-08-21 — you have TVs and aluminium Cinema Displays on hand, so buying a
frame is off the table. This section replaces the generic hardware table below.)*

Good news: the aluminium Cinema Displays are genuinely excellent frame material, better
than most commercial frames — for reasons that aren't obvious.

### Why the aluminium ACDs beat a bought frame

- **Matte antiglare hardcoat.** The single highest-impact hardware detail for a frame,
  and you already have it. A glossy panel on a wall is a mirror with pictures in it.
- **16:10 aspect ratio.** 1.60 is much closer to a 3:2 camera frame (1.50) than 16:9
  (1.78) is. Noticeably less letterboxing or cropping on every photo. Your TVs are the
  *worse* shape for this job.
- **Thin aluminium bezel** reads as deliberate on a wall rather than as a spare monitor.
- **Portrait rotation** is available once VESA-mounted — a 23" or 30" turned vertical is
  a superb poster board, and that's the orientation posters actually want.
- **Aged CCFL backlight is a non-issue here.** These panels are 16–22 years old, so the
  backlights have dimmed and warmed. That disqualifies them for photo editing and is
  nearly irrelevant — arguably flattering — for a frame in a living room.

### Which of your panels to use, best first

| Panel | Native | Connector | Verdict |
|---|---|---|---|
| **23" ACD** (A1082) | 1920×1200 | Single-link DVI | ⭐ **The sweet spot.** Plain passive HDMI→DVI cable off a Pi hits native res. 90 W max |
| **20" ACD** (A1081) | 1680×1050 | Single-link DVI | Same ease, lowest power (65 W max). Ideal for a hallway |
| **30" ACD** (A1083) | 2560×1600 | **Dual-link** DVI | Best poster board, but see the trap below. 150 W max |
| 24"/27" LED Cinema | 1920×1200 / 2560×1440 | Mini DisplayPort | **Glossy** — wrong surface for a frame. Use last |
| TVs | 16:9 | HDMI | Zero-effort via Apple TV, but worst aspect ratio, glossy, and rarely where you want a permanent frame |

### ⚠️ The 30" trap

The 30" ACD **requires dual-link DVI and has no internal scaler**. Feed it single-link —
which is all an HDMI→DVI adapter can carry — and you don't get a scaled image, you get
**1280×800**, exactly half native. On a 30" panel that's coarse enough to see from the
sofa.

There is no Raspberry Pi fix: the Pi outputs micro-HDMI, and its USB-C port is power-only
with no DisplayPort alt mode, so the active dual-link converters that solve this
(CableCreation, Sunix, Apple's old MB571Z/A) have nothing to plug into. To run the 30" at
native you need a host with **DisplayPort or USB-C output** — a mini PC, NUC, or Mac mini
— plus a ~$100 active dual-link adapter.

So: **don't start with the 30".** Prove the whole system on a 23" for the price of a $6
cable, then decide whether the big one is worth a host upgrade plus an adapter.

### The running cost — plan around this

This is the thing that decides whether the project is sensible. Continuous 24/7 operation:

| Panel | Typical draw | Per year | At $0.18/kWh |
|---|---|---|---|
| 23" ACD | ~65 W | ~570 kWh | **~$100/yr** |
| 30" ACD | ~110 W | ~960 kWh | **~$175/yr** |

Each display costs more per year in electricity than an Aura frame costs once. Blanking
the screen when nobody's looking isn't a nicety, it's the whole economics. Three ways,
combine freely:

1. **PIR motion sensor** on the Pi's GPIO → wake on approach, `DPMS off` after N minutes.
   Best experience by far: the frame is always on when anyone is in the room.
2. **Schedule** — `DPMS off` overnight via cron. Trivial, gets most of the saving.
3. **[`acdcontrol`](https://acdcontrol.sourceforge.net/)** — Linux utility that sets
   aluminium ACD backlight brightness over USB HID (range 0–255, supports `+`/`-`
   deltas). Lets you dim rather than blank in the evening, which looks far better than a
   hard cut. Note it needs root for `/dev/usb/hiddev*` unless you add a udev rule.

### Other gotchas on this vintage

- **The octopus cable** (DVI + USB + FireWire + power to an external brick) is captive
  and non-replaceable. Check yours isn't damaged before planning around a panel.
- **The power brick is the common failure point**, and the 30"'s 150 W unit is scarce and
  expensive. Don't build your only frame around a panel whose brick you can't replace.
- **VESA mounting needs Apple's M9649G/A adapter kit** (fits A1081/A1082/A1083, complies
  with VESA MIS-D 100). Discontinued but cheap and plentiful used. Without it you're stuck
  with the desk stand — and you need it for portrait rotation. **Buy this first**, it's
  the only part that gates the wall-mounted result.
- **The USB hub in the display is useful** — it's how `acdcontrol` talks to the panel, and
  it can host the PIR sensor or a USB drive.

### Pi video config, current-era

Most guides you'll find are for the legacy stack. On Bookworm / Pi 5 the old
`hdmi_group` / `hdmi_mode` / `hdmi_cvt` keys in `config.txt` are **ignored** — that's the
number one reason "my Pi won't do 1920×1200" threads exist. Set the mode on the kernel
command line instead:

```
video=HDMI-A-1:1920x1200M@60
```

or at session start with `wlr-randr` (Wayland) / `xrandr` (X11). 1920×1200 @ 60 Hz needs a
154 MHz pixel clock against single-link DVI's 165 MHz ceiling, so it fits comfortably —
use reduced blanking if the panel is fussy. `hdmi_drive=1` (DVI mode, no audio) only
applies on the legacy stack.

### Suggested topology

- **One used mini PC** = Immich server *and* drives your largest display. If you have an
  old **Mac mini** (2010–2012 era), it's ideal: native HDMI *and* Mini DisplayPort, so it
  drives an LED Cinema Display directly, and it runs Immich in Docker. One box, two jobs.
- **Pi 4/5 + $6 passive HDMI→DVI cable** per 20"/23" ACD, running a kiosk browser.
- **Apple TV** per TV, running the ImmichFrame tvOS app — zero build.

### Revised first move

Your ten-minute validation test is now even cheaper than the Apple TV route: put a **23"
ACD on a Pi with a passive HDMI→DVI cable**, point a kiosk browser at a hardcoded
playlist, and live with it for a week before writing any Swift or standing up any server.
You'll learn whether the wall placement works and whether you keep feeding it — the two
things that actually kill these projects — for the cost of a cable.

Order the M9649G/A VESA adapter now regardless of which path you pick; it's the long-lead
item and everything wall-mounted depends on it.

---

## 5. Generic hardware options (if you were starting from scratch)

| Option | Cost | Verdict |
|---|---|---|
| **Frameo-class Android frame** | $40–70 | Best value. Purpose-built, sideload ImmichFrame or a kiosk browser |
| **Old iPad + Guided Access** | free if you have one | Best panel by far. ⚠️ permanently-charging iPads swell batteries — use a smart plug to cycle charge |
| **Pi 4/5 + IPS monitor in a real frame** | $80–200 | Most control, most work. Get a **matte/anti-glare** panel — gloss ruins the illusion |
| **Apple TV + TV** | $130 | Zero-effort with shared albums; not a framed object |
| **Colour e-ink poster** | $$$$ | For the true poster-board look. InkPoster Tela 28.5" (E Ink Spectra 6) is ~$2,400; Fraimic does 13.3"–31.5". Small Waveshare panels on a Pi are the cheap way in |

The single highest-impact detail on any DIY build is **matte glass and a real mat board**.
That, more than software, is what separates "digital frame" from "monitor on a wall."

---

## 6. Recommendation

1. **Photos only, and you self-host (or will):** Immich + ImmichFrame on a $40 Frameo
   frame. Nothing to build, official iOS app, native frame client, no subscription.
2. **Photos only, no server, family should contribute:** iCloud Shared Album. Start with
   Apple TV screensaver to validate you'll actually use it (zero code, ten minutes), then
   upgrade to a Pi kiosk reading the sharedstreams endpoint. Watch whether iOS 27's
   full-res change ships.
3. **You want an actual poster board:** build the Firebase/CloudKit stack. Nothing
   off-the-shelf does scheduling, captions and layouts. Prototype the *frame* as a web
   page first — before writing any Swift, put a hardcoded playlist on a monitor on the
   wall for a week. Most frame projects die from "nice display, nobody feeds it," and
   a week of living with it tells you whether the content pipeline is the real problem.

**Cheapest way to learn the most:** see §4 — a 23" Cinema Display on a Pi with a $6
passive HDMI→DVI cable, showing a hardcoded playlist for a week. It answers the only
question that matters — whether a display on that wall is something you'll keep feeding —
before you commit to a backend.

---

## Sources

- [ImmichFrame](https://github.com/immichFrame/ImmichFrame) · [client apps list](https://github.com/immichFrame/ImmichFrame/blob/main/docs/docs/getting-started/apps.md)
- [Immich requirements](https://docs.immich.app/install/requirements/) · [Immich Kiosk docs](https://docs.immichkiosk.app/)
- [ImmichFrame kiosk on Raspberry Pi 5](https://nascompares.com/answer/raspberry-pi-5-photo-frame-immichframe-kiosk-mode-setup-guide-chromium-docker-autostart/)
- [ghostops/ICloud-Shared-Album](https://github.com/ghostops/ICloud-Shared-Album) — sharedstreams API library
- [Reverse-engineering the iCloud shared album API](https://www.llun.me/posts/dev/2022-10-25-iCloud-photos-shared-album/) · [gist: download shared albums](https://gist.github.com/fay59/8f719cd81967e0eb2234897491e051ec)
- [Apple: Shared Album limits](https://support.apple.com/en-us/108916) · [iOS 27 full-res shared albums (MacRumors, 2026-08-20)](https://www.macrumors.com/2026/08/20/ios-27-shared-albums-eat-into-icloud-storage/)
- [Apple: use photos as Apple TV screen saver](https://support.apple.com/guide/tv/use-your-photos-as-a-screen-saver-atvb545e0f30/tvos)
- [davidjamesmoss/photo-frame](https://github.com/davidjamesmoss/photo-frame) · [eyalgal/album_slideshow](https://github.com/eyalgal/album_slideshow) · [paulknewton/pi-cloud-frame](https://github.com/paulknewton/pi-cloud-frame)
- [balena photo-slideshow](https://github.com/balena-io-experimental/photo-slideshow)
- [CloudKit JS](https://developer.apple.com/documentation/cloudkitjs)
- [Fstoppers: InkPoster Tela 28.5 review](https://fstoppers.com/fine-art/inkposter-tela-285-review-future-digital-picture-frames-719866)
- [Apple Cinema Display 20/23/30 datasheet (PDF)](https://andovercg.com/datasheets/apple-cinema-display-specs.pdf) · [EveryMac: 23" ACD specs](https://everymac.com/monitors/apple/studio_cinema/specs/apple_cinema_display_23.html) · [EveryMac: 30" ACD specs](https://everymac.com/monitors/apple/studio_cinema/specs/apple_cinema_display_30.html)
- [Apple M9649G/A VESA Mount Adapter](https://www.bhphotovideo.com/c/product/340396-REG/Apple_M9649G_A_Vesa_Mount_Adapter_for.html)
- [acdcontrol — ACD backlight control for Linux](https://acdcontrol.sourceforge.net/) · [source](https://github.com/warvariuc/acdcontrol)
- [Connecting a Cinema Display to a Raspberry Pi (MacRumors)](https://forums.macrumors.com/threads/how-to-convert-a-cinema-display-to-be-used-on-a-raspberry-pi.2164284/) · [USB-C to dual-link DVI active adapter](https://www.cablecreation.com/products/usb-c-to-dual-link-dvi-active-adapter-conveter)
- [Raspberry Pi config.txt video options](https://www.raspberrypi.com/documentation/computers/config_txt.html)
- [Tom's Guide: best digital photo frames 2026](https://www.tomsguide.com/best-picks/best-digital-photo-frames)
- [Using an even cheaper Android thing as a digital photo frame](https://lucascosti.com/blog/2026/02/using-an-even-cheaper-android-thing-as-a-digital-photo-frame/)
