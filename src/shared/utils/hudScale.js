// The icons sit inside the scaled game, so they use the smallest whole multiple (min 2x) that
// reaches this size on screen
export const HUD_ICON_PX = 32;
export const MIN_HUD_TAP_PX = 56;

export const hudIconScale = (gameScale) =>
  Math.max(2, Math.ceil(MIN_HUD_TAP_PX / (HUD_ICON_PX * gameScale)));
