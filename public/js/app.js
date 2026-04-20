import { initI18n, setLang, getLang, t } from './i18n.js';
import * as api from './api.js';
import { todayStr, addDays, isToday, isYesterday, formatDate } from './utils.js';
import { renderLogin } from './components/login.js';
import { renderEntryForm } from './components/entry-form.js';
import { renderTimeline } from './components/timeline.js';
import { renderSummary } from './components/summary.js';
import { renderSettingsForm } from './components/settings.js';
import { renderConfirm } from './components/confirm.js';
import { daysBetween } from './utils.js';

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

  let dob = '';
  let dayCountStr = '';
  try {
    const dobSetting = await api.getSetting('dob');
    if (dobSetting && dobSetting.value) {
      dob = dobSetting.value;
      const days = daysBetween(dob, currentDate);
      if (days >= 0) {
        dayCountStr = ` <span style="font-size: 0.7em; font-weight: normal; opacity: 0.8; margin-left: 8px;">(Day ${days})</span>`;
      }
    }
  } catch (err) {
    console.error('Failed to get DOB', err);
  }

  const iconDownload = `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>`;
  const iconSettings = `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
  const iconLogout = `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>`;
  const iconList = `<svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
  const iconCopy = `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
  const iconTimeline = `<svg style="width:16px;height:16px;margin-right:4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  const iconSummary = `<svg style="width:16px;height:16px;margin-right:4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`;

  app.innerHTML = `
    <div class="app-shell">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <span class="app-logo">🍼</span>
          <span class="app-title">${t('app_name')}${dayCountStr}</span>
        </div>
        <div class="header-right">
          <button class="lang-toggle" id="lang-toggle">${getLang() === 'en' ? '中文' : 'EN'}</button>
          <span class="user-badge">${user.name === 'dad' ? '👨' : user.name === 'mom' ? '👩' : '👪'} ${user.display_name}</span>
          ${canEdit ? `<button class="icon-btn settings-btn" id="settings-btn" title="Settings">${iconSettings}</button>` : ''}
          <button class="icon-btn logout-btn" id="logout-btn" title="${t('nav.logout')}">${iconLogout}</button>
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
        <button class="tab-btn ${currentView === 'timeline' ? 'active' : ''}" data-view="timeline" style="display: flex; align-items: center; justify-content: center;">
          ${iconTimeline} ${t('nav.timeline')}
        </button>
        <button class="tab-btn ${currentView === 'summary' ? 'active' : ''}" data-view="summary" style="display: flex; align-items: center; justify-content: center;">
          ${iconSummary} ${t('nav.summary')}
        </button>
      </div>

      <!-- Content Area -->
      <main class="content" id="content" style="padding-bottom: 20px;">
        <div class="loading">Loading...</div>
      </main>

      <!-- Detailed Logs -->
      <div class="logs-section" style="padding: 0 var(--space-md) 100px var(--space-md);">
        <div style="display: flex; gap: 10px;">
          <button id="toggle-logs-btn" style="flex: 1; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: var(--space-sm); background: var(--bg-card); color: var(--text-secondary); font-size: var(--font-size-sm); display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
            ${iconList} Toggle Detailed Logs
          </button>
          <button id="copy-logs-btn" style="border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: var(--space-sm) 12px; background: var(--bg-card); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Copy to Clipboard">${iconCopy}</button>
          ${canEdit ? `<button id="download-pdf-btn" style="border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: var(--space-sm) 12px; background: var(--bg-card); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Export PDF">${iconDownload}</button>` : ''}
        </div>
        <div id="logs-container" style="display: none; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); margin-top: var(--space-sm); padding: var(--space-md); max-height: 400px; overflow-y: auto;">
          <pre id="logs-content" style="margin: 0; font-family: monospace; font-size: 13px; color: #a0a0b8; white-space: pre-wrap; word-break: break-word;"></pre>
        </div>
      </div>

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

  document.getElementById('copy-logs-btn').addEventListener('click', async () => {
    try {
      const text = document.getElementById('logs-content').textContent;
      if (!text || text === 'Loading logs...') {
         alert('Please toggle the detailed logs open first to load the data.');
         return;
      }
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('copy-logs-btn');
      const oldHtml = btn.innerHTML;
      btn.innerHTML = '✅';
      setTimeout(() => btn.innerHTML = oldHtml, 2000);
    } catch (err) {
      alert('Failed to copy: ' + err.message);
    }
  });

  if (canEdit) {
    document.getElementById('settings-btn').addEventListener('click', () => {
      showSettingsForm();
    });
    document.getElementById('download-pdf-btn').addEventListener('click', async () => {
      try {
        const btn = document.getElementById('download-pdf-btn');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '⏳';
        
        const entries = await api.getAllEntries();
        entries.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.time.localeCompare(a.time);
        });

        const container = document.createElement('div');
        container.style.padding = '20px';
        container.style.fontFamily = 'Helvetica, Arial, sans-serif';
        container.style.color = '#333';
        
        let html = '<h1 style="text-align:center; margin-bottom: 20px;">Baby Tracker Records</h1>';
        
        for (const e of entries) {
            let parts = [`<strong>${e.date} @ ${e.time}</strong>`];
            
            let bs = [];
            let bDetails = [];
            if (e.breast_left) {
               bs.push('L');
               if (e.breast_left !== 'Latching' && e.breast_left !== '含乳') bDetails.push(e.breast_left);
            }
            if (e.breast_right) {
               bs.push('R');
               if (e.breast_right !== 'Latching' && e.breast_right !== '含乳') bDetails.push(e.breast_right);
            }
            if (bs.length) {
               parts.push(`<strong>Breast:</strong> ${bs.join(', ')}`);
            }

            if (e.formula_ml) parts.push(`<strong>Formula:</strong> ${e.formula_ml}ml`);
            if (e.bottle_ml) parts.push(`<strong>Bottle(BM):</strong> ${e.bottle_ml}ml`);
            if (e.urine) parts.push(`<strong>Urine</strong>`);
            if (e.stool) {
               parts.push(e.stool_color ? `<strong>Stool:</strong> ${e.stool_color}` : `<strong>Stool</strong>`);
            }

            let details = [];
            if (bDetails.length) details.push([...new Set(bDetails)].join(', '));
            if (e.comments) details.push(e.comments);
            if (details.length) parts.push(`<strong>Details:</strong> ${details.join(' | ')}`);

            html += `<div style="margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; font-size: 13px; line-height: 1.5;">${parts.join(' &nbsp;|&nbsp; ')}</div>`;
        }
        container.innerHTML = html;
        
        const opt = {
          margin:       0.5,
          filename:     'baby_tracker_all.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(container).save();
        
        btn.innerHTML = oldHtml;
      } catch (e) {
        console.error(e);
        alert('Failed to generate PDF: ' + e.message);
        document.getElementById('download-pdf-btn').innerHTML = '📄';
      }
    });
  }

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

  document.getElementById('toggle-logs-btn').addEventListener('click', async () => {
    const container = document.getElementById('logs-container');
    const isHidden = container.style.display === 'none';
    if (isHidden) {
      container.style.display = 'block';
      const logsContent = document.getElementById('logs-content');
      logsContent.textContent = 'Loading logs...';
      try {
        const entries = await api.getAllEntries();
        // Sort DESC
        entries.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.time.localeCompare(a.time);
        });

        let text = 'Baby Tracker Records\n\n';
        for (const e of entries) {
            let parts = [`${e.date} @ ${e.time}`];
            
            let bs = [];
            let bDetails = [];
            if (e.breast_left) {
               bs.push('L');
               if (e.breast_left !== 'Latching' && e.breast_left !== '含乳') bDetails.push(e.breast_left);
            }
            if (e.breast_right) {
               bs.push('R');
               if (e.breast_right !== 'Latching' && e.breast_right !== '含乳') bDetails.push(e.breast_right);
            }
            if (bs.length) {
               parts.push(`Breast: ${bs.join(', ')}`);
            }

            if (e.formula_ml) parts.push(`Formula: ${e.formula_ml}ml`);
            if (e.bottle_ml) parts.push(`Bottle(BM): ${e.bottle_ml}ml`);
            if (e.urine) parts.push(`Urine`);
            if (e.stool) {
               parts.push(e.stool_color ? `Stool: ${e.stool_color}` : `Stool`);
            }

            let details = [];
            if (bDetails.length) details.push([...new Set(bDetails)].join(', '));
            if (e.comments) details.push(e.comments);
            if (details.length) parts.push(`Details: ${details.join(' | ')}`);

            text += parts.join(' | ') + '\n';
        }
        logsContent.textContent = text;
      } catch (err) {
        logsContent.textContent = 'Failed to load logs: ' + err.message;
      }
    } else {
      container.style.display = 'none';
    }
  });

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
        onDelete: (id) => {
          renderConfirm(document.getElementById('modal-container'), t('timeline.delete_confirm'), async () => {
            try {
              await api.deleteEntry(id);
              await loadContent();
            } catch (err) {
              alert(err.message);
            }
          });
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

function showSettingsForm() {
  const modalContainer = document.getElementById('modal-container');

  renderSettingsForm(modalContainer, {
    onCancel: () => {
      modalContainer.innerHTML = '';
    },
    onSave: async (newDob) => {
      modalContainer.innerHTML = '';
      await renderApp(); // Re-render to update the day count
    },
  });
}

// Boot
init();
