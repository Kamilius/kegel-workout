'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRAM DATA
// ═══════════════════════════════════════════════════════════════════════════════

const PROGRAM = [
  {
    weeksRange: [1, 2],
    name: 'Базова активація',
    holdSec: 3,
    restSec: 3,
    reps: 10,
    sets: 3,
    quickReps: 0,
    desc: '3 с напруга · 3 с відпочинок · 10 повт. × 3 підходи',
  },
  {
    weeksRange: [3, 4],
    name: 'Збільшення утримання',
    holdSec: 5,
    restSec: 5,
    reps: 10,
    sets: 3,
    quickReps: 10,
    desc: '5 с напруга · 5 с відпочинок · 10 повт. × 3 підходи + 10 швидких',
  },
  {
    weeksRange: [5, 6],
    name: 'Силова фаза',
    holdSec: 8,
    restSec: 5,
    reps: 10,
    sets: 4,
    quickReps: 20,
    desc: '8 с напруга · 5 с відпочинок · 10 повт. × 4 підходи + 20 швидких',
  },
  {
    weeksRange: [7, 8],
    name: 'Контрольна фаза',
    holdSec: 10,
    restSec: 5,
    reps: 10,
    sets: 4,
    quickReps: 0,
    desc: '10 с напруга · 5 с відпочинок · 10 повт. × 4 підходи',
  },
];

// Circumference for r=96: 2 * PI * 96 ≈ 603.19
const CIRCUMFERENCE = 2 * Math.PI * 96;

// Between-set rest (seconds)
const BETWEEN_SET_REST = 10;

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getStartDate() { return localStorage.getItem('kg_start_date'); }
function setStartDate(d) { localStorage.setItem('kg_start_date', d); }
function getSessions()   { return JSON.parse(localStorage.getItem('kg_sessions') || '[]'); }
function saveSessions(s) { localStorage.setItem('kg_sessions', JSON.stringify(s)); }
function getSettings()   { return JSON.parse(localStorage.getItem('kg_settings') || '{}'); }
function saveSettingsData(s) { localStorage.setItem('kg_settings', JSON.stringify(s)); }

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dateStr(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function addSession(date, slot) {
  const sessions = getSessions();
  // Avoid duplicates
  if (!sessions.find(s => s.date === date && s.slot === slot)) {
    sessions.push({ date, slot });
    saveSessions(sessions);
  }
}

function isSessionDone(date, slot) {
  return getSessions().some(s => s.date === date && s.slot === slot);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEK & PROGRAM CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function getCurrentWeek() {
  const start = getStartDate();
  if (!start) return 1;
  const msPerDay = 86400000;
  const days = Math.floor((Date.now() - new Date(start).getTime()) / msPerDay);
  return Math.min(8, Math.max(1, Math.ceil((days + 1) / 7)));
}

function getProgramForWeek(week) {
  return PROGRAM.find(p => week >= p.weeksRange[0] && week <= p.weeksRange[1]) || PROGRAM[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateStreak() {
  const sessions = getSessions();
  const msPerDay = 86400000;
  let streak = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const ds = dateStr(d);
    const hasSession = sessions.some(s => s.date === ds);
    if (hasSession) {
      streak++;
    } else if (i === 0) {
      // today not done yet — don't break streak
    } else {
      break;
    }
    d = new Date(d.getTime() - msPerDay);
  }
  return streak;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

let currentScreen = 'home';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === id);
  });
  currentScreen = id;

  // Show/hide bottom nav (hidden during workout)
  const nav = document.querySelector('.bottom-nav');
  nav.style.display = id === 'workout' ? 'none' : '';

  if (id === 'home')     renderHome();
  if (id === 'progress') renderProgress();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function renderHome() {
  const week = getCurrentWeek();
  const prog = getProgramForWeek(week);
  const today = todayStr();
  const mDone = isSessionDone(today, 'morning');
  const eDone = isSessionDone(today, 'evening');

  document.getElementById('week-badge').textContent = 'Тиждень ' + week;
  document.getElementById('phase-name').textContent = prog.name;
  document.getElementById('phase-desc').textContent = prog.desc;

  // Morning card
  const cardM = document.getElementById('card-morning');
  const btnM  = document.getElementById('btn-morning');
  const statM = document.getElementById('status-morning');
  cardM.classList.toggle('done', mDone);
  statM.textContent = mDone ? 'виконано ✓' : 'не виконано';
  btnM.textContent  = mDone ? 'Ще раз' : 'Почати';

  // Evening card
  const cardE = document.getElementById('card-evening');
  const btnE  = document.getElementById('btn-evening');
  const statE = document.getElementById('status-evening');
  cardE.classList.toggle('done', eDone);
  statE.textContent = eDone ? 'виконано ✓' : 'не виконано';
  btnE.textContent  = eDone ? 'Ще раз' : 'Почати';

  const streak = calculateStreak();
  const total  = getSessions().length;
  document.getElementById('home-streak').textContent = streak;
  document.getElementById('home-total').textContent  = total;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS SCREEN RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function renderProgress() {
  const streak = calculateStreak();
  const week   = getCurrentWeek();
  const total  = getSessions().length;

  document.getElementById('prog-streak').textContent = streak;
  document.getElementById('prog-week').textContent   = week;
  document.getElementById('prog-total').textContent  = total;

  const msPerDay = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = document.getElementById('calendar-rows');
  rows.innerHTML = '';

  const locale = 'uk-UA';
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getTime() - i * msPerDay);
    const ds = dateStr(d);
    const isToday = (i === 0);
    const mDone = isSessionDone(ds, 'morning');
    const eDone = isSessionDone(ds, 'evening');

    const label = isToday
      ? 'Сьогодні'
      : d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

    const row = document.createElement('div');
    row.className = 'cal-row' + (isToday ? ' today' : '');
    row.innerHTML = `
      <span class="cal-date">${label}</span>
      <span class="cal-dot ${mDone ? 'done' : 'miss'}">${mDone ? '✓' : '·'}</span>
      <span class="cal-dot ${eDone ? 'done' : 'miss'}">${eDone ? '✓' : '·'}</span>
    `;
    rows.appendChild(row);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKOUT STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════════

const WS = {        // workout state singleton
  running: false,
  paused:  false,
  slot:    'morning',
  prog:    null,
  phase:   'hold',   // hold | rest | between | quick-hold | quick-rest | countdown
  set:     1,
  rep:     1,
  quickRep: 1,
  timeLeft: 0,
  totalTime: 0,
  interval: null,
};

function startSession(slot) {
  // Set start date on first workout
  if (!getStartDate()) setStartDate(todayStr());

  // Request notification permission
  requestNotifPermission();

  WS.slot = slot;
  WS.prog = getProgramForWeek(getCurrentWeek());
  WS.set  = 1;
  WS.rep  = 1;
  WS.quickRep = 1;
  WS.paused   = false;
  WS.running  = true;

  // Update workout header
  document.getElementById('workout-slot-label').textContent =
    slot === 'morning' ? 'Ранкове тренування' : 'Вечірнє тренування';

  showScreen('workout');
  enterPhase('countdown');
}

function enterPhase(phase) {
  WS.phase = phase;

  // Clear any existing interval
  clearInterval(WS.interval);

  const p = WS.prog;

  switch (phase) {
    case 'countdown':
      setPhaseUI('Готуйся!', 'phase-prep', 'arc-prep', 3, 3);
      break;
    case 'hold':
      setPhaseUI('НАПРУЖУЙ', 'phase-hold', 'arc-hold', p.holdSec, p.holdSec);
      updateRepCounter();
      sendWorkoutNotif('Напружуй м\'язи', [100, 50, 100]);
      break;
    case 'rest':
      setPhaseUI('РОЗСЛАБ', 'phase-rest', 'arc-rest', p.restSec, p.restSec);
      updateRepCounter();
      sendWorkoutNotif('Розслаб м\'язи', [200]);
      break;
    case 'between':
      setPhaseUI('Відпочинок між підходами', 'phase-prep', 'arc-prep', BETWEEN_SET_REST, BETWEEN_SET_REST);
      sendWorkoutNotif('Підхід завершено! Відпочивай', [300, 100, 300]);
      break;
    case 'quick-hold':
      setPhaseUI('ШВИДКЕ СКОРОЧЕННЯ', 'phase-quick', 'arc-quick', 1, 1);
      updateQuickBar();
      if (WS.quickRep === 1) sendWorkoutNotif('Швидкі скорочення!', [100, 50, 100, 50, 100]);
      break;
    case 'quick-rest':
      setPhaseUI('відпусти', 'phase-quick', 'arc-quick', 1, 1);
      break;
  }

  beep(phaseFreq(phase));

  if (phase !== 'countdown') {
    document.getElementById('quick-bar').classList.toggle(
      'hidden', !(phase === 'quick-hold' || phase === 'quick-rest')
    );
  }

  WS.interval = setInterval(tick, 1000);

  document.getElementById('btn-done').classList.toggle(
    'hidden', !(phase === 'hold' || phase === 'quick-hold')
  );
}

function tick() {
  if (WS.paused) return;

  WS.timeLeft--;
  updateTimerRing(WS.timeLeft, WS.totalTime);

  if (WS.timeLeft > 0) return;

  // Phase transition
  clearInterval(WS.interval);
  const p = WS.prog;

  switch (WS.phase) {
    case 'countdown':
      enterPhase('hold');
      break;

    case 'hold':
      // After hold → rest (unless last rep of last set and quick reps next)
      enterPhase('rest');
      break;

    case 'rest':
      WS.rep++;
      if (WS.rep <= p.reps) {
        enterPhase('hold');
      } else {
        // All reps done for this set
        WS.rep = 1;
        if (WS.set < p.sets) {
          // More sets → between-set rest
          WS.set++;
          enterPhase('between');
        } else {
          // All sets done
          if (p.quickReps > 0) {
            WS.quickRep = 1;
            buildQuickDots();
            enterPhase('quick-hold');
          } else {
            completeWorkout();
          }
        }
      }
      break;

    case 'between':
      enterPhase('hold');
      break;

    case 'quick-hold':
      enterPhase('quick-rest');
      break;

    case 'quick-rest':
      WS.quickRep++;
      if (WS.quickRep <= p.quickReps) {
        enterPhase('quick-hold');
      } else {
        completeWorkout();
      }
      break;
  }
}

function setPhaseUI(label, labelClass, arcClass, timeLeft, totalTime) {
  WS.timeLeft  = timeLeft;
  WS.totalTime = totalTime;

  const el = document.getElementById('phase-label');
  el.textContent = label;
  el.className = 'phase-label-large ' + labelClass;

  const arc = document.getElementById('timer-arc');
  arc.className = 'timer-ring__arc ' + arcClass;

  updateTimerRing(timeLeft, totalTime);

  const setCount = WS.prog ? WS.prog.sets : 3;
  document.getElementById('workout-set-label').textContent =
    `Підхід ${WS.set} з ${setCount}`;
}

function updateTimerRing(timeLeft, totalTime) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const offset   = CIRCUMFERENCE * (1 - progress);
  const arc = document.getElementById('timer-arc');
  arc.style.strokeDashoffset = offset;
  // Disable CSS transition on first frame (full ring), enable after
  arc.style.transition = timeLeft === totalTime
    ? 'stroke 0.4s'
    : 'stroke 0.4s, stroke-dashoffset 0.9s linear';
  document.getElementById('timer-number').textContent = timeLeft;
}

function updateRepCounter() {
  document.getElementById('rep-counter').textContent =
    `Повторення ${WS.rep} / ${WS.prog.reps}`;
}

function buildQuickDots() {
  const container = document.getElementById('quick-dots');
  container.innerHTML = '';
  for (let i = 0; i < WS.prog.quickReps; i++) {
    const dot = document.createElement('div');
    dot.className = 'quick-dot';
    dot.id = 'qdot-' + i;
    container.appendChild(dot);
  }
}

function updateQuickBar() {
  // Mark done dots
  for (let i = 0; i < WS.quickRep - 1; i++) {
    const dot = document.getElementById('qdot-' + i);
    if (dot) dot.classList.add('done');
  }
}

function togglePause() {
  WS.paused = !WS.paused;
  document.getElementById('icon-pause').classList.toggle('hidden', WS.paused);
  document.getElementById('icon-play').classList.toggle('hidden', !WS.paused);
  document.getElementById('pause-label').textContent = WS.paused ? 'Продовжити' : 'Пауза';
}

function skipPhase() {
  clearInterval(WS.interval);
  WS.timeLeft = 1;
  tick();
}

function confirmStop() {
  document.getElementById('modal-stop').classList.remove('hidden');
}
function closeStopModal() {
  document.getElementById('modal-stop').classList.add('hidden');
}
function closeStopOnBackdrop(e) {
  if (e.target === document.getElementById('modal-stop')) closeStopModal();
}

function stopWorkout() {
  clearInterval(WS.interval);
  WS.running = false;
  closeStopModal();
  showScreen('home');
}

function completeWorkout() {
  clearInterval(WS.interval);
  WS.running = false;

  const date = todayStr();
  addSession(date, WS.slot);

  // Schedule next ntfy.sh reminders for tomorrow
  scheduleNtfyReminders();

  // Show done overlay
  const slotName = WS.slot === 'morning' ? 'ранкове' : 'вечірнє';
  document.getElementById('done-message').textContent =
    `${slotName.charAt(0).toUpperCase() + slotName.slice(1)} тренування завершено!`;
  document.getElementById('overlay-done').classList.remove('hidden');

  sendWorkoutNotif('Тренування завершено!', [200, 100, 200, 100, 400]);
}

function closeDone() {
  document.getElementById('overlay-done').classList.add('hidden');
  showScreen('home');
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════════════════════════

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(freq = 660, durationMs = 120) {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (_) {}
}

function phaseFreq(phase) {
  const map = {
    'countdown':  440,
    'hold':       880,
    'rest':       550,
    'between':    440,
    'quick-hold': 1000,
    'quick-rest': 660,
  };
  return map[phase] || 660;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

async function sendWorkoutNotif(body, vibrate) {
  if (Notification.permission !== 'granted') return;

  // Vibrate device
  if (navigator.vibrate) navigator.vibrate(vibrate || [200]);

  // Send via SW for reliability (works when screen locked)
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      reg.active.postMessage({
        type: 'NOTIFY',
        title: 'Вправи Кегеля',
        body,
        vibrate,
      });
      return;
    }
  }

  // Fallback: direct Notification API
  try {
    new Notification('Вправи Кегеля', { body, icon: 'icons/icon-192.png', silent: true });
  } catch (_) {}
}

// ── ntfy.sh integration ───────────────────────────────────────────────────────

async function scheduleNtfyReminders() {
  const settings = getSettings();
  const topic = settings.ntfyTopic;
  if (!topic) return;

  const morningTime = settings.reminderMorning || '08:00';
  const eveningTime = settings.reminderEvening || '21:00';

  try {
    await postNtfyReminder(topic, morningTime,
      'Ранкове тренування! Час для вправ Кегеля. 💪');
    await postNtfyReminder(topic, eveningTime,
      'Вечірнє тренування! Час для вправ Кегеля. 🌙');
  } catch (_) {}
}

async function postNtfyReminder(topic, timeHHMM, message) {
  const now = new Date();
  const [hh, mm] = timeHHMM.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  // Schedule for tomorrow if already past today
  if (target <= now) target.setDate(target.getDate() + 1);

  const atUnix = Math.floor(target.getTime() / 1000);

  await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: 'POST',
    headers: {
      'X-At':    String(atUnix),
      'X-Title': 'Вправи Кегеля',
      'X-Tags':  'muscle',
    },
    body: message,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

function openSettings() {
  const settings = getSettings();
  document.getElementById('reminder-morning').value = settings.reminderMorning || '08:00';
  document.getElementById('reminder-evening').value = settings.reminderEvening || '21:00';
  document.getElementById('ntfy-topic').value = settings.ntfyTopic || '';

  const startDate = getStartDate();
  document.getElementById('start-date-input').value = startDate || todayStr();

  document.getElementById('modal-settings').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('modal-settings').classList.add('hidden');
}

function closeSettingsOnBackdrop(e) {
  if (e.target === document.getElementById('modal-settings')) closeSettings();
}

function saveSettings() {
  const settings = {
    reminderMorning: document.getElementById('reminder-morning').value,
    reminderEvening: document.getElementById('reminder-evening').value,
    ntfyTopic:       document.getElementById('ntfy-topic').value.trim(),
  };
  saveSettingsData(settings);

  const startDate = document.getElementById('start-date-input').value;
  if (startDate) setStartDate(startDate);

  closeSettings();
  renderHome();

  // Request notification permission if not yet granted
  requestNotifPermission();
}

function generateNtfyTopic() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let topic = 'kegel-';
  for (let i = 0; i < 10; i++) {
    topic += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById('ntfy-topic').value = topic;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  registerSW();
  showScreen('home');

  // Prevent accidental back navigation on workout screen
  window.addEventListener('popstate', () => {
    if (currentScreen === 'workout' && WS.running) {
      history.pushState(null, '');
      confirmStop();
    }
  });
  history.pushState(null, '');
});
