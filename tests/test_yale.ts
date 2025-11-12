import { composeHangul, yaleTokenize } from "@/components/YaleToHangul.js";

function testEqual(result: string, expected: string) {
  if (result != expected) {
    console.error(
      `Strings do not match. Result="${result}", expected="${expected}".`,
    );
  }
}

testEqual(yaleTokenize("lks"), "ㄹㄱㅅ");
testEqual(yaleTokenize("chwoti"), "ㅊㅗㄷㅣ");
testEqual(yaleTokenize("tothi"), "ㄷㆍㅌㅣ");
testEqual(yaleTokenize("yaGywo"), "ㅑㅇㅛ");
testEqual(yaleTokenize("kywey"), "ㄱㆋ");
testEqual(yaleTokenize("y.lwo.ta"), "y.ㄹㅗ.ㄷㅏ");
testEqual(yaleTokenize("taRmsaHn"), "ㄷㅏ〯ㅁㅅㅏ〮ㄴ");

testEqual(yaleTokenize("macchse"), "ㅁㅏㅈㅈㅎㅅㅓ");

testEqual(composeHangul("ㄱㅏ"), "가");
testEqual(composeHangul("ㄱㅏㄴ"), "간");
testEqual(composeHangul("ㄱㅏㄴㅏ"), "가나");
testEqual(composeHangul("ㄱㅏㄴㄷㅏ"), "간다");
testEqual(composeHangul("ㄱㅏㄴㄷㅏㅁ"), "간담");

testEqual(composeHangul("ㅇㆍㆍ"), "ᄋᆢ");
testEqual(composeHangul("ㅇㆍㆍㄱ"), "ᄋᆢᆨ");
testEqual(composeHangul("ㄷㅏㅁㅍ"), "담ㅍ");
testEqual(composeHangul("ㄷㅏㅍㅍㅍㅏ"), "닾ㅍ파");
testEqual(composeHangul("ㄷㅏㅍㅍㅋㅍㅏ"), "닾ㅍㅋ파");
testEqual(composeHangul("ㅣㅇㅏ"), "ㅣ아");
testEqual(composeHangul("ㅇㅏㅏㅓㅓ"), "아ㅏㅓㅓ");
testEqual(composeHangul("ㅓㅇㅏ"), "ㅓ아");
testEqual(composeHangul("ㅅㅓㅓㅇㅏ"), "서ㅓ아");
