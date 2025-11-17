import UnicodeNames from "@unicode/unicode-16.0.0/Names/index.js";
import escapeStringRegexp from "escape-string-regexp";

import { Mapping, replaceAndMap } from "@/components/StringMapping";

// prettier-ignore
export const CONSONANT_FORMS: { [key: string]: (string | null)[] } = {
  "ㄱ": ["ㄱ", "ᄀ", "ᆨ"],
  "ㄲ": ["ㄲ", "ᄁ", "ᆩ"],
  "ㄳ": ["ㄳ", null, "ᆪ"],
  "ㄴ": ["ㄴ", "ᄂ", "ᆫ"],
  "ㄵ": ["ㄵ", "ᅜ", "ᆬ"],
  "ㄶ": ["ㄶ", "ᅝ", "ᆭ"],
  "ㄷ": ["ㄷ", "ᄃ", "ᆮ"],
  "ㄸ": ["ㄸ", "ᄄ", "ퟍ"],
  "ㄹ": ["ㄹ", "ᄅ", "ᆯ"],
  "ㄺ": ["ㄺ", "ꥤ", "ᆰ"],
  "ㄻ": ["ㄻ", "ꥨ", "ᆱ"],
  "ㄼ": ["ㄼ", "ꥩ", "ᆲ"],
  "ㄽ": ["ㄽ", "ꥬ", "ᆳ"],
  "ㄾ": ["ㄾ", null, "ᆴ"],
  "ㄿ": ["ㄿ", null, "ᆵ"],
  "ㅀ": ["ㅀ", "ᄚ", "ᆶ"],
  "ㅁ": ["ㅁ", "ᄆ", "ᆷ"],
  "ㅂ": ["ㅂ", "ᄇ", "ᆸ"],
  "ㅃ": ["ㅃ", "ᄈ", "ퟦ"],
  "ㅄ": ["ㅄ", "ᄡ", "ᆹ"],
  "ㅅ": ["ㅅ", "ᄉ", "ᆺ"],
  "ㅆ": ["ㅆ", "ᄊ", "ᆻ"],
  "ㅇ": ["ㅇ", "ᄋ", "ᆼ"],
  "ㅈ": ["ㅈ", "ᄌ", "ᆽ"],
  "ㅉ": ["ㅉ", "ᄍ", "ퟹ"],
  "ㅊ": ["ㅊ", "ᄎ", "ᆾ"],
  "ㅋ": ["ㅋ", "ᄏ", "ᆿ"],
  "ㅌ": ["ㅌ", "ᄐ", "ᇀ"],
  "ㅍ": ["ㅍ", "ᄑ", "ᇁ"],
  "ㅎ": ["ㅎ", "ᄒ", "ᇂ"],
  "ㅥ": ["ㅥ", "ᄔ", "ᇿ"],
  "ㅦ": ["ㅦ", "ᄕ", "ᇆ"],
  "ㅧ": ["ㅧ", "ᅛ", "ᇇ"],
  "ㅨ": ["ㅨ", null, "ᇈ"],
  "ㅩ": ["ㅩ", null, "ᇌ"],
  "ㅪ": ["ㅪ", "ꥦ", "ᇎ"],
  "ㅫ": ["ㅫ", null, "ᇓ"],
  "ㅬ": ["ㅬ", null, "ᇗ"],
  "ㅭ": ["ㅭ", null, "ᇙ"],
  "ㅮ": ["ㅮ", "ᄜ", "ᇜ"],
  "ㅯ": ["ㅯ", "ꥱ", "ᇝ"],
  "ㅰ": ["ㅰ", null, "ᇟ"],
  "ㅱ": ["ㅱ", "ᄝ", "ᇢ"],
  "ㅲ": ["ㅲ", "ᄞ", null],
  "ㅳ": ["ㅳ", "ᄠ", "ퟣ"],
  "ㅴ": ["ㅴ", "ᄢ", null],
  "ㅵ": ["ㅵ", "ᄣ", "ퟧ"],
  "ㅶ": ["ㅶ", "ᄧ", "ퟨ"],
  "ㅷ": ["ㅷ", "ᄩ", null],
  "ㅸ": ["ㅸ", "ᄫ", "ᇦ"],
  "ㅹ": ["ㅹ", "ᄬ", null],
  "ㅺ": ["ㅺ", "ᄭ", "ᇧ"],
  "ㅻ": ["ㅻ", "ᄮ", null],
  "ㅼ": ["ㅼ", "ᄯ", "ᇨ"],
  "ㅽ": ["ㅽ", "ᄲ", "ᇪ"],
  "ㅾ": ["ㅾ", "ᄶ", "ퟯ"],
  "ㅿ": ["ㅿ", "ᅀ", "ᇫ"],
  "ㆀ": ["ㆀ", "ᅇ", null],
  "ᇮ": ["ᇮ", null, "ᇮ"],
  "ㆁ": ["ㆁ", "ᅌ", "ᇰ"],
  "ㆂ": ["ㆂ", null, "ᇱ"],
  "ㆃ": ["ㆃ", null, "ᇲ"],
  "ㆄ": ["ㆄ", "ᅗ", "ᇴ"],
  "ㆅ": ["ㆅ", "ᅘ", null],
  "ㆆ": ["ㆆ", "ᅙ", "ᇹ"],
  "ᄓ": ["ᄓ", "ᄓ", "ᇅ"],
  "ᄖ": ["ᄖ", "ᄖ", null],
  "ᄗ": ["ᄗ", "ᄗ", "ᇊ"],
  "ᄘ": ["ᄘ", "ᄘ", "ᇍ"],
  "ᄙ": ["ᄙ", "ᄙ", "ᇐ"],
  "ᄛ": ["ᄛ", "ᄛ", "ퟝ"],
  "ᄟ": ["ᄟ", "ᄟ", null],
  "ᄤ": ["ᄤ", "ᄤ", null],
  "ᄥ": ["ᄥ", "ᄥ", null],
  "ᄦ": ["ᄦ", "ᄦ", null],
  "ᄨ": ["ᄨ", "ᄨ", "ퟩ"],
  "ᄪ": ["ᄪ", "ᄪ", "ᇤ"],
  "ᄰ": ["ᄰ", "ᄰ", "ᇩ"],
  "ᄱ": ["ᄱ", "ᄱ", "ퟪ"],
  "ᄳ": ["ᄳ", "ᄳ", null],
  "ᄴ": ["ᄴ", "ᄴ", null],
  "ᄵ": ["ᄵ", "ᄵ", null],
  "ᄷ": ["ᄷ", "ᄷ", "ퟰ"],
  "ᄸ": ["ᄸ", "ᄸ", null],
  "ᄹ": ["ᄹ", "ᄹ", "ퟱ"],
  "ᄺ": ["ᄺ", "ᄺ", null],
  "ᄻ": ["ᄻ", "ᄻ", "ퟲ"],
  "ᄼ": ["ᄼ", "ᄼ", null],
  "ᄽ": ["ᄽ", "ᄽ", null],
  "ᄾ": ["ᄾ", "ᄾ", null],
  "ᄿ": ["ᄿ", "ᄿ", null],
  "ᅁ": ["ᅁ", "ᅁ", null],
  "ᇬ": ["ᇬ", null, "ᇬ"],
  "ᅂ": ["ᅂ", "ᅂ", null],
  "ᅃ": ["ᅃ", "ᅃ", null],
  "ᅄ": ["ᅄ", "ᅄ", null],
  "ᅅ": ["ᅅ", "ᅅ", null],
  "ᅆ": ["ᅆ", "ᅆ", null],
  "ᅈ": ["ᅈ", "ᅈ", null],
  "ᅉ": ["ᅉ", "ᅉ", null],
  "ᅊ": ["ᅊ", "ᅊ", null],
  "ᅋ": ["ᅋ", "ᅋ", null],
  "ᅍ": ["ᅍ", "ᅍ", null],
  "ᅎ": ["ᅎ", "ᅎ", null],
  "ᅏ": ["ᅏ", "ᅏ", null],
  "ᅐ": ["ᅐ", "ᅐ", null],
  "ᅑ": ["ᅑ", "ᅑ", null],
  "ᅒ": ["ᅒ", "ᅒ", null],
  "ᅓ": ["ᅓ", "ᅓ", null],
  "ᅔ": ["ᅔ", "ᅔ", null],
  "ᅕ": ["ᅕ", "ᅕ", null],
  "ᅖ": ["ᅖ", "ᅖ", "ᇳ"],
  "ᅚ": ["ᅚ", "ᅚ", null],
  "ᅞ": ["ᅞ", "ᅞ", "ᇋ"],
  "ᅟ": ["ᅟ", "ᅟ", null],
  "ᇃ": ["ᇃ", null, "ᇃ"],
  "ᇄ": ["ᇄ", null, "ᇄ"],
  "ᇉ": ["ᇉ", null, "ᇉ"],
  "ᇏ": ["ᇏ", null, "ᇏ"],
  "ᇑ": ["ᇑ", null, "ᇑ"],
  "ᇒ": ["ᇒ", null, "ᇒ"],
  "ᇔ": ["ᇔ", null, "ᇔ"],
  "ꥫ": ["ꥫ", "ꥫ", "ᇕ"],
  "ᇖ": ["ᇖ", null, "ᇖ"],
  "ꥮ": ["ꥮ", "ꥮ", "ᇘ"],
  "ꥯ": ["ꥯ", "ꥯ", "ᇚ"],
  "ᇛ": ["ᇛ", null, "ᇛ"],
  "ᇞ": ["ᇞ", null, "ᇞ"],
  "ᇠ": ["ᇠ", null, "ᇠ"],
  "ᇡ": ["ᇡ", null, "ᇡ"],
  "ᇣ": ["ᇣ", null, "ᇣ"],
  "ꥴ": ["ꥴ", "ꥴ", "ᇥ"],
  "ᇭ": ["ᇭ", null, "ᇭ"],
  "ᇯ": ["ᇯ", null, "ᇯ"],
  "ᇵ": ["ᇵ", null, "ᇵ"],
  "ᇶ": ["ᇶ", null, "ᇶ"],
  "ᇷ": ["ᇷ", null, "ᇷ"],
  "ᇸ": ["ᇸ", null, "ᇸ"],
  "ᇺ": ["ᇺ", null, "ᇺ"],
  "ᇻ": ["ᇻ", null, "ᇻ"],
  "ᇼ": ["ᇼ", null, "ᇼ"],
  "ᇽ": ["ᇽ", null, "ᇽ"],
  "ᇾ": ["ᇾ", null, "ᇾ"],
  "ꥠ": ["ꥠ", "ꥠ", null],
  "ꥡ": ["ꥡ", "ꥡ", "ퟏ"],
  "ꥢ": ["ꥢ", "ꥢ", "ퟐ"],
  "ꥣ": ["ꥣ", "ꥣ", "ퟒ"],
  "ꥥ": ["ꥥ", "ꥥ", "ퟕ"],
  "ꥧ": ["ꥧ", "ꥧ", null],
  "ꥪ": ["ꥪ", "ꥪ", null],
  "ꥭ": ["ꥭ", "ꥭ", null],
  "ꥰ": ["ꥰ", "ꥰ", null],
  "ꥲ": ["ꥲ", "ꥲ", null],
  "ꥳ": ["ꥳ", "ꥳ", null],
  "ꥵ": ["ꥵ", "ꥵ", null],
  "ꥶ": ["ꥶ", "ꥶ", null],
  "ꥷ": ["ꥷ", "ꥷ", null],
  "ꥸ": ["ꥸ", "ꥸ", null],
  "ꥹ": ["ꥹ", "ꥹ", null],
  "ꥺ": ["ꥺ", "ꥺ", null],
  "ꥻ": ["ꥻ", "ꥻ", null],
  "ꥼ": ["ꥼ", "ꥼ", null],
  "ퟋ": ["ퟋ", null, "ퟋ"],
  "ퟌ": ["ퟌ", null, "ퟌ"],
  "ퟎ": ["ퟎ", null, "ퟎ"],
  "ퟑ": ["ퟑ", null, "ퟑ"],
  "ퟓ": ["ퟓ", null, "ퟓ"],
  "ퟔ": ["ퟔ", null, "ퟔ"],
  "ퟖ": ["ퟖ", null, "ퟖ"],
  "ퟗ": ["ퟗ", null, "ퟗ"],
  "ퟘ": ["ퟘ", null, "ퟘ"],
  "ퟙ": ["ퟙ", null, "ퟙ"],
  "ퟚ": ["ퟚ", null, "ퟚ"],
  "ퟛ": ["ퟛ", null, "ퟛ"],
  "ퟜ": ["ퟜ", null, "ퟜ"],
  "ퟞ": ["ퟞ", null, "ퟞ"],
  "ퟟ": ["ퟟ", null, "ퟟ"],
  "ퟠ": ["ퟠ", null, "ퟠ"],
  "ퟡ": ["ퟡ", null, "ퟡ"],
  "ퟢ": ["ퟢ", null, "ퟢ"],
  "ퟤ": ["ퟤ", null, "ퟤ"],
  "ퟥ": ["ퟥ", null, "ퟥ"],
  "ퟫ": ["ퟫ", null, "ퟫ"],
  "ퟬ": ["ퟬ", null, "ퟬ"],
  "ퟭ": ["ퟭ", null, "ퟭ"],
  "ퟮ": ["ퟮ", null, "ퟮ"],
  "ퟳ": ["ퟳ", null, "ퟳ"],
  "ퟴ": ["ퟴ", null, "ퟴ"],
  "ퟵ": ["ퟵ", null, "ퟵ"],
  "ퟶ": ["ퟶ", null, "ퟶ"],
  "ퟷ": ["ퟷ", null, "ퟷ"],
  "ퟸ": ["ퟸ", null, "ퟸ"],
  "ퟺ": ["ퟺ", null, "ퟺ"],
  "ퟻ": ["ퟻ", null, "ퟻ"],
};
// prettier-ignore
export const VOWEL_FORMS: {[key: string]: string[]} = {
  "ㅏ": ["ㅏ", "ᅡ"],
  "ㅐ": ["ㅐ", "ᅢ"],
  "ㅑ": ["ㅑ", "ᅣ"],
  "ㅒ": ["ㅒ", "ᅤ"],
  "ㅓ": ["ㅓ", "ᅥ"],
  "ㅔ": ["ㅔ", "ᅦ"],
  "ㅕ": ["ㅕ", "ᅧ"],
  "ㅖ": ["ㅖ", "ᅨ"],
  "ㅗ": ["ㅗ", "ᅩ"],
  "ㅘ": ["ㅘ", "ᅪ"],
  "ㅙ": ["ㅙ", "ᅫ"],
  "ㅚ": ["ㅚ", "ᅬ"],
  "ㅛ": ["ㅛ", "ᅭ"],
  "ㅜ": ["ㅜ", "ᅮ"],
  "ㅝ": ["ㅝ", "ᅯ"],
  "ㅞ": ["ㅞ", "ᅰ"],
  "ㅟ": ["ㅟ", "ᅱ"],
  "ㅠ": ["ㅠ", "ᅲ"],
  "ㅡ": ["ㅡ", "ᅳ"],
  "ㅢ": ["ㅢ", "ᅴ"],
  "ㅣ": ["ㅣ", "ᅵ"],
  "ㆇ": ["ㆇ", "ᆄ"],
  "ㆈ": ["ㆈ", "ᆅ"],
  "ㆉ": ["ㆉ", "ᆈ"],
  "ㆊ": ["ㆊ", "ᆑ"],
  "ㆋ": ["ㆋ", "ᆒ"],
  "ㆌ": ["ㆌ", "ᆔ"],
  "ㆍ": ["ㆍ", "ᆞ"],
  "ㆎ": ["ㆎ", "ᆡ"],
  "ᅶ": ["ᅶ", "ᅶ"],
  "ᅷ": ["ᅷ", "ᅷ"],
  "ᅸ": ["ᅸ", "ᅸ"],
  "ᅹ": ["ᅹ", "ᅹ"],
  "ᅺ": ["ᅺ", "ᅺ"],
  "ᅻ": ["ᅻ", "ᅻ"],
  "ᅼ": ["ᅼ", "ᅼ"],
  "ᅽ": ["ᅽ", "ᅽ"],
  "ᅾ": ["ᅾ", "ᅾ"],
  "ᅿ": ["ᅿ", "ᅿ"],
  "ᆀ": ["ᆀ", "ᆀ"],
  "ᆁ": ["ᆁ", "ᆁ"],
  "ᆂ": ["ᆂ", "ᆂ"],
  "ᆃ": ["ᆃ", "ᆃ"],
  "ᆆ": ["ᆆ", "ᆆ"],
  "ᆇ": ["ᆇ", "ᆇ"],
  "ᆉ": ["ᆉ", "ᆉ"],
  "ᆊ": ["ᆊ", "ᆊ"],
  "ᆋ": ["ᆋ", "ᆋ"],
  "ᆌ": ["ᆌ", "ᆌ"],
  "ᆍ": ["ᆍ", "ᆍ"],
  "ᆎ": ["ᆎ", "ᆎ"],
  "ᆏ": ["ᆏ", "ᆏ"],
  "ᆐ": ["ᆐ", "ᆐ"],
  "ᆓ": ["ᆓ", "ᆓ"],
  "ᆕ": ["ᆕ", "ᆕ"],
  "ᆖ": ["ᆖ", "ᆖ"],
  "ᆗ": ["ᆗ", "ᆗ"],
  "ᆘ": ["ᆘ", "ᆘ"],
  "ᆙ": ["ᆙ", "ᆙ"],
  "ᆚ": ["ᆚ", "ᆚ"],
  "ᆛ": ["ᆛ", "ᆛ"],
  "ᆜ": ["ᆜ", "ᆜ"],
  "ᆝ": ["ᆝ", "ᆝ"],
  "ᆟ": ["ᆟ", "ᆟ"],
  "ᆠ": ["ᆠ", "ᆠ"],
  "ᆢ": ["ᆢ", "ᆢ"],
  "ᆣ": ["ᆣ", "ᆣ"],
  "ᆤ": ["ᆤ", "ᆤ"],
  "ᆥ": ["ᆥ", "ᆥ"],
  "ᆦ": ["ᆦ", "ᆦ"],
  "ᆧ": ["ᆧ", "ᆧ"],
  "ힰ": ["ힰ", "ힰ"],
  "ힱ": ["ힱ", "ힱ"],
  "ힲ": ["ힲ", "ힲ"],
  "ힳ": ["ힳ", "ힳ"],
  "ힴ": ["ힴ", "ힴ"],
  "ힵ": ["ힵ", "ힵ"],
  "ힶ": ["ힶ", "ힶ"],
  "ힷ": ["ힷ", "ힷ"],
  "ힸ": ["ힸ", "ힸ"],
  "ힹ": ["ힹ", "ힹ"],
  "ힺ": ["ힺ", "ힺ"],
  "ힻ": ["ힻ", "ힻ"],
  "ힼ": ["ힼ", "ힼ"],
  "ힽ": ["ힽ", "ힽ"],
  "ힾ": ["ힾ", "ힾ"],
  "ힿ": ["ힿ", "ힿ"],
  "ퟀ": ["ퟀ", "ퟀ"],
  "ퟁ": ["ퟁ", "ퟁ"],
  "ퟂ": ["ퟂ", "ퟂ"],
  "ퟃ": ["ퟃ", "ퟃ"],
  "ퟄ": ["ퟄ", "ퟄ"],
  "ퟅ": ["ퟅ", "ퟅ"],
  "ퟆ": ["ퟆ", "ퟆ"],
}
// prettier-ignore
export const HANGUL_COMPOSITIONS: {[key: string]: string} = {
  "ㅃㅇ": "ㅹ",
  "ㄱㄱ": "ㄲ",
  "ㄱㅅ": "ㄳ",
  "ㄴㅈ": "ㄵ",
  "ㄴㅎ": "ㄶ",
  "ㄷㄷ": "ㄸ",
  "ㄹㄱ": "ㄺ",
  "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ",
  "ㄹㅅ": "ㄽ",
  "ㄹㅌ": "ㄾ",
  "ㄹㅍ": "ㄿ",
  "ㄹㅎ": "ㅀ",
  "ㅂㅂ": "ㅃ",
  "ㅂㅅ": "ㅄ",
  "ㅅㅅ": "ㅆ",
  "ㅈㅈ": "ㅉ",
  "ㅗㅏ": "ㅘ",
  "ㅗㅐ": "ㅙ",
  "ㅗㅣ": "ㅚ",
  "ㅜㅓ": "ㅝ",
  "ㅜㅔ": "ㅞ",
  "ㅜㅣ": "ㅟ",
  "ㅡㅣ": "ㅢ",
  "ㄴㄴ": "ㅥ",
  "ㄴㄷ": "ㅦ",
  "ㄴㅅ": "ㅧ",
  "ㄴㅿ": "ㅨ",
  "ㄹㄱㅅ": "ㅩ",
  "ㄹㄷ": "ㅪ",
  "ㄹㅂㅅ": "ㅫ",
  "ㄹㅿ": "ㅬ",
  "ㄹㆆ": "ㅭ",
  "ㅁㅂ": "ㅮ",
  "ㅁㅅ": "ㅯ",
  "ㅁㅿ": "ㅰ",
  "ㅁㅇ": "ㅱ",
  "ㅂㄱ": "ㅲ",
  "ㅂㄷ": "ㅳ",
  "ㅂㅅㄱ": "ㅴ",
  "ㅂㅅㄷ": "ㅵ",
  "ㅂㅈ": "ㅶ",
  "ㅂㅌ": "ㅷ",
  "ㅂㅇ": "ㅸ",
  "ㅂㅂㅇ": "ㅹ",
  "ㅅㄱ": "ㅺ",
  "ㅅㄴ": "ㅻ",
  "ㅅㄷ": "ㅼ",
  "ㅅㅂ": "ㅽ",
  "ㅅㅈ": "ㅾ",
  "ㅇㅇ": "ㆀ",
  "ㆁㆁ": "ᇮ",
  "ㆁㅅ": "ㆂ",
  "ㆁㅿ": "ㆃ",
  "ㅍㅇ": "ㆄ",
  "ㅎㅎ": "ㆅ",
  "ㅛㅑ": "ㆇ",
  "ㅛㅒ": "ㆈ",
  "ㅛㅣ": "ㆉ",
  "ㅠㅕ": "ㆊ",
  "ㅠㅖ": "ㆋ",
  "ㅠㅣ": "ㆌ",
  "ㆍㅣ": "ㆎ",
  "ㄴㄱ": "ᄓ",
  "ㄴㅂ": "ᄖ",
  "ㄷㄱ": "ᄗ",
  "ㄹㄴ": "ᄘ",
  "ㄹㄹ": "ᄙ",
  "ㄹㅇ": "ᄛ",
  "ㅂㄴ": "ᄟ",
  "ㅂㅅㅂ": "ᄤ",
  "ㅂㅅㅅ": "ᄥ",
  "ㅂㅅㅈ": "ᄦ",
  "ㅂㅊ": "ᄨ",
  "ㅂㅍ": "ᄪ",
  "ㅅㄹ": "ᄰ",
  "ㅅㅁ": "ᄱ",
  "ㅅㅂㄱ": "ᄳ",
  "ㅅㅅㅅ": "ᄴ",
  "ㅅㅇ": "ᄵ",
  "ㅅㅊ": "ᄷ",
  "ㅅㅋ": "ᄸ",
  "ㅅㅌ": "ᄹ",
  "ㅅㅍ": "ᄺ",
  "ㅅㅎ": "ᄻ",
  "ᄼᄼ": "ᄽ",
  "ᄾᄾ": "ᄿ",
  "ㅇㄱ": "ᅁ",
  "ㆁㄱ": "ᇬ",
  "ㅇㄷ": "ᅂ",
  "ㅇㅁ": "ᅃ",
  "ㅇㅂ": "ᅄ",
  "ㅇㅅ": "ᅅ",
  "ㅇㅿ": "ᅆ",
  "ㅇㅈ": "ᅈ",
  "ㅇㅊ": "ᅉ",
  "ㅇㅌ": "ᅊ",
  "ㅇㅍ": "ᅋ",
  "ㅈㅇ": "ᅍ",
  "ᅎᅎ": "ᅏ",
  "ㅊㅋ": "ᅒ",
  "ㅊㅎ": "ᅓ",
  "ㅍㅂ": "ᅖ",
  "ㄱㄷ": "ᅚ",
  "ㄷㄹ": "ᅞ",
  "ㅏㅗ": "ᅶ",
  "ㅏㅜ": "ᅷ",
  "ㅑㅗ": "ᅸ",
  "ㅑㅛ": "ᅹ",
  "ㅓㅗ": "ᅺ",
  "ㅓㅜ": "ᅻ",
  "ㅓㅡ": "ᅼ",
  "ㅕㅗ": "ᅽ",
  "ㅕㅜ": "ᅾ",
  "ㅗㅓ": "ᅿ",
  "ㅗㅔ": "ᆀ",
  "ㅗㅖ": "ᆁ",
  "ㅗㅗ": "ᆂ",
  "ㅗㅜ": "ᆃ",
  "ㅛㅕ": "ᆆ",
  "ㅛㅗ": "ᆇ",
  "ㅜㅏ": "ᆉ",
  "ㅜㅐ": "ᆊ",
  "ㅜㅓㅡ": "ᆋ",
  "ㅜㅖ": "ᆌ",
  "ㅜㅜ": "ᆍ",
  "ㅠㅏ": "ᆎ",
  "ㅠㅓ": "ᆏ",
  "ㅠㅔ": "ᆐ",
  "ㅠㅜ": "ᆓ",
  "ㅡㅜ": "ᆕ",
  "ㅡㅡ": "ᆖ",
  "ㅡㅣㅜ": "ᆗ",
  "ㅣㅏ": "ᆘ",
  "ㅣㅑ": "ᆙ",
  "ㅣㅗ": "ᆚ",
  "ㅣㅜ": "ᆛ",
  "ㅣㅡ": "ᆜ",
  "ㅣㆍ": "ᆝ",
  "ㆍㅓ": "ᆟ",
  "ㆍㅜ": "ᆠ",
  "ㆍㆍ": "ᆢ",
  "ㅏㅡ": "ᆣ",
  "ㅑㅜ": "ᆤ",
  "ㅕㅑ": "ᆥ",
  "ㅗㅑ": "ᆦ",
  "ㅗㅒ": "ᆧ",
  "ㄱㄹ": "ᇃ",
  "ㄱㅅㄱ": "ᇄ",
  "ㄴㅌ": "ᇉ",
  "ㄹㄷㅎ": "ᇏ",
  "ㄹㅁㄱ": "ᇑ",
  "ㄹㅁㅅ": "ᇒ",
  "ㄹㅂㅎ": "ᇔ",
  "ㄹㅂㅇ": "ꥫ",
  "ㄹㅅㅅ": "ᇖ",
  "ㄹㅋ": "ꥮ",
  "ㅁㄱ": "ꥯ",
  "ㅁㄹ": "ᇛ",
  "ㅁㅅㅅ": "ᇞ",
  "ㅁㅊ": "ᇠ",
  "ㅁㅎ": "ᇡ",
  "ㅂㄹ": "ᇣ",
  "ㅂㅎ": "ꥴ",
  "ㆁㄱㄱ": "ᇭ",
  "ㆁㅋ": "ᇯ",
  "ㅎㄴ": "ᇵ",
  "ㅎㄹ": "ᇶ",
  "ㅎㅁ": "ᇷ",
  "ㅎㅂ": "ᇸ",
  "ㄱㄴ": "ᇺ",
  "ㄱㅂ": "ᇻ",
  "ㄱㅊ": "ᇼ",
  "ㄱㅋ": "ᇽ",
  "ㄱㅎ": "ᇾ",
  "ㄷㅁ": "ꥠ",
  "ㄷㅂ": "ꥡ",
  "ㄷㅅ": "ꥢ",
  "ㄷㅈ": "ꥣ",
  "ㄹㄱㄱ": "ꥥ",
  "ㄹㄷㄷ": "ꥧ",
  "ㄹㅂㅂ": "ꥪ",
  "ㄹㅈ": "ꥭ",
  "ㅁㄷ": "ꥰ",
  "ㅂㅅㅌ": "ꥲ",
  "ㅂㅋ": "ꥳ",
  "ㅅㅅㅂ": "ꥵ",
  "ㅇㄹ": "ꥶ",
  "ㅇㅎ": "ꥷ",
  "ㅈㅈㅎ": "ꥸ",
  "ㅌㅌ": "ꥹ",
  "ㅍㅎ": "ꥺ",
  "ㅎㅅ": "ꥻ",
  "ㆆㆆ": "ꥼ",
  "ㅗㅕ": "ힰ",
  "ㅗㅗㅣ": "ힱ",
  "ㅛㅏ": "ힲ",
  "ㅛㅐ": "ힳ",
  "ㅛㅓ": "ힴ",
  "ㅜㅕ": "ힵ",
  "ㅜㅣㅣ": "ힶ",
  "ㅠㅐ": "ힷ",
  "ㅠㅗ": "ힸ",
  "ㅡㅏ": "ힹ",
  "ㅡㅓ": "ힺ",
  "ㅡㅔ": "ힻ",
  "ㅡㅗ": "ힼ",
  "ㅣㅑㅗ": "ힽ",
  "ㅣㅒ": "ힾ",
  "ㅣㅕ": "ힿ",
  "ㅣㅖ": "ퟀ",
  "ㅣㅗㅣ": "ퟁ",
  "ㅣㅛ": "ퟂ",
  "ㅣㅠ": "ퟃ",
  "ㅣㅣ": "ퟄ",
  "ㆍㅏ": "ퟅ",
  "ㆍㅔ": "ퟆ",
  "ㄴㄹ": "ퟋ",
  "ㄴㅊ": "ퟌ",
  "ㄷㄷㅂ": "ퟎ",
  "ㄷㅅㄱ": "ퟑ",
  "ㄷㅊ": "ퟓ",
  "ㄷㅌ": "ퟔ",
  "ㄹㄱㅎ": "ퟖ",
  "ㄹㄹㅋ": "ퟗ",
  "ㄹㅁㅎ": "ퟘ",
  "ㄹㅂㄷ": "ퟙ",
  "ㄹㅂㅍ": "ퟚ",
  "ㄹㆁ": "ퟛ",
  "ㄹㆆㅎ": "ퟜ",
  "ㅁㄴ": "ퟞ",
  "ㅁㄴㄴ": "ퟟ",
  "ㅁㅁ": "ퟠ",
  "ㅁㅂㅅ": "ퟡ",
  "ㅁㅈ": "ퟢ",
  "ㅂㄹㅍ": "ퟤ",
  "ㅂㅁ": "ퟥ",
  "ㅅㅂㅇ": "ퟫ",
  "ㅅㅅㄱ": "ퟬ",
  "ㅅㅅㄷ": "ퟭ",
  "ㅅㅿ": "ퟮ",
  "ㅿㅂ": "ퟳ",
  "ㅿㅂㅇ": "ퟴ",
  "ㆁㅁ": "ퟵ",
  "ㆁㅎ": "ퟶ",
  "ㅈㅂ": "ퟷ",
  "ㅈㅂㅂ": "ퟸ",
  "ㅍㅅ": "ퟺ",
  "ㅍㅌ": "ퟻ",
}

export const YALE_TO_HANGUL_CONSONANTS: { [key: string]: string } = {
  k: "ㄱ",
  n: "ㄴ",
  t: "ㄷ",
  l: "ㄹ",
  m: "ㅁ",
  p: "ㅂ",
  s: "ㅅ",
  G: "ㅇ",
  c: "ㅈ",
  ch: "ㅊ",
  kh: "ㅋ",
  th: "ㅌ",
  ph: "ㅍ",
  h: "ㅎ",

  v: "ㅱ",
  f: "ㅸ",
  fh: "ㆄ",
  z: "ㅿ",
  q: "ㆆ",
  ng: "ㆁ",

  "s/": "ᄼ",
  "c/": "ᅎ",
  "ch/": "ᅔ",

  "s\\": "ᄾ",
  "c\\": "ᅐ",
  "ch\\": "ᅕ",

  "`": "\u115f",
};
export const YALE_TO_HANGUL_VOWELS: { [key: string]: string } = {
  a: "ㅏ",
  ay: "ㅐ",
  ya: "ㅑ",
  yay: "ㅒ",
  e: "ㅓ",
  ey: "ㅔ",
  ye: "ㅕ",
  yey: "ㅖ",
  wo: "ㅗ",
  wa: "ㅘ",
  way: "ㅙ",
  woy: "ㅚ",
  ywo: "ㅛ",
  wu: "ㅜ",
  we: "ㅝ",
  wey: "ㅞ",
  wuy: "ㅟ",
  ywu: "ㅠ",
  u: "ㅡ",
  uy: "ㅢ",
  i: "ㅣ",

  o: "ㆍ",
  oy: "ㆎ",
  ywoy: "ㆉ",
  ywuy: "ㆌ",
  ywe: "ㆊ",
  ywey: "ㆋ",
  ywa: "ㆇ",
  yway: "ㆈ",
};
export const YALE_TO_HANGUL_TONE_MARKS: { [key: string]: string } = {
  L: "",
  H: "\u302e",
  R: "\u302f",
};

export function getLeadingChar(string: string): string | null {
  if (
    Object.hasOwn(CONSONANT_FORMS, string) &&
    CONSONANT_FORMS[string][1] !== null
  ) {
    return CONSONANT_FORMS[string][1];
  }
  return null;
}

export function getVowelChar(string: string): string | null {
  if (Object.hasOwn(VOWEL_FORMS, string) && VOWEL_FORMS[string][1] !== null) {
    return VOWEL_FORMS[string][1];
  }
  return null;
}

export function getTrailingChar(string: string): string | null {
  if (
    Object.hasOwn(CONSONANT_FORMS, string) &&
    CONSONANT_FORMS[string][2] !== null
  ) {
    return CONSONANT_FORMS[string][2];
  }
  return null;
}

export function composeLetters(string: string): string | null {
  if (Object.hasOwn(HANGUL_COMPOSITIONS, string)) {
    return HANGUL_COMPOSITIONS[string];
  }
  return null;
}

const TO_COMPAT: Map<string, string> = (() => {
  const result = new Map<string, string>();
  for (const forms of Object.values(CONSONANT_FORMS)) {
    if (forms[1] !== null && forms[0] !== null) {
      result.set(forms[1], forms[0]);
    }
    if (forms[2] !== null && forms[0] !== null) {
      result.set(forms[2], forms[0]);
    }
  }
  for (const forms of Object.values(VOWEL_FORMS)) {
    result.set(forms[1], forms[0]);
  }
  return result;
})();
export function toCompat(string: string): string {
  return TO_COMPAT.get(string)!;
}

const LEADING_JAMOS: Set<string> = new Set<string>(
  Object.values(CONSONANT_FORMS)
    .map((forms) => forms[1])
    .filter((form) => form !== null),
);
export function isLeadingJamo(string: string): boolean {
  return LEADING_JAMOS.has(string);
}

const TRAILING_JAMOS: Set<string> = new Set<string>(
  Object.values(CONSONANT_FORMS)
    .map((forms) => forms[2])
    .filter((form) => form !== null),
);
export function isTrailingJamo(string: string): boolean {
  return TRAILING_JAMOS.has(string);
}

// Same as NFC, but don't partially precompose syllables
// (e.g. k / a / f -> ka / f)
export function convertToPrecomposed(
  string: string,
  mapping: Mapping,
): [string, Mapping] {
  const modernLeading = LEADING_JAMOS.values()
    .toArray()
    .filter(
      (ch) => 0x1100 <= ch.codePointAt(0)! && ch.codePointAt(0)! <= 0x1112,
    )
    .map(escapeStringRegexp)
    .join("|");
  const modernTrailing = TRAILING_JAMOS.values()
    .toArray()
    .filter(
      (ch) => 0x11a8 <= ch.codePointAt(0)! && ch.codePointAt(0)! <= 0x11c2,
    )
    .map(escapeStringRegexp)
    .join("|");
  const nonModernTrailing = TRAILING_JAMOS.values()
    .toArray()
    .filter(
      (ch) => !(0x11a8 <= ch.codePointAt(0)! && ch.codePointAt(0)! <= 0x11c2),
    )
    .map(escapeStringRegexp)
    .join("|");
  const modernVowelJamos = Object.values(VOWEL_FORMS)
    .map((forms) => forms[1])
    .filter((ch) => ch !== null)
    .filter(
      (ch) => 0x1161 <= ch.codePointAt(0)! && ch.codePointAt(0)! <= 0x1175,
    )
    .map(escapeStringRegexp)
    .join("|");
  const modernSyllable = new RegExp(
    `(${modernLeading})(${modernVowelJamos})((?:${modernTrailing})|(?!${nonModernTrailing}))`,
    "g",
  );

  function convert(match: string): string {
    return match.normalize("NFC");
  }

  return replaceAndMap(string, modernSyllable, convert, mapping);
}

export const ORPHAN_REGEX = (() => {
  const compatConsonants =
    "(?:" +
    Object.keys(CONSONANT_FORMS)
      .filter((ch) =>
        UnicodeNames.get(ch.codePointAt(0)!)!.includes("HANGUL LETTER"),
      )
      .map(escapeStringRegexp)
      .join("|") +
    ")";
  const compatVowels =
    "(?:" +
    Object.keys(VOWEL_FORMS)
      .filter((ch) =>
        UnicodeNames.get(ch.codePointAt(0)!)!.includes("HANGUL LETTER"),
      )
      .map(escapeStringRegexp)
      .join("|") +
    ")";
  const leadingJamos =
    "(?:" +
    LEADING_JAMOS.values().toArray().map(escapeStringRegexp).join("|") +
    ")";
  const trailingJamos =
    "(?:" +
    TRAILING_JAMOS.values().toArray().map(escapeStringRegexp).join("|") +
    ")";
  const vowelJamos =
    "(?:" +
    Object.values(VOWEL_FORMS)
      .map((forms) => forms[1])
      .filter((ch) => ch !== null)
      .map(escapeStringRegexp)
      .join("|") +
    ")";
  const compatLetters = `(?:${compatConsonants}|${compatVowels})`;
  const leadingJamosWithoutVowels = `(?:${leadingJamos}(?!${vowelJamos}))`;
  const trailingJamosWithoutVowels = `(?:(?<!${vowelJamos})${trailingJamos})`;
  const vowelJamosWithoutLeading = `(?:(?:(?<!${leadingJamos})|\u115f)${vowelJamos})`;
  return [
    compatLetters,
    leadingJamosWithoutVowels,
    trailingJamosWithoutVowels,
    vowelJamosWithoutLeading,
  ].join("|");
})();
