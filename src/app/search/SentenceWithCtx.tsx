import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import {
  Box,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import { ThemeProvider, styled } from "@mui/material/styles";
import { Interweave } from "interweave";
import Link from "next/link";
import React from "react";

import { Book, SentenceWithContext } from "@/app/search/search";
import { darkTheme, lightTheme } from "@/app/themes";
import { highlight } from "@/components/Highlight";
import { ImagePreviewLink } from "@/components/ImageTooltip";
import { ThemeContext } from "@/components/ThemeContext";
import { useTranslation } from "@/components/TranslationProvider";
import { yale_to_hangul } from "@/components/YaleToHangul.mjs";
import { Sentence } from "@/utils/search";

function useOutsideAlerter<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: () => void,
) {
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // @ts-expect-error I dont know how to suppress this error
      if (ref.current && event.target && !ref.current.contains(event.target)) {
        callback();
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

const AlternatingBox = styled(Box)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export function SentenceWithCtx(props: {
  sentenceWithCtx: SentenceWithContext;
  book: Book;
  matchIdsInSentence: number[];
  highlightTerm: string;
  ignoreSep: boolean;
  romanize: boolean;
}) {
  const { t } = useTranslation();
  const [curTheme, _] = React.useContext(ThemeContext);
  const invTheme = curTheme === lightTheme ? darkTheme : lightTheme;
  const [isCtxOpen, setIsCtxOpen] = React.useState(false);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const removeCtxView = React.useCallback(() => {
    setIsCtxOpen(false);
  }, []);
  useOutsideAlerter(wrapperRef, removeCtxView);

  const [isHovered, setIsHovered] = React.useState(false);
  const [copyNotifOpen, setCopyNotifOpen] = React.useState(false);

  const makeWiktionaryCitation = React.useCallback(() => {
    const mainSent = props.sentenceWithCtx.mainSentence;
    const text = yale_to_hangul(
      mainSent.text_with_tone ?? mainSent.text,
    ) as string;
    const lng = props.book.year > 1600 ? "ko-ear" : "okm";
    const items = [
      `quote-book`,
      `${lng}`,
      `title=ko:${props.book.name}`,
      `year=${props.book.year_string}`,
    ];
    if (mainSent.page_start == mainSent.page_end) {
      items.push(`page=${mainSent.page_start}`);
    } else {
      items.push(`pages=${mainSent.page_start}-${mainSent.page_end}`);
    }
    items.push(`passage=^${text}.`);
    items.push(`t=<enter translation here>`);

    const prevSentence =
      props.sentenceWithCtx.contextBefore[
        props.sentenceWithCtx.contextBefore.length - 1
      ];
    const chinese =
      prevSentence?.lang === "chi"
        ? (yale_to_hangul(prevSentence.text) as string)
        : undefined;
    if (chinese !== undefined) {
      items.push(`origlang=lzh`);
      items.push(`origtext=lzh:${chinese}`);
    }

    return `{{${items.join("|")}}}`;
  }, [props.sentenceWithCtx, props.book]);

  React.useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (isHovered) {
        // Perform action when key is pressed and mouse is inside
        if (event.key === "w") {
          const citation = makeWiktionaryCitation();
          await navigator.clipboard.writeText(citation);
          setCopyNotifOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [makeWiktionaryCitation, isHovered]); // Re-run effect if isHovered changes

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Snackbar
        open={copyNotifOpen}
        autoHideDuration={1000}
        onClose={() => {
          setCopyNotifOpen(false);
        }}
        message={`Copied Wiktionary citation to clipboard.`}
      />
      <ThemeProvider theme={invTheme}>
        <Box
          className={`${invTheme.palette.mode}ThemeRoot`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: "translateY(-100%)",
            paddingBottom: ".5rem",
            zIndex: 100,
            display: isCtxOpen ? "inherit" : "none",
          }}
        >
          <Paper
            elevation={5}
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              opacity: 0.9,
            }}
          >
            {props.sentenceWithCtx.contextBefore.map((sentence, i) => (
              <AlternatingBox
                key={i}
                className={[
                  `sourceSentence`,
                  `sentence_type_${sentence.type}`,
                  `sentence_lang_${sentence.lang}`,
                ].join(" ")}
                style={{ lineHeight: 2.0 }}
                px={2}
              >
                <SentenceAndPage
                  sentence={sentence}
                  book={props.book}
                  matchIdsInSentence={null}
                  highlightTerm={props.highlightTerm}
                  ignoreSep={props.ignoreSep}
                  romanize={props.romanize}
                  showSource={false}
                />
              </AlternatingBox>
            ))}
          </Paper>
        </Box>
      </ThemeProvider>
      <Box className={"searchResultSentence"} sx={{ py: 0.4 }}>
        <SentenceAndPage
          sentence={props.sentenceWithCtx.mainSentence}
          book={props.book}
          matchIdsInSentence={props.matchIdsInSentence}
          highlightTerm={props.highlightTerm}
          ignoreSep={props.ignoreSep}
          romanize={props.romanize}
          showSource={true}
        />
        <span
          style={{
            position: "absolute", // make it take up no space
            bottom: 0,
            transform: "translateY(16%)",
          }}
        >
          <Tooltip title={t("Click to see context")}>
            <IconButton
              onClick={() => {
                setIsCtxOpen(!isCtxOpen);
              }}
            >
              <UnfoldMoreIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </span>
      </Box>
      <ThemeProvider theme={invTheme}>
        <Box
          className={`${invTheme.palette.mode}ThemeRoot`}
          style={{
            position: "absolute",
            left: 0,
            zIndex: 100,
            paddingTop: ".5rem",
            display: isCtxOpen ? "inherit" : "none",
          }}
        >
          <Paper
            elevation={5}
            style={{
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              opacity: 0.9,
            }}
          >
            {props.sentenceWithCtx.contextAfter.map((sentence, i) => (
              <AlternatingBox
                key={i}
                className={[
                  `sourceSentence`,
                  `sentence_type_${sentence.type}`,
                  `sentence_lang_${sentence.lang}`,
                ].join(" ")}
                style={{ lineHeight: 2.0 }}
                px={2}
              >
                <SentenceAndPage
                  sentence={sentence}
                  book={props.book}
                  matchIdsInSentence={null}
                  highlightTerm={props.highlightTerm}
                  ignoreSep={props.ignoreSep}
                  romanize={props.romanize}
                  showSource={false}
                />
              </AlternatingBox>
            ))}
          </Paper>
        </Box>
      </ThemeProvider>
    </div>
  );
}

function SentenceAndPage(props: {
  sentence: Sentence;
  book: Book;
  matchIdsInSentence: number[] | null;
  highlightTerm: string;
  ignoreSep: boolean;
  romanize: boolean;
  showSource: boolean;
}) {
  const theme = useTheme();
  const sourceTextColor =
    theme.palette.mode === "light" ? grey["600"] : grey["400"];

  const sentence = props.sentence;

  return (
    <React.Fragment>
      {/* Highlighted sentence */}
      <Interweave
        className="text"
        content={highlight(
          sentence.html ?? sentence.text,
          props.highlightTerm,
          props.matchIdsInSentence,
          props.romanize,
          props.ignoreSep,
        )}
        allowList={["mark", "span", "a"]}
        allowAttributes={true}
      />
      {props.showSource ? (
        <>
          {" "}
          {/* Add source link */}
          <span style={{ color: sourceTextColor }}>
            [
            <Link
              className="sourceLink"
              rel="noopener noreferrer"
              target="_blank" // Open in new tab
              href={
                "/source?" +
                new URLSearchParams({
                  name: props.book.name,
                  n: `${sentence.number_in_book}`,
                  hl: props.highlightTerm,
                  is: props.ignoreSep ? "yes" : "no",
                }).toString()
              }
              style={{ textDecoration: `underline dotted ${sourceTextColor}` }}
            >
              {props.book.name}
            </Link>
            {sentence.page_start === null ? "" : ":"}
            <ImagePreviewLink
              page_start={sentence.page_start}
              page_end={sentence.page_end}
              scan_urls={sentence.scan_urls}
              sourceTextColor={sourceTextColor}
            />
            ]
          </span>
        </>
      ) : null}
    </React.Fragment>
  );
}
