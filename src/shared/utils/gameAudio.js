// Every sound in the game plays through here, so they all go quiet while the game can't be seen
// (window minimised, another tab, the computer asleep) and carry on when it comes back.
const playing = new Set();
const held = new Set();
const tracked = new WeakSet();

const track = (audio) => {
  if (tracked.has(audio)) return;
  tracked.add(audio);
  audio.addEventListener("ended", () => playing.delete(audio));
};

// Like audio.play(): returns its promise, which callers should .catch(() => {}). While the game is
// hidden the sound waits and starts when it's back.
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

// Like audio.pause(), and it also stops a held sound from starting again when the game comes back
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
