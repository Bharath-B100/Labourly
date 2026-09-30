export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s()-]/g, '');
  const phone = /^[6-9][0-9]{9}$/.test(compact) ? `+91${compact}` : compact;
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone))
    throw new Error('Enter a valid phone number, including the country code.');
  return phone;
}
export function validateOtp(value: string) {
  if (!/^[0-9]{6}$/.test(value)) throw new Error('Enter the six-digit code.');
  return value;
}
