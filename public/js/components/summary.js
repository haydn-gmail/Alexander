import { t } from '../i18n.js';
import { timeSince, formatTime, isToday } from '../utils.js';

export function renderSummary(container, summary) {
  const lastFeed =
    summary.last_feed_time && isToday(summary.date)
      ? timeSince(summary.last_feed_time, summary.date)
      : summary.last_feed_time
        ? formatTime(summary.last_feed_time)
        : t('summary.never');

  const lastDiaper =
    summary.last_diaper_time && isToday(summary.date)
      ? timeSince(summary.last_diaper_time, summary.date)
      : summary.last_diaper_time
        ? formatTime(summary.last_diaper_time)
        : t('summary.never');

  container.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card accent-feed">
        <div class="summary-value">${summary.total_feedings}</div>
        <div class="summary-label">${t('summary.total_feedings')}</div>
      </div>
      <div class="summary-card accent-breast">
        <div class="summary-value">
          ${summary.breast_right_count}<small>${t('summary.right')}</small>
          ${summary.breast_left_count}<small>${t('summary.left')}</small>
        </div>
        <div class="summary-label">${t('summary.breast_sessions')}</div>
      </div>
      <div class="summary-card accent-formula">
        <div class="summary-value">${summary.total_formula_ml}<small>mL</small></div>
        <div class="summary-label">${t('summary.total_formula')} (${summary.formula_count}x)</div>
      </div>
      <div class="summary-card accent-bottle">
        <div class="summary-value">${summary.total_bottle_ml}<small>mL</small></div>
        <div class="summary-label">${t('summary.bottle_feeds')} (${summary.bottle_count}x)</div>
      </div>
      <div class="summary-card accent-urine">
        <div class="summary-value">${summary.urine_count}</div>
        <div class="summary-label">${t('summary.urine_count')}</div>
      </div>
      <div class="summary-card accent-stool">
        <div class="summary-value">${summary.stool_count}</div>
        <div class="summary-label">${t('summary.stool_count')}</div>
      </div>
      <div class="summary-card accent-diaper">
        <div class="summary-value">${summary.diaper_count}</div>
        <div class="summary-label">${t('summary.diapers_used')}</div>
      </div>
      <div class="summary-card accent-time">
        <div class="summary-value small-text">${lastFeed}</div>
        <div class="summary-label">${t('summary.last_feed')}</div>
      </div>
      <div class="summary-card accent-time">
        <div class="summary-value small-text">${lastDiaper}</div>
        <div class="summary-label">${t('summary.last_diaper')}</div>
      </div>
    </div>
  `;
}
