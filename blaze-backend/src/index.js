import { createApp } from 'blazefw';
import { cors } from 'blazefw/middleware/cors';
import { logger } from 'blazefw/middleware/logger';
import { requestId } from 'blazefw/middleware/request-id';

// ──────────────────────────────────────────────
// Env type (D1 + Workers AI)
// ──────────────────────────────────────────────
// type Env = { DB: D1Database; AI: Ai }

const app = createApp();

// ──────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────
app.use(requestId());
app.use(logger());
app.use(
  cors({
    origins: ['https://kxhs-diet-planner.scattrhq.workers.dev', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Session-Id'],
  })
);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function generateId() {
  return crypto.randomUUID();
}

function calcBMI(weight_kg, height_cm) {
  const h = height_cm / 100;
  return +(weight_kg / (h * h)).toFixed(1);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function calcCalories(age, weight_kg, height_cm, goal) {
  // Mifflin-St Jeor (unisex average approximation)
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 80;
  const tdee = Math.round(bmr * 1.375); // light activity
  if (goal === 'lose') return tdee - 500;
  if (goal === 'gain') return tdee + 300;
  return tdee;
}

function calcWellnessScore(bmi, mood_score, goal) {
  let score = 60;
  // BMI contribution (max 25pts)
  if (bmi >= 18.5 && bmi < 25) score += 25;
  else if (bmi >= 17 && bmi < 30) score += 15;
  else score += 5;
  // Mood contribution (max 15pts)
  score += Math.round((mood_score / 5) * 15);
  return Math.min(score, 100);
}

async function runAI(env, messages) {
  const result = await env.AI.run('@cf/openai/gpt-oss-120b', {
    messages,
    max_tokens: 600,
  });
  return result?.response ?? result?.choices?.[0]?.message?.content ?? '';
}

// ──────────────────────────────────────────────
// POST /api/session — create guest session
// ──────────────────────────────────────────────
app.post('/api/session', async (req, res) => {
  const session_id = generateId();
  await req.env.DB.prepare('INSERT INTO sessions (id) VALUES (?)')
    .bind(session_id)
    .run();
  res.json({ session_id });
});

// ──────────────────────────────────────────────
// POST /api/onboard — save user profile
// Body: { session_id, age, height_cm, weight_kg, goal }
// ──────────────────────────────────────────────
app.post('/api/onboard', async (req, res) => {
  const body = await req.json();
  const { session_id, age, height_cm, weight_kg, goal } = body;

  if (!session_id || !age || !height_cm || !weight_kg || !goal) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bmi = calcBMI(weight_kg, height_cm);
  const category = bmiCategory(bmi);
  const daily_calories = calcCalories(age, weight_kg, height_cm, goal);

  await req.env.DB.prepare(
    `INSERT INTO user_profiles
      (session_id, age, height_cm, weight_kg, goal, bmi, bmi_category, daily_calories)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       age=excluded.age, height_cm=excluded.height_cm, weight_kg=excluded.weight_kg,
       goal=excluded.goal, bmi=excluded.bmi, bmi_category=excluded.bmi_category,
       daily_calories=excluded.daily_calories`
  )
    .bind(session_id, age, height_cm, weight_kg, goal, bmi, category, daily_calories)
    .run();

  // Also save initial weight check-in
  await req.env.DB.prepare(
    'INSERT INTO weight_checkins (session_id, weight_kg) VALUES (?, ?)'
  )
    .bind(session_id, weight_kg)
    .run();

  res.json({ bmi, bmi_category: category, daily_calories });
});

// ──────────────────────────────────────────────
// POST /api/mood — record mood entry
// Body: { session_id, mood, mood_score, note? }
// ──────────────────────────────────────────────
app.post('/api/mood', async (req, res) => {
  const body = await req.json();
  const { session_id, mood, mood_score, note } = body;

  if (!session_id || !mood || !mood_score) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await req.env.DB.prepare(
    'INSERT INTO mood_entries (session_id, mood, mood_score, note) VALUES (?, ?, ?, ?)'
  )
    .bind(session_id, mood, mood_score, note ?? null)
    .run();

  res.json({ id: result.meta?.last_row_id, recorded: true });
});

// ──────────────────────────────────────────────
// POST /api/analyze — AI analysis
// Body: { session_id }
// ──────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const body = await req.json();
  const { session_id } = body;

  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  // Fetch profile and latest mood
  const profile = await req.env.DB.prepare(
    'SELECT * FROM user_profiles WHERE session_id = ?'
  )
    .bind(session_id)
    .first();

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const latestMood = await req.env.DB.prepare(
    'SELECT * FROM mood_entries WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 1'
  )
    .bind(session_id)
    .first();

  const mood_score = latestMood?.mood_score ?? 3;
  const mood = latestMood?.mood ?? 'neutral';
  const wellness_score = calcWellnessScore(profile.bmi, mood_score, profile.goal);

  // Update wellness score
  await req.env.DB.prepare(
    'UPDATE user_profiles SET wellness_score = ? WHERE session_id = ?'
  )
    .bind(wellness_score, session_id)
    .run();

  // Ask AI for personalized plan
  const aiPrompt = `You are NutriMind, a friendly diet and wellness AI.
User profile:
- Age: ${profile.age}, Height: ${profile.height_cm}cm, Weight: ${profile.weight_kg}kg
- BMI: ${profile.bmi} (${profile.bmi_category})
- Goal: ${profile.goal} weight
- Daily calorie target: ${profile.daily_calories} kcal
- Current mood: ${mood} (score ${mood_score}/5)
- Wellness score: ${wellness_score}/100

Provide a JSON object with these keys:
{
  "meal_plan": {
    "breakfast": "...",
    "lunch": "...",
    "dinner": "...",
    "snacks": "..."
  },
  "tips": ["tip1", "tip2", "tip3"],
  "motivation": "A short encouraging message based on their mood and goal."
}
Keep it warm, practical and specific. Return ONLY valid JSON.`;

  let aiData = null;
  let meal_plan = null;
  let tips = [];
  let motivation = '';

  try {
    const aiResponse = await runAI(req.env, [
      { role: 'user', content: aiPrompt },
    ]);
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiData = JSON.parse(jsonMatch[0]);
      meal_plan = aiData.meal_plan;
      tips = aiData.tips ?? [];
      motivation = aiData.motivation ?? '';
    }
  } catch (e) {
    // fallback defaults
    meal_plan = {
      breakfast: 'Oats with berries and a boiled egg',
      lunch: 'Grilled chicken salad with olive oil dressing',
      dinner: 'Baked salmon with steamed broccoli and quinoa',
      snacks: 'Greek yogurt with almonds',
    };
    tips = [
      'Drink 8 glasses of water daily',
      'Walk for 30 minutes after dinner',
      'Get 7-8 hours of sleep for recovery',
    ];
    motivation = 'Every healthy choice is a step closer to your best self!';
  }

  // Store suggestions
  if (meal_plan) {
    await req.env.DB.prepare(
      'INSERT INTO ai_suggestions (session_id, suggestion_type, content) VALUES (?, ?, ?)'
    )
      .bind(session_id, 'meal_plan', JSON.stringify(meal_plan))
      .run();
  }

  if (tips.length > 0) {
    await req.env.DB.prepare(
      'INSERT INTO ai_suggestions (session_id, suggestion_type, content) VALUES (?, ?, ?)'
    )
      .bind(session_id, 'tips', JSON.stringify(tips))
      .run();
  }

  if (motivation) {
    await req.env.DB.prepare(
      'INSERT INTO ai_suggestions (session_id, suggestion_type, content) VALUES (?, ?, ?)'
    )
      .bind(session_id, 'motivation', motivation)
      .run();
  }

  res.json({
    bmi: profile.bmi,
    bmi_category: profile.bmi_category,
    daily_calories: profile.daily_calories,
    wellness_score,
    mood,
    meal_plan,
    tips,
    motivation,
  });
});

// ──────────────────────────────────────────────
// GET /api/dashboard/:session_id
// ──────────────────────────────────────────────
app.get('/api/dashboard/:session_id', async (req, res) => {
  const { session_id } = req.params;

  const [profile, latestMood, mealPlan, tips, motivation, waterGoal] =
    await Promise.all([
      req.env.DB.prepare('SELECT * FROM user_profiles WHERE session_id = ?')
        .bind(session_id)
        .first(),
      req.env.DB.prepare(
        'SELECT * FROM mood_entries WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 1'
      )
        .bind(session_id)
        .first(),
      req.env.DB.prepare(
        "SELECT content FROM ai_suggestions WHERE session_id = ? AND suggestion_type = 'meal_plan' ORDER BY generated_at DESC LIMIT 1"
      )
        .bind(session_id)
        .first(),
      req.env.DB.prepare(
        "SELECT content FROM ai_suggestions WHERE session_id = ? AND suggestion_type = 'tips' ORDER BY generated_at DESC LIMIT 1"
      )
        .bind(session_id)
        .first(),
      req.env.DB.prepare(
        "SELECT content FROM ai_suggestions WHERE session_id = ? AND suggestion_type = 'motivation' ORDER BY generated_at DESC LIMIT 1"
      )
        .bind(session_id)
        .first(),
      Promise.resolve(null),
    ]);

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const water_goal_ml = profile.weight_kg ? Math.round(profile.weight_kg * 33) : 2000;

  res.json({
    profile: {
      age: profile.age,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      goal: profile.goal,
      bmi: profile.bmi,
      bmi_category: profile.bmi_category,
      daily_calories: profile.daily_calories,
      wellness_score: profile.wellness_score,
    },
    today_mood: latestMood
      ? { mood: latestMood.mood, score: latestMood.mood_score }
      : null,
    meal_plan: mealPlan ? JSON.parse(mealPlan.content) : null,
    tips: tips ? JSON.parse(tips.content) : [],
    motivation: motivation?.content ?? '',
    water_goal_ml,
  });
});

// ──────────────────────────────────────────────
// POST /api/chat — AI conversation (streaming)
// Body: { session_id, messages: [{role, content}] }
// ──────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const body = await req.json();
  const { session_id, messages } = body;

  if (!session_id || !messages?.length) {
    return res.status(400).json({ error: 'Missing session_id or messages' });
  }

  // Fetch profile for context
  const profile = await req.env.DB.prepare(
    'SELECT * FROM user_profiles WHERE session_id = ?'
  )
    .bind(session_id)
    .first();

  const latestMood = await req.env.DB.prepare(
    'SELECT mood, mood_score FROM mood_entries WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 1'
  )
    .bind(session_id)
    .first();

  const systemPrompt = `You are NutriMind, a compassionate AI wellness companion specializing in nutrition and mental health support.
${
  profile
    ? `User profile: Age ${profile.age}, BMI ${profile.bmi} (${profile.bmi_category}), Goal: ${profile.goal} weight, Daily calories: ${profile.daily_calories} kcal.`
    : ''
}
${latestMood ? `Current mood: ${latestMood.mood} (${latestMood.mood_score}/5).` : ''}
Be warm, supportive, and evidence-based. Keep responses concise (2-3 paragraphs max).
You can help with: diet advice, healthy recipes, mood support, motivation, and wellness tips.
If someone seems distressed, acknowledge their feelings with empathy before offering advice.`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10), // last 10 messages for context
  ];

  try {
    // Try streaming
    const aiResult = await req.env.AI.run('@cf/openai/gpt-oss-120b', {
      messages: fullMessages,
      stream: true,
      max_tokens: 500,
    });

    // If AI supports streaming, pipe as SSE
    if (aiResult instanceof ReadableStream) {
      res.header('Content-Type', 'text/event-stream');
      res.header('Cache-Control', 'no-cache');
      res.header('Connection', 'keep-alive');
      res.raw(new Response(aiResult, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': req.headers.get('Origin') || 'https://kxhs-diet-planner.scattrhq.workers.dev',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id'
        },
      }));
    } else {
      // Fallback: non-streaming
      const content =
        aiResult?.response ??
        aiResult?.choices?.[0]?.message?.content ??
        "I'm here to help! What would you like to talk about?";
      res.json({ content });
    }
  } catch (e) {
    res.status(500).json({
      content: "I'm having a moment — please try again shortly. Remember, every step counts! 💪",
    });
  }
});

// ──────────────────────────────────────────────
// GET /api/progress/:session_id
// ──────────────────────────────────────────────
app.get('/api/progress/:session_id', async (req, res) => {
  const { session_id } = req.params;

  const [weights, moods, profile] = await Promise.all([
    req.env.DB.prepare(
      'SELECT weight_kg, recorded_at FROM weight_checkins WHERE session_id = ? ORDER BY recorded_at ASC'
    )
      .bind(session_id)
      .all(),
    req.env.DB.prepare(
      'SELECT mood, mood_score, recorded_at FROM mood_entries WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 30'
    )
      .bind(session_id)
      .all(),
    req.env.DB.prepare('SELECT * FROM user_profiles WHERE session_id = ?')
      .bind(session_id)
      .first(),
  ]);

  const weightHistory = weights.results ?? [];
  const moodHistory = moods.results ?? [];

  // Calculate streak (consecutive days with any mood entry)
  const uniqueDays = new Set(
    moodHistory.map((m) => new Date(m.recorded_at * 1000).toDateString())
  );
  const streak = uniqueDays.size;

  res.json({
    weight_history: weightHistory,
    mood_history: moodHistory,
    streak,
    start_weight: weightHistory[0]?.weight_kg ?? profile?.weight_kg ?? null,
    current_weight: weightHistory[weightHistory.length - 1]?.weight_kg ?? profile?.weight_kg ?? null,
  });
});

// ──────────────────────────────────────────────
// POST /api/checkin — daily weight check-in
// Body: { session_id, weight_kg }
// ──────────────────────────────────────────────
app.post('/api/checkin', async (req, res) => {
  const body = await req.json();
  const { session_id, weight_kg } = body;

  if (!session_id || !weight_kg) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bmi = null; // will recalculate with profile height
  const profile = await req.env.DB.prepare(
    'SELECT height_cm FROM user_profiles WHERE session_id = ?'
  )
    .bind(session_id)
    .first();

  if (profile?.height_cm) {
    const newBmi = calcBMI(weight_kg, profile.height_cm);
    const newCategory = bmiCategory(newBmi);
    await req.env.DB.prepare(
      'UPDATE user_profiles SET weight_kg = ?, bmi = ?, bmi_category = ? WHERE session_id = ?'
    )
      .bind(weight_kg, newBmi, newCategory, session_id)
      .run();
  }

  await req.env.DB.prepare(
    'INSERT INTO weight_checkins (session_id, weight_kg) VALUES (?, ?)'
  )
    .bind(session_id, weight_kg)
    .run();

  res.json({ recorded: true, weight_kg });
});

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ──────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────
export default {
  fetch: app.fetch,
};
