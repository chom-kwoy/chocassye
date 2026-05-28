import {
  HANGUL_REGEX,
  TONED_SYLLABLE_REGEX,
  UNTONED_SYLLABLE_REGEX,
} from "@/components/hangulData.ts";
import { invert_mapping, replace_and_map } from "@/components/mappingUtils";

import { GUGYEOL_READINGS, GUGYEOL_REGEX } from "./Gugyeol";
import { searchTerm2Regex } from "./Regex.mjs";
import { yale_to_hangul } from "./YaleToHangul";
import { highlightColors } from "./client_utils";

export function toText(sentence, ignoreSep) {
  let mapping;

  // Remove HTML tags
  [sentence, mapping] = replace_and_map(sentence, /(<[^>]*>)/g, function () {
    return ".";
  });

  // Select full syllables
  [sentence, mapping] = replace_and_map(
    sentence,
    UNTONED_SYLLABLE_REGEX,
    function (_, syllable) {
      return syllable;
    },
    mapping,
  );

  if (ignoreSep) {
    // Remove spaces, periods, and caret if ignoreSep is set
    [sentence, mapping] = replace_and_map(
      sentence,
      /[ .^@]/g,
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
  [sentence, mapping] = replace_and_map(sentence, /(<[^>]*>)/g, function () {
    return ".";
  });

  // Replace toned syllables with untoned syllables
  [sentence, mapping] = replace_and_map(
    sentence,
    TONED_SYLLABLE_REGEX,
    function (_, syllable) {
      return syllable;
    },
    mapping,
  );

  if (ignoreSep) {
    // Remove spaces, periods, and caret if ignoreSep is set
    [sentence, mapping] = replace_and_map(
      sentence,
      /[ .^@]/g,
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
    [sentence, mapping] = replace_and_map(
      sentence,
      /([^>[\]]+)(?![^<]*>)/g,
      function (match) {
        let { result, mapping } = yale_to_hangul(match, true);
        return [result, mapping];
      },
      mapping,
    );
  }

  // replace comments
  [sentence, mapping] = replace_and_map(
    sentence,
    /<!--([\s\S\n]*?)-->/g,
    function (_, comment) {
      comments.push(yale_to_hangul(comment));
      let commentIdx = comments.length;
      return `<a class="footnoteLink" id="notefrom${commentIdx}" href="#note${commentIdx}" data-footnotenum="${commentIdx}"></a>`;
    },
    mapping,
  );

  // replace opening/closing custom tags with span
  [sentence, mapping] = replace_and_map(
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
  [sentence, mapping] = replace_and_map(
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
    [sentence, mapping] = replace_and_map(
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
  [sentence, mapping] = replace_and_map(
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
  let inv_mapping = invert_mapping(targetMapping);

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
  if (searchTerm === "") {
    return [];
  }
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
