import type {
  AvatarAccessoryId,
  AvatarColorId,
  AvatarOutfitId,
  AvatarSpecialId,
  User,
  UserAvatar
} from '../db/db';
import {
  calculateLevelFromTotalXp,
  getLevelProgress as getProgressForTotalXp
} from './levelService';

export type AvatarItemCategory = 'outfit' | 'accessory' | 'special';

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
  label: string;
  nameKey: string;
  category: AvatarItemCategory;
  requiredLevel: number;
  cost: number;
  defaultUnlocked: boolean;
  unlockKey: string;
  assetPath?: string;
  unlock: UnlockRule;
};

export const XP_PER_LEVEL = 100;

export const DEFAULT_UNLOCKED_AVATAR_ITEMS = ['no-outfit', 'no-accessory', 'no-special'];

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
  {
    id: 'none',
    label: 'No outfit',
    nameKey: 'avatar.outfits.none',
    category: 'outfit',
    requiredLevel: 1,
    cost: 0,
    defaultUnlocked: true,
    unlockKey: 'no-outfit',
    unlock: { type: 'free' }
  },
  {
    id: 'simpleTee',
    label: 'Simple T-shirt',
    nameKey: 'avatar.outfits.simpleTee',
    category: 'outfit',
    requiredLevel: 2,
    cost: 40,
    defaultUnlocked: false,
    unlockKey: 'outfit-simpleTee',
    unlock: { type: 'level', value: 2 }
  },
  {
    id: 'sweatshirt',
    label: 'Simple sweatshirt',
    nameKey: 'avatar.outfits.sweatshirt',
    category: 'outfit',
    requiredLevel: 4,
    cost: 80,
    defaultUnlocked: false,
    unlockKey: 'outfit-sweatshirt',
    unlock: { type: 'level', value: 4 }
  },
  {
    id: 'coat',
    label: 'Medical coat',
    nameKey: 'avatar.outfits.coat',
    category: 'outfit',
    requiredLevel: 6,
    cost: 140,
    defaultUnlocked: false,
    unlockKey: 'outfit-coat',
    unlock: { type: 'level', value: 6 }
  }
];

export const AVATAR_ACCESSORIES: AvatarItemOption<AvatarAccessoryId>[] = [
  {
    id: 'none',
    label: 'No accessory',
    nameKey: 'avatar.accessories.none',
    category: 'accessory',
    requiredLevel: 1,
    cost: 0,
    defaultUnlocked: true,
    unlockKey: 'no-accessory',
    unlock: { type: 'free' }
  },
  {
    id: 'glasses',
    label: 'Glasses',
    nameKey: 'avatar.accessories.glasses',
    category: 'accessory',
    requiredLevel: 3,
    cost: 60,
    defaultUnlocked: false,
    unlockKey: 'accessory-glasses',
    unlock: { type: 'level', value: 3 }
  },
  {
    id: 'stethoscope',
    label: 'Stethoscope',
    nameKey: 'avatar.accessories.stethoscope',
    category: 'accessory',
    requiredLevel: 5,
    cost: 120,
    defaultUnlocked: false,
    unlockKey: 'accessory-stethoscope',
    unlock: { type: 'level', value: 5 }
  }
];

export const AVATAR_SPECIALS: AvatarItemOption<AvatarSpecialId>[] = [
  {
    id: 'none',
    label: 'No special',
    nameKey: 'avatar.specials.none',
    category: 'special',
    requiredLevel: 1,
    cost: 0,
    defaultUnlocked: true,
    unlockKey: 'no-special',
    unlock: { type: 'free' }
  },
  {
    id: 'football',
    label: 'Football',
    nameKey: 'avatar.specials.football',
    category: 'special',
    requiredLevel: 4,
    cost: 100,
    defaultUnlocked: false,
    unlockKey: 'special-football',
    unlock: { type: 'level', value: 4 }
  },
  {
    id: 'tennis',
    label: 'Tennis',
    nameKey: 'avatar.specials.tennis',
    category: 'special',
    requiredLevel: 5,
    cost: 120,
    defaultUnlocked: false,
    unlockKey: 'special-tennis',
    unlock: { type: 'level', value: 5 }
  },
  {
    id: 'programmer',
    label: 'Programmer',
    nameKey: 'avatar.specials.programmer',
    category: 'special',
    requiredLevel: 7,
    cost: 220,
    defaultUnlocked: false,
    unlockKey: 'special-programmer',
    unlock: { type: 'level', value: 7 }
  },
  {
    id: 'doctor',
    label: 'Doctor',
    nameKey: 'avatar.specials.doctor',
    category: 'special',
    requiredLevel: 8,
    cost: 300,
    defaultUnlocked: false,
    unlockKey: 'special-doctor',
    unlock: { type: 'level', value: 8 }
  }
];

export const normalizeUnlockedAvatarItems = (items?: string[]): string[] => {
  const mergedItems = new Set([...(items || []), ...DEFAULT_UNLOCKED_AVATAR_ITEMS]);
  return Array.from(mergedItems);
};

export const getUserLevel = (xp = 0): number => calculateLevelFromTotalXp(xp);

export const getLevelProgress = (xp = 0): number => getProgressForTotalXp(xp).currentLevelXp;

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
