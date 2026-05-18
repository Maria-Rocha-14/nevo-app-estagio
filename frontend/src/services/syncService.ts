import { db, type User } from '../db/db';
import { decryptText, encryptText } from '../utils/encryption';
import { getStoredTheme, setStoredTheme } from './preferences';
import { setLoggedInUserId } from './session';

const BACKUP_VERSION = 1;
const STORAGE_KEYS_TO_EXPORT = ['user_session', 'nevo_theme'] as const;

export type SyncBackupPayload = {
  version: number;
  exportedAt: string;
  data: {
    user: User;
    preferences: {
      theme: string;
      language?: string;
    };
    localStorage: Record<string, string | null>;
  };
};

const normalizeUser = (user: User): User => ({
  ...user,
  assessmentHistory: user.assessmentHistory ?? [],
  challengeHistory: user.challengeHistory ?? [],
  completedChallenges: user.completedChallenges ?? [],
  earnedBadges: user.earnedBadges ?? [],
  unlockedAvatarItems: user.unlockedAvatarItems ?? [],
  avatar: user.avatar ?? {
    colorId: 'green',
    outfitId: 'none',
    shoeId: 'none',
    accessoryId: 'none',
    specialId: 'none'
  }
});

const getLocalStorageSnapshot = (): Record<string, string | null> => {
  return Object.fromEntries(STORAGE_KEYS_TO_EXPORT.map((key) => [key, localStorage.getItem(key)]));
};

const restoreLocalStorageSnapshot = (snapshot: Record<string, string | null>, storedUser: User) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }

    if (key === 'user_session') {
      try {
        const parsed = JSON.parse(value);
        const rebuiltSession = {
          ...parsed,
          user: {
            ...parsed.user,
            ...storedUser,
            id: storedUser.id
          }
        };
        localStorage.setItem(key, JSON.stringify(rebuiltSession));
        return;
      } catch {
        localStorage.setItem(key, value);
        return;
      }
    }

    localStorage.setItem(key, value);
  });
};

const validatePayload = (parsed: unknown): SyncBackupPayload => {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file.');
  }

  const payload = parsed as SyncBackupPayload;
  if (payload.version !== BACKUP_VERSION) {
    throw new Error('Unsupported backup version.');
  }

  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('Backup data is missing.');
  }

  if (!payload.data.user || typeof payload.data.user.email !== 'string') {
    throw new Error('Backup user data is invalid.');
  }

  if (!payload.data.preferences || typeof payload.data.preferences.theme !== 'string') {
    throw new Error('Backup preferences are invalid.');
  }

  return payload;
};

export const exportLocalData = async (password: string): Promise<{ encrypted: string; fileName: string }> => {
  const storedUserId = localStorage.getItem('logged_in_user_id');
  if (!storedUserId) {
    throw new Error('Nenhum utilizador autenticado encontrado.');
  }

  const user = await db.users.get(Number(storedUserId));
  if (!user) {
    throw new Error('Dados do utilizador não encontrados.');
  }

  const payload: SyncBackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      user: normalizeUser(user),
      preferences: {
        theme: getStoredTheme(),
        language: localStorage.getItem('nevo_language') || undefined
      },
      localStorage: getLocalStorageSnapshot()
    }
  };

  const plaintext = JSON.stringify(payload);
  const encrypted = encryptText(plaintext, password);
  const fileName = `nevo-backup-${user.email.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.nevo`;

  return { encrypted, fileName };
};

export const importLocalData = async (file: File, password: string): Promise<{ importedUser: User; preferences: { theme: string; language?: string } }> => {
  const encryptedText = await file.text();
  const decryptedText = decryptText(encryptedText, password);
  const payload = validatePayload(JSON.parse(decryptedText));

  const importedUser = normalizeUser(payload.data.user);
  const storedUser = await db.users.where('email').equals(importedUser.email).first();

  let userId: number;
  if (storedUser) {
    userId = storedUser.id as number;
    await db.users.put({ ...importedUser, id: userId });
  } else {
    userId = (await db.users.add(importedUser)) as number;
  }

  const storedUserRecord = { ...importedUser, id: userId };
  restoreLocalStorageSnapshot(payload.data.localStorage, storedUserRecord);
  const theme = payload.data.preferences.theme === 'dark' ? 'dark' : 'light';
  setStoredTheme(theme);
  setLoggedInUserId(userId);

  return { importedUser: storedUserRecord, preferences: payload.data.preferences };
};

export const downloadEncryptedBackup = async (encryptedText: string, fileName: string): Promise<void> => {
  const filePicker = (window as Window & {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }).showSaveFilePicker;

  if (filePicker) {
    const handle = await filePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'Nevo backup',
          accept: {
            'application/octet-stream': ['.nevo']
          }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(encryptedText);
    await writable.close();
    return;
  }

  const blob = new Blob([encryptedText], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
