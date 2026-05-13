import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Coins, Lock, Palette, Save, Shirt, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChameleonAvatar from '../../../components/ChameleonAvatar';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { db } from '../../../db/db';
import type { AvatarAccessoryId, AvatarOutfitId, AvatarSpecialId, UserAvatar } from '../../../db/db';
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_OUTFITS,
  AVATAR_SPECIALS,
  DEFAULT_AVATAR,
  type AvatarItemOption,
  getAvatar,
  normalizeUnlockedAvatarItems
} from '../../../services/avatar';
import { getLevelProgress } from '../../../services/levelService';
import { useSessionUser } from '../../../services/session';
import './AvatarPage.css';

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

type AvatarSelectableItem =
  | AvatarItemOption<AvatarOutfitId>
  | AvatarItemOption<AvatarAccessoryId>
  | AvatarItemOption<AvatarSpecialId>;

const USER_SESSION_KEY = 'user_session';

const updateStoredUserSession = (updates: Record<string, unknown>) => {
  try {
    const storedSession = localStorage.getItem(USER_SESSION_KEY);
    const parsedSession = storedSession ? JSON.parse(storedSession) : {};
    const currentUser = typeof parsedSession.user === 'object' && parsedSession.user !== null ? parsedSession.user : {};
    const nextSession = {
      ...parsedSession,
      ...updates,
      user: {
        ...currentUser,
        ...updates
      }
    };

    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(nextSession));
  } catch {
    return;
  }
};

export default function AvatarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSessionUser();
  const [selectedAvatar, setSelectedAvatar] = useState<UserAvatar>(DEFAULT_AVATAR);
  const [savedAvatar, setSavedAvatar] = useState<UserAvatar>(DEFAULT_AVATAR);
  const [mascotName, setMascotName] = useState('');
  const [availablePoints, setAvailablePoints] = useState(0);
  const [unlockedItems, setUnlockedItems] = useState<string[]>(normalizeUnlockedAvatarItems());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [previewLockedItem, setPreviewLockedItem] = useState<AvatarSelectableItem | null>(null);

  useEffect(() => {
    if (user) {
      const currentAvatar = getAvatar(user);
      const currentUnlockedItems = normalizeUnlockedAvatarItems(user.unlockedAvatarItems);

      setSelectedAvatar(currentAvatar);
      setSavedAvatar(currentAvatar);
      setMascotName(currentAvatar.name || '');
      setAvailablePoints(user.points || 0);
      setUnlockedItems(currentUnlockedItems);
      setPreviewLockedItem(null);

      // Older sessions do not have the unlock list yet, so create defaults once.
      if (!user.unlockedAvatarItems) {
        if (user.id) {
          void db.users.update(user.id, { unlockedAvatarItems: currentUnlockedItems });
        } else {
          void db.users.where({ email: user.email }).modify({ unlockedAvatarItems: currentUnlockedItems });
        }
        updateStoredUserSession({ unlockedAvatarItems: currentUnlockedItems, avatar: currentAvatar });
      }
    }
  }, [user]);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

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

  const persistAvatarState = async (
    avatar: UserAvatar,
    points = availablePoints,
    unlocked = unlockedItems
  ) => {
    if (user.id) {
      await db.users.update(user.id, {
        avatar,
        points,
        unlockedAvatarItems: unlocked
      });
    } else {
      await db.users.where({ email: user.email }).modify({
        avatar,
        points,
        unlockedAvatarItems: unlocked
      });
    }

    updateStoredUserSession({ avatar, points, unlockedAvatarItems: unlocked });
  };

  const handleSelectColor = async (colorId: UserAvatar['colorId']) => {
    const avatarToSave = { ...selectedAvatar, colorId, name: mascotName.trim() };

    setSelectedAvatar(avatarToSave);

    if (previewLockedItem) return;

    try {
      await persistAvatarState(avatarToSave);
      setSavedAvatar(avatarToSave);
    } catch (error) {
      console.error('Avatar color save error:', error);
      setFeedback({ tone: 'error', message: t('profile.error_update') });
    }
  };

  const getItemStatusLabel = (item: AvatarSelectableItem, isOwned: boolean, isSelected: boolean) => {
    if (isSelected && !isOwned) return t('avatar.preview_locked');
    if (isSelected) return t('avatar.selected');
    if (isOwned) return t('avatar.unlocked');
    if (levelProgress.currentLevel < item.requiredLevel) {
      return t('avatar.requires_level', { level: item.requiredLevel });
    }
    return t('avatar.buy_for', { points: item.cost });
  };

  const handleAvatarItemClick = async (item: AvatarSelectableItem, avatarPatch: Partial<UserAvatar>) => {
    const isOwned = item.defaultUnlocked || unlockedItems.includes(item.unlockKey);
    const canBuy = !isOwned && levelProgress.currentLevel >= item.requiredLevel && availablePoints >= item.cost;
    const baseAvatar = previewLockedItem && (isOwned || canBuy) ? savedAvatar : selectedAvatar;
    const avatarToPreview: UserAvatar = {
      ...baseAvatar,
      ...avatarPatch,
      name: mascotName.trim()
    };

    if (!isOwned && levelProgress.currentLevel < item.requiredLevel) {
      setSelectedAvatar(avatarToPreview);
      setPreviewLockedItem(item);
      setFeedback({ tone: 'warning', message: t('avatar.level_required_error', { level: item.requiredLevel }) });
      return;
    }

    if (!isOwned && availablePoints < item.cost) {
      setSelectedAvatar(avatarToPreview);
      setPreviewLockedItem(item);
      setFeedback({ tone: 'warning', message: t('avatar.points_required_error', { points: item.cost }) });
      return;
    }

    const nextUnlockedItems = isOwned
      ? unlockedItems
      : normalizeUnlockedAvatarItems([...unlockedItems, item.unlockKey]);
    const nextPoints = isOwned ? availablePoints : availablePoints - item.cost;
    const avatarToSave: UserAvatar = {
      ...avatarToPreview
    };

    try {
      setIsUpdatingItem(true);
      setPreviewLockedItem(null);
      setSelectedAvatar(avatarToSave);
      setSavedAvatar(avatarToSave);
      setAvailablePoints(nextPoints);
      setUnlockedItems(nextUnlockedItems);
      await persistAvatarState(avatarToSave, nextPoints, nextUnlockedItems);
      setFeedback({
        tone: 'success',
        message: isOwned ? t('avatar.equipped') : t('avatar.purchased')
      });
    } catch (error) {
      console.error('Avatar item update error:', error);
      setFeedback({ tone: 'error', message: t('profile.error_update') });
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleSave = async () => {
    if (previewLockedItem) {
      setFeedback({ tone: 'warning', message: t('avatar.preview_locked_save_error') });
      return;
    }

    const avatarToSave: UserAvatar = {
      ...selectedAvatar,
      name: mascotName.trim()
    };

    try {
      setIsSaving(true);
      await persistAvatarState(avatarToSave);
      setSelectedAvatar(avatarToSave);
      setSavedAvatar(avatarToSave);
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
        <div className={`avatar-stage ${previewLockedItem ? 'preview-locked' : ''}`}>
          <ChameleonAvatar avatar={selectedAvatar} size="lg" />
          {previewLockedItem && (
            <div className="avatar-lock-overlay" aria-label={t('avatar.preview_locked')}>
              <Lock size={30} aria-hidden="true" />
              <span>{t('avatar.preview_locked')}</span>
            </div>
          )}
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
          <span>{t('avatar.level', { level: levelProgress.currentLevel })}</span>
          <strong className="avatar-wallet" aria-label={`${availablePoints} ${t('home.points')}`}>
            <Coins size={18} aria-hidden="true" />
            {availablePoints} {t('home.points')}
          </strong>
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
                onClick={() => void handleSelectColor(color.id)}
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
            const owned = outfit.defaultUnlocked || unlockedItems.includes(outfit.unlockKey);
            const levelLocked = levelProgress.currentLevel < outfit.requiredLevel;
            const selected = selectedAvatar.outfitId === outfit.id;

            return (
              <button
                key={outfit.id}
                type="button"
                className={`avatar-item-option ${selected ? 'selected' : ''} ${levelLocked && !owned ? 'locked' : ''} ${!owned && !levelLocked ? 'buyable' : ''}`}
                disabled={isUpdatingItem}
                onClick={() => void handleAvatarItemClick(outfit, { outfitId: outfit.id, specialId: 'none' })}
              >
                <span>{t(outfit.nameKey)}</span>
                <small>{getItemStatusLabel(outfit, owned, selected)}</small>
                <small>{t('avatar.item_requirements', { level: outfit.requiredLevel, points: outfit.cost })}</small>
                {levelLocked && !owned && <Lock size={16} aria-hidden="true" />}
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
            const owned = accessory.defaultUnlocked || unlockedItems.includes(accessory.unlockKey);
            const levelLocked = levelProgress.currentLevel < accessory.requiredLevel;
            const selected = selectedAvatar.accessoryId === accessory.id;

            return (
              <button
                key={accessory.id}
                type="button"
                className={`avatar-item-option ${selected ? 'selected' : ''} ${levelLocked && !owned ? 'locked' : ''} ${!owned && !levelLocked ? 'buyable' : ''}`}
                disabled={isUpdatingItem}
                onClick={() => void handleAvatarItemClick(accessory, { accessoryId: accessory.id, specialId: 'none' })}
              >
                <span>{t(accessory.nameKey)}</span>
                <small>{getItemStatusLabel(accessory, owned, selected)}</small>
                <small>{t('avatar.item_requirements', { level: accessory.requiredLevel, points: accessory.cost })}</small>
                {levelLocked && !owned && <Lock size={16} aria-hidden="true" />}
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
          {AVATAR_SPECIALS.filter((special) => special.id !== 'none').map((special) => {
            const owned = special.defaultUnlocked || unlockedItems.includes(special.unlockKey);
            const levelLocked = levelProgress.currentLevel < special.requiredLevel;
            const selected = selectedAvatar.specialId === special.id;

            return (
              <button
                key={special.id}
                type="button"
                className={`avatar-item-option ${selected ? 'selected' : ''} ${levelLocked && !owned ? 'locked' : ''} ${!owned && !levelLocked ? 'buyable' : ''}`}
                disabled={isUpdatingItem}
                onClick={() =>
                  void handleAvatarItemClick(special, {
                    specialId: special.id,
                    outfitId: 'none',
                    accessoryId: 'none'
                  })
                }
              >
                <span>{t(special.nameKey)}</span>
                <small>{getItemStatusLabel(special, owned, selected)}</small>
                <small>{t('avatar.item_requirements', { level: special.requiredLevel, points: special.cost })}</small>
                {levelLocked && !owned && <Lock size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <button type="button" className="avatar-save-btn" onClick={handleSave} disabled={isSaving || Boolean(previewLockedItem)}>
        <Save size={20} aria-hidden="true" />
        {isSaving ? t('profile.saving') : previewLockedItem ? t('avatar.preview_locked_save') : t('avatar.save')}
      </button>
    </main>
  );
}
