import { convert, normalizeIPA, wordlist } from "@/utils/convert_eng";
import { phonemize } from "@/utils/phonemize";

function assert(a: string, b: string) {
  if (a !== b) {
    console.error(`[FAIL] ${a} is not equal to ${b}`);
    console.dir(a);
  } else {
    console.log("[PASS]");
  }
}

assert((await convert("easy")).hangul, "의즤");
assert((await convert("near")).hangul, "니으");
assert((await convert("square")).hangul, "쓰꿰으");
assert((await convert("palm")).hangul, "파음");
assert((await convert("nurse")).hangul, "너으쓰");
assert((await convert("thought")).hangul, "소으트");
assert((await convert("cure")).hangul, "큐으");
assert((await convert("city")).hangul, "씨틔");
assert((await convert("bottle")).hangul, "뽀털");
assert((await convert("calminged")).hangul, "카으밍드");
assert((await convert("justify")).hangul, "쩌쓰티파이");
assert((await convert("balled")).hangul, "뽀을드");
assert((await convert("lake")).hangul, "레이크");
assert((await convert("hello")).hangul, "헬러우");
assert((await convert("call")).hangul, "코을");
assert((await convert("water")).hangul, "우오으터");
assert((await convert("aurorasphere")).hangul, "오으로으러쓰피으");

assert(
  (await convert("May I have some water?")).hangul,
  "메이 아이 하브 썸 우오으터?",
);
assert(
  (await convert("Are you going to New York?")).hangul,
  "아으 이으우 꺼우잉 트우 니으우 요으크?",
);
assert((await convert("Arco")).hangul, "아으커우");

let cnt = 0;
for (const [word, phons] of wordlist.entries()) {
  const ipa = phonemize(word, {
    returnArray: true,
    format: "ipa",
    stripStress: false,
  })[0].phoneme;
  const normPhons = phons.map((p) =>
    p.replaceAll("ʌ", "ə").replaceAll("\u0301", ""),
  );
  const normIpa = normalizeIPA(ipa)
    .replaceAll("ʌ", "ə")
    .replaceAll("\u0301", "");
  if (!normPhons.includes(normIpa)) {
    // console.log(word, ipa, normIpa, normPhons);
    cnt += 1;
  }
}
console.log(`Incorrect matches: ${cnt}/${wordlist.size}`);
