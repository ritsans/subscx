import {
  type SimpleIcon,
  siAnthropic,
  siApplemusic,
  siClaude,
  siDropbox,
  siFigma,
  siGithub,
  siNetflix,
  siNotion,
  siSpotify,
  siYoutube,
} from 'simple-icons';

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * 正規化済みのサービス名 → simple-icons オブジェクト。
 * 未登録の名前は resolveIcon() が null を返し、頭文字バッジへ落ちる。
 */
const ICON_MAP: Record<string, SimpleIcon> = {
  netflix: siNetflix,
  spotify: siSpotify,
  youtube: siYoutube,
  'youtube premium': siYoutube,
  'apple music': siApplemusic,
  claude: siClaude,
  anthropic: siAnthropic,
  notion: siNotion,
  figma: siFigma,
  github: siGithub,
  dropbox: siDropbox,
};

export function resolveIcon(name: string): SimpleIcon | null {
  return ICON_MAP[normalize(name)] ?? null;
}
