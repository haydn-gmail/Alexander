const { initDB, createEntry, getSummaryByDate, deleteEntry, getEntriesByDate } = require('./server/db');

async function test() {
  await initDB();
  const testDate = '2026-05-01';
  
  // Clear existing entries for test date
  const existing = getEntriesByDate(testDate);
  for (const e of existing) {
    // deleteEntry is not exported by name or I need to check its export
  }

  console.log('Testing diaper count logic...');

  // Record 1: Urine only -> 1 diaper
  createEntry({
    date: testDate,
    time: '08:00',
    urine: 1,
    stool: 0,
    created_by: 'Test'
  });

  // Record 2: Stool only -> 2 diapers
  createEntry({
    date: testDate,
    time: '10:00',
    urine: 0,
    stool: 1,
    created_by: 'Test'
  });

  // Record 3: Both -> 3 diapers
  createEntry({
    date: testDate,
    time: '12:00',
    urine: 1,
    stool: 1,
    created_by: 'Test'
  });

  // Record 4: Feed only -> still 3 diapers
  createEntry({
    date: testDate,
    time: '14:00',
    formula_ml: 100,
    created_by: 'Test'
  });

  const summary = getSummaryByDate(testDate);
  console.log('Summary for', testDate, ':', summary);

  if (summary.diaper_count === 3) {
    console.log('✅ Diaper count verification PASSED');
  } else {
    console.error('❌ Diaper count verification FAILED. Expected 3, got', summary.diaper_count);
    process.exit(1);
  }
}

test().catch(console.error);
