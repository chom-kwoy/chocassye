"use client";

import { Button, Card, Grid, TextField } from "@mui/material";
import React from "react";

import { Reading, getMCData } from "@/app/hanja/middleChinese";

export default function HanjaPage() {
  const [char, setChar] = React.useState<string>("");
  const [data, setData] = React.useState<{
    char: string;
    readings: Reading[];
  } | null>(null);

  const search = async () => {
    const codePoint = char.trim().codePointAt(0);
    if (codePoint !== undefined) {
      const ch = String.fromCodePoint(codePoint);
      const readings = await getMCData(ch);
      setData(readings === null ? null : { char: ch, readings: readings });
    }
  };

  return (
    <Grid container spacing={{ xs: 0.5, sm: 2 }} alignItems="center">
      <Grid
        size={12}
        container
        spacing={1}
        alignItems="center"
        justifyContent="center"
      >
        <TextField
          label="Character"
          variant="outlined"
          value={char}
          onChange={(e) => setChar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              search();
            }
          }}
        />
        <Button variant="contained" onClick={() => search()}>
          Search
        </Button>
      </Grid>
      {data &&
        data.readings.map((reading, i) => (
          <Grid size={12} key={i}>
            <Card elevation={1} sx={{ p: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid size={1}>
                  {data.char} {i + 1}
                </Grid>
                <MiddleChinesePronInfo reading={reading} />
              </Grid>
            </Card>
          </Grid>
        ))}
    </Grid>
  );
}

export function MiddleChinesePronInfo({
  reading,
  leftWidth,
}: {
  reading: Reading;
  leftWidth?: number;
}) {
  const CHONGNIU_RHYME_GROUPS = "支脂祭眞質仙薛宵侵緝鹽葉";
  const baxter = reading.initial.baxter + reading.final.baxter;
  let zhongniu: string | null = null;
  if (
    reading.division === "三" &&
    CHONGNIU_RHYME_GROUPS.includes(reading.rhymeGroup)
  ) {
    zhongniu = reading.zhongniu ? "(중뉴3등/B류)" : "(중뉴4등/A류)";
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
        {zhongniu}
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
