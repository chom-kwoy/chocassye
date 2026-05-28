import {
  COMPAT_VOWELS_RE,
  CONS_RE,
  HANGUL_TO_YALE,
  INDEP_CONS_RE,
  INITIAL_HANGUL_TO_YALE,
  TO_COMPATIBILITY_FORM,
  VOWELS_RE,
  VOWEL_HANGUL_TO_YALE,
  YALE_TO_HANGUL_CONSONANTS,
  YALE_TO_HANGUL_FINAL_CONSONANTS,
  YALE_TO_HANGUL_INITIAL_CONSONANTS,
  YALE_TO_HANGUL_TONE_MARKS,
  YALE_TO_HANGUL_VOWELS,
} from "@/components/hangulData";

import { PUA_CONV_TABLE } from "./PuaToUni.js";

export function normalize_string(string: string): string {
  string = string.replace(COMPAT_VOWELS_RE, function (ch) {
    return "ᅟ" + ch;
  });

  string = string.normalize("NFKD");

  let conv_string = "";
  for (const ch of string) {
    if (Object.prototype.hasOwnProperty.call(PUA_CONV_TABLE, ch)) {
      conv_string += PUA_CONV_TABLE[ch];
    } else {
      conv_string += ch;
    }
  }
  return conv_string;
}

export type YaleToHangulResult = {
  result: string;
  mapping: [number, number][];
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

  const splits = string.split(VOWELS_RE);

  let result = "";

  let split_idx = 0;
  let input_idx = 0;
  let syllable_begin_pos = 0;

  const index_map: number[] = new Array(string.length);

  for (const split of splits) {
    if (split.match(VOWELS_RE)) {
      // Vowel
      result += YALE_TO_HANGUL_VOWELS[split];

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
        if (
          Object.prototype.hasOwnProperty.call(
            YALE_TO_HANGUL_FINAL_CONSONANTS,
            part,
          )
        ) {
          prefix = YALE_TO_HANGUL_FINAL_CONSONANTS[part];
          remaining = remaining.slice(prefix_len);
          break;
        }
      }

      let tone_mark = "";
      if (remaining.length > 0 && ["L", "H", "R"].includes(remaining[0])) {
        tone_mark = YALE_TO_HANGUL_TONE_MARKS[remaining[0]];
        remaining = remaining.slice(1);
        prefix_len += 1;
      }

      let found_suffix = false;
      let suffix_len = Math.min(3, remaining.length);
      let suffix = "";
      for (; suffix_len >= 1; --suffix_len) {
        const part = remaining.slice(remaining.length - suffix_len);
        if (
          Object.prototype.hasOwnProperty.call(
            YALE_TO_HANGUL_INITIAL_CONSONANTS,
            part,
          )
        ) {
          remaining = remaining.slice(0, remaining.length - suffix_len);
          suffix = YALE_TO_HANGUL_INITIAL_CONSONANTS[part];
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
        const cons_re = new RegExp(CONS_RE.source, "g");

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
              middle_part_output += YALE_TO_HANGUL_CONSONANTS[piece];
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

  const mapping: [number, number][] = new Array(string.length);
  for (let i = 0; i < string.length; ++i) {
    mapping[i] = [index_map[i], to_next_index[index_map[i]]];
  }

  // replace freestanding consonants with compatibility forms
  result = result.replace(INDEP_CONS_RE, (_, p1: string) => {
    if (Object.prototype.hasOwnProperty.call(TO_COMPATIBILITY_FORM, p1)) {
      return TO_COMPATIBILITY_FORM[p1];
    }
    return p1;
  });

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
    if (Object.prototype.hasOwnProperty.call(HANGUL_TO_YALE, ch)) {
      if (
        wasHangul &&
        Object.prototype.hasOwnProperty.call(INITIAL_HANGUL_TO_YALE, ch)
      ) {
        if (tone_all && !hadTone) {
          result += "L";
        }
        result += ".";
        hadVowel = false;
      }
      hadTone = ch === "〮" || ch === "〯";
      if (Object.prototype.hasOwnProperty.call(VOWEL_HANGUL_TO_YALE, ch)) {
        hadVowel = true;
      }

      if (!hadTone || (tone_all && hadTone)) {
        result += HANGUL_TO_YALE[ch];
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
