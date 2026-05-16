import { t } from '../i18n.js';
import * as api from '../api.js';

export async function renderLogin(container, onSuccess) {
  let users = await api.getUsers();

  // Enforce order
  const order = ['dad', 'mom', 'grandparents', 'family'];
  users.sort((a, b) => {
    const aIdx = order.indexOf(a.name);
    const bIdx = order.indexOf(b.name);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  container.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">🍼</div>
          <h1 class="login-title" data-i18n="login.title">${t('login.title')}</h1>
          <p class="login-subtitle" data-i18n="login.subtitle">${t('login.subtitle')}</p>
        </div>

        <div class="login-form">
          <label class="form-label" data-i18n="login.select_user">${t('login.select_user')}</label>
          <div class="user-selector" id="user-selector">
            ${users
              .map(
                (u) => `
              <button class="user-btn" data-name="${u.name}">
                <span class="user-emoji">${u.name === 'dad' ? '👨' : u.name === 'mom' ? '👩' : u.name === 'grandparents' ? '👴👵' : '👪'}</span>
                <span class="user-label">${u.display_name}</span>
              </button>
            `
              )
              .join('')}
          </div>

          <label class="form-label" data-i18n="login.enter_pin">${t('login.enter_pin')}</label>
          <div class="pin-display" id="pin-display">
            <span class="pin-dot"></span>
            <span class="pin-dot"></span>
            <span class="pin-dot"></span>
            <span class="pin-dot"></span>
          </div>

          <div class="pin-pad" id="pin-pad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫']
              .map((n) =>
                n === ''
                  ? '<button class="pin-key empty" disabled></button>'
                  : `<button class="pin-key" data-key="${n}">${n}</button>`
              )
              .join('')}
          </div>

          <div class="login-error" id="login-error" style="display:none" data-i18n="login.error">${t('login.error')}</div>

          <button class="btn btn-primary login-submit" id="login-btn" disabled data-i18n="login.login_btn">
            ${t('login.login_btn')}
          </button>
        </div>
      </div>
    </div>
  `;

  // State
  let selectedUser = null;
  let pin = '';

  // User selection
  container.querySelectorAll('.user-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.user-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedUser = btn.dataset.name;
      pin = '';
      updatePinDisplay();
      checkReady();
    });
  });

  // PIN pad
  container.querySelectorAll('.pin-key').forEach((key) => {
    key.addEventListener('click', () => {
      const val = key.dataset.key;
      if (val === '⌫') {
        pin = pin.slice(0, -1);
      } else if (pin.length < 4) {
        pin += val;
      }
      updatePinDisplay();
      checkReady();

      // Auto-submit when 4 digits entered
      if (pin.length === 4 && selectedUser) {
        doLogin();
      }
    });
  });

  function updatePinDisplay() {
    const dots = container.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < pin.length);
    });
  }

  function checkReady() {
    const btn = container.querySelector('#login-btn');
    btn.disabled = !(selectedUser && pin.length === 4);
  }

  container.querySelector('#login-btn').addEventListener('click', doLogin);

  async function doLogin() {
    const errorEl = container.querySelector('#login-error');
    errorEl.style.display = 'none';

    try {
      const data = await api.login(selectedUser, pin);
      onSuccess(data.user);
    } catch (err) {
      errorEl.style.display = 'block';
      pin = '';
      updatePinDisplay();
      // Shake animation
      const card = container.querySelector('.login-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
    }
  }
}
