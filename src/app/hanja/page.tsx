"use client";

import { Button, Card, Grid, TextField } from "@mui/material";
import React from "react";

import { getMCData } from "@/app/hanja/middleChinese";
import type { Reading } from "@/app/hanja/middleChinese";
import { MiddleChinesePronInfo } from "@/components/MiddleChinesePronInfo";

export default function HanjaPage() {
  const [char, setChar] = React.useState<string>("");
  const [data, setData] = React.useState<
    {
      char: string;
      readings: Reading[];
    }[]
  >([]);

  const search = async () => {
    const trimmedChar = char.trim();
    const result = [];
    for (let i = 0; i < trimmedChar.length; i++) {
      const codePoint = char.trim().codePointAt(i);
      if (codePoint !== undefined) {
        const ch = String.fromCodePoint(codePoint);
        const readings = await getMCData(ch);
        if (readings !== null) {
          result.push({ char: ch, readings });
        }
      }
    }
    setData(result);
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
      {data.map((charData, charIdx) => (
        <React.Fragment key={charIdx}>
          {charData.readings.map((reading, i) => (
            <Grid size={12} key={i}>
              <Card elevation={1} sx={{ p: 2 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid size={1}>
                    {charData.char} {i + 1}
                  </Grid>
                  <MiddleChinesePronInfo reading={reading} />
                </Grid>
              </Card>
            </Grid>
          ))}
        </React.Fragment>
      ))}
    </Grid>
  );
}
