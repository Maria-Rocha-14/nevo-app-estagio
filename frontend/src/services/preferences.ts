export type AppTheme = 'light' | 'dark';

const THEME_KEY = 'nevo_theme';

export const getStoredTheme = (): AppTheme => {
  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    return storedTheme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const applyTheme = (theme: AppTheme) => {
  document.documentElement.dataset.theme = theme;
};

export const setStoredTheme = (theme: AppTheme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    return;
  }
  applyTheme(theme);
};
