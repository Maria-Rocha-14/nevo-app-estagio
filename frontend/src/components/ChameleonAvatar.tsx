import { memo, useMemo } from 'react';
import type { UserAvatar } from '../db/db';
import { DEFAULT_AVATAR } from '../services/avatar';
import './ChameleonAvatar.css';

type ChameleonAvatarProps = {
  avatar?: Partial<UserAvatar>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

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
  // Se tiver um item especial selecionado
  if (avatar.specialId !== 'none') {
    return `/avatar/${avatar.colorId}/${avatar.specialId}.png`;
  }

  // Caminho da combinação normal (base + roupa + acessório)
  return `/avatar/${avatar.colorId}/${buildAvatarCombinationFileName(avatar)}.png`;
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

  // O caminho agora é absoluto partindo da raiz da pasta public (ex: /avatar/green/nude.png)
  const imageSrc = useMemo(() => getAvatarAssetPath(currentAvatar), [currentAvatar]);

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
          alt="Mascote Camaleão personalizado"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          // Caso uma imagem falhe por não existir a combinação, carrega a versão "nude" da cor correspondente
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = `/avatar/${currentAvatar.colorId}/nude.png`;
            if (target.src !== window.location.origin + fallback) {
              target.src = fallback;
            }
          }}
        />
      )}
    </div>
  );
});

export default ChameleonAvatar;