import escapeStringRegexp from "escape-string-regexp";

import {
  CONSONANT_FORMS,
  VOWEL_FORMS,
  YALE_TO_HANGUL_CONSONANTS,
  YALE_TO_HANGUL_TONE_MARKS,
  YALE_TO_HANGUL_VOWELS,
  composeLetters,
  getLeadingChar,
  getTrailingChar,
  getVowelChar,
  isLeadingJamo,
  isTrailingJamo,
  toCompat,
} from "@/components/HangulData";

import { PUA_CONV_TABLE } from "./PuaToUni";

// Tokenizes romanized string into hangul letters
// e.g. chwoti -> ch wo t i -> ㅊㅗㄷㅣ
export function yaleTokenize(string: string): string {
  const fullMap = {
    ...YALE_TO_HANGUL_CONSONANTS,
    ...YALE_TO_HANGUL_VOWELS,
    ...YALE_TO_HANGUL_TONE_MARKS,
  };
  const list = Object.entries(fullMap);
  // sort list by decreasing length of first component of each item
  list.sort((a, b) => b[0].length - a[0].length);
  const regexStr = list.map((x) => escapeStringRegexp(x[0])).join("|");
  const regex = new RegExp(regexStr, "g");
  return string.replaceAll(regex, (match) => fullMap[match]);
}

const COMPAT_VOWELS_RE =
  /[ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣㆇㆈㆉㆊㆋㆌㆍㆎ]/;

export function normalize_string(string: string): string {
  string = string.replace(COMPAT_VOWELS_RE, function (ch) {
    return "\u115f" + ch;
  });

  string = string.normalize("NFKD");

  let conv_string = "";
  for (const ch of string) {
    if (PUA_CONV_TABLE.hasOwnProperty(ch)) {
      conv_string += PUA_CONV_TABLE[ch];
    } else {
      conv_string += ch;
    }
  }
  return conv_string;
}

type State = "empty" | "leading" | "vowel" | "trailing";

class StateMachine {
  output: string = "";
  curState: State = "empty";
  curPartial: string = "";

  checkIfCommittable(composed: string, state: State): boolean {
    if (state === "leading") {
      if (getLeadingChar(composed) !== null) {
        return true; // not done yet
      }
    } else if (state === "vowel") {
      if (getVowelChar(composed) !== null) {
        return true; // not done yet
      }
    } else if (state === "trailing") {
      if (getTrailingChar(composed) !== null) {
        return true; // not done yet
      }
    }
    return false;
  }

  commitPartialIfDone(): boolean {
    if (this.curPartial.length <= 1 || this.curState === "empty") {
      return false;
    }

    const composed = composeLetters(this.curPartial);
    if (composed !== null && this.checkIfCommittable(composed, this.curState)) {
      return false;
    }

    return this.commitPartial();
  }

  commitPartial(): boolean {
    if (this.curPartial.length === 0 || this.curState === "empty") {
      return false;
    }

    for (let l = this.curPartial.length; l > 0; --l) {
      let composed: string | null = this.curPartial.substring(0, l);
      if (l > 1) {
        composed = composeLetters(this.curPartial.substring(0, l));
      }
      if (
        composed !== null &&
        this.checkIfCommittable(composed, this.curState)
      ) {
        if (this.curState === "leading") {
          this.output += getLeadingChar(composed);
          this.curState = "vowel";
        } else if (this.curState === "vowel") {
          this.output += getVowelChar(composed);
          this.curState = "trailing";
        } else if (this.curState === "trailing") {
          this.output += getTrailingChar(composed);
          this.curState = "leading";
        }

        this.curPartial = this.curPartial.substring(l);
        return true;
      }
    }
    return true;
  }

  run(composingText: string): string {
    for (const ch of composingText) {
      switch (this.curState) {
        case "empty":
          if (Object.hasOwn(CONSONANT_FORMS, ch)) {
            this.curPartial += ch;
            this.curState = "leading";
          } else if (Object.hasOwn(VOWEL_FORMS, ch)) {
            this.output += "\u115f"; // hangul choseong filler
            this.curPartial += ch;
            this.curState = "vowel";
          }
          this.commitPartialIfDone();
          break;
        case "leading":
          if (Object.hasOwn(CONSONANT_FORMS, ch)) {
            this.curPartial += ch;

            if (this.commitPartialIfDone() && this.curPartial.length > 0) {
              const compat = toCompat(
                this.output.substring(this.output.length - 1),
              );
              this.output = this.output.substring(0, this.output.length - 1);
              this.output += compat;
              this.curState = "leading";
            }
          } else if (Object.hasOwn(VOWEL_FORMS, ch)) {
            this.commitPartial();
            this.curPartial += ch;
            this.curState = "vowel";
            this.commitPartialIfDone();
          }
          break;
        case "vowel":
          if (Object.hasOwn(VOWEL_FORMS, ch)) {
            this.curPartial += ch;
            if (this.commitPartialIfDone() && this.curPartial.length > 0) {
              this.output += "\u115f"; // hangul choseong filler
              this.curState = "vowel";
            }
          } else if (Object.hasOwn(CONSONANT_FORMS, ch)) {
            this.commitPartial();
            this.curPartial += ch;
            this.curState = "trailing";
            this.commitPartialIfDone();
          }
          break;
        case "trailing":
          if (Object.hasOwn(CONSONANT_FORMS, ch)) {
            this.curPartial += ch;
          } else if (Object.hasOwn(VOWEL_FORMS, ch)) {
            const lastChar = this.curPartial.substring(
              this.curPartial.length - 1,
            );

            // Convert existing partial minus the last
            this.curPartial = this.curPartial.substring(
              0,
              this.curPartial.length - 1,
            );
            this.commitPartial();

            // Convert last char into leading
            this.curPartial += lastChar;
            this.curState = "leading";
            this.commitPartial();

            this.curPartial += ch;
            this.curState = "vowel";
          }
          this.commitPartialIfDone();
          break;
      }
    }

    this.commitPartial();

    if (this.output.length > 0) {
      const lastOne = this.output.substring(this.output.length - 1);
      if (isLeadingJamo(lastOne)) {
        this.output = this.output.substring(0, this.output.length - 1);
        this.output += toCompat(lastOne);
      }
    }

    return postProcess(this.output);
  }
}

function postProcess(string: string): string {
  string = string.normalize("NFC");

  function replaceStandaloneVowels(
    match: string,
    vowel: string,
    trailing: string,
  ): string {
    if (!isTrailingJamo(trailing)) {
      return toCompat(vowel);
    }
    return match;
  }

  string = string.replaceAll(/\u115f(.)(?=(.?))/g, replaceStandaloneVowels);

  return string;
}

export function composeHangul(string: string, get_index_map: boolean = false) {
  return new StateMachine().run(string);
}

export function yale_to_hangul(string: string, get_index_map: boolean = false) {
  return composeHangul(yaleTokenize(string));
}

export function hangul_to_yale(string: string, tone_all: boolean = false) {
  return ""; // TODO
}
