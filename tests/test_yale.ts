import { yale_to_hangul } from "@/components/YaleToHangul";

let totalChecks = 0;
let passedChecks = 0;

function test_y2h(yale: string, expected: string) {
  const { result: output, mapping } = yale_to_hangul(yale, true);
  totalChecks++;
  if (output !== expected) {
    console.error(`[FAIL] ${yale} -> ${output} is not equal to ${expected}`);
  } else {
    passedChecks++;
  }
}

test_y2h("ka", "가");
test_y2h("kak", "각");
test_y2h("kak.kak", "각각");
test_y2h("kak.ha", "각하");
test_y2h("kaks.ha", "갃하");
test_y2h("ho", "ᄒᆞ");
test_y2h("hoyl", "ᄒᆡᆯ");
test_y2h("tolks.pstay", "ᄃᆞᇌᄣᅢ");
test_y2h("tolkspstay", "ᄃᆞᇌᄣᅢ");
test_y2h("tolkspstayH", "ᄃᆞᇌᄣᅢ〮");
test_y2h("kakH", "각〮");
test_y2h("kaH", "가〮");
test_y2h("koH", "ᄀᆞ〮");

console.log(`Passed: ${passedChecks}/${totalChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
if (totalChecks !== passedChecks) process.exit(1);
