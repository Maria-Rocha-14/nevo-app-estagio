import type { AvatarColorId, UserAvatar } from '../db/db';
import { DEFAULT_AVATAR } from '../services/avatar';
import greenNudeAvatar from '../assets/avatar/green/nude.png';
import greenDoctorAvatar from '../assets/avatar/green/doctor.png';
import greenFootballAvatar from '../assets/avatar/green/football.png';
import greenProgrammerAvatar from '../assets/avatar/green/programmer.png';
import greenTennisAvatar from '../assets/avatar/green/tennis.png';
import blueNudeAvatar from '../assets/avatar/blue/nude.png';
import blueDoctorAvatar from '../assets/avatar/blue/doctor.png';
import blueFootballAvatar from '../assets/avatar/blue/football.png';
import blueProgrammerAvatar from '../assets/avatar/blue/programmer.png';
import blueTennisAvatar from '../assets/avatar/blue/tennis.png';
import redNudeAvatar from '../assets/avatar/red/nude.png';
import redDoctorAvatar from '../assets/avatar/red/doctor.png';
import redFootballAvatar from '../assets/avatar/red/football.png';
import redProgrammerAvatar from '../assets/avatar/red/programmer.png';
import redTennisAvatar from '../assets/avatar/red/tennis.png';
import yellowNudeAvatar from '../assets/avatar/yellow/nude.png';
import yellowDoctorSpecialAvatar from '../assets/avatar/yellow/doctor.png';
import yellowFootballAvatar from '../assets/avatar/yellow/football.png';
import yellowProgrammerAvatar from '../assets/avatar/yellow/programmer.png';
import yellowTennisAvatar from '../assets/avatar/yellow/tennis.png';
import yellowTShirtAvatar from '../assets/avatar/yellow/yellow-t-shirt.png';
import yellowTShirtGlassesAvatar from '../assets/avatar/yellow/yellow-t-shirt-glasses.png';
import yellowTShirtStethoscopeAvatar from '../assets/avatar/yellow/yellow-t-shirt-stethoscope.png';
import yellowSweatshirtAvatar from '../assets/avatar/yellow/yellow-sweatshirt.png';
import yellowSweatshirtGlassesAvatar from '../assets/avatar/yellow/yellow-sweatshirt-glasses.png';
import yellowSweatshirtStethoscopeAvatar from '../assets/avatar/yellow/yellow-sweatshirt-stethoscope.png';
import yellowLabCoatAvatar from '../assets/avatar/yellow/yellow-lab-coat.png';
import yellowLabCoatGlassesAvatar from '../assets/avatar/yellow/yellow-lab-coat-glasses.png';
import yellowLabCoatStethoscopeAvatar from '../assets/avatar/yellow/yellow-lab-coat-stethoscope.png';
import './ChameleonAvatar.css';

type ChameleonAvatarProps = {
  avatar?: Partial<UserAvatar>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const BASE_AVATAR_IMAGES: Record<AvatarColorId, string> = {
  green: greenNudeAvatar,
  blue: blueNudeAvatar,
  yellow: yellowNudeAvatar,
  red: redNudeAvatar
};

const SPECIAL_AVATAR_IMAGES: Record<
  AvatarColorId,
  Partial<Record<NonNullable<UserAvatar['specialId']>, string>>
> = {
  green: {
    football: greenFootballAvatar,
    programmer: greenProgrammerAvatar,
    doctor: greenDoctorAvatar,
    tennis: greenTennisAvatar
  },
  blue: {
    football: blueFootballAvatar,
    programmer: blueProgrammerAvatar,
    doctor: blueDoctorAvatar,
    tennis: blueTennisAvatar
  },
  yellow: {
    football: yellowFootballAvatar,
    programmer: yellowProgrammerAvatar,
    doctor: yellowDoctorSpecialAvatar,
    tennis: yellowTennisAvatar
  },
  red: {
    football: redFootballAvatar,
    programmer: redProgrammerAvatar,
    doctor: redDoctorAvatar,
    tennis: redTennisAvatar
  }
};

const YELLOW_AVATAR_IMAGES: Partial<
  Record<UserAvatar['outfitId'], Partial<Record<UserAvatar['accessoryId'], string>>>
> = {
  none: {
    none: yellowNudeAvatar
  },
  simpleTee: {
    none: yellowTShirtAvatar,
    glasses: yellowTShirtGlassesAvatar,
    stethoscope: yellowTShirtStethoscopeAvatar
  },
  sweatshirt: {
    none: yellowSweatshirtAvatar,
    glasses: yellowSweatshirtGlassesAvatar,
    stethoscope: yellowSweatshirtStethoscopeAvatar
  },
  coat: {
    none: yellowLabCoatAvatar,
    glasses: yellowLabCoatGlassesAvatar,
    stethoscope: yellowLabCoatStethoscopeAvatar
  }
};

const getCombinedYellowAvatar = (avatar: UserAvatar): string | undefined => {
  if (avatar.colorId !== 'yellow' || avatar.specialId !== 'none') return undefined;
  return YELLOW_AVATAR_IMAGES[avatar.outfitId]?.[avatar.accessoryId];
};

export default function ChameleonAvatar({ avatar, size = 'md', className = '' }: ChameleonAvatarProps) {
  const currentAvatar: UserAvatar = {
    ...DEFAULT_AVATAR,
    ...avatar
  };
  const combinedYellowAvatar = getCombinedYellowAvatar(currentAvatar);
  const specialImage =
    currentAvatar.specialId !== 'none'
      ? SPECIAL_AVATAR_IMAGES[currentAvatar.colorId]?.[currentAvatar.specialId]
      : undefined;
  const baseImage = BASE_AVATAR_IMAGES[currentAvatar.colorId] || BASE_AVATAR_IMAGES.green;

  return (
    <div
      className={`chameleon-avatar chameleon-avatar-${size} ${className}`}
      role="img"
      aria-label="Mascote camaleao"
    >
      <img className="chameleon-avatar-base" src={specialImage || combinedYellowAvatar || baseImage} alt="" aria-hidden="true" />
    </div>
  );
}
