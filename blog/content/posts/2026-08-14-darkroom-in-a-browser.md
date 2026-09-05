---
title: "A darkroom in a browser"
date: 2026-08-14
description: "Presenting photographs on the web without a white frame shouting at them. Notes on the Darkroom theme."
tags: [photography, design]
cover: /images/plate-02.svg
coverAlt: "Warm amber gradient falling to black, standing in for a photograph"
---

Most blog themes are built for text. Drop a photograph into one and the picture fights the page: white margins glow, the type competes, and the tonal range you laboured over is judged against pure #ffffff.

The **Darkroom** theme starts from the other end. It is dark by default, the greys are warm, and the only saturated colour is a safelight amber that appears on links and highlighted lines.

![Amber gradient](/images/plate-03.svg "Plate 03. Placeholder art; swap in your own JPEGs under public/images. {.wide}")

## Decisions

- **Background** `#0c0c0d`, not black. Pure black makes shadows in photographs look clipped.
- **Text** `#d9d4cc`, a paper-white with the blue taken out. It sits beside warm-toned prints without turning them orange.
- **Captions** are monospaced, small, and set in the muted colour. Captions are metadata, not prose.
- **Radius** is 2px. Photographs have corners.

## Wide plates

Break a picture out of the text measure by adding `{.wide}` to its caption. On large screens it spans most of the viewport; on phones it falls back to the column.

![Portrait format placeholder](/images/plate-04.svg "Plate 04. Portrait format stays within the measure.")

## Shortcomings

There is no lightbox and no lazy gallery grid. Both would be easy additions; neither is necessary for a journal. A JPEG, a caption, and enough space around it is most of what a photograph needs.
