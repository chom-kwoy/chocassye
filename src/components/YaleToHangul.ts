import {
  COMPAT_VOWELS_RE,
  H2Y,
  H2Y_INITIALS,
  H2Y_VOWELS,
  INDEP_CONS_RE,
  MODERN_HANGUL_SYLLABLE_REGEX,
  TO_COMPAT,
  Y2H_CONSONANTS,
  Y2H_FINALS,
  Y2H_INITIALS,
  Y2H_TONE_MARKS,
  Y2H_VOWELS,
  YALE_CONSONANTS_RE,
  YALE_VOWELS_RE,
} from "@/components/hangulData";
import { Span, replace_and_map } from "@/components/mappingUtils";

import { PUA_CONV_TABLE } from "./PuaToUni";

export function normalize_string(string: string): string {
  string = string.replaceAll(COMPAT_VOWELS_RE, function (ch) {
    return "ᅟ" + ch;
  });

  string = string.normalize("NFKD");

  let conv_string = "";
  for (const ch of string) {
    if (Object.hasOwn(PUA_CONV_TABLE, ch)) {
      conv_string += PUA_CONV_TABLE[ch];
    } else {
      conv_string += ch;
    }
  }
  return conv_string;
}

export type YaleToHangulResult = {
  result: string;
  mapping: Span[];
};

export function yale_to_hangul(
  string: string,
  get_index_map: true,
): YaleToHangulResult;
export function yale_to_hangul(string: string, get_index_map?: false): string;
export function yale_to_hangul(
  string: string,
  get_index_map = false,
): string | YaleToHangulResult {
  string = normalize_string(string);

  const splits = string.split(YALE_VOWELS_RE);

  let result = "";

  let split_idx = 0;
  let input_idx = 0;
  let syllable_begin_pos = 0;

  const index_map: number[] = new Array(string.length);

  for (const split of splits) {
    if (split.match(YALE_VOWELS_RE)) {
      // Vowel
      result += Y2H_VOWELS[split];

      for (let i = 0; i < split.length; ++i) {
        index_map[input_idx + i] = syllable_begin_pos;
      }
    } else {
      // Consonant cluster
      let max_prefix_len = Math.min(3, split.length - 1);
      if (split_idx === 0) {
        max_prefix_len = 0;
      } else if (split_idx === splits.length - 1) {
        max_prefix_len = Math.min(3, split.length);
      }

      let remaining = split;

      let prefix_len = max_prefix_len;
      let prefix = "";
      for (; prefix_len >= 1; --prefix_len) {
        const part = remaining.slice(0, prefix_len);
        if (Object.hasOwn(Y2H_FINALS, part)) {
          prefix = Y2H_FINALS[part];
          remaining = remaining.slice(prefix_len);
          break;
        }
      }

      let tone_mark = "";
      if (remaining.length > 0 && ["L", "H", "R"].includes(remaining[0])) {
        tone_mark = Y2H_TONE_MARKS[remaining[0]];
        remaining = remaining.slice(1);
        prefix_len += 1;
      }

      let found_suffix = false;
      let suffix_len = Math.min(3, remaining.length);
      let suffix = "";
      for (; suffix_len >= 1; --suffix_len) {
        const part = remaining.slice(remaining.length - suffix_len);
        if (Object.hasOwn(Y2H_INITIALS, part)) {
          remaining = remaining.slice(0, remaining.length - suffix_len);
          suffix = Y2H_INITIALS[part];
          found_suffix = true;
          break;
        }
      }

      // Add choseong filler
      if (split_idx !== splits.length - 1 && !found_suffix) {
        suffix = "ᅟ";
      }

      // Make index mapping
      // Prefix belongs to current syllable
      for (let i = 0; i < prefix_len; ++i) {
        index_map[input_idx + i] = syllable_begin_pos;
      }

      syllable_begin_pos = result.length + prefix.length + tone_mark.length;

      let i = prefix_len;
      let middle_part_output = "";
      for (const part of remaining.split(".")) {
        const cons_re = new RegExp(YALE_CONSONANTS_RE.source, "g");

        let match: RegExpExecArray | null;
        let last_idx = 0;
        while ((match = cons_re.exec(part)) !== null) {
          const start = match.index;
          const end = cons_re.lastIndex;
          if (last_idx < end) {
            if (last_idx < start) {
              const piece = part.slice(last_idx, start);
              for (let j = i; j < i + piece.length; ++j) {
                index_map[input_idx + j] = syllable_begin_pos;
                syllable_begin_pos += 1;
              }
              middle_part_output += piece;
              i += piece.length;
            }
            if (start < end) {
              const piece = match[0];
              for (let j = i; j < i + piece.length; ++j) {
                index_map[input_idx + j] = syllable_begin_pos;
              }
              middle_part_output += Y2H_CONSONANTS[piece];
              syllable_begin_pos += 1;
              i += piece.length;
            }
            last_idx = end;
          }
        }
        if (last_idx < part.length) {
          const piece = part.slice(last_idx);
          for (let j = i; j < i + piece.length; ++j) {
            index_map[input_idx + j] = syllable_begin_pos;
            syllable_begin_pos += 1;
          }
          middle_part_output += piece;
          i += piece.length;
        }

        // '.'
        index_map[input_idx + i] = syllable_begin_pos;
        i += 1;
      }

      const output = prefix + tone_mark + middle_part_output + suffix;

      // Suffix belongs to next syllable
      for (let i = split.length - suffix_len; i < split.length; ++i) {
        index_map[input_idx + i] = syllable_begin_pos;
      }

      result += output;
    }

    split_idx++;
    input_idx += split.length;
  }

  // Next index
  const to_next_index: Record<number, number> = {};
  let last_output_index = 0;
  for (let i = 0; i < string.length; ++i) {
    if (last_output_index !== index_map[i]) {
      to_next_index[last_output_index] = index_map[i];
      last_output_index = index_map[i];
    }
  }
  to_next_index[last_output_index] = result.length;

  let mapping: Span[] = new Array(string.length);
  for (let i = 0; i < string.length; ++i) {
    mapping[i] = [index_map[i], to_next_index[index_map[i]]];
  }

  // replace freestanding consonants with compatibility forms
  result = result.replaceAll(INDEP_CONS_RE, (_, p1: string) => {
    if (Object.hasOwn(TO_COMPAT, p1)) {
      return TO_COMPAT[p1];
    }
    return p1;
  });

  // replace modern hangul syllables with precomposed forms
  // for copy-paste compatibility with Microsoft products
  [result, mapping] = replace_and_map(
    result,
    MODERN_HANGUL_SYLLABLE_REGEX,
    (match) => match.normalize("NFC"),
    mapping,
  );

  if (get_index_map) {
    return {
      result: result,
      mapping: mapping,
    };
  }

  return result;
}

export function hangul_to_yale(string: string, tone_all = false): string {
  let result = "";
  let wasHangul = false;
  let hadTone = false;
  let hadVowel = false;

  string = normalize_string(string);

  for (const ch of string) {
    if (Object.hasOwn(H2Y, ch)) {
      if (wasHangul && Object.hasOwn(H2Y_INITIALS, ch)) {
        if (tone_all && !hadTone) {
          result += "L";
        }
        result += ".";
        hadVowel = false;
      }
      hadTone = ch === "〮" || ch === "〯";
      if (Object.hasOwn(H2Y_VOWELS, ch)) {
        hadVowel = true;
      }

      if (!hadTone || (tone_all && hadTone)) {
        result += H2Y[ch];
      }
      wasHangul = true;
    } else {
      if (tone_all && wasHangul && !hadTone && hadVowel) {
        result += "L";
      }
      result += ch;
      wasHangul = false;
      hadVowel = false;
    }
  }

  if (tone_all && wasHangul && !hadTone) {
    result += "L";
  }

  return result;
}
