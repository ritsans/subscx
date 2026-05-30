import {
  type SimpleIcon,
  si1password,
  siAnthropic,
  siApplemusic,
  siAudible,
  siClaude,
  siCursor,
  siDazn,
  siDropbox,
  siDuolingo,
  siEvernote,
  siFigma,
  siGithub,
  siGoogle,
  siGoogledrive,
  siGooglegemini,
  siIcloud,
  siNetflix,
  siNotion,
  siPerplexity,
  siPlaystation,
  siSpotify,
  siSteam,
  siYoutube,
  siYoutubemusic,
  siZoom,
} from 'simple-icons';

export type IconEntry =
  | { kind: 'simple-icon'; slug: string; title: string; icon: SimpleIcon }
  | {
      kind: 'brand-image';
      slug: string;
      title: string;
      ext: 'svg' | 'png' | 'jpg' | 'jpeg';
      primaryColor?: string;
      bgColor?: string;
    };

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

const ICON_MAP: Record<string, IconEntry> = {
  // === simple-icons 由来 ===
  netflix: { kind: 'simple-icon', slug: 'netflix', title: 'Netflix', icon: siNetflix },
  spotify: { kind: 'simple-icon', slug: 'spotify', title: 'Spotify', icon: siSpotify },
  youtube: { kind: 'simple-icon', slug: 'youtube', title: 'YouTube', icon: siYoutube },
  'youtube premium': { kind: 'simple-icon', slug: 'youtube-premium', title: 'YouTube Premium', icon: siYoutube },
  'youtube music': { kind: 'simple-icon', slug: 'youtube-music', title: 'YouTube Music', icon: siYoutubemusic },
  'apple music': { kind: 'simple-icon', slug: 'apple-music', title: 'Apple Music', icon: siApplemusic },
  claude: { kind: 'simple-icon', slug: 'claude', title: 'Claude', icon: siClaude },
  anthropic: { kind: 'simple-icon', slug: 'anthropic', title: 'Anthropic', icon: siAnthropic },
  notion: { kind: 'simple-icon', slug: 'notion', title: 'Notion', icon: siNotion },
  figma: { kind: 'simple-icon', slug: 'figma', title: 'Figma', icon: siFigma },
  github: { kind: 'simple-icon', slug: 'github', title: 'GitHub', icon: siGithub },
  'github copilot': { kind: 'simple-icon', slug: 'github', title: 'GitHub', icon: siGithub },
  dropbox: { kind: 'simple-icon', slug: 'dropbox', title: 'Dropbox', icon: siDropbox },
  dazn: { kind: 'simple-icon', slug: 'dazn', title: 'DAZN', icon: siDazn },
  cursor: { kind: 'simple-icon', slug: 'cursor', title: 'Cursor', icon: siCursor },
  gemini: { kind: 'simple-icon', slug: 'gemini', title: 'Gemini', icon: siGooglegemini },
  'google gemini': { kind: 'simple-icon', slug: 'gemini', title: 'Gemini', icon: siGooglegemini },
  perplexity: { kind: 'simple-icon', slug: 'perplexity', title: 'Perplexity', icon: siPerplexity },
  zoom: { kind: 'simple-icon', slug: 'zoom', title: 'Zoom', icon: siZoom },
  'google workspace': { kind: 'simple-icon', slug: 'google-workspace', title: 'Google Workspace', icon: siGoogle },
  gsuite: { kind: 'simple-icon', slug: 'google-workspace', title: 'Google Workspace', icon: siGoogle },
  'g suite': { kind: 'simple-icon', slug: 'google-workspace', title: 'Google Workspace', icon: siGoogle },
  '1password': { kind: 'simple-icon', slug: '1password', title: '1Password', icon: si1password },
  evernote: { kind: 'simple-icon', slug: 'evernote', title: 'Evernote', icon: siEvernote },
  icloud: { kind: 'simple-icon', slug: 'icloud', title: 'iCloud', icon: siIcloud },
  'icloud+': { kind: 'simple-icon', slug: 'icloud', title: 'iCloud', icon: siIcloud },
  'google drive': { kind: 'simple-icon', slug: 'google-drive', title: 'Google Drive', icon: siGoogledrive },
  'google one': { kind: 'simple-icon', slug: 'google-drive', title: 'Google Drive', icon: siGoogledrive },
  playstation: { kind: 'simple-icon', slug: 'playstation', title: 'PlayStation', icon: siPlaystation },
  'ps plus': { kind: 'simple-icon', slug: 'playstation', title: 'PlayStation', icon: siPlaystation },
  'playstation plus': { kind: 'simple-icon', slug: 'playstation', title: 'PlayStation', icon: siPlaystation },
  steam: { kind: 'simple-icon', slug: 'steam', title: 'Steam', icon: siSteam },
  audible: { kind: 'simple-icon', slug: 'audible', title: 'Audible', icon: siAudible },
  duolingo: { kind: 'simple-icon', slug: 'duolingo', title: 'Duolingo', icon: siDuolingo },
  'duolingo plus': { kind: 'simple-icon', slug: 'duolingo', title: 'Duolingo', icon: siDuolingo },

  // === brand-image 由来 (public/brand-icons/{slug}.{ext}) ===
  'disney+': { kind: 'brand-image', slug: 'disney-plus', title: 'Disney+', ext: 'svg' },
  'disney plus': { kind: 'brand-image', slug: 'disney-plus', title: 'Disney+', ext: 'svg' },
  disneyplus: { kind: 'brand-image', slug: 'disney-plus', title: 'Disney+', ext: 'svg' },
  'u-next': {
    kind: 'brand-image',
    slug: 'u-next',
    title: 'U-NEXT',
    ext: 'svg',
    primaryColor: '#000A17',
    bgColor: '#FFFFFF',
  },
  unext: {
    kind: 'brand-image',
    slug: 'u-next',
    title: 'U-NEXT',
    ext: 'svg',
    primaryColor: '#000A17',
    bgColor: '#FFFFFF',
  },
  'prime video': { kind: 'brand-image', slug: 'prime-video', title: 'Amazon Prime Video', ext: 'jpeg' },
  'amazon prime': { kind: 'brand-image', slug: 'prime-video', title: 'Amazon Prime Video', ext: 'jpeg' },
  'amazon prime video': { kind: 'brand-image', slug: 'prime-video', title: 'Amazon Prime Video', ext: 'jpeg' },
  'amazon music': {
    kind: 'brand-image',
    slug: 'amazon',
    title: 'Amazon Music',
    ext: 'svg',
    primaryColor: '#000000',
    bgColor: '#23C9D3',
  },
  chatgpt: {
    kind: 'brand-image',
    slug: 'chatgpt',
    title: 'ChatGPT',
    ext: 'svg',
    primaryColor: '#F9F9F9',
    bgColor: '#F9F9F9',
  },
  openai: {
    kind: 'brand-image',
    slug: 'chatgpt',
    title: 'ChatGPT',
    ext: 'svg',
    primaryColor: '#F9F9F9',
    bgColor: '#F9F9F9',
  },
  slack: { kind: 'brand-image', slug: 'slack', title: 'Slack', ext: 'svg' },
  'microsoft 365': { kind: 'brand-image', slug: 'microsoft-365', title: 'Microsoft 365', ext: 'svg' },
  'office 365': { kind: 'brand-image', slug: 'microsoft-365', title: 'Microsoft 365', ext: 'svg' },
  m365: { kind: 'brand-image', slug: 'microsoft-365', title: 'Microsoft 365', ext: 'svg' },
  canva: { kind: 'brand-image', slug: 'canva', title: 'Canva', ext: 'svg' },
  'adobe creative cloud': { kind: 'brand-image', slug: 'adobe-cc', title: 'Adobe Creative Cloud', ext: 'svg' },
  'adobe cc': { kind: 'brand-image', slug: 'adobe-cc', title: 'Adobe Creative Cloud', ext: 'svg' },
  'creative cloud': { kind: 'brand-image', slug: 'adobe-cc', title: 'Adobe Creative Cloud', ext: 'svg' },
  'nintendo switch online': {
    kind: 'brand-image',
    slug: 'nintendo',
    title: 'Nintendo Switch Online',
    ext: 'svg',
    primaryColor: '#FFFFFF',
    bgColor: '#E60012',
  },
  nso: {
    kind: 'brand-image',
    slug: 'nintendo',
    title: 'Nintendo Switch Online',
    ext: 'svg',
    primaryColor: '#FFFFFF',
    bgColor: '#E60012',
  },
  'switch online': {
    kind: 'brand-image',
    slug: 'nintendo',
    title: 'Nintendo Switch Online',
    ext: 'svg',
    primaryColor: '#FFFFFF',
    bgColor: '#E60012',
  },
  'xbox game pass': {
    kind: 'brand-image',
    slug: 'xbox-game-pass',
    title: 'Xbox Game Pass',
    ext: 'svg',
    primaryColor: '#FFFFFF',
    bgColor: '#107C10',
  },
  'game pass': {
    kind: 'brand-image',
    slug: 'xbox-game-pass',
    title: 'Xbox Game Pass',
    ext: 'svg',
    primaryColor: '#FFFFFF',
    bgColor: '#107C10',
  },
};

export function resolveIcon(name: string): IconEntry | null {
  return ICON_MAP[normalize(name)] ?? null;
}

export function getAllBrandIcons(): IconEntry[] {
  const seen = new Set<string>();
  const list: IconEntry[] = [];
  for (const entry of Object.values(ICON_MAP)) {
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);
    list.push(entry);
  }
  return list;
}
