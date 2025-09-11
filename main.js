// Export settings to JSON file
function exportSettings() {
    const settings = {};
    // Export all relevant keys
    settings.ciSide = localStorage.getItem('ciSide');
    settings.electrodeCount = localStorage.getItem('electrodeCount');
    settings.cf_12 = localStorage.getItem('cf_12');
    settings.cf_16 = localStorage.getItem('cf_16');
    settings.cf_22 = localStorage.getItem('cf_22');
    settings.af_12 = localStorage.getItem('af_12');
    settings.af_16 = localStorage.getItem('af_16');
    settings.af_22 = localStorage.getItem('af_22');
    const blob = new Blob([JSON.stringify(settings, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bicial-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import settings from JSON file
function importSettings() {
    const input = document.getElementById('importFile');
    if (!input) return;
    input.value = '';
    input.click();
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const settings = JSON.parse(evt.target.result);
                if (settings.ciSide) localStorage.setItem('ciSide', settings.ciSide);
                if (settings.electrodeCount) localStorage.setItem('electrodeCount', settings.electrodeCount);
                if (settings.cf_12) localStorage.setItem('cf_12', settings.cf_12);
                if (settings.cf_16) localStorage.setItem('cf_16', settings.cf_16);
                if (settings.cf_22) localStorage.setItem('cf_22', settings.cf_22);
                if (settings.af_12) localStorage.setItem('af_12', settings.af_12);
                if (settings.af_16) localStorage.setItem('af_16', settings.af_16);
                if (settings.af_22) localStorage.setItem('af_22', settings.af_22);
                // Refresh UI
                location.reload();
            } catch (err) {
                alert('Import failed: Invalid file format.');
            }
        };
        reader.readAsText(file);
    };
}

// CI side selector logic
function getStoredCISide() {
    const side = localStorage.getItem('ciSide');
    return side === 'left' ? 'left' : 'right';
}

function setStoredCISide(side) {
    localStorage.setItem('ciSide', side);
}

function getStoredAFs(count) {
    const key = 'af_' + count;
    let afs = localStorage.getItem(key);
    if (afs) {
        try {
            afs = JSON.parse(afs);
        } catch {
            afs = null;
        }
    }
    if (!afs || !Array.isArray(afs) || afs.length !== Number(count)) {
        afs = getStoredCFs(count);
        localStorage.setItem(key, JSON.stringify(afs));
    }
    return afs;
}

function setStoredAFs(count, afs) {
    const key = 'af_' + count;
    localStorage.setItem(key, JSON.stringify(afs));
}

// Initialize electrode count from localStorage or default

function logSpace(start, end, num) {
    // Returns array of num logarithmically spaced values between start and end
    const arr = [];
    const logStart = Math.log10(start);
    const logEnd = Math.log10(end);
    for (let i = 0; i < num; i++) {
        const val = Math.pow(10, logStart + (logEnd - logStart) * i / (num - 1));
        arr.push(Math.round(val));
    }
    return arr;
}

function getStoredCFs(count) {
    const key = 'cf_' + count;
    let cfs = localStorage.getItem(key);
    if (cfs) {
        try {
            cfs = JSON.parse(cfs);
        } catch {
            cfs = null;
        }
    }
    if (!cfs || !Array.isArray(cfs) || cfs.length !== Number(count)) {
        cfs = logSpace(200, 7500, Number(count));
        localStorage.setItem(key, JSON.stringify(cfs));
    }
    return cfs;
}

function setStoredCFs(count, cfs) {
    const key = 'cf_' + count;
    localStorage.setItem(key, JSON.stringify(cfs));
}

function renderCFTable(count) {
    const container = document.getElementById('cfTableContainer');
    if (!container) return;
    const cfs = getStoredCFs(count);
    const afs = getStoredAFs(count);
    const ciSide = window.getStoredCISide();
    let html = '<table class="main" style="margin:2px auto;border-collapse:collapse;">';
    if (ciSide === 'right') {
        html += '<thead><tr>' +
            '<th style="text-align:center;padding:0.5rem;">#</th>' +
            '<th style="text-align:center;padding:0.5rem;" title="alignment frequency">af</th>' +
            '<th style="text-align:center;padding:0.5rem;" title="center frequency">cf</th>' +
            '<th style="text-align:center;padding:0.5rem;">af</th>' +
            '<th style="text-align:center;padding:0.5rem;">cf</th>' +
            '<th style="text-align:center;padding:0.5rem;">af/cf</th>' +
            '<th style="text-align:center;padding:0.5rem;">' +
                '<input type="checkbox" id="master-check" style="margin:0;vertical-align:middle;" title="Select/unselect all" />' +
            '</th>' +
            '</tr></thead><tbody>';
    } else {
        html += '<thead><tr>' +
            '<th style="text-align:center;padding:0.5rem;">#</th>' +
            '<th style="text-align:center;padding:0.5rem;" title="center frequency">cf</th>' +
            '<th style="text-align:center;padding:0.5rem;" title="alignment frequency">af</th>' +
            '<th style="text-align:center;padding:0.5rem;">cf</th>' +
            '<th style="text-align:center;padding:0.5rem;">af</th>' +
            '<th style="text-align:center;padding:0.5rem;">cf/af</th>' +
            '<th style="text-align:center;padding:0.5rem;">' +
                '<input type="checkbox" id="master-check" style="margin:0;vertical-align:middle;" title="Select/unselect all" />' +
            '</th>' +
            '</tr></thead><tbody>';
    }
    // Master checkbox event handler
    setTimeout(() => {
        const masterCheck = document.getElementById('master-check');
        if (masterCheck) {
            masterCheck.addEventListener('change', function() {
                const checks = container.querySelectorAll('.row-check');
                checks.forEach(cb => { cb.checked = masterCheck.checked; });
            });
        }
    }, 0);
    for (let i = 0; i < cfs.length; i++) {
        if (ciSide === 'right') {
            html += `<tr><td style="text-align:center;">${i+1}</td>` +
                `<td style="text-align:center;">
                    <input type="number" step="1" min="0" value="${afs[i]}" data-idx="${i}" class="af-input" style="width:6em;margin:2px;padding:0.4em 0.5em;font-size:1.1em;border-radius:5px;border:1px solid #ccc;text-align:right;" />
                </td>` +
                `<td style="text-align:center;">
                    <input type="number" step="1" min="0" value="${cfs[i]}" data-idx="${i}" class="cf-input" style="width:6em;margin:2px;padding:0.4em 0.5em;font-size:1.1em;border-radius:5px;border:1px solid #ccc;text-align:right;" />
                </td>` +
                `<td style="text-align:center;">
                    <button class="beep-btn" data-type="af" data-idx="${i}" title="Play af beep" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#f7fafd;cursor:pointer;">🔉</button>
                </td>` +
                `<td style="text-align:center;">
                    <button class="beep-btn" data-type="cf" data-idx="${i}" title="Play cf beep" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#f7fafd;cursor:pointer;">🔉</button>
                </td>` +
                `<td style="text-align:center;">
                    <button class="beep-btn" data-type="afcf" data-idx="${i}" title="Play alternating af/cf beep" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#f7fafd;cursor:pointer;">🔊</button>
                </td>` +
                `<td style="text-align:center;">
                    <input type="checkbox" class="row-check" data-idx="${i}" />
                </td></tr>`;
        } else {
            html += `<tr><td style="text-align:center;">${i+1}</td>` +
                `<td style="text-align:center;">
                    <input type="number" step="1" min="0" value="${cfs[i]}" data-idx="${i}" class="cf-input" style="width:6em;margin:2px;padding:0.4em 0.5em;font-size:1.1em;border-radius:5px;border:1px solid #ccc;text-align:right;" />
                </td>` +
                `<td style="text-align:center;">
                    <input type="number" step="1" min="0" value="${afs[i]}" data-idx="${i}" class="af-input" style="width:6em;margin:2px;padding:0.4em 0.5em;font-size:1.1em;border-radius:5px;border:1px solid #ccc;text-align:right;" />
                </td>` +
                `<td style="text-align:center;">
                    <button class="beep-btn" data-type="cf" data-idx="${i}" title="Play cf beep" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#f7fafd;cursor:pointer;">🔉</button>
                </td>` +
                `<td style="text-align:center;">
                    <button class="beep-btn" data-type="af" data-idx="${i}" title="Play af beep" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#f7fafd;cursor:pointer;">🔉</button>
                </td>` +
                `<td style="text-align:center;">
                    <button class="beep-btn" data-type="cfaf" data-idx="${i}" title="Play alternating cf/af beep" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#f7fafd;cursor:pointer;">🔊</button>
                </td>` +
                `<td style="text-align:center;">
                    <input type="checkbox" class="row-check" data-idx="${i}" />
                </td></tr>`;
        }
    }
    // Add final row with only the three button columns
    if (ciSide === 'right') {
        html += `<tr>` +
            `<td></td><td></td><td></td>` +
            `<td style="text-align:center;">
                <button class="beep-btn" data-type="af-all" title="Play checked af beeps" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#e0eafc;cursor:pointer;">🔉</button>
            </td>` +
            `<td style="text-align:center;">
                <button class="beep-btn" data-type="cf-all" title="Play checked cf beeps" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#e0eafc;cursor:pointer;">🔉</button>
            </td>` +
            `<td style="text-align:center;">
                <button class="beep-btn" data-type="afcf-all" title="Play checked af/cf beeps alternating" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#e0eafc;cursor:pointer;">🔊</button>
            </td>` +
            `<td></td></tr>`;
    } else {
        html += `<tr>` +
            `<td></td><td></td><td></td>` +
            `<td style="text-align:center;">
                <button class="beep-btn" data-type="cf-all" title="Play checked cf beeps" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#e0eafc;cursor:pointer;">🔉</button>
            </td>` +
            `<td style="text-align:center;">
                <button class="beep-btn" data-type="af-all" title="Play checked af beeps" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#e0eafc;cursor:pointer;">🔉</button>
            </td>` +
            `<td style="text-align:center;">
                <button class="beep-btn" data-type="cfaf-all" title="Play checked cf/af beeps alternating" style="width:2em;height:2em;font-size:1.3em;border-radius:6px;border:1px solid #bbb;background:#e0eafc;cursor:pointer;">🔊</button>
            </td>` +
            `<td></td></tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    // Add event listeners for cf inputs
    Array.from(container.querySelectorAll('.cf-input')).forEach(input => {
        input.addEventListener('change', function() {
            const idx = Number(input.dataset.idx);
            cfs[idx] = parseInt(input.value);
            afs[idx] = cfs[idx];
            setStoredCFs(count, cfs);
            setStoredAFs(count, afs);
            // Update af input value
            const afInput = container.querySelector(`.af-input[data-idx='${idx}']`);
            if (afInput) afInput.value = afs[idx];
        });
    });
    // Add event listeners for af inputs
    Array.from(container.querySelectorAll('.af-input')).forEach(input => {
        input.addEventListener('change', function() {
            const idx = Number(input.dataset.idx);
            afs[idx] = parseInt(input.value);
            setStoredAFs(count, afs);
        });
    });
    // Add event listeners for beep buttons
    Array.from(container.querySelectorAll('.beep-btn')).forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = btn.dataset.idx !== undefined ? Number(btn.dataset.idx) : null;
            const type = btn.dataset.type;
            const ciSide = window.getStoredCISide();
            let cfVolume = 0.75, afVolume = 0.75;
            const vcf = localStorage.getItem('cfVolume');
            if (vcf) cfVolume = parseInt(vcf, 10) / 100;
            const vaf = localStorage.getItem('afVolume');
            if (vaf) afVolume = parseInt(vaf, 10) / 100;
            let duration = localStorage.getItem('beepDuration');
            duration = duration ? parseInt(duration, 10) / 1000 : 0.15;
            let reps = 3;
            const repInput = document.getElementById('beepReps');
            if (repInput && repInput.value) reps = Math.max(1, parseInt(repInput.value));
            // Button logic matches heading and column order
            if (type === 'cf') {
                playBeep(cfs[idx], ciSide, { volume: cfVolume });
            } else if (type === 'af') {
                playBeep(afs[idx], ciSide === 'left' ? 'right' : 'left', { volume: afVolume });
            } else if (type === 'cfaf') {
                // Alternating cf/af beep: play cf first (CI side), then af (AF side)
                let i = 0;
                function playNext() {
                    if (i >= reps * 2) return;
                    if (i % 2 === 0) {
                        playBeep(cfs[idx], ciSide, { volume: cfVolume, duration });
                    } else {
                        playBeep(afs[idx], ciSide === 'left' ? 'right' : 'left', { volume: afVolume, duration });
                    }
                    i++;
                    setTimeout(playNext, duration * 1000);
                }
                playNext();
            } else if (type === 'afcf') {
                // Alternating af/cf beep: play af first (AF side), then cf (CI side)
                let i = 0;
                function playNext() {
                    if (i >= reps * 2) return;
                    if (i % 2 === 0) {
                        playBeep(afs[idx], ciSide === 'left' ? 'right' : 'left', { volume: afVolume, duration });
                    } else {
                        playBeep(cfs[idx], ciSide, { volume: cfVolume, duration });
                    }
                    i++;
                    setTimeout(playNext, duration * 1000);
                }
                playNext();
            } else if (type === 'cf-all' || type === 'af-all' || type === 'cfaf-all' || type === 'afcf-all') {
                // Get checked indices
                const checked = Array.from(container.querySelectorAll('.row-check:checked')).map(cb => Number(cb.dataset.idx));
                if (type === 'cf-all') {
                    // Play checked cf frequencies in order
                    let i = 0;
                    function playNext() {
                        if (i >= checked.length) return;
                        playBeep(cfs[checked[i]], 'left', { volume: cfVolume, duration });
                        i++;
                        setTimeout(playNext, duration * 1000 * 1.25);
                    }
                    playNext();
                } else if (type === 'af-all') {
                    // Play checked af frequencies in order
                    let i = 0;
                    function playNext() {
                        if (i >= checked.length) return;
                        playBeep(afs[checked[i]], 'right', { volume: afVolume, duration });
                        i++;
                        setTimeout(playNext, duration * 1000 * 1.25);
                    }
                    playNext();
                } else if (type === 'cfaf-all') {
                    // Play checked cf frequencies in order, then checked af frequencies in order, with a gap between (left)
                    let i = 0;
                    function playCFNext() {
                        if (i >= checked.length) {
                            setTimeout(playAFNext, duration * 1000 * 1.25);
                            return;
                        }
                        playBeep(cfs[checked[i]], 'left', { volume: cfVolume, duration });
                        i++;
                        setTimeout(playCFNext, duration * 1000 * 1.25);
                    }
                    let j = 0;
                    function playAFNext() {
                        if (j >= checked.length) return;
                        playBeep(afs[checked[j]], 'right', { volume: afVolume, duration });
                        j++;
                        setTimeout(playAFNext, duration * 1000 * 1.25);
                    }
                    playCFNext();
                } else if (type === 'afcf-all') {
                    // Play checked af frequencies in order, then checked cf frequencies in order, with a gap between (right)
                    let i = 0;
                    function playAFNext() {
                        if (i >= checked.length) {
                            setTimeout(playCFNext, duration * 1000 * 1.25);
                            return;
                        }
                        playBeep(afs[checked[i]], 'right', { volume: afVolume, duration });
                        i++;
                        setTimeout(playAFNext, duration * 1000 * 1.25);
                    }
                    let j = 0;
                    function playCFNext() {
                        if (j >= checked.length) return;
                        playBeep(cfs[checked[j]], 'left', { volume: cfVolume, duration });
                        j++;
                        setTimeout(playCFNext, duration * 1000 * 1.25);
                    }
                    playAFNext();
                }
            }
        });
    });
}

// Play beep sound with given frequency and stereo channel
function playBeep(frequency, side, options = {}) {
    let duration = options.duration;
    if (typeof duration !== 'number') {
        const stored = localStorage.getItem('beepDuration');
        duration = stored ? parseInt(stored, 10) / 1000 : 0.15;
    }
    const type = options.type || 'sine'; // waveform
    const ctx = window.bicialAudioCtx || (window.bicialAudioCtx = new (window.AudioContext || window.webkitAudioContext)());
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    let volume = 0.75;
    if (options.volume !== undefined) {
        volume = options.volume;
    }
    gain.gain.value = volume;
    // Stereo panning
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
        pan.pan.value = side === 'right' ? 1 : -1;
        osc.connect(gain).connect(pan).connect(ctx.destination);
    } else {
        osc.connect(gain).connect(ctx.destination);
    }
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = function() {
        osc.disconnect();
        gain.disconnect();
        if (pan) pan.disconnect();
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Volume sliders
    const cfSlider = document.getElementById('cfVolume');
    const afSlider = document.getElementById('afVolume');
    if (cfSlider) {
        const stored = localStorage.getItem('cfVolume');
        cfSlider.value = stored ? stored : '75';
        cfSlider.addEventListener('input', function() {
            localStorage.setItem('cfVolume', cfSlider.value);
        });
    }
    if (afSlider) {
        const stored = localStorage.getItem('afVolume');
        afSlider.value = stored ? stored : '75';
        afSlider.addEventListener('input', function() {
            localStorage.setItem('afVolume', afSlider.value);
        });
    }
    // Beep duration input
    const beepInput = document.getElementById('beepDuration');
    if (beepInput) {
        const stored = localStorage.getItem('beepDuration');
        beepInput.value = stored ? stored : '150';
        beepInput.addEventListener('change', function() {
            localStorage.setItem('beepDuration', beepInput.value);
        });
    }
    
    // CI side selector
    const ciSideSelect = document.getElementById('ciSide');
    if (ciSideSelect) {
        ciSideSelect.value = window.getStoredCISide();
        ciSideSelect.addEventListener('change', function() {
            setStoredCISide(ciSideSelect.value);
            const select = document.getElementById('electrodeCount');
            if (select) {
                renderCFTable(select.value);
            }
        });
    }

    // Electrode count and table
    const select = document.getElementById('electrodeCount');
    const stored = localStorage.getItem('electrodeCount');
    if (select) {
        select.value = stored ? stored : '12';
        renderCFTable(select.value);
        select.addEventListener('change', function() {
            localStorage.setItem('electrodeCount', select.value);
            renderCFTable(select.value);
        });
    }
});
