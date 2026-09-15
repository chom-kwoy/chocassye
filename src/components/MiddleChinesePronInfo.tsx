import { Grid } from "@mui/material";

import type { Reading } from "@/app/hanja/middleChinese";

const CHONGNIU_RHYME_GROUPS = "支脂祭眞質仙薛宵侵緝鹽葉";
const SEMI_CHONGNIU_RHYME_GROUPS = CHONGNIU_RHYME_GROUPS + "諄庚陌清昔幽";
// prettier-ignore
const CHONGNIU_INITIALS = ["p", "ph", "b", "m", "k", "kh", "g", "ng", "'", "x", "h"];
// prettier-ignore
const TONES: { [key: string]: string } = {"平": "", "上": "X", "去": "H", "入": ""};

export function MiddleChinesePronInfo({
  reading,
  leftWidth,
}: {
  reading: Reading;
  leftWidth?: number;
}) {
  const isChongniuInitial = CHONGNIU_INITIALS.includes(reading.initial.baxter);
  const isSemiChongniuRhymeGroup =
    SEMI_CHONGNIU_RHYME_GROUPS.includes(reading.rhymeGroup) &&
    reading.division === "三";
  const isChongniuRhymeGroup =
    CHONGNIU_RHYME_GROUPS.includes(reading.rhymeGroup) &&
    reading.division === "三";

  let baxterFinal = reading.final.baxter;
  // ignore chongniu for non-applicable initials
  if (isSemiChongniuRhymeGroup) {
    if (!isChongniuInitial) {
      baxterFinal = baxterFinal
        .replace(/^ji(?=e)/, "j")
        .replace(/^jwi(?=e)/, "jw")
        .replace(/^ji/, "i")
        .replace(/^jwi/, "wi");
    }
  }
  // yj -> j
  if (reading.initial.baxter.includes("y") && baxterFinal.startsWith("j")) {
    baxterFinal = baxterFinal.slice(1);
  }
  const baxter = reading.initial.baxter + baxterFinal + TONES[reading.tone];
  let chongniu: string | null = null;
  if (isChongniuInitial && isChongniuRhymeGroup) {
    chongniu = reading.chongniu ? "(중뉴3등/B류)" : "(중뉴4등/A류)";
  }
  const l = leftWidth ?? 2;
  const r = 12 - l;
  return (
    <Grid size={11} container spacing={0.5} alignItems="center">
      <Grid size={l}>성모</Grid>
      <Grid size={r}>{reading.initial.rhymeGroup}모</Grid>
      <Grid size={l}>운모</Grid>
      <Grid size={r}>
        {reading.rhymeGroup}운 {reading.openClosed}구호 {reading.division}등
        {chongniu}
      </Grid>
      <Grid size={l}>성조</Grid>
      <Grid size={r}>{reading.tone}성</Grid>
      <Grid size={l}>반절</Grid>
      <Grid size={r}>{reading.fanqie}切</Grid>
      <Grid size={l}>Baxter</Grid>
      <Grid size={r}>
        <code>{baxter}</code>
      </Grid>
    </Grid>
  );
}
