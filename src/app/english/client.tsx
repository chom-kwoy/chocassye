"use client";

import { Stack } from "@mui/material";
import Paper from "@mui/material/Paper";
import React from "react";

import { convertEngToHang } from "@/app/english/convert";

export function EnglishClient() {
  const [englishInput, setEnglishInput] = React.useState("What is this?");
  const [hangulOutput, setHangulOutput] = React.useState("우오티즈디쓰");
  const [ipaOutput, setIpaOutput] = React.useState("w ɔ́ t / ɪ z / ð ɪ́ s / ?");

  async function handleHangulChange(newText: string) {
    setEnglishInput(newText);
    const result = await convertEngToHang(newText);
    setIpaOutput(result.ipa);
    setHangulOutput(result.hangul);
  }

  return (
    <Stack sx={{ maxWidth: "lg" }}>
      <h1>참괴로운 영어표기법 변환기</h1>
      <Paper elevation="1" sx={{ p: 2 }}>
        {/*영어 입력 */}
        <textarea
          value={englishInput}
          onChange={(event) => handleHangulChange(event.target.value)}
        />
        {/*한글 출력 */}
        <div>↓</div>
        <div>
          IPA: <code>{`${ipaOutput}`}</code>
        </div>
        <div>
          한글: <span>{`${hangulOutput}`}</span>
        </div>
      </Paper>
    </Stack>
  );
}
