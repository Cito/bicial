(() => {
  "use strict";

  // Helpers
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const KEYS = {
    ciSide: "ciSide",
    electrodeCount: "electrodeCount",
    volumeL: "volumeL",
    volumeR: "volumeR",
    beepDuration: "beepDuration",
    beepReps: "beepReps",
    semiKeyLabel: "semiKeyLabel",
    // arrays per count
    fLPrefix: "fL_",
    fRPrefix: "fR_",
    // per-row adjustments
    adjLPrefix: "adjL_",
    adjRPrefix: "adjR_",
    // row selection set
    selectedPrefix: "sel_",
  };

  // ---- storage helpers ----
  function getF(count, side) {
    const prefix = side === "L" ? KEYS.fLPrefix : KEYS.fRPrefix;
    const key = prefix + count;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === Number(count)) return arr;
      } catch {}
    }
    // default log-spaced 200..7500 Hz
    const arr = logSpace(200, 7500, Number(count));
    localStorage.setItem(key, JSON.stringify(arr));
    return arr;
  }
  function setF(count, side, arr) {
    const prefix = side === "L" ? KEYS.fLPrefix : KEYS.fRPrefix;
    localStorage.setItem(prefix + count, JSON.stringify(arr));
  }

  function getAdj(count, side) {
    const prefix = side === "L" ? KEYS.adjLPrefix : KEYS.adjRPrefix;
    const key = prefix + count;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === Number(count)) return arr;
      } catch {}
    }
    const arr = new Array(Number(count)).fill(0);
    localStorage.setItem(key, JSON.stringify(arr));
    return arr;
  }
  function setAdj(count, side, arr) {
    const prefix = side === "L" ? KEYS.adjLPrefix : KEYS.adjRPrefix;
    localStorage.setItem(prefix + count, JSON.stringify(arr));
  }

  function getSelected(count) {
    const raw = localStorage.getItem(KEYS.selectedPrefix + count);
    if (!raw) return new Set();
    try {
      return new Set(JSON.parse(raw));
    } catch {
      return new Set();
    }
  }
  function setSelected(count, set) {
    localStorage.setItem(KEYS.selectedPrefix + count, JSON.stringify([...set]));
  }

  function logSpace(start, end, num) {
    const out = [];
    const a = Math.log10(start),
      b = Math.log10(end);
    for (let i = 0; i < num; i++)
      out.push(Math.round(10 ** (a + ((b - a) * i) / (num - 1))));
    return out;
  }

  function initControls() {
    // CI side radios (L/R)
    const storedSide = localStorage.getItem(KEYS.ciSide) || "R";
    const sideRadios = $$('input[name="ciSide"]');
    sideRadios.forEach((r) => {
      r.checked = r.value === storedSide;
      r.addEventListener("change", () => {
        if (r.checked) localStorage.setItem(KEYS.ciSide, r.value);
        renderTable();
      });
    });

    // Electrode count radios (12/16/22)
    const storedCount = localStorage.getItem(KEYS.electrodeCount) || "12";
    const countRadios = $$('input[name="electrodeCount"]');
    countRadios.forEach((r) => {
      r.checked = r.value === storedCount;
      r.addEventListener("change", () => {
        if (r.checked) localStorage.setItem(KEYS.electrodeCount, r.value);
        renderTable();
      });
    });

    // Volumes & timing
    const volL = $("#volumeL");
    if (volL) {
      volL.value = localStorage.getItem(KEYS.volumeL) || "75";
      volL.addEventListener("input", () => {
        localStorage.setItem(KEYS.volumeL, volL.value);
        // live-update any active L+R for left ear
        updateActiveBothGainsForEar("L");
      });
    }
    const volR = $("#volumeR");
    if (volR) {
      volR.value = localStorage.getItem(KEYS.volumeR) || "75";
      volR.addEventListener("input", () => {
        localStorage.setItem(KEYS.volumeR, volR.value);
        // live-update any active L+R for right ear
        updateActiveBothGainsForEar("R");
      });
    }
    const dur = $("#beepDuration");
    if (dur) {
      dur.value = localStorage.getItem(KEYS.beepDuration) || "500";
      dur.addEventListener("change", () =>
        localStorage.setItem(KEYS.beepDuration, dur.value)
      );
    }
    const reps = $("#beepReps");
    if (reps) {
      reps.value = localStorage.getItem(KEYS.beepReps) || "3";
      reps.addEventListener("change", () =>
        localStorage.setItem(KEYS.beepReps, reps.value)
      );
    }

    // Export / Import
    const btnExport = $("#btnExport");
    if (btnExport) btnExport.addEventListener("click", doExport);
    const btnImport = $("#btnImport");
    const importFile = $("#importFile");
    if (btnImport && importFile)
      btnImport.addEventListener("click", () => importFile.click());
    if (importFile) importFile.addEventListener("change", doImport);

    // Copy/Paste FAT actions
    const btnCopyFAT = document.getElementById("btnCopyFAT");
    if (btnCopyFAT) btnCopyFAT.addEventListener("click", doCopyFAT);
    const btnPasteFAT = document.getElementById("btnPasteFAT");
    if (btnPasteFAT) btnPasteFAT.addEventListener("click", doPasteFAT);

    // Reset buttons
    const btnResetAlign = $("#btnResetAlign");
    if (btnResetAlign) btnResetAlign.addEventListener("click", resetAlignments);
    const btnResetAll = $("#btnResetAll");
    if (btnResetAll) btnResetAll.addEventListener("click", resetEverything);

    // Help button
    const btnHelp = $("#btnHelp");
    if (btnHelp) btnHelp.addEventListener("click", showHelp);
    const lnkInstructions = $("#lnkInstructions");
    if (lnkInstructions)
      lnkInstructions.addEventListener("click", (e) => {
        e.preventDefault();
        showHelp();
      });
    const btnHelpCloseIcon = $("#btnHelpCloseIcon");
    if (btnHelpCloseIcon) btnHelpCloseIcon.addEventListener("click", hideHelp);

    // Initial table render
    renderTable();
    // Try to detect the character mapped to the physical Semicolon key and update titles
    initSemicolonLabel();
  }

  function getSemiLabel() {
    const s = localStorage.getItem(KEYS.semiKeyLabel);
    return s && s.length ? s : ";";
  }
  function formatSemiLabel(s) {
    if (!s) return ";";
    return s.toUpperCase();
  }
  function setSemiLabel(ch) {
    if (!ch) return;
    const c = String(ch);
    try {
      localStorage.setItem(KEYS.semiKeyLabel, c);
    } catch {}
  }
  async function initSemicolonLabel() {
    try {
      if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
        const map = await navigator.keyboard.getLayoutMap();
        const v = map && map.get("Semicolon");
        if (v && typeof v === "string" && v.length) {
          setSemiLabel(v);
          updateSimulTitles(v);
        }
      }
    } catch {}
  }
  function updateSimulTitles(label) {
    const lab = formatSemiLabel(label || getSemiLabel());
    document.querySelectorAll('.fat button[data-act="both"]').forEach((btn) => {
      const base = "Simultaneous L+R";
      const cur = btn.getAttribute("title") || base;
      const next = cur.replace(/\s*\([^)]*\)\s*$/, "");
      btn.setAttribute("title", `${next} (${lab})`);
    });
  }

  function doExport() {
    // Gather top-level settings
    const settings = {
      ciSide: localStorage.getItem(KEYS.ciSide) || "R",
      electrodeCount: localStorage.getItem(KEYS.electrodeCount) || "12",
      volumeL: localStorage.getItem(KEYS.volumeL) || "75",
      volumeR: localStorage.getItem(KEYS.volumeR) || "75",
      beepDuration: localStorage.getItem(KEYS.beepDuration) || "500",
      beepReps: localStorage.getItem(KEYS.beepReps) || "3",
    };

    // Gather arrays from localStorage for all counts present
    const arrays = { fL: {}, fR: {}, adjL: {}, adjR: {}, selected: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const put = (bucket, count, val) => {
        if (count) bucket[count] = val;
      };
      try {
        if (k.startsWith(KEYS.fLPrefix)) {
          const count = k.slice(KEYS.fLPrefix.length);
          put(arrays.fL, count, JSON.parse(localStorage.getItem(k)));
        } else if (k.startsWith(KEYS.fRPrefix)) {
          const count = k.slice(KEYS.fRPrefix.length);
          put(arrays.fR, count, JSON.parse(localStorage.getItem(k)));
        } else if (k.startsWith(KEYS.adjLPrefix)) {
          const count = k.slice(KEYS.adjLPrefix.length);
          put(arrays.adjL, count, JSON.parse(localStorage.getItem(k)));
        } else if (k.startsWith(KEYS.adjRPrefix)) {
          const count = k.slice(KEYS.adjRPrefix.length);
          put(arrays.adjR, count, JSON.parse(localStorage.getItem(k)));
        } else if (k.startsWith(KEYS.selectedPrefix)) {
          const count = k.slice(KEYS.selectedPrefix.length);
          put(arrays.selected, count, JSON.parse(localStorage.getItem(k)));
        }
      } catch {
        // ignore malformed entries
      }
    }

    const data = {
      app: "bicial",
      version: 1,
      savedAt: new Date().toISOString(),
      settings,
      arrays,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bicial-settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Copy/Paste FAT helpers ----
  function getNonCIEar() {
    const ciSide = localStorage.getItem(KEYS.ciSide) || "R";
    return ciSide === "R" ? "L" : "R";
  }
  function getCIEar() {
    const ciSide = localStorage.getItem(KEYS.ciSide) || "R";
    return ciSide === "R" ? "R" : "L";
  }
  async function doCopyFAT() {
    try {
      const container = document.getElementById("fatContainer");
      if (!container) return;
      const count = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
      const ear = getNonCIEar();
      const values = [];
      for (let i = 0; i < count; i++) {
        values.push(String(getDisplayedFreq(container, ear, i)));
      }
      const text = values.join("\n");
      await navigator.clipboard.writeText(text);
    } catch (err) {
      alert("Copy failed. Your browser may block clipboard access.");
    }
  }
  function normalizePasteText(raw) {
    if (!raw) return [];
    let s = String(raw)
      .replace(/[;\t\r ]+/g, "\n")
      .replace(/\u00A0/g, "\n");
    const lines = s
      .split(/\n+/)
      .map((x) => x.replace(/,/g, ".").trim())
      .filter((x) => x.length > 0);
    return lines;
  }
  async function doPasteFAT() {
    try {
      const container = document.getElementById("fatContainer");
      if (!container) return;
      const count = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
      const ear = getCIEar();
      const text = await navigator.clipboard.readText();
      const parts = normalizePasteText(text);
      if (parts.length !== count) {
        alert(`Paste failed: expected ${count} values, got ${parts.length}.`);
        return;
      }
      const nums = parts.map((p) => {
        const v = Math.round(Number(p));
        return Number.isFinite(v) && v >= 0 ? v : 0;
      });
      const c = count;
      const left = getF(c, "L");
      const right = getF(c, "R");
      for (let i = 0; i < c; i++) {
        if (ear === "L") left[i] = nums[i];
        else right[i] = nums[i];
      }
      setF(c, "L", left);
      setF(c, "R", right);
      for (let i = 0; i < c; i++) {
        const inp = container.querySelector(
          `.ear-input[data-ear="${ear}"][data-i="${i}"]`
        );
        if (inp) inp.value = String(nums[i]);
      }
      const ciIsLeft = ear === "L";
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      for (const [rowIndex, obj] of bothPlayers) {
        const v = nums[rowIndex];
        if (!Number.isFinite(v)) continue;
        try {
          if (ciIsLeft && obj.oscL) obj.oscL.frequency.setValueAtTime(v, now);
          if (!ciIsLeft && obj.oscR) obj.oscR.frequency.setValueAtTime(v, now);
        } catch {}
      }
    } catch (err) {
      alert(
        "Paste failed. Your browser may block clipboard access or the data was invalid."
      );
    }
  }

  function doImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        const s = data.settings || {};
        if (s.ciSide) localStorage.setItem(KEYS.ciSide, s.ciSide);
        if (s.electrodeCount)
          localStorage.setItem(KEYS.electrodeCount, String(s.electrodeCount));
        if (s.volumeL != null)
          localStorage.setItem(KEYS.volumeL, String(s.volumeL));
        if (s.volumeR != null)
          localStorage.setItem(KEYS.volumeR, String(s.volumeR));
        if (s.beepDuration != null)
          localStorage.setItem(KEYS.beepDuration, String(s.beepDuration));
        if (s.beepReps != null)
          localStorage.setItem(KEYS.beepReps, String(s.beepReps));

        const a = data.arrays || {};
        const writeBucket = (bucket, prefix) => {
          if (!bucket) return;
          Object.keys(bucket).forEach((count) => {
            try {
              localStorage.setItem(
                prefix + count,
                JSON.stringify(bucket[count])
              );
            } catch {}
          });
        };
        writeBucket(a.fL, KEYS.fLPrefix);
        writeBucket(a.fR, KEYS.fRPrefix);
        writeBucket(a.adjL, KEYS.adjLPrefix);
        writeBucket(a.adjR, KEYS.adjRPrefix);
        writeBucket(a.selected, KEYS.selectedPrefix);

        // reflect imported settings in UI
        const sideRadios = document.querySelectorAll('input[name="ciSide"]');
        sideRadios.forEach(
          (r) =>
            (r.checked = r.value === (localStorage.getItem(KEYS.ciSide) || "R"))
        );
        const countRadios = document.querySelectorAll(
          'input[name="electrodeCount"]'
        );
        countRadios.forEach(
          (r) =>
            (r.checked =
              r.value === (localStorage.getItem(KEYS.electrodeCount) || "12"))
        );
        const volL = document.getElementById("volumeL");
        if (volL) volL.value = localStorage.getItem(KEYS.volumeL) || "75";
        const volR = document.getElementById("volumeR");
        if (volR) volR.value = localStorage.getItem(KEYS.volumeR) || "75";
        const dur = document.getElementById("beepDuration");
        if (dur) dur.value = localStorage.getItem(KEYS.beepDuration) || "500";
        const reps = document.getElementById("beepReps");
        if (reps) reps.value = localStorage.getItem(KEYS.beepReps) || "3";
        renderTable();
      } catch (err) {
        alert("Import failed: invalid file.");
      }
      // allow re-importing the same file name
      try {
        e.target.value = "";
      } catch {}
    };
    reader.readAsText(file);
  }

  window.addEventListener("DOMContentLoaded", initControls);

  // ---- table rendering ----
  function renderTable() {
    const container = document.getElementById("fatContainer");
    if (!container) return;
    // stop any active L+R rows before re-render to avoid orphan audio
    stopAllBoth();
    // cancel any batch play sequences
    cancelAllBatches();
    const count = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
    const ciSide = localStorage.getItem(KEYS.ciSide) || "R";
    // reflect CI side in container for CSS-based styling of CI ear inputs
    try {
      container.setAttribute("data-ci-side", ciSide);
    } catch {}
    const fL = getF(count, "L");
    const fR = getF(count, "R");
    const adjL = getAdj(count, "L");
    const adjR = getAdj(count, "R");
    const selected = getSelected(count);

    const isCIRight = ciSide === "R";

    const head = [
      "#",
      "L f",
      "R f",
      "f ±",
      "L",
      "R",
      "L/R",
      "L+R",
      "✓",
      "L vol ±",
      "R vol ±",
    ];

    let html =
      '<table class="fat"><thead><tr>' +
      head.map((h) => `<th>${h}</th>`).join("") +
      "</tr></thead><tbody>";
    for (let i = 0; i < count; i++) {
      const idx = i + 1;
      // numeric inputs: left ear freq, right ear freq
      const leftVal = fL[i];
      const rightVal = fR[i];
      html += "<tr>";
      html += `<td>${idx}</td>`;
      html += `<td><input type="number" class="ear-input" data-ear="L" data-i="${i}" value="${leftVal}" min="0" step="1"></td>`;
      html += `<td><input type="number" class="ear-input" data-ear="R" data-i="${i}" value="${rightVal}" min="0" step="1"></td>`;
      // nudge non-CI ear frequency: -10, -1, +1, +10
      html +=
        `<td class=\"nudge-cell\">` +
        `<button class=\"btn-icon nudge\" data-act=\"nudge\" data-i=\"${i}\" data-delta=\"-10\" title=\"Non-CI -10 (A)\">⏬</button>` +
        `<button class=\"btn-icon nudge\" data-act=\"nudge\" data-i=\"${i}\" data-delta=\"-1\" title=\"Non-CI -1 (S)\">🔽</button>` +
        `<button class=\"btn-icon nudge\" data-act=\"nudge\" data-i=\"${i}\" data-delta=\"1\" title=\"Non-CI +1 (D)\">🔼</button>` +
        `<button class=\"btn-icon nudge\" data-act=\"nudge\" data-i=\"${i}\" data-delta=\"10\" title=\"Non-CI +10 (F)\">⏫</button>` +
        `</td>`;
      // play single left/right
      html += `<td><button class=\"btn-icon single\" data-act=\"play\" data-ear=\"L\" data-i=\"${i}\" title=\"Play left (J)\">🔉</button></td>`;
      html += `<td><button class=\"btn-icon single\" data-act=\"play\" data-ear=\"R\" data-i=\"${i}\" title=\"Play right (K)\">🔉</button></td>`;
      // alternating L/R
      html += `<td><button class=\"btn-icon lr\" data-act=\"alt\" data-i=\"${i}\" title=\"Alternate L/R (L)\">🔊</button></td>`;
      // simultaneous toggle L+R (title shows actual character for the physical semicolon key)
      html += `<td><button class=\"btn-icon lr\" data-act=\"both\" data-i=\"${i}\" title=\"Simultaneous L+R (${formatSemiLabel(
        getSemiLabel()
      )})\">🔊</button></td>`;
      // selection checkbox
      const checked = selected.has(i) ? "checked" : "";
      html += `<td><input type="checkbox" class="row-check" data-i="${i}" ${checked}></td>`;
      // per-row volume adjustments
      const adjLeft = adjL[i];
      const adjRight = adjR[i];
      html += `<td><input type="range" class="adj" min="-50" max="50" step="1" value="${adjLeft}" data-ear="L" data-i="${i}"></td>`;
      html += `<td><input type="range" class="adj" min="-50" max="50" step="1" value="${adjRight}" data-ear="R" data-i="${i}"></td>`;
      html += "</tr>";
    }
    // bottom batch row
    html +=
      "<tr>" +
      '<td colspan="4"></td>' +
      `<td><button class="btn-icon single" data-act="play-all" data-ear="L" title="Play checked left">🔉</button></td>` +
      `<td><button class="btn-icon single" data-act="play-all" data-ear="R" title="Play checked right">🔉</button></td>` +
      `<td><button class="btn-icon lr" data-act="alt-all" title="Alternate checked">🔊</button></td>` +
      '<td colspan="4"></td>' +
      "</tr>";

    html += "</tbody></table>";
    container.innerHTML = html;

    // master checkbox in header
    const thead = container.querySelector("thead tr");
    if (thead) {
      const ths = thead.querySelectorAll("th");
      const checkThIndex = head.indexOf("✓");
      if (ths[checkThIndex]) {
        ths[
          checkThIndex
        ].innerHTML = `<input type="checkbox" id="masterCheck">`;
        const master = container.querySelector("#masterCheck");
        if (master) {
          master.addEventListener("change", () => {
            const boxes = container.querySelectorAll(".row-check");
            const set = new Set();
            boxes.forEach((cb, j) => {
              cb.checked = master.checked;
              if (master.checked) set.add(Number(cb.dataset.i));
            });
            setSelected(count, set);
            updateBatchButtonsDisabled(container);
          });
        }
      }
    }

    // input handlers
    container.querySelectorAll(".ear-input").forEach((inp) => {
      const setActive = () => {
        const i = Number(inp.dataset.i);
        if (Number.isFinite(i)) lastActiveRow = i;
      };
      inp.addEventListener("focus", setActive);
      inp.addEventListener("input", setActive);
      inp.addEventListener("change", () => {
        setActive();
        const i = Number(inp.dataset.i);
        const ear = inp.dataset.ear; // 'L' or 'R'
        const val = Math.max(0, Math.round(Number(inp.value) || 0));
        inp.value = val;
        const otherEar = ear === "L" ? "R" : "L";
        const c = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
        const left = getF(c, "L");
        const right = getF(c, "R");
        if (ear === "L") left[i] = val;
        else right[i] = val;
        const ciSide = localStorage.getItem(KEYS.ciSide) || "R";
        const isCiEar = ear === ciSide;
        if (isCiEar) {
          if (ear === "L") right[i] = val;
          else left[i] = val;
          const other = container.querySelector(
            `.ear-input[data-i="${i}"][data-ear="${otherEar}"]`
          );
          if (other) other.value = String(val);
        }
        setF(c, "L", left);
        setF(c, "R", right);
      });
    });
    container.querySelectorAll(".adj").forEach((sl) => {
      const setActive = () => {
        const i = Number(sl.dataset.i);
        if (Number.isFinite(i)) lastActiveRow = i;
      };
      sl.addEventListener("focus", setActive);
      sl.addEventListener("input", () => {
        setActive();
        const i = Number(sl.dataset.i);
        const ear = sl.dataset.ear; // L or R as displayed
        const v = Math.max(
          -50,
          Math.min(50, Math.round(Number(sl.value) || 0))
        );
        sl.value = v;
        const c = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
        const cir = (localStorage.getItem(KEYS.ciSide) || "R") === "R";
        const adjLeft = getAdj(c, "L");
        const adjRight = getAdj(c, "R");
        if (ear === "L") {
          (cir ? adjLeft : adjRight)[i] = v;
        } else {
          (cir ? adjRight : adjLeft)[i] = v;
        }
        setAdj(c, "L", adjLeft);
        setAdj(c, "R", adjRight);
        // live-update gain if L+R is active for this row (map displayed ear to actual channel)
        const actualEar = cir ? ear : ear === "L" ? "R" : "L";
        updateLiveGainFor(i, actualEar);
      });
    });
    container.querySelectorAll(".row-check").forEach((cb) => {
      cb.addEventListener("change", () => {
        const c = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
        const set = getSelected(c);
        const idx = Number(cb.dataset.i);
        if (cb.checked) set.add(idx);
        else set.delete(idx);
        setSelected(c, set);
        updateBatchButtonsDisabled(container);
      });
    });

    // one-time event delegation for button clicks
    if (!container.dataset.bound) {
      container.addEventListener("click", onTableClick);
      container.dataset.bound = "1";
    }

    // Set initial disabled state for batch buttons
    updateBatchButtonsDisabled(container);
  }

  function updateBatchButtonsDisabled(container) {
    const { sel } = getSelectedSorted();
    const none = sel.length === 0;
    const btnL = container.querySelector(
      'button[data-act="play-all"][data-ear="L"]'
    );
    const btnR = container.querySelector(
      'button[data-act="play-all"][data-ear="R"]'
    );
    const btnAlt = container.querySelector('button[data-act="alt-all"]');
    if (btnL) btnL.disabled = none || !!batchTimers.L;
    if (btnR) btnR.disabled = none || !!batchTimers.R;
    if (btnAlt) btnAlt.disabled = none || !!batchTimers.ALT;
  }

  // ---- audio: single beep L/R ----
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // resume if suspended (browser policy)
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function getDisplayedFreq(container, ear, i) {
    const inp = container.querySelector(
      `.ear-input[data-ear="${ear}"][data-i="${i}"]`
    );
    return Math.max(0, Math.round(Number((inp && inp.value) || 0)));
  }

  function earGain(ear, i) {
    const count = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
    const base =
      (ear === "L"
        ? Number(localStorage.getItem(KEYS.volumeL) || "75")
        : Number(localStorage.getItem(KEYS.volumeR) || "75")) / 100;
    const adjArr = getAdj(count, ear);
    const adj = Number(adjArr[i] || 0); // -50..50
    const factor = 1 + adj / 50; // 0..2
    const g = Math.max(0, Math.min(1, base * factor));
    return g;
  }

  function updateLiveGainFor(rowIndex, ear) {
    const obj = bothPlayers.get(rowIndex);
    if (!obj) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const newGain = earGain(ear, rowIndex);
    try {
      const env = ear === "L" ? obj.envL : obj.envR;
      if (!env) return;
      env.gain.cancelScheduledValues(now);
      env.gain.setTargetAtTime(newGain, now, 0.03);
    } catch {}
  }

  function updateActiveBothGainsForEar(ear) {
    for (const [rowIndex, obj] of bothPlayers) {
      updateLiveGainFor(rowIndex, ear);
    }
  }

  function playSingleBeep(ear, i) {
    const container = document.getElementById("fatContainer");
    if (!container) return;
    const ctx = getAudioCtx();
    const freq = getDisplayedFreq(container, ear, i);
    const durMs = Math.max(
      10,
      Number(localStorage.getItem(KEYS.beepDuration) || "500")
    );
    const dur = durMs / 1000;
    const gainVal = earGain(ear, i);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    // Envelope
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    env.gain.setTargetAtTime(0, now + Math.max(0.02, dur - 0.02), 0.01);

    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = ear === "L" ? -1 : 1;
      osc.connect(env);
      env.connect(panner);
      panner.connect(ctx.destination);
    } else {
      // Fallback: split to channels via ChannelMerger
      const gL = ctx.createGain();
      const gR = ctx.createGain();
      gL.gain.value = ear === "L" ? 1 : 0;
      gR.gain.value = ear === "R" ? 1 : 0;
      const merger = ctx.createChannelMerger(2);
      osc.connect(env);
      env.connect(gL);
      env.connect(gR);
      gL.connect(merger, 0, 0);
      gR.connect(merger, 0, 1);
      merger.connect(ctx.destination);
    }

    osc.start(now);
    osc.stop(now + dur);
    osc.onended = () => {
      try {
        osc.disconnect();
      } catch {}
    };
  }

  // ---- simultaneous L+R toggle ----
  const bothPlayers = new Map(); // rowIndex -> { oscL, oscR, envL, envR, panL?, panR?, merger?, btn }
  function startBoth(i, btn) {
    const container = document.getElementById("fatContainer");
    if (!container) return;
    const ctx = getAudioCtx();
    const freqL = getDisplayedFreq(container, "L", i);
    const freqR = getDisplayedFreq(container, "R", i);
    const gLVal = earGain("L", i);
    const gRVal = earGain("R", i);
    const now = ctx.currentTime;

    const oscL = ctx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(freqL, now);
    const envL = ctx.createGain();
    envL.gain.setValueAtTime(0, now);
    envL.gain.linearRampToValueAtTime(gLVal, now + 0.02);
    const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panL) panL.pan.value = -1;

    const oscR = ctx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(freqR, now);
    const envR = ctx.createGain();
    envR.gain.setValueAtTime(0, now);
    envR.gain.linearRampToValueAtTime(gRVal, now + 0.02);
    const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panR) panR.pan.value = 1;

    let merger = null;
    if (panL && panR) {
      // modern path: panners to destination
      oscL.connect(envL);
      envL.connect(panL);
      panL.connect(ctx.destination);
      oscR.connect(envR);
      envR.connect(panR);
      panR.connect(ctx.destination);
    } else {
      // fallback: explicit channel routing
      merger = ctx.createChannelMerger(2);
      oscL.connect(envL);
      envL.connect(merger, 0, 0);
      oscR.connect(envR);
      envR.connect(merger, 0, 1);
      merger.connect(ctx.destination);
    }

    oscL.start(now);
    oscR.start(now);
    btn.classList.add("is-on");
    bothPlayers.set(i, { oscL, oscR, envL, envR, panL, panR, merger, btn });
  }

  function stopBoth(i, btnFromClick) {
    const obj = bothPlayers.get(i);
    if (!obj) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    try {
      obj.envL.gain.cancelScheduledValues(now);
      obj.envR.gain.cancelScheduledValues(now);
      obj.envL.gain.setTargetAtTime(0, now, 0.02);
      obj.envR.gain.setTargetAtTime(0, now, 0.02);
    } catch {}
    // stop oscillators shortly after ramp down using audio timeline (no JS timers)
    try {
      obj.oscL.stop(now + 0.06);
    } catch {}
    try {
      obj.oscR.stop(now + 0.06);
    } catch {}
    const btn = btnFromClick || obj.btn;
    let ended = 0;
    function cleanup() {
      ended++;
      if (ended < 2) return;
      try {
        obj.oscL.disconnect();
      } catch {}
      try {
        obj.oscR.disconnect();
      } catch {}
      try {
        obj.envL.disconnect();
      } catch {}
      try {
        obj.envR.disconnect();
      } catch {}
      try {
        obj.panL && obj.panL.disconnect();
      } catch {}
      try {
        obj.panR && obj.panR.disconnect();
      } catch {}
      try {
        obj.merger && obj.merger.disconnect();
      } catch {}
      if (btn) btn.classList.remove("is-on");
      bothPlayers.delete(i);
    }
    try {
      obj.oscL.onended = cleanup;
    } catch {}
    try {
      obj.oscR.onended = cleanup;
    } catch {}
  }

  function stopAllBoth() {
    for (const [i] of bothPlayers) stopBoth(i);
  }

  // Track last-active row for keyboard shortcuts and handle button actions
  let lastActiveRow = null;
  function onTableClick(e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (btn.dataset.i != null) {
      const idx = Number(btn.dataset.i);
      if (Number.isFinite(idx)) lastActiveRow = idx;
    }
    if (act === "play") {
      const ear = btn.dataset.ear; // 'L' or 'R'
      const i = Number(btn.dataset.i);
      if (Number.isFinite(i) && (ear === "L" || ear === "R"))
        playSingleBeep(ear, i);
    } else if (act === "alt") {
      const i = Number(btn.dataset.i);
      if (!Number.isFinite(i)) return;
      runAltSequence(btn, i);
    } else if (act === "both") {
      const i = Number(btn.dataset.i);
      if (!Number.isFinite(i)) return;
      if (bothPlayers.has(i)) stopBoth(i, btn);
      else startBoth(i, btn);
    } else if (act === "play-all") {
      const ear = btn.dataset.ear;
      if (ear !== "L" && ear !== "R") return;
      startBatchSingle(ear, btn);
    } else if (act === "alt-all") {
      startBatchAlt(btn);
    } else if (act === "nudge") {
      const i = Number(btn.dataset.i);
      const delta = Math.round(Number(btn.dataset.delta) || 0);
      if (!Number.isFinite(i) || !delta) return;
      nudgeNonCi(i, delta);
    }
    // other actions will be implemented later
  }

  // Global keyboard shortcuts (ignore when typing or help is open)

  function blurIfNudgeFocused() {
    const ae = document.activeElement;
    if (!ae) return;
    // Only act on buttons inside the frequency alignment table
    const inTable = typeof ae.closest === "function" && ae.closest(".fat");
    if (
      inTable &&
      ae.tagName === "BUTTON" &&
      ae.classList &&
      ae.classList.contains("btn-icon")
    ) {
      try {
        ae.blur();
      } catch {}
    }
  }

  document.addEventListener("keydown", (e) => {
    const help = document.getElementById("helpView");
    if (help && !help.classList.contains("hidden")) return;
    const t = e.target;
    const tag = t && t.tagName ? t.tagName.toLowerCase() : "";
    const isEditable =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      (t && t.isContentEditable);
    if (isEditable) return;
    if (lastActiveRow == null) return;

    const key = (e.key || "").toLowerCase();
    const code = e.code || "";
    // ASDF: nudge non-CI ear
    if (key === "a") {
      nudgeNonCi(lastActiveRow, -10);
      e.preventDefault();
      blurIfNudgeFocused();
      return;
    }
    if (key === "s") {
      nudgeNonCi(lastActiveRow, -1);
      e.preventDefault();
      blurIfNudgeFocused();
      return;
    }
    if (key === "d") {
      nudgeNonCi(lastActiveRow, +1);
      e.preventDefault();
      blurIfNudgeFocused();
      return;
    }
    if (key === "f") {
      nudgeNonCi(lastActiveRow, +10);
      e.preventDefault();
      blurIfNudgeFocused();
      return;
    }
    // J/K/L/Semicolon: speakers
    if (key === "j") {
      playSingleBeep("L", lastActiveRow);
      e.preventDefault();
      blurIfNudgeFocused();
      return;
    }
    if (key === "k") {
      playSingleBeep("R", lastActiveRow);
      e.preventDefault();
      blurIfNudgeFocused();
      return;
    }
    if (key === "l") {
      const altBtn = document.querySelector(
        `.fat button[data-act="alt"][data-i="${lastActiveRow}"]`
      );
      if (altBtn) {
        runAltSequence(altBtn, lastActiveRow);
        e.preventDefault();
        blurIfNudgeFocused();
      }
      return;
    }
    if (code === "Semicolon") {
      // Update the label to reflect current layout mapping
      const observed = e.key && e.key.length ? e.key : getSemiLabel();
      if (observed && observed !== getSemiLabel()) {
        setSemiLabel(observed);
        updateSimulTitles(observed);
      }
      const bothBtn = document.querySelector(
        `.fat button[data-act="both"][data-i="${lastActiveRow}"]`
      );
      if (bothBtn) {
        if (bothPlayers.has(lastActiveRow)) stopBoth(lastActiveRow, bothBtn);
        else startBoth(lastActiveRow, bothBtn);
        e.preventDefault();
        blurIfNudgeFocused();
      }
      return;
    }
  });

  function nudgeNonCi(rowIndex, delta) {
    const container = document.getElementById("fatContainer");
    if (!container) return;
    const c = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
    const ciSide = localStorage.getItem(KEYS.ciSide) || "R";
    const targetEar = ciSide === "R" ? "L" : "R"; // non-CI ear
    const current = getDisplayedFreq(container, targetEar, rowIndex);
    const next = Math.max(0, current + delta);
    // update input UI
    const inp = container.querySelector(
      `.ear-input[data-ear="${targetEar}"][data-i="${rowIndex}"]`
    );
    if (inp) inp.value = String(next);
    // update storage arrays
    const left = getF(c, "L");
    const right = getF(c, "R");
    if (targetEar === "L") left[rowIndex] = next;
    else right[rowIndex] = next;
    setF(c, "L", left);
    setF(c, "R", right);
    // live update if simultaneous L+R is active for this row
    const obj = bothPlayers.get(rowIndex);
    if (obj) {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      try {
        if (targetEar === "L" && obj.oscL)
          obj.oscL.frequency.setValueAtTime(next, now);
        if (targetEar === "R" && obj.oscR)
          obj.oscR.frequency.setValueAtTime(next, now);
      } catch {}
    }
  }

  // ---- alternating L/R sequence ----
  const altTimers = new Map(); // rowIndex -> [timeoutIds]
  function runAltSequence(button, rowIndex) {
    // guard against double-start
    if (altTimers.has(rowIndex)) return;
    const reps = Math.max(
      1,
      Math.floor(Number(localStorage.getItem(KEYS.beepReps) || "3"))
    );
    const durMs = Math.max(
      10,
      Math.floor(Number(localStorage.getItem(KEYS.beepDuration) || "500"))
    );
    const perRep = 4.5 * durMs; // L beep (dur), pause (dur), R beep (dur), inter-rep gap (1.5*dur)
    const ids = [];
    altTimers.set(rowIndex, ids);
    button.classList.add("is-on");
    button.disabled = true;

    for (let r = 0; r < reps; r++) {
      const base = r * perRep;
      ids.push(setTimeout(() => playSingleBeep("L", rowIndex), base + 0));
      ids.push(
        setTimeout(() => playSingleBeep("R", rowIndex), base + 2 * durMs)
      );
    }
    const total = (reps - 1) * perRep + 3 * durMs; // last R beep finishes here
    ids.push(
      setTimeout(() => {
        // cleanup
        ids.forEach((id) => clearTimeout(id));
        altTimers.delete(rowIndex);
        button.classList.remove("is-on");
        button.disabled = false;
      }, total + 10)
    );
  }

  // ---- batch sequential playback (bottom row) ----
  const batchTimers = { L: null, R: null, ALT: null };

  function getSelectedSorted() {
    const count = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
    const sel = [...getSelected(count)];
    sel.sort((a, b) => a - b);
    return { count, sel };
  }

  // ---- Help view ----
  let readmeLoaded = false;
  async function showHelp() {
    // stop playing and timers so no dangling audio continues in help view
    stopAllBoth();
    cancelAllBatches();
    const app = document.getElementById("appView");
    const help = document.getElementById("helpView");
    const infoBtn = document.getElementById("btnHelp");
    const closeBtn = document.getElementById("btnHelpCloseIcon");
    if (!app || !help) return;
    app.classList.add("hidden");
    help.classList.remove("hidden");
    help.setAttribute("aria-hidden", "false");
    if (infoBtn) infoBtn.classList.add("hidden");
    if (closeBtn) closeBtn.classList.remove("hidden");
    if (!readmeLoaded) await loadReadme();
  }

  function hideHelp() {
    const app = document.getElementById("appView");
    const help = document.getElementById("helpView");
    const infoBtn = document.getElementById("btnHelp");
    const closeBtn = document.getElementById("btnHelpCloseIcon");
    if (!app || !help) return;
    help.classList.add("hidden");
    help.setAttribute("aria-hidden", "true");
    app.classList.remove("hidden");
    if (closeBtn) closeBtn.classList.add("hidden");
    if (infoBtn) infoBtn.classList.remove("hidden");
  }

  async function loadReadme() {
    const el = document.getElementById("helpContent");
    if (!el) return;
    const render = (text) => {
      el.innerHTML = mdToHtml(text);
      el.querySelectorAll("a[href]").forEach((a) => {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      });
      readmeLoaded = true;
    };
    try {
      const res = await fetch("README.md", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      render(text);
    } catch (err) {
      // CORS or network issue. Provide concise fallback with separate paragraphs and a tip.
      el.innerHTML = `
                <p>Could not fetch README (likely due to browser restrictions when opened locally).</p>
                <p>You can open the <a href="README.md" target="_blank" rel="noopener">local file</a> in a new tab or view it <a href="https://github.com/cito/bicial" target="_blank" rel="noopener">on GitHub</a>.</p>
                <p>Tip: serving this folder over HTTP (for example, using a simple local web server) avoids these restrictions.</p>
            `;
    }
  }

  function mdToHtml(src) {
    // very small, safe-ish markdown renderer (headings, lists, paragraphs, code blocks, links, inline code)
    const escapeHtml = (s) =>
      s.replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
      );
    const lines = src.split(/\r?\n/);
    let out = "";
    let inCode = false;
    let inList = false;
    let para = [];
    const flushPara = () => {
      if (!para.length) return;
      const text = para.join(" ");
      out += `<p>${inline(text)}</p>`;
      para = [];
    };
    const flushList = () => {
      if (inList) {
        out += "</ul>";
        inList = false;
      }
    };
    const inline = (t) => {
      let s = escapeHtml(t);
      // links
      s = s.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (m, a, b) => `<a href="${escapeHtml(b)}">${escapeHtml(a)}</a>`
      );
      // inline code
      s = s.replace(/`([^`]+)`/g, (m, a) => `<code>${a}</code>`);
      return s;
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (raw.startsWith("```")) {
        flushPara();
        if (!inCode) {
          out += "<pre><code>";
          inCode = true;
        } else {
          out += "</code></pre>";
          inCode = false;
        }
        continue;
      }
      if (inCode) {
        out += escapeHtml(raw) + "\n";
        continue;
      }
      if (/^\s*$/.test(raw)) {
        flushPara();
        flushList();
        continue;
      }
      const h = raw.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        flushPara();
        flushList();
        const level = h[1].length;
        out += `<h${level}>${inline(h[2])}</h${level}>`;
        continue;
      }
      const li = raw.match(/^[-*]\s+(.*)$/);
      if (li) {
        flushPara();
        if (!inList) {
          out += "<ul>";
          inList = true;
        }
        out += `<li>${inline(li[1])}</li>`;
        continue;
      }
      // paragraph line
      para.push(raw.trim());
    }
    flushPara();
    flushList();
    if (inCode) out += "</code></pre>";
    return out;
  }

  function startBatchSingle(ear, btn) {
    if (batchTimers[ear]) return; // already running for this ear
    const { count, sel } = getSelectedSorted();
    if (!sel.length) return;
    const dur = Math.max(
      10,
      Math.floor(Number(localStorage.getItem(KEYS.beepDuration) || "1000"))
    );
    const ids = [];
    batchTimers[ear] = { ids, btn };
    btn.classList.add("is-on");
    btn.disabled = true;
    sel.forEach((rowIdx, k) => {
      const t = k * (2 * dur);
      ids.push(setTimeout(() => playSingleBeep(ear, rowIdx), t));
    });
    const total = (sel.length - 1) * (2 * dur) + dur;
    ids.push(setTimeout(() => finishBatch(ear), total + 10));
  }

  function startBatchAlt(btn) {
    if (batchTimers.ALT) return;
    const { count, sel } = getSelectedSorted();
    if (!sel.length) return;
    const dur = Math.max(
      10,
      Math.floor(Number(localStorage.getItem(KEYS.beepDuration) || "1000"))
    );
    const reps = Math.max(
      1,
      Math.floor(Number(localStorage.getItem(KEYS.beepReps) || "3"))
    );
    const perRow = 4 * dur; // time budget per row for previous model; keep for total calc
    const perRep = sel.length * perRow + 0.5 * dur; // overall rep length incl. 1.5d gap between reps
    const ids = [];
    batchTimers.ALT = { ids, btn };
    btn.classList.add("is-on");
    btn.disabled = true;
    for (let r = 0; r < reps; r++) {
      const repBase = r * perRep;
      // First: all L beeps top-to-bottom
      sel.forEach((rowIdx, j) => {
        const t = repBase + j * (2 * dur);
        ids.push(setTimeout(() => playSingleBeep("L", rowIdx), t));
      });
      // After finishing last L and its pause, start all R beeps
      const rBlockBase = repBase + sel.length * (2 * dur);
      sel.forEach((rowIdx, j) => {
        const t = rBlockBase + j * (2 * dur);
        ids.push(setTimeout(() => playSingleBeep("R", rowIdx), t));
      });
    }
    const total =
      (reps - 1) * perRep + (sel.length - 1) * perRow + 2 * dur + dur; // last R end time
    ids.push(setTimeout(() => finishBatch("ALT"), total + 10));
  }

  function finishBatch(kind) {
    const slot = batchTimers[kind];
    if (!slot) return;
    slot.ids.forEach((id) => clearTimeout(id));
    if (slot.btn) {
      slot.btn.classList.remove("is-on");
      slot.btn.disabled = false;
    }
    batchTimers[kind] = null;
  }

  function cancelAllBatches() {
    ["L", "R", "ALT"].forEach((k) => {
      const slot = batchTimers[k];
      if (!slot) return;
      slot.ids.forEach((id) => clearTimeout(id));
      if (slot.btn) {
        slot.btn.classList.remove("is-on");
        slot.btn.disabled = false;
      }
      batchTimers[k] = null;
    });
  }

  // ---- reset logic ----
  function keysForAllCounts() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k === KEYS.ciSide ||
        k === KEYS.electrodeCount ||
        k === KEYS.volumeL ||
        k === KEYS.volumeR ||
        k === KEYS.beepDuration ||
        k === KEYS.beepReps ||
        k.startsWith(KEYS.fLPrefix) ||
        k.startsWith(KEYS.fRPrefix) ||
        k.startsWith(KEYS.adjLPrefix) ||
        k.startsWith(KEYS.adjRPrefix) ||
        k.startsWith(KEYS.selectedPrefix)
      )
        keys.push(k);
    }
    return keys;
  }

  function resetEverything() {
    if (!confirm("Reset everything? This will clear all settings.")) return;
    // stop audio and timers
    stopAllBoth();
    cancelAllBatches();
    // Clear only our app keys from localStorage
    const keys = keysForAllCounts();
    keys.forEach((k) => localStorage.removeItem(k));
    // Re-init UI controls with defaults and re-render
    initControls();
  }

  function resetAlignments() {
    if (
      !confirm(
        "Reset alignments? This keeps global settings and CI-side center frequencies, and mirrors them to the other ear."
      )
    )
      return;
    stopAllBoth();
    cancelAllBatches();
    const ciSide = localStorage.getItem(KEYS.ciSide) || "R";
    const count = Number(localStorage.getItem(KEYS.electrodeCount) || "12");
    // Get CI ear frequencies for current count
    const fCi = getF(count, ciSide);
    const other = ciSide === "R" ? "L" : "R";
    // Mirror to non-CI ear and persist
    setF(count, other, [...fCi]);
    // Reset per-row adjustments for both ears
    setAdj(count, "L", new Array(count).fill(0));
    setAdj(count, "R", new Array(count).fill(0));
    // Clear selected rows
    setSelected(count, new Set());
    // Keep global volumes and timings as-is; refresh UI
    renderTable();
  }
})();
