import { 
  isValidEmail, 
  isValidPhone,
  validatePassword,
  isValidCreditCard,
  getCreditCardType
} from './validation';

describe('Shared validation utilities', () => {
  describe('isValidEmail', () => {
    test('validates correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('validates correct phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('11234567890')).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('12345678901')).toBe(false); // 11 digits not starting with 1
      expect(isValidPhone('21234567890')).toBe(false); // starts with 2
    });
  });

  describe('validatePassword', () => {
    test('validates strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.missing).toHaveLength(0);
    });

    test('validates very strong passwords', () => {
      const result = validatePassword('VeryStrongP@ssword123456');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('very-strong');
      expect(result.missing).toHaveLength(0);
    });

    test('identifies weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.missing.length).toBeGreaterThan(2);
    });

    test('identifies medium passwords', () => {
      const result = validatePassword('Medium123');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('medium');
      expect(result.missing.length).toBeLessThanOrEqual(2);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    test('respects custom options', () => {
      // No special chars required
      const result = validatePassword('Abcdef123456', { 
        requireSpecialChars: false 
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('isValidCreditCard', () => {
    test('validates correct credit card numbers', () => {
      // Valid test numbers from major providers
      expect(isValidCreditCard('4111111111111111')).toBe(true); // Visa
      expect(isValidCreditCard('5555555555554444')).toBe(true); // Mastercard
      expect(isValidCreditCard('378282246310005')).toBe(true);  // Amex
      expect(isValidCreditCard('6011111111111117')).toBe(true); // Discover
    });

    test('rejects invalid credit card numbers', () => {
      expect(isValidCreditCard('')).toBe(false);
      expect(isValidCreditCard('411111111111')).toBe(false); // Too short
      expect(isValidCreditCard('4111111111111112')).toBe(false); // Invalid checksum
    });
  });

  describe('getCreditCardType', () => {
    test('identifies card types correctly', () => {
      expect(getCreditCardType('4111111111111111')).toBe('visa');
      expect(getCreditCardType('5555555555554444')).toBe('mastercard');
      expect(getCreditCardType('378282246310005')).toBe('amex');
      expect(getCreditCardType('6011111111111117')).toBe('discover');
      expect(getCreditCardType('30569309025904')).toBe('dinersclub');
      expect(getCreditCardType('3530111333300000')).toBe('jcb');
      expect(getCreditCardType('1234567890123456')).toBe('unknown');
    });
  });
});