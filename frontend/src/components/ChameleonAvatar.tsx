import { memo, useMemo} from 'react';
import type { UserAvatar } from '../db/db';
import { DEFAULT_AVATAR } from '../services/avatar';
import './ChameleonAvatar.css';

type ChameleonAvatarProps = {
  avatar?: Partial<UserAvatar>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

type AvatarImageModule = {
  default: string;
};

// 1. Adicionamos { eager: true } para carregar todas as imagens no build
const avatarModules = import.meta.glob<AvatarImageModule>('../assets/avatar/**/*.png', { eager: true });
const avatarSrcCache = new Map<string, string>();

const buildAvatarCombinationFileName = (avatar: UserAvatar): string => {
  const prefix = avatar.colorId;

  const baseName =
    avatar.outfitId === 'coat' ? `${prefix}-lab-coat` :
      avatar.outfitId === 'sweatshirt' ? `${prefix}-sweatshirt` :
        avatar.outfitId === 'simpleTee' ? `${prefix}-t-shirt` :
          `${prefix}-base`;

  if (avatar.accessoryId === 'glasses') return `${baseName}-glasses`;
  if (avatar.accessoryId === 'stethoscope') return `${baseName}-stethoscope`;
  return baseName;
};

const getAvatarAssetPath = (avatar: UserAvatar): string => {
  if (avatar.specialId !== 'none') {
    return `../assets/avatar/${avatar.colorId}/${avatar.specialId}.png`;
  }

  const combinationPath = `../assets/avatar/${avatar.colorId}/${buildAvatarCombinationFileName(avatar)}.png`;
  if (avatarModules[combinationPath]) {
    return combinationPath;
  }

  return `../assets/avatar/${avatar.colorId}/nude.png`;
};

// 2. Agora esta função é síncrona
const getAvatarSrc = (path: string): string => {
  const cachedSrc = avatarSrcCache.get(path);
  if (cachedSrc) return cachedSrc;

  const module = avatarModules[path] ?? avatarModules['../assets/avatar/green/nude.png'];

  if (module && typeof module === 'object' && 'default' in module) {
    const src = (module as AvatarImageModule).default;
    avatarSrcCache.set(path, src);
    return src;
  }
  return '';
};

const ChameleonAvatar = memo(function ChameleonAvatar({
  avatar,
  size = 'md',
  className = ''
}: ChameleonAvatarProps) {
  const currentAvatar: UserAvatar = useMemo(() => ({
    ...DEFAULT_AVATAR,
    ...avatar
  }), [avatar]);

  const assetPath = useMemo(() => getAvatarAssetPath(currentAvatar), [currentAvatar]);

  // 3. Carregamento direto e síncrono
  const imageSrc = useMemo(() => getAvatarSrc(assetPath), [assetPath]);

  return (
    <div
      className={`chameleon-avatar chameleon-avatar-${size} ${className}`}
      role="img"
      aria-label="Mascote camaleao"
    >
      {imageSrc && (
        <img
          className="chameleon-avatar-base"
          src={imageSrc}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

export default ChameleonAvatar;