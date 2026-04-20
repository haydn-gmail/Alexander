import { t } from '../i18n.js';
import { todayStr, nowTimeStr } from '../utils.js';

export function renderEntryForm(container, { onSave, onCancel, editEntry = null }) {
  const isEdit = !!editEntry;
  const entry = editEntry || {
    date: todayStr(),
    time: nowTimeStr(),
    breast_right: '',
    breast_left: '',
    formula_ml: '',
    urine: 0,
    stool: 0,
    stool_color: '',
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
              <input type="date" class="form-input" id="entry-date" value="${entry.date}" />
            </div>
            <div class="form-group">
              <label class="form-label">${t('entry_form.time')}</label>
              <input type="time" class="form-input" id="entry-time" value="${entry.time}" />
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
                min="0" max="200" />
            </div>
            <input type="hidden" id="formula-ml-val" value="${entry.formula_ml || ''}" />
          </div>

          <!-- Diaper -->
          <div class="form-section">
            <label class="form-label section-label">🧷 ${t('entry_form.urine')} & ${t('entry_form.stool')}</label>
            <div class="diaper-btns">
              <button type="button" class="toggle-btn diaper-btn ${entry.urine ? 'active' : ''}" id="urine-btn">
                💧 ${t('entry_form.urine')}
              </button>
              <button type="button" class="toggle-btn diaper-btn ${entry.stool ? 'active' : ''}" id="stool-btn">
                💩 ${t('entry_form.stool')}
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
  let urine = !!entry.urine;
  let stool = !!entry.stool;
  let stoolColor = entry.stool_color || '';

  // Breast toggles
  container.querySelector('#breast-right-btn').addEventListener('click', (e) => {
    breastRight = breastRight ? '' : t('entry_form.latching');
    e.currentTarget.classList.toggle('active', !!breastRight);
  });
  container.querySelector('#breast-left-btn').addEventListener('click', (e) => {
    breastLeft = breastLeft ? '' : t('entry_form.latching');
    e.currentTarget.classList.toggle('active', !!breastLeft);
  });

  // Formula presets
  container.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      const ml = Number(btn.dataset.ml);
      if (formulaMl === ml) {
        formulaMl = '';
      } else {
        formulaMl = ml;
        btn.classList.add('active');
      }
      container.querySelector('#formula-custom').value = '';
    });
  });

  container.querySelector('#formula-custom').addEventListener('input', (e) => {
    formulaMl = e.target.value ? Number(e.target.value) : '';
    container.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
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
    const data = {
      date: container.querySelector('#entry-date').value,
      time: container.querySelector('#entry-time').value,
      breast_right: breastRight || null,
      breast_left: breastLeft || null,
      formula_ml: formulaMl || null,
      urine: urine ? 1 : 0,
      stool: stool ? 1 : 0,
      stool_color: stoolColor || null,
      comments: container.querySelector('#entry-comments').value || null,
    };

    if (isEdit) data.id = editEntry.id;
    onSave(data);
  });
}
