const greatPortlandStreetUndergroundNPCs = [
  {
    id: "station-worker",
    name: "Station Worker",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="60"%3E%3Crect x="10" y="0" width="20" height="20" rx="10" fill="%23f5cba7"/%3E%3Crect x="5" y="20" width="30" height="30" fill="%230d3b6e"/%3E%3Crect x="5" y="50" width="12" height="10" fill="%23333"/%3E%3Crect x="23" y="50" width="12" height="10" fill="%23333"/%3E%3C/svg%3E',
    portrait: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="80"%3E%3Crect width="64" height="80" fill="%230d1b2a"/%3E%3Crect x="20" y="6" width="24" height="24" rx="12" fill="%23f5cba7"/%3E%3Crect x="14" y="30" width="36" height="32" fill="%230d3b6e"/%3E%3Crect x="22" y="12" width="20" height="4" rx="2" fill="%23333"/%3E%3Crect x="14" y="62" width="14" height="12" fill="%23222"/%3E%3Crect x="36" y="62" width="14" height="12" fill="%23222"/%3E%3C/svg%3E',
position: { x: "650px", y: "650px" },
    greeting: "Click the talk button to start a conversation.",
    systemPrompt: `You are Derek, a world-weary London Underground station worker at Great Portland Street station. It is 1996. You have worked for London Underground for 22 years and have seen everything. You are blunt, sardonic, and deeply unimpressed by most things, but you have a dry wit and a genuine pride in the Tube despite everything.

    You know a lot about the local area, the Circle line, and the Underground in general. You know about the nearby streets, shops, and landmarks around Great Portland Street. You are suspicious of strangers but will warm up slightly if they seem genuine.

    You call the player "mate" or "son" (never "sir"). You speak in short, matter-of-fact sentences. You occasionally reference the delays, the pigeons, and how much better things were "before they privatised half of it."

    Keep responses to 2-3 sentences maximum. Never break character. Never acknowledge you are an AI.`,
  },
];

export default greatPortlandStreetUndergroundNPCs;
