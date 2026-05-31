export function initials(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ROLES = ['Mason', 'Helper', 'Carpenter', 'Electrician', 'Plumber', 'Supervisor', 'Labour'];
