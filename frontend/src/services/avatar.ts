import type {
  AvatarAccessoryId,
  AvatarColorId,
  AvatarOutfitId,
  AvatarSpecialId,
  User,
  UserAvatar
} from '../db/db';

type UnlockRule =
  | { type: 'free' }
  | { type: 'level'; value: number }
  | { type: 'points'; value: number };

export type AvatarColorOption = {
  id: AvatarColorId;
  nameKey: string;
  swatch: string;
  body: string;
  shade: string;
  spots: string;
};

export type AvatarItemOption<TId extends string> = {
  id: TId;
  nameKey: string;
  unlock: UnlockRule;
};

export const XP_PER_LEVEL = 100;

export const DEFAULT_AVATAR: UserAvatar = {
  name: '',
  colorId: 'green',
  outfitId: 'none',
  shoeId: 'none',
  accessoryId: 'none',
  specialId: 'none'
};

export const AVATAR_COLORS: AvatarColorOption[] = [
  {
    id: 'green',
    nameKey: 'avatar.colors.green',
    swatch: '#84d56f',
    body: '#84d56f',
    shade: '#4aa36e',
    spots: '#3e8f68'
  },
  {
    id: 'blue',
    nameKey: 'avatar.colors.blue',
    swatch: '#8ed4ee',
    body: '#8ed4ee',
    shade: '#48a4c7',
    spots: '#3285a4'
  },
  {
    id: 'yellow',
    nameKey: 'avatar.colors.yellow',
    swatch: '#f4cf38',
    body: '#f4cf38',
    shade: '#cda629',
    spots: '#a98612'
  },
  {
    id: 'red',
    nameKey: 'avatar.colors.red',
    swatch: '#cf4250',
    body: '#cf4250',
    shade: '#962e3d',
    spots: '#7d2434'
  }
];

export const AVATAR_OUTFITS: AvatarItemOption<AvatarOutfitId>[] = [
  { id: 'none', nameKey: 'avatar.outfits.none', unlock: { type: 'free' } },
  { id: 'simpleTee', nameKey: 'avatar.outfits.simpleTee', unlock: { type: 'free' } },
  { id: 'sweatshirt', nameKey: 'avatar.outfits.sweatshirt', unlock: { type: 'level', value: 2 } },
  { id: 'coat', nameKey: 'avatar.outfits.coat', unlock: { type: 'points', value: 150 } }
];

export const AVATAR_ACCESSORIES: AvatarItemOption<AvatarAccessoryId>[] = [
  { id: 'none', nameKey: 'avatar.accessories.none', unlock: { type: 'free' } },
  { id: 'glasses', nameKey: 'avatar.accessories.glasses', unlock: { type: 'points', value: 60 } },
  { id: 'stethoscope', nameKey: 'avatar.accessories.stethoscope', unlock: { type: 'points', value: 120 } }
];

export const AVATAR_SPECIALS: AvatarItemOption<AvatarSpecialId>[] = [
  { id: 'none', nameKey: 'avatar.specials.none', unlock: { type: 'free' } },
  { id: 'football', nameKey: 'avatar.specials.football', unlock: { type: 'points', value: 250 } },
  { id: 'programmer', nameKey: 'avatar.specials.programmer', unlock: { type: 'level', value: 4 } },
  { id: 'doctor', nameKey: 'avatar.specials.doctor', unlock: { type: 'level', value: 5 } },
  { id: 'tennis', nameKey: 'avatar.specials.tennis', unlock: { type: 'points', value: 350 } }
];

export const getUserLevel = (xp = 0): number => Math.floor(xp / XP_PER_LEVEL) + 1;

export const getLevelProgress = (xp = 0): number => xp % XP_PER_LEVEL;

const getAvatarOutfit = (outfitId?: string): AvatarOutfitId =>
  AVATAR_OUTFITS.some((outfit) => outfit.id === outfitId) ? (outfitId as AvatarOutfitId) : DEFAULT_AVATAR.outfitId;

const getAvatarAccessory = (accessoryId?: string): AvatarAccessoryId =>
  AVATAR_ACCESSORIES.some((accessory) => accessory.id === accessoryId)
    ? (accessoryId as AvatarAccessoryId)
    : DEFAULT_AVATAR.accessoryId;

const getAvatarSpecial = (specialId?: string): AvatarSpecialId =>
  AVATAR_SPECIALS.some((special) => special.id === specialId)
    ? (specialId as AvatarSpecialId)
    : DEFAULT_AVATAR.specialId;

export const getAvatar = (user?: User | null): UserAvatar => {
  const storedAvatar: Partial<UserAvatar> = user?.avatar || {};

  return {
    ...DEFAULT_AVATAR,
    ...storedAvatar,
    colorId: getAvatarColor((storedAvatar.colorId || DEFAULT_AVATAR.colorId) as AvatarColorId).id,
    outfitId: getAvatarOutfit(storedAvatar.outfitId),
    shoeId: 'none',
    accessoryId: getAvatarAccessory(storedAvatar.accessoryId),
    specialId: getAvatarSpecial(storedAvatar.specialId)
  };
};

export const getAvatarColor = (colorId: AvatarColorId): AvatarColorOption =>
  AVATAR_COLORS.find((color) => color.id === colorId) || AVATAR_COLORS[0];

export const isAvatarItemUnlocked = (
  unlock: UnlockRule,
  user?: Pick<User, 'points' | 'xp'> | null
): boolean => {
  if (unlock.type === 'free') return true;
  if (!user) return false;
  if (unlock.type === 'points') return (user.points || 0) >= unlock.value;
  return getUserLevel(user.xp || 0) >= unlock.value;
};

export const getUnlockTextKey = (unlock: UnlockRule): string => {
  if (unlock.type === 'points') return 'avatar.unlock.points';
  if (unlock.type === 'level') return 'avatar.unlock.level';
  return 'avatar.unlock.free';
};

export const getUnlockValue = (unlock: UnlockRule): number => {
  if (unlock.type === 'free') return 0;
  return unlock.value;
};
