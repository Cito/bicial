(() => {
    'use strict';

    // Helpers
    const $ = (sel, el = document) => el.querySelector(sel);
    const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

    const KEYS = {
        ciSide: 'ciSide',
        electrodeCount: 'electrodeCount',
        volumeL: 'volumeL',
        volumeR: 'volumeR',
        beepDuration: 'beepDuration',
        beepReps: 'beepReps',
        // arrays per count
        fLPrefix: 'fL_',
        fRPrefix: 'fR_',
        // per-row adjustments
        adjLPrefix: 'adjL_',
        adjRPrefix: 'adjR_',
        // row selection set
        selectedPrefix: 'sel_',
    };

    // ---- storage helpers ----
    function getF(count, side) {
        const prefix = side === 'L' ? KEYS.fLPrefix : KEYS.fRPrefix;
        const key = prefix + count;
        const raw = localStorage.getItem(key);
        if (raw) {
            try { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length === Number(count)) return arr; } catch {}
        }
        // default log-spaced 200..7500 Hz
        const arr = logSpace(200, 7500, Number(count));
        localStorage.setItem(key, JSON.stringify(arr));
        return arr;
    }
    function setF(count, side, arr) { 
        const prefix = side === 'L' ? KEYS.fLPrefix : KEYS.fRPrefix;
        localStorage.setItem(prefix + count, JSON.stringify(arr));
    }


    function getAdj(count, side) {
        const prefix = side === 'L' ? KEYS.adjLPrefix : KEYS.adjRPrefix;
        const key = prefix + count;
        const raw = localStorage.getItem(key);
        if (raw) {
            try { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length === Number(count)) return arr; } catch {}
        }
        const arr = new Array(Number(count)).fill(0);
        localStorage.setItem(key, JSON.stringify(arr));
        return arr;
    }
    function setAdj(count, side, arr) {
        const prefix = side === 'L' ? KEYS.adjLPrefix : KEYS.adjRPrefix;
        localStorage.setItem(prefix + count, JSON.stringify(arr));
    }

    function getSelected(count) {
        const raw = localStorage.getItem(KEYS.selectedPrefix + count);
        if (!raw) return new Set();
        try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
    }
    function setSelected(count, set) {
        localStorage.setItem(KEYS.selectedPrefix + count, JSON.stringify([...set]));
    }

    function logSpace(start, end, num) {
        const out = [];
        const a = Math.log10(start), b = Math.log10(end);
        for (let i = 0; i < num; i++) out.push(Math.round(10 ** (a + (b - a) * i / (num - 1))));
        return out;
    }

    function initControls() {
        // CI side radios (L/R)
    const storedSide = localStorage.getItem(KEYS.ciSide) || 'R';
        const sideRadios = $$('input[name="ciSide"]');
        sideRadios.forEach(r => {
            r.checked = r.value === storedSide;
            r.addEventListener('change', () => {
                if (r.checked) localStorage.setItem(KEYS.ciSide, r.value);
        renderTable();
            });
        });

        // Electrode count radios (12/16/22)
    const storedCount = localStorage.getItem(KEYS.electrodeCount) || '12';
        const countRadios = $$('input[name="electrodeCount"]');
        countRadios.forEach(r => {
            r.checked = r.value === storedCount;
            r.addEventListener('change', () => {
                if (r.checked) localStorage.setItem(KEYS.electrodeCount, r.value);
        renderTable();
            });
        });

        // Volumes & timing
        const volL = $('#volumeL');
        if (volL) {
            volL.value = localStorage.getItem(KEYS.volumeL) || '75';
            volL.addEventListener('input', () => localStorage.setItem(KEYS.volumeL, volL.value));
        }
        const volR = $('#volumeR');
        if (volR) {
            volR.value = localStorage.getItem(KEYS.volumeR) || '50';
            volR.addEventListener('input', () => localStorage.setItem(KEYS.volumeR, volR.value));
        }
        const dur = $('#beepDuration');
        if (dur) {
            dur.value = localStorage.getItem(KEYS.beepDuration) || '1000';
            dur.addEventListener('change', () => localStorage.setItem(KEYS.beepDuration, dur.value));
        }
        const reps = $('#beepReps');
        if (reps) {
            reps.value = localStorage.getItem(KEYS.beepReps) || '3';
            reps.addEventListener('change', () => localStorage.setItem(KEYS.beepReps, reps.value));
        }

        // Export / Import
        const btnExport = $('#btnExport');
        if (btnExport) btnExport.addEventListener('click', doExport);
        const btnImport = $('#btnImport');
        const importFile = $('#importFile');
    if (btnImport && importFile) btnImport.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', doImport);

    // Initial table render
    renderTable();
    }

    function doExport() {
        const data = {
            ciSide: localStorage.getItem(KEYS.ciSide) || 'R',
            electrodeCount: localStorage.getItem(KEYS.electrodeCount) || '12',
            volumeL: localStorage.getItem(KEYS.volumeL) || '75',
            volumeR: localStorage.getItem(KEYS.volumeR) || '50',
            beepDuration: localStorage.getItem(KEYS.beepDuration) || '1000',
            beepReps: localStorage.getItem(KEYS.beepReps) || '3',
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bicial-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function doImport(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (data.ciSide) localStorage.setItem(KEYS.ciSide, data.ciSide);
                if (data.electrodeCount) localStorage.setItem(KEYS.electrodeCount, data.electrodeCount);
                if (data.volumeL) localStorage.setItem(KEYS.volumeL, data.volumeL);
                if (data.volumeR) localStorage.setItem(KEYS.volumeR, data.volumeR);
                if (data.beepDuration) localStorage.setItem(KEYS.beepDuration, data.beepDuration);
                if (data.beepReps) localStorage.setItem(KEYS.beepReps, data.beepReps);
                // reflect imported settings in UI
                const sideRadios = document.querySelectorAll('input[name="ciSide"]');
                sideRadios.forEach(r => r.checked = r.value === (localStorage.getItem(KEYS.ciSide) || 'right'));
                const countRadios = document.querySelectorAll('input[name="electrodeCount"]');
                countRadios.forEach(r => r.checked = r.value === (localStorage.getItem(KEYS.electrodeCount) || '12'));
                renderTable();
            } catch (err) {
                alert('Import failed: invalid file.');
            }
        };
        reader.readAsText(file);
    }

    window.addEventListener('DOMContentLoaded', initControls);

    // ---- table rendering ----
    function renderTable() {
        const container = document.getElementById('cfTableContainer');
        if (!container) return;
        const count = Number(localStorage.getItem(KEYS.electrodeCount) || '12');
        const ciSide = localStorage.getItem(KEYS.ciSide) || 'right';
        const fL = getF(count, 'L');
        const fR = getF(count, 'R');
        const adjL = getAdj(count, 'L');
        const adjR = getAdj(count, 'R');
        const selected = getSelected(count);

        const isCIRight = ciSide === 'R';

        const head = ['#', 'L', 'R', 'L', 'R', 'L/R', 'L+R', '✓', 'L vol +/-', 'R vol +/-'];

        let html = '<table class="cf-table"><thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
        for (let i = 0; i < count; i++) {
            const idx = i + 1;
            // numeric inputs: left ear freq, right ear freq
            const leftVal = fL[i];
            const rightVal = fR[i];
            html += '<tr>';
            html += `<td>${idx}</td>`;
            html += `<td><input type="number" class="ear-input" data-ear="L" data-i="${i}" value="${leftVal}" min="0" step="1"></td>`;
            html += `<td><input type="number" class="ear-input" data-ear="R" data-i="${i}" value="${rightVal}" min="0" step="1"></td>`;
            // play single left/right
            html += `<td><button class="btn-icon single" data-act="play" data-ear="L" data-i="${i}" title="Play left">🔉</button></td>`;
            html += `<td><button class="btn-icon single" data-act="play" data-ear="R" data-i="${i}" title="Play right">🔉</button></td>`;
            // alternating L/R
            html += `<td><button class="btn-icon lr" data-act="alt" data-i="${i}" title="Alternate L/R">🔊</button></td>`;
            // simultaneous toggle L+R
            html += `<td><button class="btn-icon lr" data-act="both" data-i="${i}" title="Simultaneous L+R">🔊</button></td>`;
            // selection checkbox
            const checked = selected.has(i) ? 'checked' : '';
            html += `<td><input type="checkbox" class="row-check" data-i="${i}" ${checked}></td>`;
            // per-row volume adjustments
            const adjLeft = adjL[i];
            const adjRight = adjR[i];
            html += `<td><input type="range" class="adj" min="-50" max="50" step="1" value="${adjLeft}" data-ear="L" data-i="${i}"></td>`;
            html += `<td><input type="range" class="adj" min="-50" max="50" step="1" value="${adjRight}" data-ear="R" data-i="${i}"></td>`;
            html += '</tr>';
        }
        // bottom batch row
        html += '<tr>' +
          '<td></td><td></td><td></td>' +
          `<td><button class="btn-icon single" data-act="play-all" data-ear="L" title="Play checked left">🔉</button></td>` +
          `<td><button class="btn-icon single" data-act="play-all" data-ear="R" title="Play checked right">🔉</button></td>` +
          `<td><button class="btn-icon lr" data-act="alt-all" title="Alternate checked">🔊</button></td>` +
          '<td></td>' +
          '<td></td>' + // keeps header alignment with checkbox column
          '<td></td><td></td>' +
        '</tr>';

        html += '</tbody></table>';
        container.innerHTML = html;

        // master checkbox in header
        const thead = container.querySelector('thead tr');
        if (thead) {
            const ths = thead.querySelectorAll('th');
            const checkThIndex = 7; // position of ✓ column in head array
            if (ths[checkThIndex]) {
                ths[checkThIndex].innerHTML = `<input type="checkbox" id="masterCheck">`;
                const master = container.querySelector('#masterCheck');
                if (master) {
                    master.addEventListener('change', () => {
                        const boxes = container.querySelectorAll('.row-check');
                        const set = new Set();
                        boxes.forEach((cb, j) => {
                            cb.checked = master.checked;
                            if (master.checked) set.add(Number(cb.dataset.i));
                        });
                        setSelected(count, set);
                    });
                }
            }
        }

        // input handlers
        container.querySelectorAll('.ear-input').forEach(inp => {
            inp.addEventListener('change', () => {
                const i = Number(inp.dataset.i);
                const ear = inp.dataset.ear; // L or R as displayed
                const val = Math.max(0, Math.round(Number(inp.value) || 0));
                inp.value = val;
                const otherEar = ear === 'L' ? 'R' : 'L';
                const c = Number(localStorage.getItem(KEYS.electrodeCount) || '12');
                const fL = getF(c, 'L'), fR = getF(c, 'R');
                setF(c, ear, ear === 'L' ? fL : fR);
                const ciSide = localStorage.getItem(KEYS.ciSide) || 'R';
                const isCiEar = ear === ciSide;
                if (isCiEar) {
                    setF(c, otherEar, ear === 'L' ? fR : fL);
                    const other = container.querySelector(`.ear-input[data-i="${i}"][data-ear="${otherEar}"]`);
                    if (other) other.value = String(val);
                } 
            });
        });
        container.querySelectorAll('.adj').forEach(sl => {
            sl.addEventListener('input', () => {
                const i = Number(sl.dataset.i);
                const ear = sl.dataset.ear; // L or R as displayed
                const v = Math.max(-50, Math.min(50, Math.round(Number(sl.value) || 0)));
                sl.value = v;
                const c = Number(localStorage.getItem(KEYS.electrodeCount) || '12');
                const cir = (localStorage.getItem(KEYS.ciSide) || 'R') === 'R';
                const adjLeft = getAdj(c, 'L');
                const adjRight = getAdj(c, 'R');
                if (ear === 'L') {
                    (cir ? adjLeft : adjRight)[i] = v;
                } else {
                    (cir ? adjRight : adjLeft)[i] = v;
                }
                setAdj(c, 'L', adjLeft);
                setAdj(c, 'R', adjRight);
            });
        });
        container.querySelectorAll('.row-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const c = Number(localStorage.getItem(KEYS.electrodeCount) || '12');
                const set = getSelected(c);
                const idx = Number(cb.dataset.i);
                if (cb.checked) set.add(idx); else set.delete(idx);
                setSelected(c, set);
            });
        });
    }
})();

// Note: the electrode table and audio logic will be added next.
