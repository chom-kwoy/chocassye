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
  const map = new Map<string, Final>(
    table.flatMap((final) => final.names.map((name) => [name, final])),
  );
  const baxterToFinal = new Map<string, Final>();
  for (const final of table) {
    baxterToFinal.set(final.baxter, final);
  }
  const checkedToneMap = new Map<string, Final>();
  for (const final of table) {
    const addToMap = (sonBaxter: string) => {
      const sonCounterpart = baxterToFinal.get(sonBaxter);
      if (sonCounterpart !== undefined) {
        for (const name of sonCounterpart.names) {
          checkedToneMap.set(name, final);
        }
      }
    };
    if (final.baxter.endsWith("p")) {
      addToMap(final.baxter.slice(0, -1) + "m");
    } else if (final.baxter.endsWith("t")) {
      addToMap(final.baxter.slice(0, -1) + "n");
    } else if (final.baxter.endsWith("k")) {
      addToMap(final.baxter.slice(0, -1) + "ng");
    }
  }
  return [map, checkedToneMap];
}

const [MC_FINALS_DATA, MC_CHECKED_TONE_FINALS_DATA] = readFinalsCsv(
  "chocassye-corpus/MCfinals.csv",
);

function getMCFinal(
  rhymeGroup: string,
  openClosed: string,
  division: string,
  zhongniu: string,
  tone: string,
): Final | null {
  const data = tone === "入" ? MC_CHECKED_TONE_FINALS_DATA : MC_FINALS_DATA;
  let result = data.get(rhymeGroup + zhongniu + division + openClosed);
  if (result === undefined)
    result = data.get(rhymeGroup + division + openClosed);
  if (result === undefined) result = data.get(rhymeGroup + division);
  if (result === undefined) result = data.get(rhymeGroup + openClosed);
  if (result === undefined) result = data.get(rhymeGroup);
  return result ?? null;
}

export type Reading = {
  initial: Initial;
  final: Final;
  rhymeGroup: string;
  division: string;
  openClosed: string;
  zhongniu: string;
  tone: string;
  fanqie: string;
};

type ReadingData = {
  initial: string;
  rhymeGroup: string;
  division: string;
  openClosed: string;
  zhongniu: string;
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
      const match = line.match(/\["([^"])"\] *= *\{((?: * "[^"]*",? *)+)\}/u);
      if (match === null) {
        console.log("Invalid line:", line);
        continue;
      }
      const char = match[1];
      const readings = match[2].split(",").map((reading) => {
        const match = reading.match(
          /"([^"])([^"])([^"])([^"]) ([^"])([^"][^"]|0)(?:-(重鈕))?(:?\?|？)?"/u,
        );
        if (match === null) {
          console.log("Invalid reading:", char, reading);
          return null;
        }
        return {
          initial: match[1],
          rhymeGroup: match[2],
          division: match[3],
          openClosed: match[4],
          zhongniu: match[7] ?? "",
          tone: match[5],
          fanqie: match[6],
        };
      });
      mcData[char] = readings.filter((reading) => reading !== null);
    }
  }
  console.log("Finished reading MC data files.");
  return mcData;
}

const MIDDLE_CHINESE_DATA = await readMCDataFiles();

export async function getMCData(char: string): Promise<Reading[] | null> {
  const data = MIDDLE_CHINESE_DATA[char];
  console.log(data);
  if (data === undefined) {
    return null;
  }
  return data.map((record) => {
    const initial = getMCInitial(record.initial);
    const final = getMCFinal(
      record.rhymeGroup,
      record.openClosed,
      record.division,
      record.zhongniu,
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
        record.zhongniu,
      );
    }
    return {
      ...record,
      initial: initial!,
      final: final!,
    };
  });
}
