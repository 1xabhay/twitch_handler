// !discord / !insta / !playlist / !socials — links come from .env (LINK_DISCORD, LINK_INSTA, LINK_PLAYLIST).
export type Links = Partial<Record<'discord' | 'insta' | 'playlist', string>>;

const LINE = { discord: (u: string) => `💬 discord: ${u}`, insta: (u: string) => `📸 insta: ${u}`, playlist: (u: string) => `🎧 shared playlist: ${u}` };
const ALIAS: Record<string, keyof Links> = { discord: 'discord', insta: 'insta', instagram: 'insta', ig: 'insta', playlist: 'playlist' };

export const handleLink = (text: string, links: Links) => {
  const cmd = text.trim().toLowerCase().match(/^!(\w+)$/)?.[1];
  if (!cmd) return null;
  if (cmd === 'socials') {
    const all = (Object.keys(LINE) as (keyof Links)[]).flatMap((k) => (links[k] ? [LINE[k](links[k]!)] : []));
    return all.length ? all.join(' · ') : null;
  }
  const key = ALIAS[cmd];
  return key && links[key] ? LINE[key](links[key]!) : null;
};
