export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPassword = (password: string): boolean =>
  password.length >= 6;

export const isNonEmpty = (value: string): boolean => value.trim().length > 0;

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface DayOption {
  /** ISO date, e.g. "2025-06-22" — what we store on the booking. */
  iso: string;
  /** Day of month, e.g. "22". */
  day: string;
  /** Weekday label, e.g. "MON". */
  weekday: string;
}

/** The next `count` days starting today, for the booking date strip. */
export function upcomingDays(count: number): DayOption[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    return {
      iso,
      day: String(d.getDate()),
      weekday: WEEKDAY_LABELS[d.getDay()],
    };
  });
}

/** Human-friendly date like "Mon, 22 Jun" from an ISO date string. */
export function formatBookingDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAY_LABELS[d.getDay()].charAt(0)}${WEEKDAY_LABELS[d.getDay()]
    .slice(1)
    .toLowerCase()}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}
