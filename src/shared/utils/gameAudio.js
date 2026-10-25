// Every sound plays through here so they all pause while the page is hidden
const playing = new Set();
const held = new Set();
const tracked = new WeakSet();

const track = (audio) => {
  if (tracked.has(audio)) return;
  tracked.add(audio);
  audio.addEventListener("ended", () => playing.delete(audio));
};

// Returns play()'s promise: callers must .catch it
export const playSound = (audio) => {
  if (document.hidden) {
    held.add(audio);
    return Promise.resolve();
  }
  track(audio);
  playing.add(audio);
  const played = audio.play();
  played.catch(() => playing.delete(audio));
  return played;
};

// Also stops a held sound starting when the page is visible again
export const pauseSound = (audio) => {
  playing.delete(audio);
  held.delete(audio);
  audio.pause();
};

const onVisibilityChange = () => {
  if (document.hidden) {
    playing.forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        held.add(audio);
      }
    });
    playing.clear();
  } else {
    const resume = [...held];
    held.clear();
    resume.forEach((audio) => playSound(audio).catch(() => {}));
  }
};

document.addEventListener("visibilitychange", onVisibilityChange);
