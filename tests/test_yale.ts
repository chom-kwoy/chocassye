import {
  composeHangul,
  countOrphanedSyllables,
  yaleToHangul,
} from "@/components/YaleToHangul.js";

function testEqual<T>(result: T, expected: T) {
  if (result != expected) {
    console.error(
      `Values do not match. Result="${result}", expected="${expected}".`,
    );
  }
}

function testAll() {
  testEqual(composeHangul("ㄱㅏ"), [
    "가",
    [
      [0, 1],
      [0, 1],
    ],
  ]);
  testEqual(composeHangul("ㄱㅏㄴ"), [
    "간",
    [
      [0, 1],
      [0, 1],
      [0, 1],
    ],
  ]);
  testEqual(composeHangul("ㄱㅏㄴㅏ"), [
    "가나",
    [
      [0, 1],
      [0, 1],
      [1, 2],
      [1, 2],
    ],
  ]);
  testEqual(composeHangul("ㄱㅏㄴㄷㅏ"), [
    "간다",
    [
      [0, 1],
      [0, 1],
      [0, 1],
      [1, 2],
      [1, 2],
    ],
  ]);
  testEqual(composeHangul("ㄱㅏㄴㄷㅏㅁ"), [
    "간담",
    [
      [0, 1],
      [0, 1],
      [0, 1],
      [1, 2],
      [1, 2],
      [1, 2],
    ],
  ]);

  testEqual(composeHangul("ㄱㅏㄴㄴ"), [
    "가ᇿ",
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 3],
    ],
  ]);
  testEqual(composeHangul("ㄱㅏㅸ"), [
    "가ᇦ",
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  ]);

  // testEqual(composeHangul("ㅇㆍㆍ"), "ᄋᆢ");
  // testEqual(composeHangul("ㅇㆍㆍㄱ"), "ᄋᆢᆨ");
  // testEqual(composeHangul("ㄷㅏㅁㅍ"), "담ㅍ");
  // testEqual(composeHangul("ㄷㅏㅍㅍㅍㅏ"), "닾ㅍ파");
  // testEqual(composeHangul("ㄷㅏㅍㅍㅋㅍㅏ"), "닾ㅍㅋ파");
  // testEqual(composeHangul("ㅣㅇㅏ"), "ㅣ아");
  // testEqual(composeHangul("ㅇㅏㅏㅓㅓ"), "아ㅏㅓㅓ");
  // testEqual(composeHangul("ㅓㅇㅏ"), "ㅓ아");
  // testEqual(composeHangul("ㅅㅓㅓㅇㅏ"), "서ㅓ아");

  // testEqual(countOrphanedSyllables("ㅇㆍㆍ"), 0);
  // testEqual(countOrphanedSyllables("ㅇㆍㆍㄱ"), 0);
  // testEqual(countOrphanedSyllables("ㄷㅏㅁㅍ"), 1);
  // testEqual(countOrphanedSyllables("ㄷㅏㅍㅍㅍㅏ"), 1);
  // testEqual(countOrphanedSyllables("ㄷㅏㅍㅍㅋㅍㅏ"), 2);
  // testEqual(countOrphanedSyllables("ㅣㅇㅏ"), 1);
  // testEqual(countOrphanedSyllables("ㅇㅏㅏㅓㅓ"), 3);
  // testEqual(countOrphanedSyllables("ㅓㅇㅏ"), 1);
  // testEqual(countOrphanedSyllables("ㅅㅓㅓㅇㅏ"), 1);
  //
  // testEqual(yaleToHangul("chwoti"), "초디");
  // testEqual(yaleToHangul("macchse"), "마ퟹꥻᅥ");
  //
  // testEqual(yaleToHangul("lks"), "ㄺㅅ");
  // testEqual(yaleToHangul("tothi"), "ᄃᆞ티");
  // testEqual(yaleToHangul("yaGywo"), "ㅑ요");
  // testEqual(yaleToHangul("kywey"), "ᄀᆒ");
  // testEqual(yaleToHangul("y.lwo.ta"), "y.로.다");
  // testEqual(yale_to_hangul("taRmsaHn"), "담〯산〮");
}

testAll();
