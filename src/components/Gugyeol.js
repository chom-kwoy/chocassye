import { hangul_to_yale } from "./YaleToHangul";

export const GUGYEOL_DATA = {
  "\uf696": ["ㄱ/기", "只"],
  "\uf77c": ["?(갑)", "甲"],
  "\uf681": ["거", "去"],
  "\uf686": ["겨", "在"],
  "\uf687": ["고", "古"],
  "\uf690": ["곰", "厼"],
  "\uf68c": ["과", "果"],
  "\uf6ab": ["근", "斤"],
  "\uf779": ["긔", "中"],
  "\uf755": ["?(ᄀᆞᆮ)", "印"],
  "\uf693": ["?(ᄀᆞᆺ)", "這"],
  "\uf6ac": ["ㄴ/은", "隱"],
  "\uf69b": ["나", "乃"],
  "\uf6a0": ["노", "奴"],
  "\uf6a4": ["누", "臥"],
  "\uf6a5": ["니", "尼"],
  "\uf6a8": ["ᄂᆞ", "飛"],
  "\uf6b0": ["다", "多"],
  "\uf765": ["?(다)", "之"],
  "\uf711": ["뎌", "彼"],
  "\uf6bc": ["뎌", "丁"],
  "\uf6c0": ["도", "刀"],
  "\uf6c2": ["두", "斗"],
  "\uf6c7": ["디", "知"],
  "\uf6ce": ["ᄃᆞ", "入"],
  "\uf708": ["?(ᄃᆞ로)", "巴"],
  "\uf6cf": ["ᄃᆞᆯ", "冬"],
  "\uf6d0": ["ᄃᆡ", "矣"],
  "\uf6ec": ["ㄹ/을", "乙"],
  "\uf6ea": ["ㄹ/을", "尸"],
  "\uf6d6": ["라", "羅"],
  "\uf6de": ["로", "以"],
  "\uf6e2": ["리", "令"],
  "\uf6e3": ["리", "利"],
  "\uf703": ["ㅁ/음", "音"],
  "\uf6f2": ["마", "亇"],
  "\uf6fe": ["?(모)", "毛"],
  "\uf6f8": ["며", "厼"],
  "\uf6ff": ["믈", "勿"],
  "\uf709": ["?(ㅂ)", "邑"],
  "\u6368": ["ᄇᆞ리", "捨"],
  "\uf706": ["ᄇᆞ/ᄇᆞᆺ", "火"],
  "\uf722": ["ㅅ", "叱"],
  "\uf70a": ["사/삼", "沙"],
  "\uf70c": ["삼", "三"],
  "\uf712": ["?(삼/일)", "一"],
  "\uf710": ["셔", "立"],
  "\uf71f": ["시", "賜"],
  "\uf71a": ["시", "示"],
  "\uf720": ["ᄉᆞᆸ", "白"],
  "\uf72a": ["아", "良"],
  "\uf73c": ["여", "亦"],
  "\uf73b": ["여", "亦"],
  "\uf73a": ["?(여)", "與"],
  "\uf76e": ["오/호", "乎"],
  "\uf740": ["오", "五"],
  "\uf69f": ["우", "又"],
  "\uf748": ["우", "于"],
  "\uf74d": ["의", "衣"],
  "\uf750": ["이", "是"],
  "\uf6d2": ["익", "弋"],
  "\uf757": ["일", "成"],
  "\uf75c": ["자", "第"],
  "\uf760": ["져", "齊"],
  "\uf77b": ["?(지)", "子"],
  "\uf766": ["?(지ᇫ)", "造"],
  "\uf764": ["텨", "止"],
  "\uf76b": ["하", "下"],
  "\uf76d": ["호/오", "乎"],
  "\uf772": ["히", "兮"],
  "\uf6b4": ["?(히/디)", "支"],
  "\uf775": ["ᄒᆞ", "為"],
  "\uf695": ["ᄒᆞᆫ/ᄀᆞᆫ", "艮"],
  "\uf6d5": ["ᄒᆡ", "令"],
};

export const GUGYEOL_READINGS = Object.fromEntries(
  Object.entries(GUGYEOL_DATA).map(([gugyeol, data]) => [gugyeol, data[0]]),
);
export const GUGYEOL_ORIG_CHAR = Object.fromEntries(
  Object.entries(GUGYEOL_DATA).map(([gugyeol, data]) => [gugyeol, data[1]]),
);

export const GUGYEOL_REGEX =
  /([恨捨\uf681\uf686\uf687\uf68c\uf690\uf693\uf695\uf696\uf69b\uf69f\uf6a0\uf6a4\uf6a5\uf6a8\uf6ab\uf6ac\uf6b0\uf6b4\uf6bc\uf6c0\uf6c2\uf6c7\uf6ce\uf6cf\uf6d0\uf6d2\uf6d5\uf6d6\uf6de\uf6e2\uf6e3\uf6ea\uf6ec\uf6f2\uf6f8\uf6fe\uf6ff\uf703\uf706\uf708\uf709\uf70a\uf70c\uf710\uf711\uf712\uf71a\uf71f\uf720\uf722\uf72a\uf73a\uf73b\uf73c\uf740\uf748\uf74d\uf750\uf755\uf757\uf75c\uf760\uf764\uf765\uf766\uf76b\uf76d\uf76e\uf772\uf775\uf779\uf77b\uf77c])/g;

const normalizedReadings = Object.entries(GUGYEOL_READINGS).map(
  ([gugyeol, pron]) => ({
    gugyeol,
    pron,
    readings: (pron.startsWith("?(") ? pron.slice(2, -1) : pron)
      .split("/")
      .map((reading) => hangul_to_yale(reading)),
  }),
);
const maxReadingLength = Math.max(
  ...normalizedReadings.flatMap(({ readings }) =>
    readings.map((p) => p.length),
  ),
);
const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

export function suggestGugyeol(input, cursor = input.length) {
  if (cursor <= 0 || cursor > input.length) {
    return [];
  }

  // Keep UTF-16 offsets into the original text, without splitting a grapheme.
  const segments = Array.from(segmenter.segment(input));
  const endIndex = segments.findIndex(
    ({ index, segment }) => index + segment.length === cursor,
  );
  const suggestions = new Map();
  for (let i = endIndex; i >= 0; i--) {
    const replaceStart = segments[i].index;
    const searchPart = hangul_to_yale(input.slice(replaceStart, cursor));
    if (searchPart.length > maxReadingLength) break;
    if (searchPart.length === 0) continue;

    for (const { gugyeol, pron, readings } of normalizedReadings) {
      if (readings.some((reading) => reading.startsWith(searchPart))) {
        // Prefer the longest matching source span for a duplicate candidate.
        suggestions.set(gugyeol, {
          gugyeol,
          pron,
          replaceStart,
          replaceEnd: cursor,
        });
      }
    }
  }
  return Array.from(suggestions.values());
}

export function replaceGugyeolPUAWithHanja(text) {
  let result = "";
  let converting = false;
  for (const char of text) {
    const replacement = GUGYEOL_ORIG_CHAR[char];
    if (replacement !== undefined && replacement !== char) {
      if (!converting) result += "[";
      result += replacement;
      converting = true;
    } else {
      if (converting) result += "]";
      result += char;
      converting = false;
    }
  }
  return converting ? result + "]" : result;
}
