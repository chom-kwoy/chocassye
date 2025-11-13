import {
  composeHangul,
  countOrphanedSyllables,
  yale_to_hangul,
} from "@/components/YaleToHangul.js";

function testEqual(result: string | number, expected: string | number) {
  if (result != expected) {
    console.error(
      `Values do not match. Result="${result}", expected="${expected}".`,
    );
  }
}

testEqual(composeHangul("ㄱㅏ"), "가");
testEqual(composeHangul("ㄱㅏㄴ"), "간");
testEqual(composeHangul("ㄱㅏㄴㅏ"), "가나");
testEqual(composeHangul("ㄱㅏㄴㄷㅏ"), "간다");
testEqual(composeHangul("ㄱㅏㄴㄷㅏㅁ"), "간담");

testEqual(composeHangul("ㄱㅏㄴㄴ"), "가ᇿ");
testEqual(composeHangul("ㄱㅏㅸ"), "가ᇦ");

testEqual(composeHangul("ㅇㆍㆍ"), "ᄋᆢ");
testEqual(composeHangul("ㅇㆍㆍㄱ"), "ᄋᆢᆨ");
testEqual(composeHangul("ㄷㅏㅁㅍ"), "담ㅍ");
testEqual(composeHangul("ㄷㅏㅍㅍㅍㅏ"), "닾ㅍ파");
testEqual(composeHangul("ㄷㅏㅍㅍㅋㅍㅏ"), "닾ㅍㅋ파");
testEqual(composeHangul("ㅣㅇㅏ"), "ㅣ아");
testEqual(composeHangul("ㅇㅏㅏㅓㅓ"), "아ㅏㅓㅓ");
testEqual(composeHangul("ㅓㅇㅏ"), "ㅓ아");
testEqual(composeHangul("ㅅㅓㅓㅇㅏ"), "서ㅓ아");

testEqual(countOrphanedSyllables("ㅇㆍㆍ"), 0);
testEqual(countOrphanedSyllables("ㅇㆍㆍㄱ"), 0);
testEqual(countOrphanedSyllables("ㄷㅏㅁㅍ"), 1);
testEqual(countOrphanedSyllables("ㄷㅏㅍㅍㅍㅏ"), 1);
testEqual(countOrphanedSyllables("ㄷㅏㅍㅍㅋㅍㅏ"), 2);
testEqual(countOrphanedSyllables("ㅣㅇㅏ"), 1);
testEqual(countOrphanedSyllables("ㅇㅏㅏㅓㅓ"), 3);
testEqual(countOrphanedSyllables("ㅓㅇㅏ"), 1);
testEqual(countOrphanedSyllables("ㅅㅓㅓㅇㅏ"), 1);

testEqual(yale_to_hangul("chwoti"), "초디");
testEqual(yale_to_hangul("macchse"), "마ퟹꥻᅥ");

// testEqual(yale_to_hangul("lks"), "ㄺㅅ");
// testEqual(yale_to_hangul("tothi"), "ᄃᆞ티");
// testEqual(yale_to_hangul("yaGywo"), "ㅑ요");
// testEqual(yale_to_hangul("kywey"), "ᄀᆒ");
// testEqual(yale_to_hangul("y.lwo.ta"), "y.로.다");
// testEqual(yale_to_hangul("taRmsaHn"), "담〯산〮");
