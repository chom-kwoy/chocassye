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

console.log(`Passed: ${passedChecks}/${totalChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
if (totalChecks !== passedChecks) process.exit(1);
