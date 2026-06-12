import { escapeStringRegexp } from "next/dist/shared/lib/escape-regexp";

const Y2MH_INITIALS: Record<string, string> = {
  k: "ᄀ",
  kk: "ᄁ",
  n: "ᄂ",
  t: "ᄃ",
  tt: "ᄄ",
  l: "ᄅ",
  m: "ᄆ",
  p: "ᄇ",
  pp: "ᄈ",
  s: "ᄉ",
  ss: "ᄊ",
  G: "ᄋ",
  c: "ᄌ",
  cc: "ᄍ",
  ch: "ᄎ",
  kh: "ᄏ",
  th: "ᄐ",
  ph: "ᄑ",
  h: "ᄒ",
};
export const Y2H_INITIALS: Record<string, string> = {
  ...Y2MH_INITIALS,
  nn: "ᄔ",
  GG: "ᅇ",
  pk: "ᄞ",
  pt: "ᄠ",
  ps: "ᄡ",
  psk: "ᄢ",
  pst: "ᄣ",
  psc: "ᄦ",
  pc: "ᄧ",
  pth: "ᄩ",
  W: "ᄫ",
  sk: "ᄭ",
  skh: "ᄸ",
  sn: "ᄮ",
  sm: "ᄱ",
  st: "ᄯ",
  sth: "ᄹ",
  sp: "ᄲ",
  sph: "ᄺ",
  spk: "ᄳ",
  sss: "ᄴ",
  sG: "ᄵ",
  sc: "ᄶ",
  sch: "ᄷ",
  sh: "ᄻ",
  z: "ᅀ",
  hh: "ᅘ",
  q: "ᅙ",
  ng: "ᅌ",

  "s/": "ᄼ",
  "ss/": "ᄽ",
  "c/": "ᅎ",
  "cc/": "ᅏ",
  "ch/": "ᅔ",

  "s\\": "ᄾ",
  "ss\\": "ᄿ",
  "c\\": "ᅐ",
  "cc\\": "ᅑ",
  "ch\\": "ᅕ",

  "`": "ᅟ",
};
const Y2MH_FINALS: Record<string, string> = {
  k: "ᆨ",
  kk: "ᆩ",
  ks: "ᆪ",
  n: "ᆫ",
  nc: "ᆬ",
  nh: "ᆭ",
  t: "ᆮ",
  l: "ᆯ",
  lk: "ᆰ",
  lm: "ᆱ",
  lp: "ᆲ",
  ls: "ᆳ",
  lh: "ᆶ",
  m: "ᆷ",
  p: "ᆸ",
  ps: "ᆹ",
  s: "ᆺ",
  ss: "ᆻ",
  G: "ᆼ",
  c: "ᆽ",
  ch: "ᆾ",
  kh: "ᆿ",
  th: "ᇀ",
  ph: "ᇁ",
  h: "ᇂ",
};
export const Y2H_FINALS: Record<string, string> = {
  ...Y2MH_FINALS,
  nk: "ᇅ",
  nt: "ᇆ",
  ns: "ᇇ",
  nz: "ᇈ",
  lks: "ᇌ",
  lt: "ᇎ",
  lmk: "ᇑ",
  lms: "ᇒ",
  lmh: "ퟘ",
  lps: "ᇓ",
  lss: "ᇖ",
  lth: "ᆴ",
  lph: "ᆵ",
  lz: "ᇗ",
  lW: "ᇕ",
  lq: "ᇙ",
  nth: "ᇉ",
  nch: "ퟌ",
  mk: "ᇚ",
  mp: "ᇜ",
  ms: "ᇝ",
  mz: "ᇟ",
  mch: "ᇠ",
  M: "ᇢ",
  W: "ᇦ",
  sk: "ᇧ",
  st: "ᇨ",
  z: "ᇫ",
  ng: "ᇰ",
  ngk: "ᇬ",
  ngkk: "ᇭ",
  ngkh: "ᇯ",
  f: "ᇴ",
  q: "ᇹ",
  ngs: "ᇱ",
  pl: "ᇣ",
};
export const Y2H_CONSONANTS: Record<string, string> = {
  ...Y2H_FINALS,
  ...Y2H_INITIALS,
};
const Y2MH_VOWELS: Record<string, string> = {
  a: "ᅡ",
  ay: "ᅢ",
  ya: "ᅣ",
  yay: "ᅤ",
  e: "ᅥ",
  ey: "ᅦ",
  ye: "ᅧ",
  yey: "ᅨ",
  wo: "ᅩ",
  wa: "ᅪ",
  way: "ᅫ",
  woy: "ᅬ",
  yo: "ᅭ",
  wu: "ᅮ",
  we: "ᅯ",
  wey: "ᅰ",
  wuy: "ᅱ",
  yu: "ᅲ",
  u: "ᅳ",
  uy: "ᅴ",
  i: "ᅵ",
};
export const Y2H_VOWELS: Record<string, string> = {
  ...Y2MH_VOWELS,
  o: "ᆞ",
  oy: "ᆡ",
  yoy: "ᆈ",
  yuy: "ᆔ",
  ywe: "ᆑ",
  ywey: "ᆒ",
  ywa: "ᆄ",
  yway: "ᆅ",
};
export const Y2H_TONE_MARKS: Record<string, string> = {
  L: "",
  H: "〮",
  R: "〯",
};
// prettier-ignore
const TO_COMPAT_CONSONANTS: Record<string, string> = {
  "ᄀ": "ㄱ",
  "ᄁ": "ㄲ",
  "ᆪ": "ㄳ",
  "ᄂ": "ㄴ",
  "ᆬ": "ㄵ",
  "ᆭ": "ㄶ",
  "ᄃ": "ㄷ",
  "ᄄ": "ㄸ",
  "ᄅ": "ㄹ",
  "ᆰ": "ㄺ",
  "ᆱ": "ㄻ",
  "ᆲ": "ㄼ",
  "ᆳ": "ㄽ",
  "ᆴ": "ㄾ",
  "ᆵ": "ㄿ",
  "ᄚ": "ㅀ",
  "ᄆ": "ㅁ",
  "ᄇ": "ㅂ",
  "ᄈ": "ㅃ",
  "ᄡ": "ㅄ",
  "ᄉ": "ㅅ",
  "ᄊ": "ㅆ",
  "ᄋ": "ㅇ",
  "ᄌ": "ㅈ",
  "ᄍ": "ㅉ",
  "ᄎ": "ㅊ",
  "ᄏ": "ㅋ",
  "ᄐ": "ㅌ",
  "ᄑ": "ㅍ",
  "ᄒ": "ㅎ",
  "ᄔ": "ㅥ",
  "ᄕ": "ㅦ",
  "ᇇ": "ㅧ",
  "ᇈ": "ㅨ",
  "ᇌ": "ㅩ",
  "ᇎ": "ㅪ",
  "ᇓ": "ㅫ",
  "ᇗ": "ㅬ",
  "ᇙ": "ㅭ",
  "ᄜ": "ㅮ",
  "ᇝ": "ㅯ",
  "ᇟ": "ㅰ",
  "ᄝ": "ㅱ",
  "ᄞ": "ㅲ",
  "ᄠ": "ㅳ",
  "ᄢ": "ㅴ",
  "ᄣ": "ㅵ",
  "ᄧ": "ㅶ",
  "ᄩ": "ㅷ",
  "ᄫ": "ㅸ",
  "ᄬ": "ㅹ",
  "ᄭ": "ㅺ",
  "ᄮ": "ㅻ",
  "ᄯ": "ㅼ",
  "ᄲ": "ㅽ",
  "ᄶ": "ㅾ",
  "ᅀ": "ㅿ",
  "ᅇ": "ㆀ",
  "ᅌ": "ㆁ",
  "ᇱ": "ㆂ",
  "ᇲ": "ㆃ",
  "ᅗ": "ㆄ",
  "ᅘ": "ㆅ",
  "ᅙ": "ㆆ",
};
// prettier-ignore
const TO_COMPAT_VOWELS: Record<string, string> = {
  "ᅡ": "ㅏ",
  "ᅢ": "ㅐ",
  "ᅣ": "ㅑ",
  "ᅤ": "ㅒ",
  "ᅥ": "ㅓ",
  "ᅦ": "ㅔ",
  "ᅧ": "ㅕ",
  "ᅨ": "ㅖ",
  "ᅩ": "ㅗ",
  "ᅪ": "ㅘ",
  "ᅫ": "ㅙ",
  "ᅬ": "ㅚ",
  "ᅭ": "ㅛ",
  "ᅮ": "ㅜ",
  "ᅯ": "ㅝ",
  "ᅰ": "ㅞ",
  "ᅱ": "ㅟ",
  "ᅲ": "ㅠ",
  "ᅳ": "ㅡ",
  "ᅴ": "ㅢ",
  "ᅵ": "ㅣ",
  "ᆄ": "ㆇ",
  "ᆅ": "ㆈ",
  "ᆈ": "ㆉ",
  "ᆑ": "ㆊ",
  "ᆒ": "ㆋ",
  "ᆔ": "ㆌ",
  "ᆞ": "ㆍ",
  "ᆡ": "ㆎ",
};
export const TO_COMPAT: Record<string, string> = {
  ...TO_COMPAT_CONSONANTS,
  ...TO_COMPAT_VOWELS,
};

function inv(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

export const H2Y: Record<string, string> = {
  ...inv(Y2H_INITIALS),
  ...inv(Y2H_VOWELS),
  ...inv(Y2H_FINALS),
  "〮": "H",
  "〯": "R",
};
export const H2Y_INITIALS: Record<string, string> = inv(Y2H_INITIALS);
export const H2Y_VOWELS: Record<string, string> = inv(Y2H_VOWELS);
export const H2Y_FINALS: Record<string, string> = inv(Y2H_FINALS);
export const H2Y_TONE_MARKS: Record<string, string> = inv(Y2H_TONE_MARKS);

function sortedAlts(keys: string[]): string {
  const maxLen = Math.max(0, ...keys.map((k) => k.length));
  const parts: string[] = [];
  for (let len = maxLen; len >= 0; --len) {
    for (const key of keys) {
      if (key.length === len) {
        parts.push(escapeStringRegexp(key));
      }
    }
  }
  return parts.join("|");
}

const hangulInitials = sortedAlts(Object.keys(H2Y_INITIALS));
const hangulVowels = sortedAlts(Object.keys(H2Y_VOWELS));
const hangulFinals = sortedAlts([...Object.keys(H2Y_FINALS), ""]);
const hangulTones = sortedAlts(Object.keys(H2Y_TONE_MARKS));
const compatVowels = sortedAlts([...new Set(Object.values(TO_COMPAT_VOWELS))]);

const modHangInitials = sortedAlts([...new Set(Object.values(Y2MH_INITIALS))]);
const modHangVowels = sortedAlts([...new Set(Object.values(Y2MH_VOWELS))]);
const modHangFinals = sortedAlts([...new Set(Object.values(Y2MH_FINALS))]);
const modHangFinalsSet = new Set(Object.values(Y2MH_FINALS));
const oldHangFinals = sortedAlts(
  [...new Set(Object.values(Y2H_FINALS))].filter(
    (f) => !modHangFinalsSet.has(f),
  ),
);

const yaleInitials = sortedAlts(Object.keys(Y2H_INITIALS));
const yaleVowels = sortedAlts(Object.keys(Y2H_VOWELS));
const yaleFinals = sortedAlts([...Object.keys(Y2H_FINALS), ""]);
const yaleTones = sortedAlts(Object.keys(Y2H_TONE_MARKS));
const yaleConsonants = sortedAlts(Object.keys(Y2H_CONSONANTS));

export const YALE_VOWELS_RE = new RegExp(`(${yaleVowels})`);
export const YALE_CONSONANTS_RE = new RegExp(`(${yaleConsonants})`);

export const INDEP_CONS_RE = new RegExp(
  `(${hangulInitials})(?!${hangulVowels})`,
  "g",
);
export const COMPAT_VOWELS_RE = new RegExp(`(?:${compatVowels})`, "g");
export const HANGUL_SYLLABLE_REGEX = new RegExp(
  `((?:${hangulInitials})(?:${hangulVowels})(?:${hangulFinals}))(${hangulTones})`,
  "g",
);
export const MODERN_HANGUL_SYLLABLE_REGEX = new RegExp(
  `((?:${modHangInitials})(?:${modHangVowels})(?:(?:${modHangFinals})(?!〮|〯)|(?!〮|〯|${modHangFinals}|${oldHangFinals})))`,
  "g",
);

export const YALE_TONED_SYLLABLE_REGEX = new RegExp(
  `((?:${yaleInitials})(?:${yaleVowels})(?:${yaleFinals}))(${yaleTones})(?![^<]*>)`,
  "g",
);
export const YALE_UNTONED_SYLLABLE_REGEX = new RegExp(
  `((?:${yaleInitials})(?:${yaleVowels})(?:${yaleFinals}))(?![^<]*>)`,
  "g",
);
