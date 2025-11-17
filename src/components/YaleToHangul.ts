import assert from "node:assert";

import {
  CONSONANT_FORMS,
  ORPHAN_REGEX,
  VOWEL_FORMS,
  YALE_TO_HANGUL_CONSONANTS,
  YALE_TO_HANGUL_TONE_MARKS,
  YALE_TO_HANGUL_VOWELS,
  composeLetters,
  convertToPrecomposed,
  getLeadingChar,
  getTrailingChar,
  getVowelChar,
  isLeadingJamo,
  isTrailingJamo,
  toCompat,
} from "@/components/HangulData";
import { Mapping, replaceAndMap } from "@/components/StringMapping";

import { PUA_CONV_TABLE } from "./PuaToUni";

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
  mapping: Mapping = [];

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

        for (let i = 0; i < l; ++i) {
          this.mapping.push([this.output.length - 1, this.output.length]);
        }

        this.curPartial = this.curPartial.substring(l);
        return true;
      }
    }
    return true;
  }

  run(composingText: string): [string, Mapping] {
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
              // Convert last character to compat
              this.output =
                this.output.substring(0, this.output.length - 1) +
                toCompat(this.output.substring(this.output.length - 1));
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
        this.output =
          this.output.substring(0, this.output.length - 1) + toCompat(lastOne);
      }
    }

    assert(
      this.mapping.length === composingText.length,
      `Mapping length != composingText.length: ${composingText}`,
    );

    return postProcess(this.output, this.mapping);
  }
}

function postProcess(string: string, mapping: Mapping): [string, Mapping] {
  [string, mapping] = convertToPrecomposed(string, mapping);

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

  [string, mapping] = replaceAndMap(
    string,
    /\u115f(.)(?=(.?))/g,
    replaceStandaloneVowels,
    mapping,
  );

  return [string, mapping];
}

export function composeHangul(
  string: string,
  mapping: Mapping | null = null,
): [string, Mapping] {
  const [resultString, resultMatch] = new StateMachine().run(string);
  return [resultString, resultMatch];
}

export function countOrphanedSyllables(string: string) {
  const [composed, _] = composeHangul(string);
  const matches = composed.matchAll(new RegExp(ORPHAN_REGEX, "g")).toArray();
  return matches.length;
}

function yaleToHangulImpl(string: string): [string, Mapping] {
  const fullMap = {
    ...YALE_TO_HANGUL_CONSONANTS,
    ...YALE_TO_HANGUL_VOWELS,
    ...YALE_TO_HANGUL_TONE_MARKS,
  };

  const tokenizedStrings: Map<string, Mapping>[] = [
    new Map<string, Mapping>([["", []]]),
  ];

  for (let l = 1; l <= string.length; ++l) {
    let curMinOrphans = Infinity;
    const curTokenizedSet = new Map<string, Mapping>();
    for (let inc = 1; inc <= 4; ++inc) {
      if (l - inc < 0) {
        continue;
      }
      const part = fullMap[string.substring(l - inc, l)];
      if (part === undefined) {
        continue;
      }
      const prefixSet = tokenizedStrings[l - inc];
      for (const [prefix, prefixMapping] of prefixSet.entries()) {
        const nOrphans = countOrphanedSyllables(prefix + part);
        const newMapping = [...prefixMapping];
        for (let i = 0; i < inc; ++i) {
          newMapping.push([prefix.length, prefix.length + part.length]);
        }
        if (curMinOrphans > nOrphans) {
          curMinOrphans = nOrphans;
          curTokenizedSet.clear();
          curTokenizedSet.set(prefix + part, newMapping);
        } else if (curMinOrphans == nOrphans) {
          curTokenizedSet.set(prefix + part, newMapping);
        }
      }
    }
    tokenizedStrings.push(curTokenizedSet);
  }

  const answerSet = tokenizedStrings[string.length].entries().toArray();

  if (answerSet.length === 0) {
    // Cannot convert
    const identityMapping: Mapping = [];
    for (let i = 0; i < string.length; ++i) {
      identityMapping.push([i, i + 1]);
    }
    return [string, identityMapping];
  }

  const [resultString, resultMapping] = answerSet[0];

  return composeHangul(resultString, resultMapping);
}

export function yaleToHangul(string: string, getIndexMap?: false): string;
export function yaleToHangul(
  string: string,
  getIndexMap: true,
): [string, Mapping];

export function yaleToHangul(string: string, getIndexMap: boolean = false) {
  function replaceFunc(
    _: string,
    alphabetic: string,
    other: string,
  ): string | [string, Mapping] {
    if (other === undefined) {
      return yaleToHangulImpl(alphabetic);
    } else {
      return other;
    }
  }

  const [resultString, resultMapping] = replaceAndMap(
    string,
    /([a-zA-Z]+)|([^a-zA-Z]+)/g,
    replaceFunc,
  );

  if (getIndexMap) {
    return [resultString, resultMapping];
  }
  return resultString;
}

console.log(yaleToHangul("chwoti", true));

export function hangulToYale(string: string, toneAll: boolean = false) {
  return ""; // TODO
}
