// Traffic keeps to the left: cars heading right use the lane by the station's pavement,
// cars heading left the lane nearer the viewer. Durations differ so the two lanes drift in and out of step.
export const trafficLanes = [
  { id: "eastbound", direction: "right", lane: "far", duration: 14, delay: 6, volume: 0.7 },
  { id: "westbound", direction: "left", lane: "near", duration: 12, delay: 0, volume: 1 },
];
