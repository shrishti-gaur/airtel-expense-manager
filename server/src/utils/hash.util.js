import crypto from 'crypto';

/**
 * Hash a plain text password with a secure salt.
 * @param {string} password
 * @returns {string} salt:hash format
 */
export function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored password hash.
 * @param {string} password
 * @param {string} storedPasswordHash
 * @returns {boolean}
 */
export function verifyPassword(password, storedPasswordHash) {
  if (!password || !storedPasswordHash) return false;
  const parts = storedPasswordHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}
