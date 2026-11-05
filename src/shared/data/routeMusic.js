import thrillerSuspenseTheme from "../../assets/music/thriller-suspense-theme.wav";
import noirPiano from "../../assets/music/noir-piano.wav";
import coldDarkAbandoned from "../../assets/music/cold-dark-abandoned.mp3";

// A track plays on and on across all its paths, rather than restarting with each scene
export const routeMusic = [
  {
    src: thrillerSuspenseTheme,
    volume: 0.3,
    paths: ["/great-portland-street", "/great-portland-street-ticket-hall"],
  },
  {
    src: noirPiano,
    volume: 0.3,
    paths: ["/great-portland-street-exterior", "/residential-street"],
  },
  {
    src: coldDarkAbandoned,
    volume: 0.22,
    paths: ["/victims-flat-hallway", "/victims-flat-living-room", "/victims-flat-kitchen", "/victims-flat-bedroom"],
  },
];

export const musicForPath = (path) =>
  routeMusic.find((track) => track.paths.includes(path)) ?? null;
