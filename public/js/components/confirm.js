import { t } from '../i18n.js';

export function renderConfirm(container, message, onConfirm) {
  container.innerHTML = `
    <div class="modal-overlay" id="confirm-modal">
      <div class="modal-card" style="max-width: 400px; text-align: center;">
        <div class="modal-header" style="justify-content: center; margin-bottom: 20px;">
          <h2>${t('app_name') || 'Baby Tracker'}</h2>
        </div>
        <p style="font-size: 16px; margin-bottom: 30px;">${message}</p>
        <div class="form-actions" style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">${t('entry_form.cancel') || 'Cancel'}</button>
          <button type="button" class="btn btn-primary" id="confirm-ok-btn">${t('common.yes') || 'OK'}</button>
        </div>
      </div>
    </div>
  `;

  const cleanup = () => {
    container.innerHTML = '';
  };

  container.querySelector('#confirm-cancel-btn').addEventListener('click', cleanup);
  container.querySelector('#confirm-modal').addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal') cleanup();
  });

  container.querySelector('#confirm-ok-btn').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });
}
