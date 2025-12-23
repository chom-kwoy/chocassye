"use strict";

import fs from "fs";
import { glob } from "glob";
import jsdom from "jsdom";
import { promisify } from "util";

import { hangul_to_yale } from "../components/YaleToHangul.mjs";
import { insert_into_db } from "./insert_into_db.ts";
import {
  parse_year_string,
  year_and_bookname_from_filename,
} from "./parse_utils.js";

function uni(str) {
  return str.replace(
    /{{{[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]}}}/g,
    function (ch) {
      return String.fromCharCode(parseInt(ch.slice(3, 8), 16));
    },
  );
}

function find_year(doc) {
  let year_elem = doc.querySelectorAll("meta year");
  if (year_elem !== null) {
    if (
      year_elem.attributes !== undefined &&
      year_elem.attributes.n !== undefined
    ) {
      return uni(year_elem.attributes.n.value).trim();
    }
  }
  year_elem = doc.querySelector("teiHeader date");
  if (year_elem !== null) {
    return uni(year_elem.textContent).trim();
  }

  return null;
}

function findAttributions(doc) {
  let respStmts = doc.querySelectorAll("teiHeader respStmt");
  let attributions = [];
  for (let respStmt of respStmts) {
    let resp = respStmt.querySelector("resp");
    let name = respStmt.querySelector("name");
    if (name !== null && uni(name.textContent).trim() !== "") {
      attributions.push({
        role: resp ? uni(resp.textContent).trim() : null,
        name: uni(name.textContent).trim(),
      });
    }
  }
  return attributions;
}

function findBibl(doc) {
  let notesStmt = doc.querySelector("teiHeader notesStmt");
  if (notesStmt !== null) {
    let bibl = notesStmt.querySelector("bibl");
    if (bibl !== null) {
      let infos = [];
      for (let child of bibl.children) {
        if (child.tagName !== "date" && child.tagName !== "year") {
          if (uni(child.textContent).trim() !== "") {
            infos.push(uni(child.textContent).trim());
          }
        }
      }
      return infos.join("; ");
    }
  }
  let meta = doc.querySelector("meta");
  if (meta !== null) {
    let photograph = meta.querySelectorAll("photograph");
    if (photograph.length > 0) {
      return [...photograph].map((p) => uni(p.textContent).trim()).join(", ");
    }
  }
  return null;
}

function add_file(file, xml) {
  const errorNode = xml.querySelector("parsererror");
  if (errorNode) {
    throw new Error("parse failed: " + errorNode.innerHTML);
  }

  let { filename, year_string } = year_and_bookname_from_filename(file);

  let doc = xml.documentElement;

  if (year_string === null) {
    year_string = find_year(doc).normalize("NFKC");
  }
  let { year, year_start, year_end } = parse_year_string(year_string);

  let has_tone_tag = doc.querySelector("meta > has-tone");
  let has_tone = has_tone_tag && has_tone_tag.attributes.value.value;

  let attributions = findAttributions(doc);
  let bibliography = findBibl(doc);

  let elements = doc.querySelectorAll(
    ":not(meta):not(titleStmt):not(bibl) > sent," +
      ":not(meta):not(titleStmt):not(bibl) > mark," +
      ":not(meta):not(titleStmt):not(bibl) > title," +
      ":not(meta):not(titleStmt):not(bibl) > head," +
      ":not(meta):not(titleStmt):not(bibl) > chr," +
      ":not(meta):not(titleStmt):not(bibl) > c," +
      ":not(meta):not(titleStmt):not(bibl) > page",
  );
  console.log(`${filename}: ${elements.length} sentences selected.`);

  let book_details = {
    filename: filename,
    year: year,
    year_sort: year ?? 9999,
    decade_sort: year === null ? 9999 : Math.floor(year / 10) * 10,
    year_start: year_start,
    year_end: year_end,
    year_string: year_string,
    attributions: attributions,
    bibliography: bibliography,
    num_sentences: elements.length,
  };

  let sentences = [];

  // iterate over sentences
  let index = 0;
  let last_page = null;
  let global_page = null;
  let cur_section = null;
  let non_chinese_sentence_count = 0;
  for (let sentence of elements) {
    if (sentence.tagName === "mark") {
      let attr = sentence.attributes;
      let type = attr.type === undefined ? null : uni(attr.type.value.trim());
      let text = uni(sentence.textContent.trim());

      sentences.push({
        filename: filename,
        text: text,
        type: type,
        number_in_book: index,
      });
      non_chinese_sentence_count += 1;
      index += 1;
    } else if (sentence.tagName === "page") {
      let attr = sentence.attributes;
      if (attr.n !== undefined) {
        global_page = uni(attr.n.value.trim());
      }
    } else {
      try {
        let html = uni(sentence.innerHTML.trim());
        html = hangul_to_yale(html, has_tone);
        let text = uni(sentence.textContent.trim());
        let text_with_tone = null;
        if (has_tone) {
          text_with_tone = hangul_to_yale(text, true);
        }
        text = hangul_to_yale(text, false);

        let attr = sentence.attributes;
        let type = attr.type === undefined ? null : uni(attr.type.value.trim());
        let page =
          attr.page === undefined ? global_page : uni(attr.page.value.trim());
        if (page === null) {
          page = attr.n === undefined ? null : uni(attr.n.value.trim());
        }
        if (page === null) {
          console.warn("WARNING: page is null", file);
        }
        if (sentence.tagName === "title" || type === "title") {
          if (!is_monotonic(last_page, page)) {
            cur_section = uni(sentence.textContent.trim());
          }
        }
        last_page = page;

        let page_start = null;
        let page_end = null;
        if (page !== null) {
          let cur_pages = page.replace(/(?<!\d)0+/g, "").split("-");
          let splits = cur_pages[0].split(/(\d+)/);
          let prefix = splits[0];
          cur_pages[0] = splits.slice(1).join("");
          page_start = prefix + cur_pages[0];
          page_end =
            cur_pages.length === 1 ? page_start : prefix + cur_pages[1];
        }

        let lang = attr.lang === undefined ? null : uni(attr.lang.value.trim());
        let number_in_page = null;
        if (attr.n !== undefined) {
          number_in_page = uni(attr.n.value);
        } else if (attr.num !== undefined) {
          number_in_page = uni(attr.num.value);
        }

        if (text.length > 5000) {
          console.error(filename, "Sentence too long:", text.length);
          throw new Error("Sentence too long");
        }

        if (lang !== "chi") {
          non_chinese_sentence_count += 1;
        }

        const text_without_sep = text.replace(/[ .^@]/g, "");
        sentences.push({
          filename: filename,
          section: cur_section,
          text: text,
          text_without_sep: text_without_sep,
          text_with_tone: text_with_tone,
          html: html,
          type: type,
          lang: lang,
          page_start: page_start,
          page_end: page_end,
          orig_tag: sentence.tagName,
          number_in_page: number_in_page,
          number_in_book: index,
          year_sort: book_details.year_sort,
          decade_sort: book_details.decade_sort,
        });
        index += 1;
      } catch (error) {
        console.error(filename, " Error:", error, uni(sentence.textContent));
        throw error;
      }
    }
  }

  book_details["non_chinese_sentence_count"] = non_chinese_sentence_count;

  return [book_details, sentences];
}

function is_monotonic(prev_page, cur_page) {
  if (prev_page === null || cur_page === null) {
    return false;
  }
  prev_page = prev_page.split("-");
  prev_page = prev_page[prev_page.length - 1];
  cur_page = cur_page.split("-");
  cur_page = cur_page[0];
  const prev_num = prev_page.match(/\d+/g);
  const cur_num = cur_page.match(/\d+/g);
  if (prev_num === null) {
    return true;
  }
  const pnum = parseInt(prev_num, 10);
  const cnum = parseInt(cur_num, 10);
  if (pnum === cnum || pnum + 1 === cnum) {
    return true;
  }
  if (cnum !== 1) {
    console.warn(
      "WARNING: found discontinuous page number",
      prev_page,
      cur_page,
    );
  }
  return cnum !== 1;
}

function parse_xml(parser, data) {
  data = data.replace(/^\uFEFF/, "").replace(/[^\0-~]/g, function (ch) {
    return "{{{" + ("0000" + ch.charCodeAt().toString(16)).slice(-5) + "}}}";
  });
  return parser.parseFromString(data, "text/xml");
}

export async function insert_xml_documents(pool, batch_size, slice) {
  const dom = new jsdom.JSDOM("");
  const parser = new dom.window.DOMParser();

  const xmlFiles = await glob("chocassye-corpus/data/*/*.xml");
  xmlFiles.sort();
  console.log("Total", xmlFiles.length, "files");
  let promises = [];
  for (let [i, file] of xmlFiles.entries()) {
    if (slice && i >= slice) {
      break;
    }

    if (promises.length >= batch_size) {
      const finished = await Promise.any(promises);
      promises = promises.filter((prom) => prom.id !== finished);
    }

    if (process.env.FILE) {
      if (!file.includes(process.env.FILE)) {
        continue;
      }
    }

    const pushTask = promisify(fs.readFile)(file, "utf8")
      .then((data) => {
        return parse_xml(parser, data);
      })
      .then(async (xml) => {
        const [book_details, sentences] = add_file(file, xml);
        return insert_into_db(pool, book_details, sentences);
      })
      .then(() => {
        console.log(i, "DONE", file);
        return i;
      })
      .catch((err) => {
        console.error(i, "ERROR", file, err.code, err.stack);
        return i;
      });

    pushTask.id = i;

    promises.push(pushTask);
  }
  await Promise.all(promises);
}
