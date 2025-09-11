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
    };

    function initControls() {
        // CI side radios (L/R)
        const storedSide = localStorage.getItem(KEYS.ciSide) || 'R';
        const sideRadios = $$('input[name="ciSide"]');
        sideRadios.forEach(r => {
            r.checked = r.value === storedSide;
            r.addEventListener('change', () => {
                if (r.checked) localStorage.setItem(KEYS.ciSide, r.value);
            });
        });

        // Electrode count radios (12/16/22)
        const storedCount = localStorage.getItem(KEYS.electrodeCount) || '12';
        const countRadios = $$('input[name="electrodeCount"]');
        countRadios.forEach(r => {
            r.checked = r.value === storedCount;
            r.addEventListener('change', () => {
                if (r.checked) localStorage.setItem(KEYS.electrodeCount, r.value);
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
                sideRadios.forEach(r => r.checked = r.value === (localStorage.getItem(KEYS.ciSide) || 'R'));
                const countRadios = document.querySelectorAll('input[name="electrodeCount"]');
                countRadios.forEach(r => r.checked = r.value === (localStorage.getItem(KEYS.electrodeCount) || '12'));
            } catch (err) {
                alert('Import failed: invalid file.');
            }
        };
        reader.readAsText(file);
    }

    window.addEventListener('DOMContentLoaded', initControls);
})();

// Note: the electrode table and audio logic will be added next.
