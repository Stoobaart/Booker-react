import { useEffect, useRef } from "react";
import { playSound, pauseSound } from "../utils/gameAudio";

const useMusic = (src, { volume = 1, loop = true } = {}) => {
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.loop = loop;
    audio.volume = volume;

    const resumeOnInteraction = () => {
      if (!cancelled) {
        playSound(audio).catch(() => {});
      }
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };

    playSound(audio).catch(() => {
      document.addEventListener("click", resumeOnInteraction);
      document.addEventListener("keydown", resumeOnInteraction);
    });

    return () => {
      cancelled = true;
      pauseSound(audio);
      audio.currentTime = 0;
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };
  }, [src, volume, loop]);

  return audioRef;
};

export default useMusic;
