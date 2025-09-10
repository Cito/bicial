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
    let html = '<table style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>' +
        '<th style="text-align:center;padding:0.5rem;">#</th>' +
        '<th style="text-align:center;padding:0.5rem;" title="center frequency">cf</th>' +
        '<th style="text-align:center;padding:0.5rem;" title="alignment frequency">af</th>' +
        '</tr></thead><tbody>';
    for (let i = 0; i < cfs.length; i++) {
        html += `<tr><td style="text-align:center;">${i+1}</td>` +
            `<td style="text-align:center;">
                <input type="number" step="1" min="0" value="${cfs[i]}" data-idx="${i}" class="cf-input" style="width:6em;margin:2px;padding:0.4em 0.5em;font-size:1.1em;border-radius:5px;border:1px solid #ccc;text-align:right;" />
            </td>` +
            `<td style="text-align:center;">
                <input type="number" step="1" min="0" value="${afs[i]}" data-idx="${i}" class="af-input" style="width:6em;margin:2px;padding:0.4em 0.5em;font-size:1.1em;border-radius:5px;border:1px solid #ccc;text-align:right;" />
            </td></tr>`;
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
}

document.addEventListener('DOMContentLoaded', function() {
    // CI side selector
    const ciSideSelect = document.getElementById('ciSide');
    if (ciSideSelect) {
        ciSideSelect.value = getStoredCISide();
        ciSideSelect.addEventListener('change', function() {
            setStoredCISide(ciSideSelect.value);
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
