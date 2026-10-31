# Agent → Interface, for Android

**A2UI × Material 3 × Westpac GEL, in Jetpack Compose.** The Android sibling of
[a2ui-westpac](../a2ui-westpac) (the web version). Same thinking experiment,
same scripted agent, same JSON stream.

An agent that speaks only [A2UI](https://a2ui.org) composes banking screens out
of the standard basic catalog. On Android that catalog is rendered by Google's
own `androidx.a2ui.compose` renderer and its Material 3 implementation, running
inside a `MaterialTheme` whose colour roles, shapes and type are pointed at
[Westpac GEL](https://github.com/WestpacGEL/GEL-next) tokens. One catalog slot,
the button, is overridden to reach GEL's 3dp corners. The agent has never heard
of Westpac.

## Status: written, partially verified, not yet compiled

This project was authored against the public API of `androidx.a2ui` **1.0.0-alpha02**
(the API surface in the androidx repository at that version), but it has not
been built: the environment it was written in cannot reach Google's Maven
repository. What has been checked: the pure-Kotlin agent compiles with kotlinc 2.2.21, and
the JSONL it emits for every scenario and action validates against the A2UI
reference processor with zero errors. The Compose layer is unverified. Open it
in Android Studio and sync. Expect the first build to want
a nudge or two, most likely one of:

- `compileSdk`: the a2ui preview is compiled against SDK 37.1. If sync asks,
  add `compileSdkMinor = 1` in `app/build.gradle.kts` (AGP 8.12+), or move to
  the AGP 9 `compileSdk { version = release(37) { minorApiLevel = 1 } }` form.
- Compose versions: `material3-a2ui` requires Compose 1.13.0-alpha03 and
  Material 3 1.5.0-alpha28 or newer. They are pinned in
  `gradle/libs.versions.toml`; raise them if a newer alpha is required.
- The renderer is alpha and its catalog constructor already changed between
  alpha01 and alpha02. If `materialA2uiBasicCatalogV1` or `A2uiBasicCatalogV1.Functions`
  moved again, `app/src/main/kotlin/com/telemetry/a2uiwestpac/catalog/WestpacCatalog.kt`
  is the one file to adjust.

## What is in the box

| Path | What it does |
| --- | --- |
| `scripts/gel-tokens.mjs` | Walks the W3C token tree in `@westpac/style-config` and generates `theme/GelWbc.kt` (Compose `Color` and `Dp` values; semantic tokens reference primitives by name). |
| `theme/WestpacTheme.kt` | Maps every Material 3 colour role, the shape scale and heading type onto GEL. Two skins (`Skin.Westpac`, `Skin.Baseline`) and a derived dark scheme. |
| `catalog/WestpacCatalog.kt` | Google's Material basic catalog with placeholder media renderers and the button slot swapped for `GelButton`. |
| `catalog/GelButton.kt` | The one overridden component: GEL's 3dp rectangle when the Westpac skin is on, stock Material otherwise. |
| `agent/` | JSON builders and the scripted agent (four scenarios that react to surface actions), ported line for line from the web project. |
| `ExperimentViewModel.kt` | Hosts the A2UI message processor and parser, plays agent replies with a streaming cadence, logs the raw stream, and turns outbound events into agent replies. |
| `ui/ExperimentScreen.kt` | Transcript with inline `A2uiSurface`s, scenario chips, skin and dark toggles, and an inspector sheet (premise, stream, send). |

## Regenerating the tokens

```
npm i --no-save @westpac/style-config
node scripts/gel-tokens.mjs
```

## Differences from the web version

- No "A2UI reference" renderer option: on Android the Material implementation
  *is* the reference, so the switch is Westpac GEL versus Material baseline.
- Money and dates are formatted by the renderer's catalog functions in the
  device locale, so an Australian phone prints "$", not "A$".
- Markdown in body text is whatever the androidx Text component supports.

## Stack

Kotlin 2.2, Jetpack Compose 1.13 (alpha), Material 3 1.5 (alpha),
`androidx.a2ui` 1.0.0-alpha02, `@westpac/style-config` 1.0 for tokens. Min SDK 26.
