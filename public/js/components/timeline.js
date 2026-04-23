import { t } from '../i18n.js';
import { formatTime, isToday, isYesterday, formatDate, escapeHtml, calculateDuration } from '../utils.js';
import * as api from '../api.js';

export function renderTimeline(container, entries, date, { onEdit, onDelete, canEdit }) {
  const dateLabel = isToday(date)
    ? t('timeline.today')
    : isYesterday(date)
      ? t('timeline.yesterday')
      : formatDate(date);

  if (!entries.length) {
    container.innerHTML = `
      <div class="timeline-empty">
        <div class="empty-icon">📋</div>
        <p>${t('timeline.no_entries')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = entries
    .map((e) => {
      const badges = [];
      if (e.breast_right) badges.push(`<span class="badge badge-breast">🤱 ${t('entry_form.breast_right')}</span>`);
      if (e.breast_left) badges.push(`<span class="badge badge-breast">🤱 ${t('entry_form.breast_left')}</span>`);
      if (e.formula_ml) badges.push(`<span class="badge badge-formula">🍼 ${e.formula_ml}mL</span>`);
      if (e.bottle_ml) badges.push(`<span class="badge badge-bottle">🧴 ${e.bottle_ml}mL</span>`);
      if (e.urine) badges.push(`<span class="badge badge-urine">💧</span>`);
      if (e.stool) {
        const colorLabel = e.stool_color ? ` ${t('entry_form.colors.' + e.stool_color)}` : '';
        badges.push(`<span class="badge badge-stool">💩${colorLabel}</span>`);
      }

      let feedTimeStr = '';
      if (e.feed_start || e.feed_end) {
        const duration = calculateDuration(e.feed_start, e.feed_end);
        if (duration !== null) {
          feedTimeStr = `<div class="card-feed-time">⏱️ ${formatTime(e.feed_start)} - ${formatTime(e.feed_end)} (${duration}m)</div>`;
        } else if (e.feed_start) {
          feedTimeStr = `<div class="card-feed-time">⏱️ ${t('entry_form.feed_start')}: ${formatTime(e.feed_start)}</div>`;
        } else {
          feedTimeStr = `<div class="card-feed-time">⏱️ ${t('entry_form.feed_end')}: ${formatTime(e.feed_end)}</div>`;
        }
      }

      return `
        <div class="timeline-card" data-id="${e.id}">
          <div class="card-time">${formatTime(e.time)}</div>
          <div class="card-body">
            <div class="card-badges">${badges.join('')}</div>
            ${feedTimeStr}
            ${e.comments ? `<div class="card-comment">${escapeHtml(e.comments)}</div>` : ''}
            ${e.created_by ? `<div class="card-meta">${t('timeline.logged_by')}: ${escapeHtml(e.created_by)}</div>` : ''}
          </div>
          ${
            canEdit
              ? `
            <div class="card-actions">
              <button class="icon-btn edit-btn" data-id="${e.id}" title="Edit">✏️</button>
              <button class="icon-btn delete-btn" data-id="${e.id}" title="Delete">🗑️</button>
            </div>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');

  // Event listeners
  if (canEdit) {
    container.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const entry = entries.find((en) => en.id === id);
        onEdit(entry);
      });
    });

    container.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        onDelete(id);
      });
    });
  }
}
