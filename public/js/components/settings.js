import { t } from '../i18n.js';
import * as api from '../api.js';
import { todayStr } from '../utils.js';

export async function renderSettingsForm(container, { onCancel, onSave }) {
  let dob = '';
  try {
    const res = await api.getSetting('dob');
    dob = res.value || '';
  } catch (err) {
    console.error('Failed to load DOB setting', err);
  }

  container.innerHTML = `
    <div class="modal-overlay" id="settings-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h2>${t('settings.title') || 'Settings'}</h2>
          <button class="modal-close" id="settings-close">✕</button>
        </div>

        <form class="entry-form" id="settings-form">
          <div class="form-section">
            <label class="form-label section-label">${t('settings.dob') || 'Baby Date of Birth'}</label>
            <input type="date" class="form-input" id="setting-dob" value="${dob}" />
            <small>${t('settings.dob_desc') || 'Set the date of birth to track days since birth.'}</small>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="settings-cancel-btn">${t('entry_form.cancel') || 'Cancel'}</button>
            <button type="submit" class="btn btn-primary">${t('entry_form.save') || 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Cancel
  container.querySelector('#settings-cancel-btn').addEventListener('click', onCancel);
  container.querySelector('#settings-close').addEventListener('click', onCancel);
  container.querySelector('#settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') onCancel();
  });

  // Submit
  container.querySelector('#settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDob = container.querySelector('#setting-dob').value;
    try {
      if (newDob) {
        await api.setSetting('dob', newDob);
      }
      onSave(newDob);
    } catch (err) {
      alert(err.message);
    }
  });
}
