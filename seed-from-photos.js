/**
 * Seed script — Import records extracted from the 4 hospital tracking sheet photos
 * Photos: IMG_6691.jpg through IMG_6694.jpg
 * Source: NewYork-Presbyterian Lower Manhattan Hospital, 83 Gold St
 * Date range: April 15-19, 2026
 */
const path = require('path');
const { initDB, createEntry, getDB } = require('./server/db');

const RECORDS = [
  // ============================================
  // IMG_6693 — Sheet 1: April 15 to April 16
  // ============================================

  // April 15
  { date: '2026-04-15', time: '04:00', formula_ml: 10 },
  { date: '2026-04-15', time: '06:30', formula_ml: 10, stool: 1, stool_color: 'black', comments: '体温血糖正常 (Body temp & blood sugar normal)' },
  { date: '2026-04-15', time: '10:00', formula_ml: 15, stool: 1, stool_color: 'black' },
  { date: '2026-04-15', time: '12:00', formula_ml: 15, stool: 1, stool_color: 'black' },
  { date: '2026-04-15', time: '13:00', formula_ml: 15, stool: 1, stool_color: 'black' },
  { date: '2026-04-15', time: '15:30', urine: 1, stool: 1, stool_color: 'black' },
  { date: '2026-04-15', time: '16:30', formula_ml: 20 },
  { date: '2026-04-15', time: '17:50', urine: 1, stool: 1, comments: 'Vaccine shots: Hepatitis B & RSV' },
  { date: '2026-04-15', time: '20:30', breast_right: 'Latching', breast_left: 'Latching', formula_ml: 15, urine: 1 },
  { date: '2026-04-15', time: '23:30', breast_right: 'Latching', breast_left: 'Latching', formula_ml: 17 },

  // ============================================
  // IMG_6693 (bottom) + IMG_6694 — Sheet 2: April 16 to April 17
  // ============================================

  // April 16
  { date: '2026-04-16', time: '00:00', comments: 'Weight: 3.010 kg' },
  { date: '2026-04-16', time: '02:00', formula_ml: 22 },
  { date: '2026-04-16', time: '05:15', formula_ml: 28 },
  { date: '2026-04-16', time: '06:30', urine: 1 },
  { date: '2026-04-16', time: '07:40', breast_left: 'Latching' },
  { date: '2026-04-16', time: '08:15', urine: 1 },
  { date: '2026-04-16', time: '08:30', formula_ml: 32, stool: 1, comments: 'Baby spill milk during sleep' },
  { date: '2026-04-16', time: '12:50', urine: 1, stool: 1 },
  { date: '2026-04-16', time: '13:30', formula_ml: 20, comments: 'Baby alert after feeding' },
  { date: '2026-04-16', time: '16:30', breast_right: 'Latching', formula_ml: 28, comments: 'Alert after feeding' },
  { date: '2026-04-16', time: '17:10', comments: 'First bath, then skin-to-skin' },
  { date: '2026-04-16', time: '21:30', formula_ml: 28 },

  // ============================================
  // IMG_6694 (bottom) + IMG_6692 — Sheet 3: April 17 to April 18
  // ============================================

  // April 17
  { date: '2026-04-17', time: '01:00', formula_ml: 28 },
  { date: '2026-04-17', time: '02:00', urine: 1 },
  { date: '2026-04-17', time: '04:30', breast_right: 'Latch practice', breast_left: 'Latch practice', formula_ml: 28, urine: 1 },
  { date: '2026-04-17', time: '05:00', comments: 'Weight: 2.975 kg' },
  { date: '2026-04-17', time: '08:30', formula_ml: 30, urine: 1, stool: 1, stool_color: 'green', comments: 'Latch expert Joyce' },
  { date: '2026-04-17', time: '12:00', formula_ml: 30, stool: 1 },
  { date: '2026-04-17', time: '15:00', formula_ml: 29, urine: 1, comments: '(Time estimated from sheet)' },
  { date: '2026-04-17', time: '17:00', formula_ml: 30, urine: 1, comments: '(Time estimated from sheet)' },
  { date: '2026-04-17', time: '20:00', formula_ml: 35, urine: 1, stool: 1 },

  // April 18
  { date: '2026-04-18', time: '01:00', formula_ml: 40, urine: 1, stool: 1 },
  { date: '2026-04-18', time: '04:00', formula_ml: 40, urine: 1, stool: 1 },
  { date: '2026-04-18', time: '05:40', formula_ml: 5 },
  { date: '2026-04-18', time: '08:30', formula_ml: 45 },
  { date: '2026-04-18', time: '11:30', formula_ml: 45 },

  // ============================================
  // IMG_6691 — Sheet 4 (rotated): April 18 (cont.) to April 19
  // ============================================

  // April 18 (continued)
  { date: '2026-04-18', time: '14:39', formula_ml: 45, stool: 1 },
  { date: '2026-04-18', time: '16:30', formula_ml: 45, urine: 1, stool: 1 },
  { date: '2026-04-18', time: '17:30', formula_ml: 20, urine: 1, stool: 1 },
  { date: '2026-04-18', time: '21:00', formula_ml: 55, urine: 1, stool: 1 },
  { date: '2026-04-18', time: '23:25', formula_ml: 55, urine: 1, stool: 1, comments: 'Pee on Daddy 😂' },

  // April 19
  { date: '2026-04-19', time: '02:50', formula_ml: 59, urine: 1, stool: 1 },
  { date: '2026-04-19', time: '05:00', formula_ml: 50, urine: 1 },
  { date: '2026-04-19', time: '08:00', formula_ml: 55, stool: 1 },
  { date: '2026-04-19', time: '12:18', formula_ml: 50, urine: 1, stool: 1 },
  { date: '2026-04-19', time: '15:20', breast_right: 'Latching', formula_ml: 60, urine: 1 },
  { date: '2026-04-19', time: '18:40', formula_ml: 50, urine: 1, stool: 1 },
  { date: '2026-04-19', time: '21:00', formula_ml: 59 },
  { date: '2026-04-19', time: '23:00', formula_ml: 15, urine: 1 },
  { date: '2026-04-19', time: '23:30', formula_ml: 15, urine: 1 },
];

async function seed() {
  await initDB();

  // Check if entries already exist
  const db = getDB();
  const existing = db.exec('SELECT COUNT(*) FROM entries');
  const count = existing[0].values[0][0];

  if (count > 0) {
    console.log(`⚠️  Database already has ${count} entries. Skipping seed to avoid duplicates.`);
    console.log('   To re-seed, delete data/baby_tracker.db and restart.');
    process.exit(0);
  }

  console.log(`📝 Importing ${RECORDS.length} records from hospital tracking sheets...\n`);

  let imported = 0;
  for (const record of RECORDS) {
    const entry = {
      date: record.date,
      time: record.time,
      breast_right: record.breast_right || null,
      breast_left: record.breast_left || null,
      formula_ml: record.formula_ml || null,
      urine: record.urine || 0,
      stool: record.stool || 0,
      stool_color: record.stool_color || null,
      comments: record.comments || null,
      created_by: 'Hospital Sheet Import',
    };
    createEntry(entry);
    imported++;

    // Progress indicator
    const dateStr = `${record.date} ${record.time}`;
    const parts = [];
    if (record.breast_right) parts.push(`BR:${record.breast_right}`);
    if (record.breast_left) parts.push(`BL:${record.breast_left}`);
    if (record.formula_ml) parts.push(`F:${record.formula_ml}mL`);
    if (record.urine) parts.push('💧');
    if (record.stool) parts.push('💩');
    if (record.comments) parts.push(`"${record.comments}"`);
    console.log(`  ✅ ${dateStr} — ${parts.join(', ')}`);
  }

  console.log(`\n🎉 Done! Imported ${imported} records.`);
  console.log('\nBreakdown by date:');

  // Print summary
  const dates = [...new Set(RECORDS.map((r) => r.date))];
  for (const date of dates) {
    const dayRecords = RECORDS.filter((r) => r.date === date);
    console.log(`  📅 ${date}: ${dayRecords.length} entries`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
