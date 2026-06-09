/* ============================================================
   app.js — GradeBook logic
   Applies to: index.html
   Requires:   style.css (for grade badge class names)
   ============================================================ */


/* ── 1. GRADING SCALE ───────────────────────────────────────── */
/*
   Each entry says: if the average is >= min, award this grade.
   The array is checked top to bottom, so the first match wins.
*/
const GRADE_SCALE = [
  { min: 80, grade: 'A', label: 'Excellent'  },
  { min: 65, grade: 'B', label: 'Good'       },
  { min: 50, grade: 'C', label: 'Average'    },
  { min: 40, grade: 'D', label: 'Below Avg'  },
  { min: 0,  grade: 'F', label: 'Fail'       },
];


/* ── 2. APP DATA ────────────────────────────────────────────── */
/*
   subjects — array of subject name strings.
   pupils   — array of pupil objects: { id, name, scores[] }
              scores[] has one entry per subject, in the same order.
   nextId   — auto-incrementing ID for each new pupil.
*/
let subjects = ['Math', 'English', 'Science', 'Social Studies'];

let pupils = [
  { id: 1, name: 'Alice Mwangi',   scores: [82, 76, 90, 68] },
  { id: 2, name: 'Brian Otieno',   scores: [55, 61, 48, 72] },
  { id: 3, name: 'Carol Njoroge',  scores: [91, 88, 95, 100] },
];

let nextId = 4;


/* ── 3. PURE HELPER FUNCTIONS ───────────────────────────────── */

/**
 * getGrade(avg)
 * Given a numeric average, returns the matching grade object.
 * Example: getGrade(82) → { min:80, grade:'A', label:'Excellent' }
 */
function getGrade(avg) {
  return GRADE_SCALE.find(g => avg >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

/**
 * calcAvg(scores)
 * Returns the average of an array of scores, ignoring empty strings.
 * Returns null if there are no valid scores yet.
 * Example: calcAvg([80, '', 90]) → 85
 */
function calcAvg(scores) {
  const valid = scores.filter(s => s !== '' && !isNaN(s));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + Number(b), 0) / valid.length;
}

/**
 * escHtml(str)
 * Escapes special HTML characters so user-typed names can't
 * accidentally break the page layout or inject HTML.
 * Example: escHtml('<b>hi</b>') → '&lt;b&gt;hi&lt;/b&gt;'
 */
function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


/* ── 4. SUBJECT MANAGEMENT ──────────────────────────────────── */

/**
 * renderSubjectTags()
 * Reads the subjects array and writes the coloured tag pills
 * into the #subjectTags div in index.html.
 */
function renderSubjectTags() {
  const wrap = document.getElementById('subjectTags');

  if (!subjects.length) {
    wrap.innerHTML = '<span style="color:var(--ink-soft);font-size:13px">No subjects yet.</span>';
    return;
  }

  wrap.innerHTML = subjects.map((s, i) => `
    <span class="subject-tag">
      ${s}
      <button onclick="removeSubject(${i})" title="Remove">×</button>
    </span>
  `).join('');
}

/**
 * addSubject()
 * Reads the text input, adds the new subject to the subjects array,
 * and adds an empty score slot to every existing pupil.
 * Called when the user clicks "+ Add" or presses Enter.
 */
function addSubject() {
  const inp = document.getElementById('newSubjectInput');
  const val = inp.value.trim();

  // Do nothing if empty or already exists
  if (!val || subjects.includes(val)) {
    inp.value = '';
    return;
  }

  subjects.push(val);

  // Give every existing pupil an empty score for the new subject
  pupils.forEach(p => { p.scores.push(''); });

  inp.value = '';
  render(); // Rebuild the whole UI
}

/**
 * removeSubject(idx)
 * Removes the subject at position idx from subjects[],
 * and removes the matching score from every pupil.
 */
function removeSubject(idx) {
  if (!confirm(`Remove subject "${subjects[idx]}"?`)) return;

  subjects.splice(idx, 1);
  pupils.forEach(p => p.scores.splice(idx, 1));

  render();
}


/* ── 5. PUPIL MANAGEMENT ────────────────────────────────────── */

/**
 * addPupil()
 * Adds a blank pupil row to the pupils array, then re-renders.
 * Automatically focuses the name input of the new row.
 */
function addPupil() {
  pupils.push({
    id: nextId++,
    name: '',
    scores: subjects.map(() => ''), // One empty score per subject
  });

  render();

  // Focus the new pupil's name field after the DOM updates
  setTimeout(() => {
    const inputs = document.querySelectorAll('.name-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 50);
}

/**
 * removePupil(id)
 * Removes the pupil with the given id from the array and re-renders.
 */
function removePupil(id) {
  pupils = pupils.filter(p => p.id !== id);
  render();
}

/**
 * clearAll()
 * Empties the entire pupils array after a confirmation prompt.
 */
function clearAll() {
  if (!confirm('Clear all pupils?')) return;
  pupils = [];
  render();
}

/**
 * updateName(id, val)
 * Called every time the user types in a name input field.
 * Updates the matching pupil's name in the data array.
 */
function updateName(id, val) {
  const p = pupils.find(p => p.id === id);
  if (p) p.name = val;
  updateSummary(); // Summary pupil count may change
}

/**
 * updateScore(id, subjectIndex, val)
 * Called every time a score input changes.
 * Clamps the value between 0 and 100, saves it,
 * then updates just that row (faster than full re-render).
 */
function updateScore(id, idx, val) {
  const p = pupils.find(p => p.id === id);
  if (!p) return;

  // Clamp between 0–100, or keep empty
  p.scores[idx] = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));

  renderRow(id);    // Update just this pupil's average + grade
  updateSummary();  // Update class statistics
}


/* ── 6. RENDERING FUNCTIONS ─────────────────────────────────── */

/**
 * renderRow(id)
 * Updates the average, grade badge, and remarks for one pupil row.
 * Called on every keystroke in a score field — much faster than
 * rebuilding the entire table.
 */
function renderRow(id) {
  const p = pupils.find(p => p.id === id);
  if (!p) return;

  const avg        = calcAvg(p.scores);
  const avgCell    = document.getElementById(`avg-${id}`);
  const gradeCell  = document.getElementById(`grade-${id}`);
  const remarkCell = document.getElementById(`remark-${id}`);
  if (!avgCell) return;

  if (avg === null) {
    // No scores entered yet
    avgCell.textContent  = '—';
    gradeCell.innerHTML  = '';
    remarkCell.textContent = '';
  } else {
    const g = getGrade(avg);

    avgCell.textContent = avg.toFixed(1) + '%';
    avgCell.style.color = avg >= 65 ? 'var(--green)'
                        : avg >= 50 ? 'var(--amber)'
                        :             'var(--red)';

    gradeCell.innerHTML    = `<span class="grade-badge grade-${g.grade}">${g.grade}</span>`;
    remarkCell.textContent = g.label;
  }
}

/**
 * render()
 * Full page rebuild. Called when the subjects or pupils arrays change.
 * Builds the subject tags AND the entire pupils table from scratch.
 */
function render() {
  renderSubjectTags();

  const wrap = document.getElementById('tableWrap');

  // Empty state message
  if (!pupils.length) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        No pupils added yet. Click "+ Add Pupil" to start.
      </div>`;
    updateSummary();
    return;
  }

  // CSS grid: name column | one column per subject | avg | grade | remarks | delete button
  const gridCols = `1fr repeat(${subjects.length}, 70px) 90px 70px 90px 50px`;

  // ── Header row ──
  let html = `
    <div style="display:grid;grid-template-columns:${gridCols};gap:6px;
                align-items:center;margin-bottom:6px;padding-bottom:8px;
                border-bottom:1px solid var(--rule);">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;
                  letter-spacing:.06em;color:var(--ink-soft)">Name</div>
      ${subjects.map(s => `
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;
                    letter-spacing:.06em;color:var(--ink-soft);text-align:center">${s}</div>
      `).join('')}
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;
                  letter-spacing:.06em;color:var(--ink-soft);text-align:center">Average</div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;
                  letter-spacing:.06em;color:var(--ink-soft);text-align:center">Grade</div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;
                  letter-spacing:.06em;color:var(--ink-soft)">Remarks</div>
      <div></div>
    </div>`;

  // ── One data row per pupil ──
  pupils.forEach(p => {
    const avg = calcAvg(p.scores);
    const g   = avg !== null ? getGrade(avg) : null;

    const avgColor = avg === null    ? 'var(--ink-soft)'
                   : avg >= 65      ? 'var(--green)'
                   : avg >= 50      ? 'var(--amber)'
                   :                  'var(--red)';

    html += `
      <div style="display:grid;grid-template-columns:${gridCols};gap:6px;
                  align-items:center;margin-bottom:6px;">

        <!-- Pupil name -->
        <input
          class="name-input"
          type="text"
          value="${escHtml(p.name)}"
          placeholder="Pupil name"
          oninput="updateName(${p.id}, this.value)"
        />

        <!-- One score input per subject -->
        ${p.scores.map((s, i) => `
          <input
            type="number"
            min="0" max="100"
            value="${s}"
            placeholder="—"
            oninput="updateScore(${p.id}, ${i}, this.value)"
          />
        `).join('')}

        <!-- Calculated average (updated by renderRow) -->
        <div
          id="avg-${p.id}"
          class="avg-cell"
          style="color:${avgColor}"
        >${avg === null ? '—' : avg.toFixed(1) + '%'}</div>

        <!-- Grade badge -->
        <div id="grade-${p.id}" style="text-align:center">
          ${g ? `<span class="grade-badge grade-${g.grade}">${g.grade}</span>` : ''}
        </div>

        <!-- Remarks -->
        <div id="remark-${p.id}" class="remarks-cell">
          ${g ? g.label : ''}
        </div>

        <!-- Delete button -->
        <button
          class="btn btn-danger btn-sm"
          onclick="removePupil(${p.id})"
          title="Remove pupil"
        >✕</button>

      </div>`;
  });

  wrap.innerHTML = html;
  updateSummary();
}

/**
 * updateSummary()
 * Reads all current averages and writes statistics into the
 * #summaryGrid div. Hides the card if there are no pupils.
 */
function updateSummary() {
  const card = document.getElementById('summaryCard');
  const grid = document.getElementById('summaryGrid');

  if (!pupils.length) { card.style.display = 'none'; return; }

  const avgs = pupils.map(p => calcAvg(p.scores)).filter(a => a !== null);

  if (!avgs.length) { card.style.display = 'none'; return; }

  card.style.display = '';

  const classAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const highest  = Math.max(...avgs);
  const lowest   = Math.min(...avgs);
  const passing  = avgs.filter(a => a >= 40).length;

  // Count how many pupils got each grade
  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  avgs.forEach(a => { counts[getGrade(a).grade]++; });

  grid.innerHTML = `
    <div class="stat-box">
      <div class="val">${pupils.length}</div>
      <div class="lbl">Total Pupils</div>
    </div>
    <div class="stat-box">
      <div class="val">${classAvg.toFixed(1)}%</div>
      <div class="lbl">Class Average</div>
    </div>
    <div class="stat-box">
      <div class="val" style="color:var(--green)">${highest.toFixed(1)}%</div>
      <div class="lbl">Highest Score</div>
    </div>
    <div class="stat-box">
      <div class="val" style="color:var(--red)">${lowest.toFixed(1)}%</div>
      <div class="lbl">Lowest Score</div>
    </div>
    <div class="stat-box">
      <div class="val">${passing}</div>
      <div class="lbl">Passing (≥40%)</div>
    </div>
    ${Object.entries(counts).map(([g, c]) => `
      <div class="stat-box">
        <div class="val">
          <span class="grade-badge grade-${g}">${g}</span>
        </div>
        <div class="lbl">${c} pupil${c !== 1 ? 's' : ''}</div>
      </div>
    `).join('')}
  `;
}


/* ── 7. EXPORT ──────────────────────────────────────────────── */

/**
 * exportCSV()
 * Converts all pupil data into a CSV string and triggers
 * a file download in the browser. No server needed.
 */
function exportCSV() {
  const header = ['Name', ...subjects, 'Average', 'Grade', 'Remarks'].join(',');

  const rows = pupils.map(p => {
    const avg = calcAvg(p.scores);
    const g   = avg !== null ? getGrade(avg) : null;

    return [
      `"${p.name || 'Unnamed'}"`,    // Wrap name in quotes (may contain commas)
      ...p.scores.map(s => s === '' ? '' : s),
      avg !== null ? avg.toFixed(1) : '',
      g ? g.grade : '',
      g ? g.label  : '',
    ].join(',');
  });

  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');

  a.href     = URL.createObjectURL(blob);
  a.download = 'gradebook.csv';
  a.click();
}


/* ── 8. INITIALISE ──────────────────────────────────────────── */
/*
   Run render() once when the page loads.
   Because this <script> tag is at the bottom of index.html,
   the DOM is already fully built by the time this line runs.
*/
render();
