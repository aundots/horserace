/** 경주 70%~완주까지 관중 함성 (함성3.m4a) */

export const CHEER_START_PROGRESS = 0.7;

const CHEER_SRC = "/함성3.m4a";
const CHEER_VOLUME = 0.72;
const FADE_MS = 450;

let cheerAudio: HTMLAudioElement | null = null;
let cheerActive = false;
let fadeTimer: ReturnType<typeof window.setInterval> | null = null;

export function isRaceSoundEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("horserace.sound") !== "off";
}

export function getCheerThreshold() {
  return CHEER_START_PROGRESS;
}

function getCheerAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!cheerAudio) {
    cheerAudio = new Audio(CHEER_SRC);
    cheerAudio.loop = true;
    cheerAudio.preload = "auto";
  }
  return cheerAudio;
}

function clearFadeTimer() {
  if (fadeTimer != null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function fadeVolume(target: number, onDone?: () => void) {
  const audio = getCheerAudio();
  if (!audio) return;

  clearFadeTimer();
  const start = audio.volume;
  const startAt = performance.now();

  fadeTimer = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - startAt) / FADE_MS);
    audio.volume = start + (target - start) * t;
    if (t >= 1) {
      clearFadeTimer();
      onDone?.();
    }
  }, 16);
}

export function prepareRaceAudio() {
  const audio = getCheerAudio();
  if (!audio) return;
  audio.load();
}

export function stopFinishCheer() {
  clearFadeTimer();
  const audio = cheerAudio;
  if (!audio) {
    cheerActive = false;
    return;
  }

  if (!cheerActive && audio.paused) return;

  const vol = audio.volume;
  if (vol <= 0.01) {
    audio.pause();
    audio.currentTime = 0;
    cheerActive = false;
    return;
  }

  fadeVolume(0, () => {
    audio.pause();
    audio.currentTime = 0;
    cheerActive = false;
  });
}

/** 70%부터 완주까지 루프 함성 */
export function startFinishCheer() {
  if (!isRaceSoundEnabled() || cheerActive) return;

  const audio = getCheerAudio();
  if (!audio) return;

  cheerActive = true;
  audio.volume = 0;
  const playPromise = audio.play();
  if (playPromise) {
    playPromise
      .then(() => fadeVolume(CHEER_VOLUME))
      .catch(() => {
        cheerActive = false;
      });
  }
}

export function updateFinishCheer(progress: number, racing: boolean) {
  if (!racing) {
    stopFinishCheer();
    return;
  }
  if (progress >= CHEER_START_PROGRESS) {
    startFinishCheer();
  }
}

/** @deprecated startFinishCheer / updateFinishCheer 사용 */
export function playFinishCheer() {
  startFinishCheer();
}
