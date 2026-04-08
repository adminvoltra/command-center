// One-time script to seed lifting data into Redis via the API
const API = "http://localhost:3000/api/context";

const liftingData = {
  "2026": {
    push: {
      "Peck Deck": [
        { date: "1/7", d: 7, w: 150, tr: 20 },
        { date: "1/17", d: 17, w: 130, tr: 40 },
        { date: "1/21", d: 21, w: 140, tr: 20 },
        { date: "1/31", d: 31, w: 140, tr: 20, note: "Need more weight" },
        { date: "2/18", d: 49, w: 150, tr: 20 },
        { date: "2/24", d: 55, w: 160, tr: 21 },
        { date: "3/7", d: 66, w: 165, tr: 20 },
        { date: "3/12", d: 71, w: 170, tr: 20 },
        { date: "3/25", d: 84, w: 170, tr: 20 },
      ],
      "Rev. Peck Deck": [
        { date: "1/7", d: 7, w: 80, tr: 20 },
        { date: "1/17", d: 17, w: 80, tr: 24 },
        { date: "1/21", d: 21, w: 80, tr: 20 },
        { date: "1/31", d: 31, w: 80, tr: 20 },
        { date: "2/18", d: 49, w: 90, tr: 20 },
        { date: "2/24", d: 55, w: 90, tr: 20 },
        { date: "3/7", d: 66, w: 95, tr: 20 },
      ],
      "Incline DB (ea)": [
        { date: "1/7", d: 7, w: 60, tr: 20 },
        { date: "1/17", d: 17, w: 60, tr: 22 },
        { date: "2/6", d: 37, w: 65, tr: 28 },
        { date: "2/18", d: 49, w: 60, tr: 36, note: "light" },
        { date: "3/7", d: 66, w: 70, tr: 20 },
        { date: "3/12", d: 71, w: 70, tr: 19 },
        { date: "3/18", d: 77, w: 60, tr: 30, note: "light" },
        { date: "3/25", d: 84, w: 65, tr: 22 },
      ],
      "Flat DB Bench (ea)": [
        { date: "1/21", d: 21, w: 70, tr: 30 },
        { date: "1/31", d: 31, w: 70, tr: 20, note: "Get 12 next" },
        { date: "2/18", d: 49, w: 60, tr: 30, note: "light" },
        { date: "3/18", d: 77, w: 60, tr: 30, note: "light" },
      ],
      "Close Incline DB (ea)": [
        { date: "3/7", d: 66, w: 35, tr: 20 },
        { date: "3/12", d: 71, w: 35, tr: 30 },
        { date: "3/25", d: 84, w: 40, tr: 30 },
      ],
      "IYTs (ea)": [
        { date: "1/7", d: 7, w: 15, tr: 14 },
        { date: "1/17", d: 17, w: 15, tr: 18 },
        { date: "1/21", d: 21, w: 20, tr: 12, note: "up to 20s" },
        { date: "1/31", d: 31, w: 20, tr: 12 },
        { date: "2/6", d: 37, w: 20, tr: 10 },
        { date: "3/12", d: 71, w: 20, tr: 8 },
        { date: "3/18", d: 77, w: 20, tr: 14 },
        { date: "3/25", d: 84, w: 20, tr: 14 },
      ],
      "Overhead Tri-Cable": [
        { date: "1/7", d: 7, w: 70, tr: 20 },
        { date: "1/21", d: 21, w: 100, tr: 20 },
        { date: "1/31", d: 31, w: 70, tr: 10 },
        { date: "2/6", d: 37, w: 100, tr: 20 },
        { date: "2/18", d: 49, w: 100, tr: 22, note: "1x6@100 + 2x8@80" },
        { date: "2/24", d: 55, w: 90, tr: 26, note: "1x10@80 + 1x16@90 !!" },
        { date: "3/7", d: 66, w: 100, tr: 20 },
      ],
      "Overhead Tri-DB (ea)": [
        { date: "3/7", d: 66, w: 55, tr: 20 },
        { date: "3/18", d: 77, w: 55, tr: 24 },
        { date: "3/25", d: 84, w: 35, tr: 20, note: "sore" },
      ],
      "Cable Tri Pulldown": [
        { date: "1/21", d: 21, w: 80, tr: 20 },
        { date: "2/18", d: 49, w: 60, tr: 20 },
        { date: "2/24", d: 55, w: 60, tr: 30 },
        { date: "3/7", d: 66, w: 60, tr: 20 },
        { date: "3/12", d: 71, w: 100, tr: 24 },
        { date: "3/18", d: 77, w: 60, tr: 20 },
        { date: "3/25", d: 84, w: 120, tr: 20, note: "easy - go heavier" },
      ],
      "Cable Crossovers": [
        { date: "2/18", d: 49, w: 40, tr: 20 },
        { date: "2/24", d: 55, w: 40, tr: 20 },
        { date: "3/7", d: 66, w: 50, tr: 20 },
        { date: "3/18", d: 77, w: 60, tr: 16 },
      ],
      "Chest Press (machine)": [
        { date: "1/31", d: 31, w: 120, tr: 30 },
        { date: "2/24", d: 55, w: 160, tr: 48 },
      ],
      "Cable Shoulder Raise": [
        { date: "2/18", d: 49, w: 30, tr: 20 },
        { date: "2/24", d: 55, w: 30, tr: 24 },
      ],
    },
    pull: {
      "Lat Pull": [
        { date: "1/17", d: 17, w: 140, tr: 20 },
        { date: "2/6", d: 37, w: 150, tr: 20 },
        { date: "2/15", d: 46, w: 150, tr: 30 },
        { date: "2/26", d: 57, w: 160, tr: 20, note: "Increase" },
      ],
      "Rows": [
        { date: "1/31", d: 31, w: 140, tr: 20 },
        { date: "2/15", d: 46, w: 140, tr: 20 },
        { date: "2/26", d: 57, w: 170, tr: 20 },
      ],
      "Smith Bent Rows": [
        { date: "2/26", d: 57, w: 45, tr: 20 },
      ],
      "Bi Curls (ea)": [
        { date: "1/7", d: 7, w: 40, tr: 20 },
        { date: "1/17", d: 17, w: 40, tr: 16 },
        { date: "1/21", d: 21, w: 40, tr: 20 },
        { date: "1/31", d: 31, w: 35, tr: 30, note: "Superset drop" },
        { date: "2/6", d: 37, w: 40, tr: 20, note: "left tendon" },
        { date: "2/26", d: 57, w: 40, tr: 24 },
      ],
      "Hammer Curl (ea)": [
        { date: "2/15", d: 46, w: 35, tr: 20 },
        { date: "2/26", d: 57, w: 20, tr: 24, note: "superset drop" },
      ],
      "Cable Bi Curl": [
        { date: "2/15", d: 46, w: 80, tr: 20 },
      ],
      "DB Shrugs (ea)": [
        { date: "2/15", d: 46, w: 55, tr: 20 },
      ],
    },
    legs: {
      "Leg Extension": [
        { date: "1/6", d: 6, w: 200, tr: 10 },
        { date: "1/16", d: 16, w: 200, tr: 20 },
        { date: "1/19", d: 19, w: 245, tr: 27, note: "12+15 reps" },
        { date: "2/4", d: 35, w: 245, tr: 24 },
        { date: "2/11", d: 42, w: 245, tr: 40 },
        { date: "2/17", d: 48, w: 245, tr: 30 },
        { date: "2/21", d: 52, w: 245, tr: 40 },
        { date: "3/4", d: 63, w: 245, tr: 40 },
        { date: "3/11", d: 70, w: 245, tr: 42, note: "2x21" },
        { date: "3/17", d: 76, w: 245, tr: 40 },
      ],
      "Leg Curl": [
        { date: "1/6", d: 6, w: 150, tr: 30 },
        { date: "1/19", d: 19, w: 200, tr: 20 },
        { date: "1/30", d: 30, w: 245, tr: 48, note: "2x10@170 + 2x14@245" },
        { date: "2/4", d: 35, w: 200, tr: 24 },
        { date: "2/11", d: 42, w: 200, tr: 30 },
        { date: "2/17", d: 48, w: 170, tr: 20, note: "Too easy" },
        { date: "2/21", d: 52, w: 180, tr: 20 },
        { date: "3/11", d: 70, w: 200, tr: 16 },
        { date: "3/17", d: 76, w: 200, tr: 28 },
      ],
      "Smith Squat (ea)": [
        { date: "1/16", d: 16, w: 0, tr: 20, note: "BW only" },
        { date: "1/19", d: 19, w: 45, tr: 30 },
        { date: "1/22", d: 22, w: 45, tr: 20 },
        { date: "1/30", d: 30, w: 70, tr: 20, note: "explosive" },
        { date: "2/4", d: 35, w: 45, tr: 16 },
        { date: "2/17", d: 48, w: 45, tr: 12 },
        { date: "2/21", d: 52, w: 45, tr: 20, note: "light" },
        { date: "3/4", d: 63, w: 45, tr: 18 },
        { date: "3/11", d: 70, w: 90, tr: 15, note: "3x5" },
      ],
      "Leg Press": [
        { date: "1/6", d: 6, w: 260, tr: 45 },
        { date: "1/22", d: 22, w: 300, tr: 20 },
        { date: "3/17", d: 76, w: 135, tr: 40, note: "warmup pyramid" },
      ],
      "Calf Work": [
        { date: "1/6", d: 6, w: 200, tr: 50 },
        { date: "1/19", d: 19, w: 290, tr: 40 },
        { date: "1/22", d: 22, w: 45, tr: 100 },
        { date: "1/30", d: 30, w: 70, tr: 80 },
        { date: "2/4", d: 35, w: 70, tr: 70 },
        { date: "2/21", d: 52, w: 200, tr: 100 },
        { date: "3/11", d: 70, w: 45, tr: 90 },
        { date: "3/17", d: 76, w: 220, tr: 30 },
      ],
      "Inner/Outer Thigh": [
        { date: "1/22", d: 22, w: 150, tr: 40 },
        { date: "2/11", d: 42, w: 150, tr: 40 },
        { date: "3/11", d: 70, w: 170, tr: 40 },
      ],
      "Good Mornings": [
        { date: "1/19", d: 19, w: 45, tr: 20 },
        { date: "2/17", d: 48, w: 45, tr: 20 },
        { date: "3/4", d: 63, w: 70, tr: 20 },
      ],
      "Rotary Torso": [
        { date: "1/30", d: 30, w: 70, tr: 20 },
        { date: "2/11", d: 42, w: 100, tr: 20 },
        { date: "2/21", d: 52, w: 120, tr: 10 },
        { date: "3/7", d: 66, w: 120, tr: 20 },
      ],
    },
  },
};

async function seed() {
  // Fetch current context from Redis
  const res = await fetch(API);
  const { context } = await res.json();

  // Merge lifting data
  context.lifting = liftingData;

  // Save back
  const saveRes = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  const result = await saveRes.json();
  console.log("Saved:", result.success);
}

seed().catch(console.error);
