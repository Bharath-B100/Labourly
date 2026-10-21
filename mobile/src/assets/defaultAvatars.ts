import type { ImageSourcePropType } from 'react-native';

const CARPENTER_AVATAR: ImageSourcePropType = require('../../assets/profiles/carpenter.jpg');
const ELECTRICIAN_AVATAR: ImageSourcePropType = require('../../assets/profiles/electrician.jpg');
const PLUMBER_AVATAR: ImageSourcePropType = require('../../assets/profiles/plumber.jpg');
const MASON_AVATAR: ImageSourcePropType = require('../../assets/profiles/mason.jpg');
const PAINTER_AVATAR: ImageSourcePropType = require('../../assets/profiles/painter.jpg');
const WELDER_AVATAR: ImageSourcePropType = require('../../assets/profiles/welder.jpg');
const HELPER_AVATAR: ImageSourcePropType = require('../../assets/profiles/helper.jpg');
const CONTRACTOR_AVATAR: ImageSourcePropType = require('../../assets/profiles/contractor.jpg');

export const DASHBOARD_BANNER: ImageSourcePropType = require('../../assets/banners/dashboard-worker-banner.jpg');

export const TRADE_AVATARS = {
  carpenter: CARPENTER_AVATAR,
  electrician: ELECTRICIAN_AVATAR,
  plumber: PLUMBER_AVATAR,
  mason: MASON_AVATAR,
  painter: PAINTER_AVATAR,
  welder: WELDER_AVATAR,
  helper: HELPER_AVATAR,
  contractor: CONTRACTOR_AVATAR,
} as const;

export function getDefaultWorkerAvatar(
  trade?: string | null,
): ImageSourcePropType {
  if (!trade) return CARPENTER_AVATAR;
  const normalized = trade.toLowerCase().trim();
  if (normalized.includes('carpent')) return CARPENTER_AVATAR;
  if (normalized.includes('electr')) return ELECTRICIAN_AVATAR;
  if (normalized.includes('plumb')) return PLUMBER_AVATAR;
  if (normalized.includes('mason') || normalized.includes('brick'))
    return MASON_AVATAR;
  if (normalized.includes('paint')) return PAINTER_AVATAR;
  if (normalized.includes('weld')) return WELDER_AVATAR;
  if (
    normalized.includes('help') ||
    normalized.includes('labour') ||
    normalized.includes('labor')
  )
    return HELPER_AVATAR;
  return CARPENTER_AVATAR;
}

export function getDefaultUserAvatar(
  role?: string | null,
): ImageSourcePropType {
  if (role === 'WORKER') return CARPENTER_AVATAR;
  return CONTRACTOR_AVATAR;
}
