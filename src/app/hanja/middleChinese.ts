"use server";

import { readFile, readdir } from "fs/promises";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { join } from "path";

export type Initial = {
  type: string;
  rhymeGroup: string;
  baxter: string;
  karlgren: string;
  shao: string;
  wangli: string;
  pulleyblank: string;
  zhengzhang: string;
  lirong: string;
  panwuyun: string;
};

function readInitialsCsv(filePath: string): Map<string, Initial> {
  const content = readFileSync(filePath, "utf-8");
  const { data } = Papa.parse<{ [key: string]: string }>(content, {
    header: true,
    skipEmptyLines: true,
  });
  const table = data.map((row) => {
    const result: Initial = {
      type: row["Type"],
      rhymeGroup: row["Rhyme Group"],
      baxter: row["Baxter"],
      karlgren: row["Karlgren"],
      shao: row["Shao"],
      wangli: row["Wang Li"],
      pulleyblank: row["Pulleyblank"],
      zhengzhang: row["Zhengzhang"],
      lirong: row["Li Rong"],
      panwuyun: row["Pan Wuyun"],
    };
    return result;
  });
  return new Map<string, Initial>(
    table.map((initial) => [initial.rhymeGroup, initial]),
  );
}

const MC_INITIALS_DATA = readInitialsCsv("chocassye-corpus/MCinitials.csv");

function getMCInitial(rhymeGroup: string): Initial | null {
  return MC_INITIALS_DATA.get(rhymeGroup) ?? null;
}

export type Final = {
  number: number;
  group: string;
  names: string[];
  division: number;
  baxter: string;
  karlgren: string;
  shao: string;
  wangli: string;
  pulleyblank: string;
  zhengzhang: string;
  lirong: string;
  panwuyun: string;
};

function readFinalsCsv(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const { data } = Papa.parse<{ [key: string]: string }>(content, {
    header: true,
    skipEmptyLines: true,
  });
  const table = data.map((row) => {
    const result: Final = {
      number: parseInt(row["No"]),
      group: row["Group"],
      names: row["Name"].split("/").map((name) => name.trim()),
      division: parseInt(row["Div"]),
      baxter: row["Baxter"],
      karlgren: row["Karlgren"],
      shao: row["Shao"],
      wangli: row["Wang Li"],
      pulleyblank: row["Pulleyblank"],
      zhengzhang: row["Zhengzhang"],
      lirong: row["Li Rong"],
      panwuyun: row["Pan Wuyun"],
    };
    return result;
  });
  return new Map<string, Final>(
    table.flatMap((final) => final.names.map((name) => [name, final])),
  );
}

const MC_FINALS_DATA = readFinalsCsv("chocassye-corpus/MCfinals.csv");

const CHECKED_TONE_COUNTERPARTS: { [key: string]: string } = {
  東: "屋",
  冬: "沃",
  鍾: "燭",
  江: "覺",
  真: "質",
  眞: "質",
  臻: "櫛",
  諄: "術",
  痕: "麧",
  魂: "沒",
  欣: "迄",
  文: "物",
  寒: "曷",
  桓: "末",
  元: "月",
  刪: "黠",
  山: "鎋",
  仙: "薛",
  先: "屑",
  唐: "鐸",
  陽: "藥",
  庚: "陌",
  耕: "麥",
  清: "昔",
  青: "錫",
  登: "德",
  蒸: "職",
  侵: "緝",
  談: "盍",
  嚴: "業",
  凡: "乏",
  銜: "狎",
  咸: "洽",
  鹽: "葉",
  添: "帖",
  覃: "合",
};

function getMCFinal(
  rhymeGroup: string,
  openClosed: string,
  division: string,
  chongniu: string,
  tone: string,
): Final | null {
  const chongniuKey = chongniu ? "重鈕三" : division;
  const candidates = [
    rhymeGroup + chongniuKey + openClosed,
    rhymeGroup + chongniuKey,
    rhymeGroup + division + openClosed,
    rhymeGroup + openClosed,
    rhymeGroup + division,
    rhymeGroup,
  ];
  for (const candidate of candidates) {
    const key =
      tone === "入"
        ? (CHECKED_TONE_COUNTERPARTS[candidate[0]] ?? candidate[0]) +
          candidate.slice(1)
        : candidate;
    const result = MC_FINALS_DATA.get(key);
    if (result !== undefined) return result;
  }
  return null;
}

export type Reading = {
  initial: Initial;
  final: Final;
  rhymeGroup: string;
  division: string;
  openClosed: string;
  chongniu: string;
  tone: string;
  fanqie: string;
};

type ReadingData = {
  initial: string;
  rhymeGroup: string;
  division: string;
  openClosed: string;
  chongniu: string;
  tone: string;
  fanqie: string;
};

async function readMCDataFiles() {
  const dirPath = "chocassye-corpus/MCData/";
  const files = await readdir(dirPath, {
    withFileTypes: true,
  });

  console.log("Start reading MC data files:");
  const mcData: { [key: string]: ReadingData[] } = {};
  files.sort((a, b) => a.name.localeCompare(b.name));
  for (const file of files) {
    if (!file.isFile()) continue;

    const content = await readFile(join(dirPath, file.name), "utf-8");
    for (const line of content.split("\n")) {
      if (
        line.startsWith("return") ||
        line.startsWith("}") ||
        line.trim().length === 0
      ) {
        continue;
      }
      const match = line.match(/\["([^"])"\] *= *\{((?:\s*"[^"]*",?\s*)+)\}/u);
      if (match === null) {
        console.log("Invalid line:", line);
        continue;
      }
      const char = match[1];
      const readings: ReadingData[] = [];
      for (const piece of match[2].split(",")) {
        const reading = piece.trim();
        if (!reading) continue;
        const readingMatch = reading.match(
          /"([^"])([^"])([^"])([^"]) ([^"])([^"][^"]|0)(?:-(重鈕))?(?:\?|？)?"/u,
        );
        if (readingMatch === null) {
          console.log("Invalid reading:", char, reading);
          continue;
        }
        readings.push({
          initial: readingMatch[1],
          rhymeGroup: readingMatch[2],
          division: readingMatch[3],
          openClosed: readingMatch[4],
          chongniu: readingMatch[7] ?? "",
          tone: readingMatch[5],
          fanqie: readingMatch[6],
        });
      }
      mcData[char] = readings;
    }
  }
  console.log("Finished reading MC data files.");
  return mcData;
}

const MIDDLE_CHINESE_DATA = await readMCDataFiles();

function lookupMCData(char: string): Reading[] | null {
  const data = MIDDLE_CHINESE_DATA[char];
  if (data === undefined) {
    return null;
  }
  return data.map((record) => {
    const initial = getMCInitial(record.initial);
    const final = getMCFinal(
      record.rhymeGroup,
      record.openClosed,
      record.division,
      record.chongniu,
      record.tone,
    );
    if (initial === null || final === null) {
      console.error(
        "Bad lookup:",
        char,
        record.initial,
        record.rhymeGroup,
        record.division,
        record.openClosed,
        record.chongniu,
      );
    }
    return {
      ...record,
      initial: initial!,
      final: final!,
    };
  });
}

export async function getMCData(char: string): Promise<Reading[] | null> {
  return lookupMCData(char);
}

const CHONGNIU_RHYME_GROUPS = "支脂祭眞質仙薛宵侵緝鹽葉";
const SEMI_CHONGNIU_RHYME_GROUPS = CHONGNIU_RHYME_GROUPS + "諄庚陌清昔幽";
const CHONGNIU_INITIALS = [
  "p",
  "ph",
  "b",
  "m",
  "k",
  "kh",
  "g",
  "ng",
  "'",
  "x",
  "h",
];

export type ReconstructionAuthor =
  | "baxter"
  | "karlgren"
  | "shao"
  | "wangli"
  | "pulleyblank"
  | "zhengzhang"
  | "lirong"
  | "panwuyun";

export async function getMCReconstructions(
  author: ReconstructionAuthor,
  includeTone: boolean,
  spaced: boolean,
  chongniu: "medial" | "vowel" | null = null,
): Promise<{ [key: string]: string[] }> {
  const result: { [key: string]: string[] } = {};
  for (const char of Object.keys(MIDDLE_CHINESE_DATA)) {
    const readings = lookupMCData(char);
    if (readings === null) continue;
    for (const reading of readings) {
      const initial = reading.initial[author];
      let final = reading.final[author];
      if (author === "baxter") {
        const isChongniuInitial = CHONGNIU_INITIALS.includes(initial);
        const isSemiChongniuRhymeGroup =
          SEMI_CHONGNIU_RHYME_GROUPS.includes(reading.rhymeGroup) &&
          reading.division === "三";
        if (isSemiChongniuRhymeGroup && !isChongniuInitial) {
          final = final
            .replace(/^ji(?=e)/, "j")
            .replace(/^jwi(?=e)/, "jw")
            .replace(/^ji/, "i")
            .replace(/^jwi/, "wi");
        }
        if (initial.includes("y") && final.startsWith("j")) {
          final = final.slice(1);
        }
        if (isSemiChongniuRhymeGroup && isChongniuInitial) {
          if (chongniu === "medial") {
            const isChongniuIV = final.includes("ji") || final.includes("jwi");
            final = final
              .replace(/^ji(?=e)/, "j")
              .replace(/^jwi(?=e)/, "jw")
              .replace(/^ji/, "i")
              .replace(/^jwi/, "wi");
            if (!isChongniuIV) {
              final = final.replace(/^j/, "ɨ̯");
              if (!final.includes("ɨ̯")) final = "ɨ̯" + final;
            }
          } else if (chongniu === "vowel") {
            throw new Error("vowel chongniu not implemented yet");
          }
        }
      }
      let reconstruction = spaced ? initial + " " + final : initial + final;
      if (includeTone) {
        if (reading.tone === "上") reconstruction += spaced ? " X" : "X";
        if (reading.tone === "去") reconstruction += spaced ? " H" : "H";
      }
      (result[char] ??= []).push(reconstruction);
    }
  }
  return result;
}
