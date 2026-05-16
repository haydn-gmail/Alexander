import { t } from '../i18n.js';
import { todayStr, nowTimeStr } from '../utils.js';

export function renderEntryForm(container, { onSave, onCancel, editEntry = null }) {
  const isEdit = !!editEntry;
  const entryTime = nowTimeStr();
  const entry = editEntry || {
    date: todayStr(),
    time: entryTime,
    feed_start: entryTime,
    feed_end: entryTime,
    breast_right: '',
    breast_left: '',
    formula_ml: '',
    bottle_ml: '',
    urine: 0,
    stool: 0,
    stool_color: '',
    bath: 0,
    comments: '',
  };

  container.innerHTML = `
    <div class="modal-overlay" id="entry-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h2>${isEdit ? t('entry_form.edit_title') : t('entry_form.title')}</h2>
          <button class="modal-close" id="modal-close">✕</button>
        </div>

        <form class="entry-form" id="entry-form">
          <!-- Date & Time -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('entry_form.date')}</label>
              <input type="date" class="form-input" id="entry-date" value="${entry.date}" required />
            </div>
            <div class="form-group">
              <label class="form-label">${t('entry_form.time')}</label>
              <input type="time" class="form-input" id="entry-time" value="${entry.time}" step="60" required />
            </div>
          </div>

          <!-- Feeding Times (Optional) -->
          <div class="form-section ${entry.breast_right || entry.breast_left || entry.formula_ml || entry.bottle_ml ? '' : 'hidden'}" id="feeding-times-section">
            <label class="form-label section-label">⏱️ ${t('entry_form.feeding_times')}</label>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">${t('entry_form.feed_start')}</label>
                <input type="time" class="form-input" id="feed-start" value="${entry.feed_start || entry.time}" step="60" />
              </div>
              <div class="form-group">
                <label class="form-label">${t('entry_form.feed_end')} <span id="next-day-indicator" style="color: var(--accent-formula); font-size: 0.8em; display: none;">(+1 Day)</span></label>
                <input type="time" class="form-input" id="feed-end" value="${entry.feed_end || entry.time}" step="60" />
              </div>
            </div>
          </div>

          <!-- Breastfeeding -->
          <div class="form-section">
            <label class="form-label section-label">🤱 ${t('entry_form.breastfeeding')}</label>
            <div class="breast-btns">
              <button type="button" class="toggle-btn breast-btn ${entry.breast_right ? 'active' : ''}" id="breast-right-btn" data-side="right">
                ${t('entry_form.breast_right')} ➡️
              </button>
              <button type="button" class="toggle-btn breast-btn ${entry.breast_left ? 'active' : ''}" id="breast-left-btn" data-side="left">
                ⬅️ ${t('entry_form.breast_left')}
              </button>
            </div>
            <input type="hidden" id="breast-right-val" value="${entry.breast_right || ''}" />
            <input type="hidden" id="breast-left-val" value="${entry.breast_left || ''}" />
          </div>

          <!-- Formula -->
          <div class="form-section">
            <label class="form-label section-label">🍼 ${t('entry_form.formula')}</label>
            <div class="formula-presets" id="formula-presets">
              ${[10, 15, 20, 30, 40, 50, 60]
                .map(
                  (ml) => `
                <button type="button" class="preset-btn ${entry.formula_ml == ml ? 'active' : ''}" data-ml="${ml}">${ml}</button>
              `
                )
                .join('')}
              <input type="number" class="form-input formula-custom" id="formula-custom"
                placeholder="${t('entry_form.custom')}"
                value="${entry.formula_ml && ![10, 15, 20, 30, 40, 50, 60].includes(Number(entry.formula_ml)) ? entry.formula_ml : ''}"
                min="0" max="240" />
            </div>
            <input type="hidden" id="formula-ml-val" value="${entry.formula_ml || ''}" />
          </div>

          <!-- Bottle Breast Milk -->
          <div class="form-section">
            <label class="form-label section-label">🧴 ${t('entry_form.bottle')}</label>
            <div class="formula-presets" id="bottle-presets">
              ${[10, 15, 20, 30, 40, 50, 60]
                .map(
                  (ml) => `
                <button type="button" class="preset-btn bottle-preset-btn ${entry.bottle_ml == ml ? 'active' : ''}" data-ml="${ml}">${ml}</button>
              `
                )
                .join('')}
              <input type="number" class="form-input formula-custom" id="bottle-custom"
                placeholder="${t('entry_form.custom')}"
                value="${entry.bottle_ml && ![10, 15, 20, 30, 40, 50, 60].includes(Number(entry.bottle_ml)) ? entry.bottle_ml : ''}"
                min="0" max="240" />
            </div>
            <input type="hidden" id="bottle-ml-val" value="${entry.bottle_ml || ''}" />
          </div>

          <!-- Diaper -->
          <div class="form-section">
            <label class="form-label section-label">🧷 ${t('entry_form.urine')}, ${t('entry_form.stool')} & ${t('entry_form.bath')}</label>
            <div class="diaper-btns" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="toggle-btn diaper-btn ${entry.urine ? 'active' : ''}" id="urine-btn">
                💧 ${t('entry_form.urine')}
              </button>
              <button type="button" class="toggle-btn diaper-btn ${entry.stool ? 'active' : ''}" id="stool-btn">
                💩 ${t('entry_form.stool')}
              </button>
              <button type="button" class="toggle-btn diaper-btn ${entry.bath ? 'active' : ''}" id="bath-btn">
                🛁 ${t('entry_form.bath')}
              </button>
            </div>
            <div class="stool-colors ${entry.stool ? '' : 'hidden'}" id="stool-colors">
              ${['black', 'green', 'yellow', 'brown']
                .map(
                  (color) => `
                <button type="button" class="color-btn ${entry.stool_color === color ? 'active' : ''}" data-color="${color}">
                  <span class="color-dot color-${color}"></span>
                  ${t('entry_form.colors.' + color)}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Comments -->
          <div class="form-section">
            <label class="form-label section-label">💬 ${t('entry_form.comments')}</label>
            <textarea class="form-input form-textarea" id="entry-comments" rows="2" placeholder="">${entry.comments || ''}</textarea>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-btn">${t('entry_form.cancel')}</button>
            <button type="submit" class="btn btn-primary">${t('entry_form.save')}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // State
  let breastRight = entry.breast_right || '';
  let breastLeft = entry.breast_left || '';
  let formulaMl = entry.formula_ml || '';
  let bottleMl = entry.bottle_ml || '';
  let urine = !!entry.urine;
  let stool = !!entry.stool;
  let stoolColor = entry.stool_color || '';
  let bath = !!entry.bath;

  function updateFeedingTimesVisibility() {
    const isFeeding = !!(breastRight || breastLeft || formulaMl || bottleMl);
    const section = container.querySelector('#feeding-times-section');
    section.classList.toggle('hidden', !isFeeding);
    
    if (isFeeding && !isEdit) {
      const curTime = container.querySelector('#entry-time').value;
      const startInput = container.querySelector('#feed-start');
      const endInput = container.querySelector('#feed-end');
      if (!startInput.value) startInput.value = curTime;
      if (!endInput.value) endInput.value = curTime;
    }
  }

  // Breast toggles
  container.querySelector('#breast-right-btn').addEventListener('click', (e) => {
    breastRight = breastRight ? '' : t('entry_form.latching');
    e.currentTarget.classList.toggle('active', !!breastRight);
    updateFeedingTimesVisibility();
  });
  container.querySelector('#breast-left-btn').addEventListener('click', (e) => {
    breastLeft = breastLeft ? '' : t('entry_form.latching');
    e.currentTarget.classList.toggle('active', !!breastLeft);
    updateFeedingTimesVisibility();
  });

  // Formula presets
  container.querySelectorAll('#formula-presets .preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#formula-presets .preset-btn').forEach((b) => b.classList.remove('active'));
      const ml = Number(btn.dataset.ml);
      if (formulaMl === ml) {
        formulaMl = '';
      } else {
        formulaMl = ml;
        btn.classList.add('active');
      }
      container.querySelector('#formula-custom').value = '';
      updateFeedingTimesVisibility();
    });
  });

  container.querySelector('#formula-custom').addEventListener('input', (e) => {
    formulaMl = e.target.value ? Number(e.target.value) : '';
    container.querySelectorAll('#formula-presets .preset-btn').forEach((b) => b.classList.remove('active'));
    updateFeedingTimesVisibility();
  });

  // Bottle breast milk presets
  container.querySelectorAll('.bottle-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.bottle-preset-btn').forEach((b) => b.classList.remove('active'));
      const ml = Number(btn.dataset.ml);
      if (bottleMl === ml) {
        bottleMl = '';
      } else {
        bottleMl = ml;
        btn.classList.add('active');
      }
      container.querySelector('#bottle-custom').value = '';
      updateFeedingTimesVisibility();
    });
  });

  container.querySelector('#bottle-custom').addEventListener('input', (e) => {
    bottleMl = e.target.value ? Number(e.target.value) : '';
    container.querySelectorAll('.bottle-preset-btn').forEach((b) => b.classList.remove('active'));
    updateFeedingTimesVisibility();
  });

  // Diaper toggles
  container.querySelector('#urine-btn').addEventListener('click', (e) => {
    urine = !urine;
    e.currentTarget.classList.toggle('active', urine);
  });

  container.querySelector('#stool-btn').addEventListener('click', (e) => {
    stool = !stool;
    e.currentTarget.classList.toggle('active', stool);
    container.querySelector('#stool-colors').classList.toggle('hidden', !stool);
    if (!stool) stoolColor = '';
  });

  container.querySelector('#bath-btn').addEventListener('click', (e) => {
    bath = !bath;
    e.currentTarget.classList.toggle('active', bath);
  });

  // Date/Time sync for new entries
  if (!isEdit) {
    container.querySelector('#entry-time').addEventListener('input', (e) => {
      const val = e.target.value;
      if (val) {
        container.querySelector('#feed-start').value = val;
        container.querySelector('#feed-end').value = val;
        checkCrossMidnight();
      }
    });
  }

  function checkCrossMidnight() {
    const start = container.querySelector('#feed-start').value;
    const end = container.querySelector('#feed-end').value;
    const indicator = container.querySelector('#next-day-indicator');
    if (indicator) {
      if (start && end && end < start) {
        indicator.style.display = 'inline';
      } else {
        indicator.style.display = 'none';
      }
    }
  }

  container.querySelector('#feed-start').addEventListener('input', checkCrossMidnight);
  container.querySelector('#feed-end').addEventListener('input', checkCrossMidnight);
  setTimeout(checkCrossMidnight, 0);

  // Stool color selection
  container.querySelectorAll('.color-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('active'));
      stoolColor = btn.dataset.color;
      btn.classList.add('active');
    });
  });

  // Cancel
  container.querySelector('#cancel-btn').addEventListener('click', onCancel);
  container.querySelector('#modal-close').addEventListener('click', onCancel);
  container.querySelector('#entry-modal').addEventListener('click', (e) => {
    if (e.target.id === 'entry-modal') onCancel();
  });

  // Submit
  container.querySelector('#entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate that if it's a feeding, we have the section visible
    const isFeeding = !!(breastRight || breastLeft || formulaMl || bottleMl);
    
    const data = {
      date: container.querySelector('#entry-date').value,
      time: container.querySelector('#entry-time').value,
      feed_start: isFeeding ? (container.querySelector('#feed-start').value || null) : null,
      feed_end: isFeeding ? (container.querySelector('#feed-end').value || null) : null,
      breast_right: breastRight || null,
      breast_left: breastLeft || null,
      formula_ml: formulaMl || null,
      bottle_ml: bottleMl || null,
      urine: urine ? 1 : 0,
      stool: stool ? 1 : 0,
      stool_color: stoolColor || null,
      bath: bath ? 1 : 0,
      comments: container.querySelector('#entry-comments').value || null,
    };

    if (isEdit) data.id = editEntry.id;
    onSave(data);
  });
}
