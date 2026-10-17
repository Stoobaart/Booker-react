import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { playSound, pauseSound } from "./gameAudio";

let hidden = false;

const setHidden = (value) => {
  hidden = value;
  document.dispatchEvent(new Event("visibilitychange"));
};

const makeAudio = () => {
  const audio = new EventTarget();
  audio.paused = true;
  audio.play = vi.fn(() => {
    audio.paused = false;
    return Promise.resolve();
  });
  audio.pause = vi.fn(() => {
    audio.paused = true;
  });
  return audio;
};

describe("gameAudio", () => {
  beforeEach(() => {
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  });

  afterEach(() => {
    setHidden(false);
    vi.restoreAllMocks();
  });

  it("pauses what's playing when the game is hidden and resumes it when it's back", () => {
    const audio = makeAudio();
    playSound(audio);

    setHidden(true);
    expect(audio.paused).toBe(true);

    setHidden(false);
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.paused).toBe(false);
  });

  it("doesn't start a sound while the game is hidden, but starts it when it's back", () => {
    setHidden(true);
    const audio = makeAudio();
    playSound(audio);
    expect(audio.play).not.toHaveBeenCalled();

    setHidden(false);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("doesn't resume a sound that was stopped while the game was hidden", () => {
    const audio = makeAudio();
    playSound(audio);
    setHidden(true);
    pauseSound(audio);

    setHidden(false);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("doesn't resume a sound that had already finished", () => {
    const audio = makeAudio();
    playSound(audio);
    audio.paused = true;
    audio.dispatchEvent(new Event("ended"));

    setHidden(true);
    setHidden(false);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });
});
