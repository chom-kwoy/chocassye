import { invertMapping, replaceAndMap } from "@/components/StringMapping.ts";

import { GUGYEOL_READINGS, GUGYEOL_REGEX } from "./Gugyeol";
import { searchTerm2Regex } from "./Regex.mjs";
import { yaleToHangul } from "./YaleToHangul.js";
import { highlightColors } from "./client_utils";

// TODO: Generate these from YaleToHangul.js
const HANGUL_REGEX =
  /((?:ᄀ|ᄁ|ᄂ|ᄔ|ᄃ|ᄄ|ᄅ|ᄆ|ᄇ|ᄈ|ᄉ|ᄊ|ᄋ|ᅇ|ᄌ|ᄍ|ᄎ|ᄏ|ᄐ|ᄑ|ᄒ|ᄞ|ᄠ|ᄡ|ᄢ|ᄣ|ᄧ|ᄩ|ᄫ|ᄭ|ᄮ|ᄯ|ᄲ|ᄶ|ᄻ|ᅀ|ᅘ|ᅙ|ᅌ|ᅟ)(?:ᅡ|ᅢ|ᅣ|ᅤ|ᅥ|ᅦ|ᅧ|ᅨ|ᅩ|ᅪ|ᅫ|ᅬ|ᅭ|ᅮ|ᅯ|ᅰ|ᅱ|ᅲ|ᅳ|ᅴ|ᅵ|ᆞ|ᆡ|ᆈ|ᆔ|ᆑ|ᆒ|ᆄ|ᆅ)(?:ᆨ|ᆪ|ᆫ|ᆮ|ᆯ|ᆰ|ᆱ|ᆲ|ᆳ|ᆷ|ᆸ|ᆹ|ᆺ|ᆼ|ᇆ|ᇇ|ᇈ|ᇌ|ᇗ|ᇙ|ᇜ|ᇝ|ᇟ|ᇢ|ᇦ|ᇫ|ᇰ|ᇹ|ᇱ|))(〮|〯|)/g;
const TONED_SYLLABLE_REGEX =
  /((?:psk|pst|psc|pth|ss\/|cc\/|ch\/|ss\\|cc\\|ch\\|kk|nn|tt|pp|ss|GG|cc|ch|kh|th|ph|pk|pt|ps|pc|sk|sn|st|sp|sc|sh|hh|ng|s\/|c\/|s\\|c\\|k|n|t|l|m|p|s|G|c|h|W|z|q|`)(?:ywey|yway|yay|yey|way|woy|wey|wuy|yoy|yuy|ywe|ywa|ay|ya|ey|ye|wo|wa|yo|wu|we|yu|uy|oy|a|e|u|i|o)(?:lth|lph|nth|lks|mch|ngs|kk|ks|nc|nh|lk|lm|lp|ls|lh|ps|ss|ch|kh|th|ph|nt|ns|nz|lz|lq|mk|mp|ms|mz|sk|st|ng|pl|k|n|t|l|m|p|s|G|c|h|M|W|z|f|q|))(L|H|R|)(?![^<]*>)/g;
const UNTONED_SYLLABLE_REGEX =
  /((?:psk|pst|psc|pth|ss\/|cc\/|ch\/|ss\\|cc\\|ch\\|kk|nn|tt|pp|ss|GG|cc|ch|kh|th|ph|pk|pt|ps|pc|sk|sn|st|sp|sc|sh|hh|ng|s\/|c\/|s\\|c\\|k|n|t|l|m|p|s|G|c|h|W|z|q|`)(?:ywey|yway|yay|yey|way|woy|wey|wuy|yoy|yuy|ywe|ywa|ay|ya|ey|ye|wo|wa|yo|wu|we|yu|uy|oy|a|e|u|i|o)(?:lth|lph|nth|lks|mch|ngs|kk|ks|nc|nh|lk|lm|lp|ls|lh|ps|ss|ch|kh|th|ph|nt|ns|nz|lz|lq|mk|mp|ms|mz|sk|st|ng|pl|k|n|t|l|m|p|s|G|c|h|M|W|z|f|q|))(?![^<]*>)/g;

export function toText(sentence, ignoreSep) {
  let mapping;

  // Remove HTML tags
  [sentence, mapping] = replaceAndMap(sentence, /(<[^>]*>)/g, function () {
    return ".";
  });

  // Select full syllables
  [sentence, mapping] = replaceAndMap(
    sentence,
    UNTONED_SYLLABLE_REGEX,
    function (_, syllable) {
      return syllable;
    },
    mapping,
  );

  if (ignoreSep) {
    // Remove spaces, periods, and caret if ignoreSep is set
    [sentence, mapping] = replaceAndMap(
      sentence,
      /[ .^]/g,
      function () {
        return "";
      },
      mapping,
    );
  }

  return [sentence, mapping];
}

export function toTextIgnoreTone(sentence, ignoreSep) {
  let mapping;

  // Remove HTML tags
  [sentence, mapping] = replaceAndMap(sentence, /(<[^>]*>)/g, function () {
    return ".";
  });

  // Replace toned syllables with untoned syllables
  [sentence, mapping] = replaceAndMap(
    sentence,
    TONED_SYLLABLE_REGEX,
    function (_, syllable) {
      return syllable;
    },
    mapping,
  );

  if (ignoreSep) {
    // Remove spaces, periods, and caret if ignoreSep is set
    [sentence, mapping] = replaceAndMap(
      sentence,
      /[ .^]/g,
      function () {
        return "";
      },
      mapping,
    );
  }

  return [sentence, mapping];
}

export function toDisplayHTML(sentence, romanize = false) {
  let comments = [];
  let mapping = null;

  // yale to hangul (ignoring tags)
  if (!romanize) {
    [sentence, mapping] = replaceAndMap(
      sentence,
      /([^>[\]]+)(?![^<]*>)/g,
      function (match) {
        let { result, mapping } = yaleToHangul(match, true);
        return [result, mapping];
      },
      mapping,
    );
  }

  // replace comments
  [sentence, mapping] = replaceAndMap(
    sentence,
    /<!--([\s\S\n]*?)-->/g,
    function (_, comment) {
      comments.push(yaleToHangul(comment));
      let commentIdx = comments.length;
      return `<a class="footnoteLink" id="notefrom${commentIdx}" href="#note${commentIdx}" data-footnotenum="${commentIdx}"></a>`;
    },
    mapping,
  );

  // replace opening/closing custom tags with span
  [sentence, mapping] = replaceAndMap(
    sentence,
    /<(\/)?([^ >]*)[^>]*>/g,
    function (match, closing, tag) {
      if (tag === "a") {
        return match; // skip footnotes
      }
      if (closing) {
        return "</span>";
      }
      return `<span orig-tag="${tag}">`;
    },
    mapping,
  );

  // replace [] with <span> anno tags
  [sentence, mapping] = replaceAndMap(
    sentence,
    /(\[|\])/g,
    function (match) {
      if (match === "[") {
        return `<span orig-tag="anno">`;
      } else {
        return `</span>`;
      }
    },
    mapping,
  );

  // Render tone marks on top of syllable
  if (!romanize) {
    [sentence, mapping] = replaceAndMap(
      sentence,
      HANGUL_REGEX,
      function (_, syllable, tone) {
        if (tone === "") {
          return `<span data-tone="L">${syllable}</span>`;
        } else if (tone === "\u302e") {
          return `<span data-tone="H">${syllable}<span is-tone>${tone}</span></span>`;
        } else if (tone === "\u302f") {
          return `<span data-tone="R">${syllable}<span is-tone>${tone}</span></span>`;
        }
      },
      mapping,
    );
  }

  // Add tooltips to gugyeol characters
  [sentence, mapping] = replaceAndMap(
    sentence,
    GUGYEOL_REGEX,
    function (ch) {
      return `<abbr data-title=${GUGYEOL_READINGS[ch]} tabindex="0">${ch}</abbr>`;
    },
    mapping,
  );

  return [sentence, mapping];
}

function getMatchingRanges(
  hlRegex,
  targetText,
  targetMapping,
  displayHTMLMapping = null,
) {
  let inv_mapping = invertMapping(targetMapping);

  let match_ranges = [];
  let match;
  const regex = new RegExp(hlRegex.source, "g");
  while ((match = regex.exec(targetText)) !== null) {
    let matchBegin = match.index;
    let matchEnd = match.index + match[0].length;
    let match_range = [
      inv_mapping[matchBegin][0],
      inv_mapping[matchEnd - 1][1],
    ];
    if (displayHTMLMapping !== null) {
      match_range = [
        displayHTMLMapping[match_range[0]][0],
        displayHTMLMapping[match_range[1] - 1][1],
      ];
    }
    match_ranges.push(match_range);
  }

  return match_ranges;
}

function removeOverlappingRanges(match_ranges, max_length) {
  let match_ranges_unique = [];
  let matched = Array(max_length).fill(false);
  for (let range of match_ranges) {
    if (matched.slice(...range).some((v) => v)) {
      continue;
    }
    match_ranges_unique.push(range);
    for (let i = range[0]; i < range[1]; ++i) {
      matched[i] = true;
    }
  }
  match_ranges_unique.sort((a, b) => a[0] - b[0]);
  return match_ranges_unique;
}

function addHighlights(displayHTML, match_ranges, highlightIds = null) {
  let output = "";
  let last_idx = 0;
  let hl_idx = 0;
  for (let range of match_ranges) {
    output += displayHTML.slice(last_idx, range[0]);

    let color = null;
    if (highlightIds !== null) {
      let colorIdx = highlightIds[hl_idx];
      color = colorIdx % highlightColors.length;
    }
    let mark_text = displayHTML.slice(range[0], range[1]);
    output += `<mark data-hl-id="${color}">${mark_text}</mark>`;

    hl_idx += 1;
    last_idx = range[1];
  }
  output += displayHTML.slice(last_idx);
  return output;
}

export function findMatchingRanges(
  originalText,
  displayText,
  displayTextMapping,
  searchTerm,
  ignoreSep,
) {
  try {
    // Find matches
    let hlRegex = searchTerm2Regex(searchTerm, ignoreSep);
    let match_ranges = [
      ...getMatchingRanges(
        hlRegex,
        ...toText(originalText, ignoreSep),
        displayTextMapping,
      ),
      ...getMatchingRanges(
        hlRegex,
        ...toTextIgnoreTone(originalText, ignoreSep),
        displayTextMapping,
      ),
    ];

    // Remove overlapping ranges
    return removeOverlappingRanges(match_ranges, displayText.length);
  } catch (error) {
    console.error("Error finding matching ranges:", error);
    return [];
  }
}

export function highlight(text, searchTerm, match_ids, romanize, ignoreSep) {
  // Into HTML for display
  let [displayHTML, displayHTMLMapping] = toDisplayHTML(text, romanize);

  // Find matches
  const match_ranges = findMatchingRanges(
    text,
    displayHTML,
    displayHTMLMapping,
    searchTerm,
    ignoreSep,
  );

  // Add highlights
  return addHighlights(displayHTML, match_ranges, match_ids);
}
