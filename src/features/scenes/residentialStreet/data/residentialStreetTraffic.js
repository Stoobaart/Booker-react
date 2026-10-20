// Traffic keeps to the left: cars heading right in the lane by the pavement, cars heading left nearer
// the viewer. A car crosses the screen in the first quarter of its lane's duration, at the same speed
// as the main road by the station.
export const trafficLanes = [
  { id: "eastbound", direction: "right", lane: "far", duration: 13, delay: 4, volume: 0.6 },
  { id: "westbound", direction: "left", lane: "near", duration: 12, delay: 9, volume: 0.9 },
];
