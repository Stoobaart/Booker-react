import { useEffect, useRef } from "react";

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
        audio.play();
      }
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };

    audio.play().catch(() => {
      document.addEventListener("click", resumeOnInteraction);
      document.addEventListener("keydown", resumeOnInteraction);
    });

    return () => {
      cancelled = true;
      audio.pause();
      audio.currentTime = 0;
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };
  }, [src, volume, loop]);

  return audioRef;
};

export default useMusic;
