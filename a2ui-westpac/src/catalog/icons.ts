/**
 * A2UI basic-catalog icon names → Material Symbols ligatures.
 *
 * GEL has its own icon set (`@westpac/ui` icons). It is not published as a
 * font, so Material Symbols stands in; this map is the seam where a GEL icon
 * set would be dropped in.
 */
const EXPLICIT: Record<string, {name: string; fill?: 0 | 1}> = {
  accountCircle: {name: 'account_circle'},
  arrowBack: {name: 'arrow_back'},
  arrowForward: {name: 'arrow_forward'},
  attachFile: {name: 'attach_file'},
  calendarToday: {name: 'calendar_today'},
  camera: {name: 'photo_camera'},
  check: {name: 'check'},
  fastForward: {name: 'fast_forward'},
  favorite: {name: 'favorite', fill: 1},
  favoriteOff: {name: 'favorite', fill: 0},
  locationOn: {name: 'location_on'},
  lockOpen: {name: 'lock_open'},
  moreVert: {name: 'more_vert'},
  moreHoriz: {name: 'more_horiz'},
  notificationsOff: {name: 'notifications_off'},
  play: {name: 'play_arrow'},
  rewind: {name: 'fast_rewind'},
  shoppingCart: {name: 'shopping_cart'},
  skipNext: {name: 'skip_next'},
  skipPrevious: {name: 'skip_previous'},
  star: {name: 'star', fill: 1},
  starHalf: {name: 'star_half', fill: 1},
  starOff: {name: 'star', fill: 0},
  visibilityOff: {name: 'visibility_off'},
  volumeDown: {name: 'volume_down'},
  volumeMute: {name: 'volume_mute'},
  volumeOff: {name: 'volume_off'},
  volumeUp: {name: 'volume_up'},
};

export function symbolFor(a2uiName: string): {name: string; fill: 0 | 1} {
  const hit = EXPLICIT[a2uiName];
  if (hit) return {name: hit.name, fill: hit.fill ?? 0};
  return {name: a2uiName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase(), fill: 0};
}
