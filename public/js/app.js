import { initI18n, setLang, getLang, t } from './i18n.js';
import * as api from './api.js';
import { todayStr, addDays, isToday, isYesterday, formatDate } from './utils.js';
import { renderLogin } from './components/login.js';
import { renderEntryForm } from './components/entry-form.js';
import { renderTimeline } from './components/timeline.js';
import { renderSummary } from './components/summary.js';

let currentDate = todayStr();
let currentView = 'timeline'; // 'timeline' or 'summary'

async function init() {
  await initI18n();

  if (api.isLoggedIn()) {
    renderApp();
  } else {
    renderLoginScreen();
  }

  // Re-render on language change
  window.addEventListener('langchange', () => {
    if (api.isLoggedIn()) {
      renderApp();
    } else {
      renderLoginScreen();
    }
  });
}

function renderLoginScreen() {
  const app = document.getElementById('app');
  renderLogin(app, (user) => {
    renderApp();
  });
}

async function renderApp() {
  const app = document.getElementById('app');
  const user = api.getCurrentUser();
  const canEdit = user.role === 'admin';

  const dateLabel = isToday(currentDate)
    ? t('timeline.today')
    : isYesterday(currentDate)
      ? t('timeline.yesterday')
      : formatDate(currentDate);

  app.innerHTML = `
    <div class="app-shell">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <span class="app-logo">🍼</span>
          <span class="app-title">${t('app_name')}</span>
        </div>
        <div class="header-right">
          <button class="lang-toggle" id="lang-toggle">${getLang() === 'en' ? '中文' : 'EN'}</button>
          <span class="user-badge">${user.name === 'dad' ? '👨' : user.name === 'mom' ? '👩' : '👪'} ${user.display_name}</span>
          <button class="icon-btn logout-btn" id="logout-btn" title="${t('nav.logout')}">⬅️</button>
        </div>
      </header>

      <!-- Date Navigator -->
      <div class="date-nav">
        <button class="icon-btn" id="prev-day">◀</button>
        <span class="date-label" id="date-label">${dateLabel}</span>
        <button class="icon-btn" id="next-day" ${isToday(currentDate) ? 'disabled' : ''}>▶</button>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button class="tab-btn ${currentView === 'timeline' ? 'active' : ''}" data-view="timeline">
          📋 ${t('nav.timeline')}
        </button>
        <button class="tab-btn ${currentView === 'summary' ? 'active' : ''}" data-view="summary">
          📊 ${t('nav.summary')}
        </button>
      </div>

      <!-- Content Area -->
      <main class="content" id="content">
        <div class="loading">Loading...</div>
      </main>

      <!-- FAB / Add Button (admin only) -->
      ${canEdit ? `<button class="fab" id="add-btn" title="${t('common.add_entry')}">＋</button>` : ''}

      <!-- Modal container -->
      <div id="modal-container"></div>
    </div>
  `;

  // Event listeners
  document.getElementById('lang-toggle').addEventListener('click', () => {
    const newLang = getLang() === 'en' ? 'zh' : 'en';
    setLang(newLang);
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    api.logout();
    renderLoginScreen();
  });

  document.getElementById('prev-day').addEventListener('click', () => {
    currentDate = addDays(currentDate, -1);
    renderApp();
  });

  document.getElementById('next-day').addEventListener('click', () => {
    if (!isToday(currentDate)) {
      currentDate = addDays(currentDate, 1);
      renderApp();
    }
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      renderApp();
    });
  });

  if (canEdit) {
    document.getElementById('add-btn').addEventListener('click', () => {
      showEntryForm();
    });
  }

  // Load content
  await loadContent();
}

async function loadContent() {
  const content = document.getElementById('content');
  const user = api.getCurrentUser();
  const canEdit = user.role === 'admin';

  try {
    if (currentView === 'timeline') {
      const entries = await api.getEntries(currentDate);
      renderTimeline(content, entries, currentDate, {
        canEdit,
        onEdit: (entry) => showEntryForm(entry),
        onDelete: async (id) => {
          await api.deleteEntry(id);
          await loadContent();
        },
      });
    } else {
      const summary = await api.getSummary(currentDate);
      renderSummary(content, summary);
    }
  } catch (err) {
    content.innerHTML = `<div class="error-msg">Error: ${err.message}</div>`;

    // If auth error, redirect to login
    if (err.message.includes('Authentication') || err.message.includes('expired')) {
      api.logout();
      renderLoginScreen();
    }
  }
}

function showEntryForm(editEntry = null) {
  const modalContainer = document.getElementById('modal-container');

  renderEntryForm(modalContainer, {
    editEntry,
    onCancel: () => {
      modalContainer.innerHTML = '';
    },
    onSave: async (data) => {
      try {
        if (editEntry) {
          await api.updateEntry(editEntry.id, data);
        } else {
          await api.createEntry(data);
        }
        modalContainer.innerHTML = '';
        await loadContent();
      } catch (err) {
        alert(err.message);
      }
    },
  });
}

// Boot
init();
