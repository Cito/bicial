# Copilot instructions for the “bicial” project

The title of the app is "Binaural CI Alignment". The project short name is "bicial". The subtitle is "Align the center frequencies of your cochlear implant with your other ear". It should be MIT licensed.

This file describes the app’s purpose, functionality, UI structure, and technical constraints so Copilot can create the project from scratch.

## Overview

A small client‑only web app for binaural CI alignment for patients that have one acoustic ear and one CI implant ear. It helps compare/align cochlear implant (CI) center frequencies with acoustic alignment frequencies from natural hearing with the unimplanted ear.

It is meant to be used with over-the-ear headphones that deliver the sound to the ear and CI individually by using stereo panning (left/right).

No build tools, larger frameworks or backend. Lightweight, generally available CDN resources (Alpine, Bootstrap, Bulma, Tailwind) are OK, but less is more. Everything is plain HTML/CSS/JS and runs by opening `index.html` in a browser.

However, the code should be clean, well structured and commented for maintainability.

## Tech stack and constraints

- HTML/CSS/JavaScript only (no frameworks)
- Web Audio API for tone generation
- LocalStorage for persistence (all user input should be persisted)
- Must work when loaded as local file
- No complex waveform design beyond simple tones (sine by default)

## Files

- `index.html`: Static page shell containing controls (global settings) and a container for the dynamic table
- `main.css`: Basic styling (card layout, table visuals)
- `main.js`: All logic (rendering, events, audio, persistence)
- `README.md`: Brief usage notes and license

## Page layout

The page should have a modern, clean look with header, footer and a centered card containing the controls and the table with the electrode rows.

At the top of the page, there should be a selector for the number of electrode (12, 16, or 22). There should be also a selector for the CI side (L or R) with R preselected. When changing the frequencies for the CI side, the should also change the frequencies for the other side to match. These two input should be in one row.

The UI then renders a table with one row per electrode and the following columns (headings):
- `#` – electrode index (1-based)
- `L f` – numeric editable integer input (Hz) for left ear frequency
- `R f` – numeric editable integer input (Hz) for right ear frequency
- `L` – play button for left ear (single beep)
- `R` – play button for right ear (single beep)
- `L/R` – play button for alternating left/right ear beeps (number of reps controlled by global input)
- `L+R` – toggle button for simultaneous left/right ear
- `[check]` – checkbox to select this row for batch play, heading should be a master checkbox to set/unset all
- `f ±` – buttons to increase and decrease the CI-side frequency by 1 or 10 Hz
- `L vol ±` – slider (−50 to +50) to adjust left ear volume for this row (relative to global volume)
- `R vol ±` – slider (−50 to +50) to adjust right ear volume for this row (relative to global volume)

The table should also have a bottom row with batch control buttons to play checked rows sequentially.

Below the table there should be inputs for beep duration (ms), and number of repetitions (reps) for alternating beeps (again, both controls in one row).

Also below the table there should be two global volume sliders (0 to 100) for L and R.

And finally, buttons for exporting and importing the entire settings as JSON file.

The buttons should have nice icons symbolizing their function. The toggle buttons should have a visual state (background color change).

The play buttons can use the "loudspeaker with one wave" unicode char (&#128265;), the alternating and simultaneous play/toggle buttons should use "loudspeaker with three waves" unicode char (&#128266;).
