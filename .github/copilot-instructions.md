# Copilot instructions for the “bicial” project

Create a small, client‑only web app “Binaural CI Alignment” (short name: bicial) that helps users align CI center frequencies with their acoustic ear. License: MIT. Keep the UI clear and modern.

Quick start: Open `index.html` directly in a modern browser (local file mode works well), or serve the folder as static files (e.g., GitHub Pages).

## Tech and constraints
- Plain HTML/CSS/JS (no frameworks, no build, no backend). Must run by opening `index.html` locally or from static hosting (e.g., GitHub Pages).
- Web Audio API for tone generation (simple sine tones only), stereo panning for left/right.
- Persist all user inputs to `localStorage`.
- Code should be clean, readable, commented where helpful, and easily maintainable by human developers.

## Files
- `index.html`: Page shell (header, footer, card), controls, table container, help overlay.
- `main.css`: Basic layout/styles for a clean, modern look (card, table, controls, buttons).
- `main.js`: All logic (state, render, audio, events, persistence, import/export, help).
- `README.md`: User info (overview, usage, terms/disclaimer). Also used by in‑app Help.
- `LICENSE`: MIT.

## Core UI and behavior
- Header + footer around a centered “card”. Top row: segmented radio groups for CI side (`L`/`R`, default `R`) and electrode count (`12`/`16`/`22`).
- Dynamic table: one row per electrode with columns:
	- `#` index (1‑based)
	- `L f`, `R f`: number inputs (Hz)
	- `f ±`: nudge buttons to change the non‑CI ear frequency by ±1 and ±10
	- `L`, `R`: single beep buttons
	- `L/R`: alternating L then R beeps, repetitions controlled globally
	- `L+R`: simultaneous play/stop toggle per row
	- `✓`: row checkbox (with master checkbox in header)
	- `L vol ±`, `R vol ±`: per‑row relative gain sliders (−50..+50) applied on top of global volume
- Bottom batch row: buttons to play all checked rows sequentially (L‑only, R‑only, alternating L‑then‑R per repetition).
- Below table: global beep duration (ms) and repetitions; global L/R volume sliders (0..100).
- Actions: Export/Import settings (JSON), “Reset alignments”, and “Reset everything”.
- Help: an ℹ button (and a footer link “info & terms”) opens an in‑page Help view rendering `README.md`. If `fetch` fails (e.g., when opened via `file:`), show a concise fallback message with a link to open the local `README.md` and a link to the GitHub repo. Close help with an `⨯` button.
 - Keyboard shortcuts: A/S/D/F nudge the non‑CI ear (−10/−1/+1/+10, left‑to‑right). J/K/L/; control playback (Left/Right/Alternate/Simultaneous). The `;` refers to the physical semicolon key (to the right of `L`). Shortcuts act on the last‑interacted row and are ignored while typing or when Help is open.

## State, persistence, and rules
- Persist top‑level settings: `ciSide` (`L`/`R`), `electrodeCount` (`12`/`16`/`22`), `volumeL`, `volumeR`, `beepDuration`, `beepReps`.
- For each electrode count, persist arrays in `localStorage`:
	- Frequencies per ear: `fL_<count>`, `fR_<count>` (default to log‑spaced 200..7500 Hz).
	- Per‑row relative gains: `adjL_<count>`, `adjR_<count>` (range −50..+50, default 0).
	- Selected rows set: `sel_<count>` (array of indices).
- Editing the CI ear frequency mirrors that value to the other ear for the same row. Editing the non‑CI ear is independent.
- Nudge controls always adjust the non‑CI ear.

## Export / Import
- Export a JSON file with shape:
	```json
	{
		"app": "bicial",
		"version": 1,
		"savedAt": "ISO-8601",
		"settings": { ciSide, electrodeCount, volumeL, volumeR, beepDuration, beepReps },
		"arrays": { "fL": {"12":[]...}, "fR":{}, "adjL":{}, "adjR":{}, "selected":{} }
	}
	```
- Import reads this structure, writes to `localStorage`, updates controls, and re-renders.

## Audio specifics
- Web Audio API: sine `OscillatorNode` per ear with simple attack/release envelope (`GainNode`).
- Stereo routing: use `StereoPannerNode` when available; otherwise, route with a `ChannelMergerNode`.
- Live updates while `L+R` is playing:
	- Global and per‑row volume changes smoothly adjust gains.
	- Nudge changes the active ear’s oscillator frequency immediately.
- Alternating sequence timing with `setTimeout`; guard against double‑starts and clean up timers.
- Stop any playing audio and cancel timers before re-rendering or when opening Help.

## Resets
- Reset alignments: keep CI side and global settings; mirror CI ear frequencies to the other ear for the current electrode count; clear per‑row gains and selections for that count; re-render.
- Reset everything: clear all app keys in `localStorage`, stop audio, re‑init UI with defaults.

## Visual and accessibility
- Keep it clear and modern; use iconography for buttons; show toggle state for active `L+R` and running batches.
- Basic keyboard and ARIA where reasonable (labels for controls, titles/aria‑labels on buttons).
