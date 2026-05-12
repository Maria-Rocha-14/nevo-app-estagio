import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Palette, Save, Shirt, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChameleonAvatar from '../../../components/ChameleonAvatar';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { db } from '../../../db/db';
import type { UserAvatar } from '../../../db/db';
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_OUTFITS,
  AVATAR_SPECIALS,
  DEFAULT_AVATAR,
  getAvatar,
  getLevelProgress,
  getUnlockTextKey,
  getUnlockValue,
  getUserLevel,
  isAvatarItemUnlocked,
  XP_PER_LEVEL
} from '../../../services/avatar';
import { useSessionUser } from '../../../services/session';
import './AvatarPage.css';

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

export default function AvatarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSessionUser();
  const [selectedAvatar, setSelectedAvatar] = useState<UserAvatar>(DEFAULT_AVATAR);
  const [mascotName, setMascotName] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const currentAvatar = getAvatar(user);
      setSelectedAvatar(currentAvatar);
      setMascotName(currentAvatar.name || '');
    }
  }, [user]);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const userLevel = useMemo(() => getUserLevel(user?.xp || 0), [user?.xp]);
  const levelProgress = useMemo(() => getLevelProgress(user?.xp || 0), [user?.xp]);

  if (user === undefined) {
    return (
      <main className="avatar-page" aria-busy="true">
        <div className="avatar-loading">{t('profile.loading')}</div>
      </main>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const getUnlockLabel = (unlock: (typeof AVATAR_OUTFITS)[number]['unlock']) => {
    const key = getUnlockTextKey(unlock);
    const value = getUnlockValue(unlock);
    return t(key, { value });
  };

  const handleSave = async () => {
    const avatarToSave: UserAvatar = {
      ...selectedAvatar,
      name: mascotName.trim()
    };
    const selectedOutfit = AVATAR_OUTFITS.find((outfit) => outfit.id === selectedAvatar.outfitId);
    const selectedAccessory = AVATAR_ACCESSORIES.find((accessory) => accessory.id === selectedAvatar.accessoryId);
    const selectedSpecial = AVATAR_SPECIALS.find((special) => special.id === selectedAvatar.specialId);

    if (
      !selectedOutfit ||
      !selectedAccessory ||
      !selectedSpecial ||
      !isAvatarItemUnlocked(selectedOutfit.unlock, user) ||
      !isAvatarItemUnlocked(selectedAccessory.unlock, user) ||
      !isAvatarItemUnlocked(selectedSpecial.unlock, user)
    ) {
      setFeedback({ tone: 'error', message: t('avatar.locked_error') });
      return;
    }

    try {
      setIsSaving(true);
      if (user.id) {
        await db.users.update(user.id, { avatar: avatarToSave });
      } else {
        await db.users.where({ email: user.email }).modify({ avatar: avatarToSave });
      }
      setSelectedAvatar(avatarToSave);
      setFeedback({ tone: 'success', message: t('avatar.saved') });
    } catch (error) {
      console.error('Avatar save error:', error);
      setFeedback({ tone: 'error', message: t('profile.error_update') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="avatar-page" aria-labelledby="avatar-title">
      <header className="avatar-header">
        <button type="button" className="avatar-icon-btn" onClick={() => navigate('/profile')} aria-label={t('profile.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <p className="avatar-kicker">{t('avatar.kicker')}</p>
          <h1 id="avatar-title">{t('avatar.title')}</h1>
        </div>
      </header>

      {feedback && (
        <FeedbackMessage
          tone={feedback.tone}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <section className="avatar-preview-card" aria-label={t('avatar.preview')}>
        <div className="avatar-stage">
          <ChameleonAvatar avatar={selectedAvatar} size="lg" />
        </div>
        <label className="avatar-name-field" htmlFor="mascot-name">
          <span>{t('avatar.name_label')}</span>
          <input
            id="mascot-name"
            type="text"
            value={mascotName}
            onChange={(event) => setMascotName(event.target.value)}
            placeholder={t('avatar.name_placeholder')}
            maxLength={24}
          />
        </label>
        <div className="avatar-progress">
          <span>{t('avatar.level', { level: userLevel })}</span>
          <strong>{user.points || 0} {t('home.points')}</strong>
        </div>
        <div className="avatar-progress-bar" aria-label={t('home.progress')}>
          <span style={{ width: `${(levelProgress / XP_PER_LEVEL) * 100}%` }} />
        </div>
      </section>

      <section className="avatar-section">
        <div className="avatar-section-title">
          <Palette size={18} aria-hidden="true" />
          <h2>{t('avatar.color_title')}</h2>
        </div>
        <div className="avatar-color-grid">
          {AVATAR_COLORS.map((color) => {
            const isSelected = selectedAvatar.colorId === color.id;
            return (
              <button
                key={color.id}
                type="button"
                className={`avatar-color-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedAvatar((current) => ({ ...current, colorId: color.id }))}
                aria-label={t(color.nameKey)}
                aria-pressed={isSelected}
              >
                <span style={{ backgroundColor: color.swatch }} />
                {isSelected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="avatar-section">
        <div className="avatar-section-title">
          <Shirt size={18} aria-hidden="true" />
          <h2>{t('avatar.outfit_title')}</h2>
        </div>
        <div className="avatar-item-grid">
          {AVATAR_OUTFITS.map((outfit) => {
            const unlocked = isAvatarItemUnlocked(outfit.unlock, user);
            const selected = selectedAvatar.outfitId === outfit.id;

            return (
              <button
                key={outfit.id}
                type="button"
                className={`avatar-item-option ${selected ? 'selected' : ''}`}
                disabled={!unlocked}
                onClick={() => setSelectedAvatar((current) => ({ ...current, outfitId: outfit.id, specialId: 'none' }))}
              >
                <span>{t(outfit.nameKey)}</span>
                <small>{unlocked ? t('avatar.available') : getUnlockLabel(outfit.unlock)}</small>
                {!unlocked && <Lock size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="avatar-section">
        <div className="avatar-section-title">
          <Sparkles size={18} aria-hidden="true" />
          <h2>{t('avatar.accessory_title')}</h2>
        </div>
        <div className="avatar-item-grid">
          {AVATAR_ACCESSORIES.map((accessory) => {
            const unlocked = isAvatarItemUnlocked(accessory.unlock, user);
            const selected = selectedAvatar.accessoryId === accessory.id;

            return (
              <button
                key={accessory.id}
                type="button"
                className={`avatar-item-option ${selected ? 'selected' : ''}`}
                disabled={!unlocked}
                onClick={() => setSelectedAvatar((current) => ({ ...current, accessoryId: accessory.id, specialId: 'none' }))}
              >
                <span>{t(accessory.nameKey)}</span>
                <small>{unlocked ? t('avatar.available') : getUnlockLabel(accessory.unlock)}</small>
                {!unlocked && <Lock size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="avatar-section">
        <div className="avatar-section-title">
          <Sparkles size={18} aria-hidden="true" />
          <h2>{t('avatar.special_title')}</h2>
        </div>
        <div className="avatar-item-grid">
          {AVATAR_SPECIALS.map((special) => {
            const unlocked = isAvatarItemUnlocked(special.unlock, user);
            const selected = selectedAvatar.specialId === special.id;

            return (
              <button
                key={special.id}
                type="button"
                className={`avatar-item-option ${selected ? 'selected' : ''}`}
                disabled={!unlocked}
                onClick={() =>
                  setSelectedAvatar((current) => ({
                    ...current,
                    specialId: special.id,
                    outfitId: 'none',
                    accessoryId: 'none'
                  }))
                }
              >
                <span>{t(special.nameKey)}</span>
                <small>{unlocked ? t('avatar.available') : getUnlockLabel(special.unlock)}</small>
                {!unlocked && <Lock size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <button type="button" className="avatar-save-btn" onClick={handleSave} disabled={isSaving}>
        <Save size={20} aria-hidden="true" />
        {isSaving ? t('profile.saving') : t('avatar.save')}
      </button>
    </main>
  );
}
