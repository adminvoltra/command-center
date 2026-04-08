// One-time migration: backfill `id` on all existing lift sessions in Redis
// and ensure `liftingDrafts` exists.
// Run: node scripts/migrate-lift-ids.mjs

const API = "http://localhost:3000/api/context";

async function migrate() {
  const res = await fetch(API);
  const { context } = await res.json();

  if (!context.lifting) {
    console.log("No lifting data found, nothing to migrate.");
    return;
  }

  let count = 0;
  const lifting = context.lifting;

  for (const year of Object.keys(lifting)) {
    const yearData = lifting[year];
    for (const cat of Object.keys(yearData)) {
      const catData = yearData[cat];
      if (!catData) continue;
      for (const exercise of Object.keys(catData)) {
        const sessions = catData[exercise];
        if (!Array.isArray(sessions)) continue;
        for (let i = 0; i < sessions.length; i++) {
          if (!sessions[i].id) {
            sessions[i].id = `${Date.now()}-${count}`;
            count++;
          }
        }
      }
    }
  }

  // Ensure liftingDrafts exists
  if (!context.liftingDrafts) {
    context.liftingDrafts = [];
  }

  const saveRes = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  const result = await saveRes.json();
  console.log(`Migrated ${count} sessions with IDs. Saved: ${result.success}`);
}

migrate().catch(console.error);
