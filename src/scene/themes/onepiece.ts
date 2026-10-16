// Grand Line: a One Piece nod. Places and props only, no characters (fan homage, nothing copied).
import { C, type Block, type Paint } from '../blocks.ts';
import type { Theme } from '../theme.ts';
import { FH, type Kind } from '../city.ts';

const ink = '#1E1E24', wood = '#8C5A34', darkWood = '#5A3A22', sea = '#3A7CA5', hat = '#F2C230', ribbon = '#E4572E', orange = '#FF9A3D';

// Water 7 canal houses: cream stone with arched windows, terracotta flats with blue shutters
const storey: Partial<Record<Kind, Block>> = {
  office: (p, x, y) => {
    p(x, y, 16, FH, '#E8DCC0'); p(x, y + 7, 16, 1, '#B8A880');
    for (const wx of [2, 7, 12]) { p(x + wx, y + 3, 3, 3, C.lit); p(x + wx + 1, y + 2, 1, 1, C.lit); }
  },
  apartment: (p, x, y) => {
    p(x, y, 16, FH, '#D98A5A'); p(x, y + 7, 16, 1, '#A8603A');
    for (const wx of [3, 10]) { p(x + wx, y + 2, 3, 3, C.lit); p(x + wx - 1, y + 2, 1, 3, sea); p(x + wx + 3, y + 2, 1, 3, sea); }
  },
};
const roof = (p: Paint, x: number, y: number, kind: Kind, t: number) => {
  p(x, y - 2, 16, 2, sea);
  if (kind === 'office') { // little dome with a flag
    p(x + 5, y - 4, 6, 2, sea); p(x + 7, y - 5, 2, 1, sea); p(x + 8, y - 9, 1, 4, darkWood);
    p(x + 9, y - 9 + (Math.floor(t / 1500) % 2), 3, 2, ink);
  } else for (const gx of [2, 5, 10, 13]) { p(x + gx, y - 3, 1, 1, '#3E8E41'); p(x + gx, y - 4, 1, 1, orange); } // tangerine pots
};

// a Jolly Roger: skull, crossbones, straw hat (cx, top y)
const roger = (p: Paint, cx: number, y: number, bone: string) => {
  p(cx - 1, y, 3, 1, hat); p(cx - 1, y + 1, 3, 1, ribbon); p(cx - 2, y + 1, 1, 1, hat); p(cx + 2, y + 1, 1, 1, hat);
  p(cx - 1, y + 2, 3, 2, bone); p(cx, y + 4, 1, 1, bone);
  for (const [dx, dy] of [[-3, 2], [3, 2], [-2, 3], [2, 3], [-2, 5], [2, 5], [-3, 6], [3, 6]] as const) p(cx + dx, y + dy, 1, 1, bone);
};

const tangerine = (p: Paint, x: number, y: number) => {
  p(x + 2, y - 4, 1, 4, '#6B4A2B'); p(x, y - 9, 5, 5, '#3E8E41');
  p(x + 1, y - 8, 1, 1, orange); p(x + 3, y - 7, 1, 1, orange); p(x + 1, y - 6, 1, 1, orange);
};

const lots: Partial<Record<Kind, Block>> = {
  office: (p, x, y, s) => { storey.office!(p, x, y - 16, s); storey.office!(p, x, y - 8, s); p(x + 6, y - 5, 4, 5, sea); p(x + 7, y - 6, 2, 1, sea); },
  apartment: (p, x, y, s) => { storey.apartment!(p, x, y - 16, s); storey.apartment!(p, x, y - 8, s); p(x + 7, y - 5, 3, 5, C.dark); },
  park: (p, x, y) => { tangerine(p, x, y); tangerine(p, x + 6, y); tangerine(p, x + 11, y); }, // evergreen: it's the Grand Line
  shop: (p, x, y) => { // meat shop: a bone-in roast in the window
    p(x, y - 10, 16, 10, '#D9B48A');
    for (let i = 0; i < 16; i += 2) p(x + i, y - 12, 2, 2, i % 4 ? '#F4F4F4' : '#2E8B57');
    p(x + 2, y - 8, 7, 5, C.lit); p(x + 4, y - 7, 3, 3, '#A0442E'); p(x + 3, y - 6, 1, 1, '#F4F4F4'); p(x + 7, y - 6, 1, 1, '#F4F4F4');
    p(x + 11, y - 7, 3, 7, C.dark);
  },
  watertower: (p, x, y) => { // Water 7 water barrel on stilts
    p(x + 2, y - 8, 1, 8, darkWood); p(x + 9, y - 8, 1, 8, darkWood); p(x + 2, y - 5, 8, 1, darkWood);
    p(x + 1, y - 19, 10, 11, '#9A6A3A'); p(x, y - 16, 12, 5, '#9A6A3A');
    p(x, y - 17, 12, 1, darkWood); p(x, y - 11, 12, 1, darkWood); p(x + 2, y - 20, 8, 1, darkWood); p(x + 3, y - 21, 6, 1, '#4FB3E8');
  },
  turbine: (p, x, y, { t }) => { // windmill, sails turn slowly
    p(x + 3, y - 6, 6, 6, '#9A7445'); p(x + 4, y - 14, 4, 8, '#B08850'); p(x + 4, y - 16, 4, 2, '#8C5E48'); p(x + 5, y - 4, 2, 4, C.dark);
    const sail = '#E8D8B0', hub = [x + 6, y - 15] as const;
    if (Math.floor(t / 1500) % 2) { p(hub[0], hub[1] - 6, 1, 6, sail); p(hub[0] - 5, hub[1], 5, 1, sail); p(hub[0] + 1, hub[1], 5, 1, sail); p(hub[0], hub[1] + 1, 1, 5, sail); }
    else for (let i = 1; i <= 5; i++) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) p(hub[0] + dx * i, hub[1] + dy * i, 1, 1, sail);
    p(hub[0], hub[1], 1, 1, darkWood);
  },
  clocktower: (p, x, y, { t, night }) => { // lighthouse, the lamp sweeps at night
    p(x + 2, y - 8, 10, 8, '#F4F4F4'); p(x + 3, y - 17, 8, 9, '#C8443A'); p(x + 4, y - 26, 6, 9, '#F4F4F4'); // tapering stripes
    p(x + 6, y - 4, 2, 4, C.dark); p(x + 6, y - 14, 2, 2, C.lit);
    p(x + 2, y - 27, 10, 1, C.dark); p(x + 4, y - 31, 6, 4, '#2A2A3A'); p(x + 5, y - 30, 4, 2, night ? C.shine : C.lit);
    p(x + 5, y - 33, 4, 2, '#C8443A'); p(x + 6, y - 34, 2, 1, '#C8443A');
    if (night) p(Math.floor(t / 2000) % 2 ? x + 10 : x, y - 30, 4, 1, 'rgba(255,241,193,0.6)');
  },
  ferris: (p, x, y, { t }) => { // pirate ship at the dock: sun-lion figurehead, straw-hat sail
    for (let r = 0; r < 7; r++) { const inset = Math.max(0, 3 - r); p(x + 3 + inset, y - 1 - r, 22 - 2 * inset, 1, r === 5 ? hat : wood); }
    p(x + 18, y - 11, 7, 4, wood); p(x + 19, y - 10, 1, 1, C.lit); p(x + 21, y - 10, 1, 1, C.lit); p(x + 23, y - 10, 1, 1, C.lit);
    p(x, y - 11, 4, 4, orange); p(x + 1, y - 10, 2, 2, C.lit); // lion mane, sunny face
    p(x + 13, y - 29, 1, 22, darkWood);
    const b = Math.floor(t / 2500) % 2; // the sail breathes
    p(x + 7, y - 25, 13, 11, '#F4F0E0'); p(x + 20, y - 24 + b, 1, 9, '#F4F0E0');
    roger(p, x + 13, y - 24, ink);
    p(x + 14, y - 29 + b, 4, 2, ink); // black flag on the mast
  },
};

export const onepiece: Theme = {
  name: 'Grand Line',
  hello: '🏴‍☠️ Grand Line day! the city sets sail: canal houses, windmills, a lighthouse, and a pirate ship for the longest focus blocks. !task still builds',
  bye: '⚓ the ship is back in port, plain city again',
  names: {
    ferris: 'pirate ship', clocktower: 'lighthouse', turbine: 'windmill', watertower: 'water barrel',
    shop: 'meat shop', park: 'tangerine grove', office: 'canal house', apartment: 'canal flat',
  },
  kit: {
    lots, storey, roof,
    body: { office: [0, 16, 16, '#E8DCC0'], apartment: [0, 16, 16, '#D98A5A'], shop: [0, 16, 10, '#D9B48A'], clocktower: undefined },
    boat: (p, x, y, color, dir, night) => { // pirate sloop, black sail
      p(x, y, 10, 2, '#6B4A2B'); p(x, y, 10, 1, color); p(x + 1, y + 2, 8, 1, C.dark);
      p(x + 5, y - 6, 1, 6, darkWood); p(x + 3, y - 5, 5, 4, ink); p(x + 5, y - 4, 1, 1, '#F4F4F4');
      p(dir > 0 ? x - 4 : x + 11, y + 2, 3, 1, '#BFE3FF');
      if (night) p(dir > 0 ? x + 9 : x, y - 1, 1, 1, C.shine);
    },
    balloon: (p, x, y, t) => { // a news coo: gull in a cap with a satchel of papers
      const up = Math.floor(t / 400) % 2;
      p(x + 1, y + 2, 5, 3, '#F4F4F4'); p(x + 5, y + 1, 2, 2, '#F4F4F4'); p(x + 7, y + 2, 1, 1, '#F2A03D'); p(x + 5, y, 2, 1, '#4C6AA8');
      p(x, y + (up ? 0 : 3), 3, 1, '#D8D8E0'); p(x + 2, y + 5, 2, 2, '#B08850');
    },
    water: { day: '#1E7A8C', night: '#0F2A3A' },
  },
};
