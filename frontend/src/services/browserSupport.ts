export type BrowserSupportCheck = {
  supported: boolean;
  missingRequired: string[];
  missingOptional: string[];
};

const canUseLocalStorage = (): boolean => {
  try {
    const key = '__nevo_storage_test__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const getBrowserSupport = (): BrowserSupportCheck => {
  const requiredChecks: Array<[string, boolean]> = [
    ['JavaScript moderno', typeof Promise !== 'undefined' && typeof Array.prototype.find === 'function'],
    ['Armazenamento local', typeof window !== 'undefined' && canUseLocalStorage()],
    ['Base de dados local', typeof window !== 'undefined' && 'indexedDB' in window],
    ['Upload de imagens', typeof File !== 'undefined' && typeof FileReader !== 'undefined'],
    ['Pre-visualizacao de imagens', typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function']
  ];

  const optionalChecks: Array<[string, boolean]> = [
    ['Camara', Boolean(navigator.mediaDevices?.getUserMedia)],
    ['Geolocalizacao', 'geolocation' in navigator],
    ['Ligacoes externas seguras', typeof fetch === 'function']
  ];

  const missingRequired = requiredChecks.filter(([, passed]) => !passed).map(([label]) => label);
  const missingOptional = optionalChecks.filter(([, passed]) => !passed).map(([label]) => label);

  return {
    supported: missingRequired.length === 0,
    missingRequired,
    missingOptional
  };
};
