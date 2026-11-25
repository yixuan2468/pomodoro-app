const WORK_DURATION_SECONDS = 25 * 60;
const BREAK_DURATION_SECONDS = 5 * 60;

let currentPhase = "work";
let remainingSeconds = WORK_DURATION_SECONDS;
let timerInterval = null;
let audioContext = null;
let completedSessions = 0;

function initializeApp() {
  completedSessions = loadCompletedSessions();
  renderCompletedSessions();
  renderTimer();
  document.getElementById("start-button").addEventListener("click", startTimer);
  document.getElementById("pause-button").addEventListener("click", pauseTimer);
  document.getElementById("resume-button").addEventListener("click", resumeTimer);
  document.getElementById("reset-button").addEventListener("click", resetTimer);
}

function loadCompletedSessions() {
  try {
    const savedCount = localStorage.getItem("completedWorkSessions");

    if (savedCount === null) {
      return 0;
    }

    const count = Number(savedCount);
    if (savedCount.trim() === "" || !Number.isSafeInteger(count) || count < 0) {
      console.error("Saved completed session count is invalid.");
      return 0;
    }

    return count;
  } catch (error) {
    console.error("Unable to load completed sessions:", error);
    return 0;
  }
}

function saveCompletedSessions(count) {
  try {
    localStorage.setItem("completedWorkSessions", String(count));
  } catch (error) {
    console.error("Unable to save completed sessions:", error);
  }
}

function startTimer() {
  unlockAudio();

  if (timerInterval !== null || remainingSeconds === 0) {
    return;
  }

  timerInterval = setInterval(tick, 1000);
}

function pauseTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resumeTimer() {
  startTimer();
}

function resetTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  currentPhase = "work";
  remainingSeconds = WORK_DURATION_SECONDS;
  renderTimer();
}

function tick() {
  remainingSeconds = Math.max(remainingSeconds - 1, 0);

  if (remainingSeconds === 0) {
    handlePhaseCompletion();
  }

  renderTimer();
}

function handlePhaseCompletion() {
  if (currentPhase === "work") {
    completedSessions += 1;
    saveCompletedSessions(completedSessions);
    renderCompletedSessions();
  }

  currentPhase = currentPhase === "work" ? "break" : "work";
  remainingSeconds = currentPhase === "work" ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS;
  playTransitionSound();
}

function renderCompletedSessions() {
  document.getElementById("session-count").textContent = String(completedSessions);
}

function renderTimer() {
  document.getElementById("time-display").textContent = formatTime(remainingSeconds);
  document.getElementById("phase-label").textContent = currentPhase === "work" ? "Work" : "Break";
  const totalSeconds = currentPhase === "work" ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS;
  renderProgress(remainingSeconds, totalSeconds);
}

function renderProgress(remainingSeconds, totalSeconds) {
  const indicator = document.getElementById("progress-indicator");
  const circumference = indicator.getTotalLength();
  const progress = Math.max(0, Math.min(remainingSeconds / totalSeconds, 1));

  indicator.style.strokeDasharray = circumference;
  indicator.style.strokeDashoffset = circumference * (1 - progress);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function unlockAudio() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    console.error("Web Audio API is not supported in this browser.");
    return;
  }

  if (audioContext === null) {
    audioContext = new AudioContextConstructor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch((error) => {
      console.error("Unable to resume audio context:", error);
    });
  }
}

function playTransitionSound() {
  if (audioContext === null || audioContext.state !== "running") {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startTime = audioContext.currentTime;
  const duration = 0.25;

  oscillator.frequency.setValueAtTime(660, startTime);
  gain.gain.setValueAtTime(0.15, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

initializeApp();
