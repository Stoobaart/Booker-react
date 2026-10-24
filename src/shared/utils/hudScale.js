// The HUD's 32px icons (shared/components/HudButton.scss) sit inside the scaled game, so on a
// phone 2x would shrink to a dozen pixels. They're drawn at whole multiples of 32px instead,
// the smallest one that comes out at least this big on screen, and never under 2x.
export const HUD_ICON_PX = 32;
export const MIN_HUD_TAP_PX = 56;

export const hudIconScale = (gameScale) =>
  Math.max(2, Math.ceil(MIN_HUD_TAP_PX / (HUD_ICON_PX * gameScale)));
