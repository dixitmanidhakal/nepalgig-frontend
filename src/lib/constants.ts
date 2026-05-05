// ── Auth ────────────────────────────────────────────────
export const SESSION_COOKIE = 'ng_session';

// ── Nepal Provinces ─────────────────────────────────────
export const NEPAL_PROVINCES = [
  { id: 1, name: 'Koshi Province' },
  { id: 2, name: 'Madhesh Province' },
  { id: 3, name: 'Bagmati Province' },
  { id: 4, name: 'Gandaki Province' },
  { id: 5, name: 'Lumbini Province' },
  { id: 6, name: 'Karnali Province' },
  { id: 7, name: 'Sudurpashchim Province' },
] as const;

// ── Gig Categories ───────────────────────────────────────
export const GIG_CATEGORIES = [
  { id: 'web_dev',     label: 'Web Development',      icon: '💻' },
  { id: 'mobile_dev',  label: 'Mobile Development',   icon: '📱' },
  { id: 'design',      label: 'Design & Creative',    icon: '🎨' },
  { id: 'writing',     label: 'Writing & Translation', icon: '✍️' },
  { id: 'marketing',   label: 'Digital Marketing',    icon: '📣' },
  { id: 'video',       label: 'Video & Animation',    icon: '🎬' },
  { id: 'data',        label: 'Data & Analytics',     icon: '📊' },
  { id: 'accounting',  label: 'Accounting & Finance', icon: '💼' },
  { id: 'legal',       label: 'Legal & Compliance',   icon: '⚖️' },
  { id: 'it_support',  label: 'IT & Networking',      icon: '🔧' },
  { id: 'teaching',    label: 'Online Tutoring',       icon: '📚' },
  { id: 'photography', label: 'Photography',           icon: '📷' },
  { id: 'other',       label: 'Other',                icon: '🗂️' },
] as const;

// ── Platform ─────────────────────────────────────────────
export const PLATFORM_FEE_PERCENT   = 5;
export const MIN_GIG_BUDGET_NPR     = 100;       // NPR 100
export const MAX_GIG_BUDGET_NPR     = 1_000_000; // NPR 10 lakh

// ── Roles ────────────────────────────────────────────────
export type UserRole = 'pending' | 'freelancer' | 'client' | 'admin';
