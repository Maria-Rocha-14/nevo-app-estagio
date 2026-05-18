import CryptoJS from 'crypto-js';

export type EncryptedPayload = {
  version: number;
  iv: string;
  ciphertext: string;
};

const CURRENT_ENCRYPTION_VERSION = 1;

export const encryptText = (text: string, password: string): string => {
  const key = CryptoJS.SHA256(password);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const payload: EncryptedPayload = {
    version: CURRENT_ENCRYPTION_VERSION,
    iv: iv.toString(CryptoJS.enc.Base64),
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
  };

  return JSON.stringify(payload);
};

export const decryptText = (encryptedText: string, password: string): string => {
  try {
    const payload = JSON.parse(encryptedText) as EncryptedPayload;

    if (payload.version !== CURRENT_ENCRYPTION_VERSION || !payload.iv || !payload.ciphertext) {
      throw new Error('Invalid backup file format.');
    }

    const key = CryptoJS.SHA256(password);
    const iv = CryptoJS.enc.Base64.parse(payload.iv);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(payload.ciphertext)
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Incorrect password or corrupt backup file.');
    }

    return decrypted;
  } catch (error) {
    throw new Error('Could not decrypt backup file. Verify the password and try again.');
  }
};
