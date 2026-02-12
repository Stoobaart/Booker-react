import { useEffect, useRef } from "react";

const useMusic = (src, { volume = 1, loop = true } = {}) => {
  const audioRef = useRef(new Audio(src));

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = loop;
    audio.volume = volume;

    const resumeOnInteraction = () => {
      audio.play();
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };

    audio.play().catch(() => {
      document.addEventListener("click", resumeOnInteraction);
      document.addEventListener("keydown", resumeOnInteraction);
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };
  }, [src, volume, loop]);

  return audioRef;
};

export default useMusic;
