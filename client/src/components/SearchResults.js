import {Trans, useTranslation} from "react-i18next";
import React from "react";
import {
    Backdrop,
    Box, Checkbox,
    Chip,
    CircularProgress, FormControlLabel,
    Grid, Pagination,
    Paper,
    Table,
    TableBody,
    TableContainer,
    Tooltip, Typography
} from "@mui/material";
import {highlightColors, StyledTableCell, StyledTableRow} from "./utils";
import {zip} from "./common_utils.mjs";
import {Interweave} from "interweave";
import {Link} from "react-router-dom";
import {IMAGE_BASE_URL} from "./config";
import {styled} from "@mui/material/styles";
import {tooltipClasses} from "@mui/material/Tooltip";
import {
    addHighlights,
    getMatchingRanges,
    removeOverlappingRanges,
    searchTerm2Regex,
    toDisplayHTML,
    toText,
    toTextIgnoreTone
} from "./Highlight";
import {yale_to_hangul} from "./YaleToHangul.mjs";
import Histogram from "./Histogram";
import HowToPage from "./HowToPage";

function SearchResultsList(props) {
    const { t } = useTranslation();

    let footnotes = [];

    return <React.Fragment>

        <Grid item xs={12}>
            <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                    <TableBody>

                        {/* For each book */}
                        {props.filteredResults.map(([book, match_ids_in_book], i) =>
                            <StyledTableRow key={i}>

                                {/* Year column */}
                                <StyledTableCell component="th" scope="row" sx={{ verticalAlign: 'top' }}>
                                    <Grid item sx={{ py: 0.4 }}>
                                        <Tooltip title={book.year_string}>
                                            <Box>{
                                                book.year === null ? (
                                                    t("Unknown year")
                                                ) : (
                                                    book.year_end - book.year_start > 0 ? (
                                                        'c.\u00a0' + book.year
                                                    ) : book.year
                                                )
                                            }</Box>
                                        </Tooltip>
                                    </Grid>
                                </StyledTableCell>

                                {/* Sentences column */}
                                <StyledTableCell>

                                    {/* For each sentence */}
                                    {zip(book.sentences, match_ids_in_book)
                                        .map(([sentence, match_ids_in_sentence], i) =>
                                            <Grid item key={i} sx={{ py: 0.4 }}>

                                                {/* Highlighted sentence */}
                                                <Interweave
                                                    content={highlight(
                                                        sentence.html ?? sentence.text,
                                                        props.resultTerm,
                                                        match_ids_in_sentence,
                                                        footnotes,
                                                        props.romanize,
                                                        props.ignoreSep,
                                                    )}
                                                    allowList={['mark', 'span', 'a']}
                                                    allowAttributes={true}
                                                />&#8203;

                                                {/* Add source link */}
                                                <span style={{color: '#888'}}>
                                                    &lang;
                                                    <Link className="sourceLink"
                                                          to={`/source?name=${book.name}&n=${sentence.number_in_book}&hl=${props.resultTerm}`}
                                                          style={{textDecoration: "underline dotted lightgrey"}}>
                                                        {sentence.page === null? book.name : `${book.name}:`}
                                                    </Link>
                                                    {sentence.hasImages && sentence.page !== '' ?
                                                        sentence.page.split('-').map((page, i) => {
                                                            const imageURL = IMAGE_BASE_URL + book.name + '/' + page + '.jpg';
                                                            return <ImageTooltip title={pageImagePreview(page, imageURL, t)}
                                                                                 placement="right" key={i}>
                                                    <span>
                                                        <a className="pageNum"
                                                           style={{color: '#888', textDecoration: 'underline'}}
                                                           href={imageURL}
                                                           target="blank"
                                                           key={i}>{page}</a>
                                                        {i < sentence.page.split('-').length - 1? "-" : null}
                                                    </span>
                                                            </ImageTooltip>
                                                        }) : (sentence.page !== '' ? sentence.page : null)}
                                                    &rang;
                                                </span>

                                            </Grid>
                                        )}

                                </StyledTableCell>

                            </StyledTableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>

        <Grid item xs={12} container alignItems="flex-start" spacing={1.5} className="searchResultsList">
            {footnotes.length > 0? <div className="dividerFootnote"></div> : null}

            {/* Show footnotes */}
            {footnotes.map((footnote, i) =>
                <div key={i} className="footnoteContent">
                    <a className="footnoteLink" id={`note${i+1}`} href={`#notefrom${i+1}`} data-footnotenum={`${i+1}`}></a>
                    &nbsp;
                    {footnote}
                </div>
            )}
        </Grid>

    </React.Fragment>;
}


const ImageTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#f5f5f9',
        color: 'rgba(0, 0, 0, 0.87)',
        maxWidth: window.innerWidth * 0.3,
        fontSize: theme.typography.pxToRem(12),
        border: '1px solid #dadde9',
    },
}));


function pageImagePreview(page, imageURL, t) {
    return <React.Fragment>
        <Grid container>
            <Grid item xs={12}>
                <img src={imageURL}
                     alt={t("Image for page", { page: page })}
                     height={window.innerHeight - 50}
                     width={window.innerWidth - 50}
                     style={{maxHeight: "100%", maxWidth: "100%", objectFit: "scale-down"}}
                />
            </Grid>
            <Grid item xs={12}>
                {t("Image for page", { page: page })}
            </Grid>
        </Grid>
    </React.Fragment>;
}

function highlight(text, searchTerm, match_ids, footnotes, romanize, ignoreSep) {

    // Into HTML for display
    let [displayHTML, displayHTMLMapping] = toDisplayHTML(text, footnotes, romanize);

    // Find matches
    let hlRegex = searchTerm2Regex(searchTerm, ignoreSep);
    let match_ranges = [
        ...getMatchingRanges(
            hlRegex,
            ...toText(text, ignoreSep),  // Remove HTML tags, retain tones
            displayHTMLMapping
        ),
        ...getMatchingRanges(
            hlRegex,
            ...toTextIgnoreTone(text, ignoreSep),  // Remove HTML tags and tones
            displayHTMLMapping
        )
    ];

    // Remove overlapping ranges
    match_ranges = removeOverlappingRanges(match_ranges, displayHTML.length);

    // Add highlights
    return addHighlights(displayHTML, match_ranges, match_ids, highlightColors);
}

let SearchResultsWrapper = function (props) {
    const { t } = useTranslation();

    const [disabledMatches, setDisabledMatches] = React.useState(new Set());

    let num_pages = Math.ceil(props.numResults / props.pageN);

    // Determine highlight colors
    let matches = [];

    function toggleMatch(_, i) {
        let disabledMatches_ = new Set(disabledMatches);
        if (disabledMatches_.has(i)) {
            disabledMatches_.delete(i);
        }
        else {
            disabledMatches_.add(i);
        }

        setDisabledMatches(disabledMatches_);
    }

    React.useEffect(() => {
        setDisabledMatches(new Set());
    }, [props.resultTerm, props.page, props.doc]);

    for (const book of props.results) {
        let book_parts = [];
        for (const sentence of book.sentences) {

            let text = sentence.html ?? sentence.text;

            // Find matches
            let hlRegex = searchTerm2Regex(props.resultTerm, props.ignoreSep);
            let [rawText, rawTextRanges] = toText(text, props.ignoreSep);
            let match_ranges = [
                ...getMatchingRanges(hlRegex, rawText, rawTextRanges, rawTextRanges),
                ...getMatchingRanges(hlRegex, ...toTextIgnoreTone(text, props.ignoreSep), rawTextRanges),
            ];

            // Remove overlapping ranges
            match_ranges = removeOverlappingRanges(match_ranges, rawText.length);

            let parts = [];
            for (let range of match_ranges) {
                parts.push(yale_to_hangul(rawText.slice(...range)));
            }

            book_parts.push(parts);
        }
        matches.push(book_parts);
    }

    // List of unique matches in current page
    let uniqueMatches = [...new Set(matches.flat(2))];

    // Array(book)[Array(sentence)[Array(matches)[int]]]
    let match_ids = matches.map(
        (matches_in_book) => matches_in_book.map(
            (matches_in_sentence) => matches_in_sentence.map(
                (match) => uniqueMatches.indexOf(match)
            )
        )
    );

    let filtered_results_list = zip(
        props.results,
        match_ids
    )
        //.filter(
        //    ([_, match_ids_in_book]) => // filter out entire book if there are no valid matches in it
        //        !match_ids_in_book.flat().every(
        //            id => props.disabledMatches.has(id)
        //        )
        //)
        .map(([book, match_ids_in_book]) => { // filter out sentence if there are no valid matches in it

            let sentences_and_indices =
                zip(book.sentences, match_ids_in_book);
            //.filter(
            //    ([_, match_ids_in_sentence]) =>
            //        !match_ids_in_sentence.every(
            //            id => props.disabledMatches.has(id)
            //        )
            //);

            let [sentences, indices] = zip(...sentences_and_indices);

            return [{...book, sentences: sentences}, indices];
        });

    return <React.Fragment>

        <Grid item xs={12} container sx={{position: 'relative'}}>
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    position: 'absolute',
                }}
                open={!props.statsLoaded}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Histogram data={props.histogram} setPage={props.setPage} pageN={props.pageN}/>
        </Grid>

        {/* Show highlight match legend */}
        <Grid item xs mt={1} mb={2} container columnSpacing={1} spacing={1}>
            {uniqueMatches.map((part, i) =>
                <Grid key={i} item xs="auto">
                    <Chip
                        label={part}
                        sx={{backgroundColor: highlightColors[i % highlightColors.length]}}
                        size="small"
                        onDelete={() => null}
                        clickable>
                        {/*<span className={disabledMatches.has(i)? "matchLegendItem disabled" : "matchLegendItem"}
                               onClick={(event) => {toggleMatch(event, i)}}>
                            <span className={"".concat("colorShower s", i)}></span>
                            <span className="matchLegendWord">{part}</span>
                        </span>*/}
                    </Chip>
                </Grid>
            )}
        </Grid>

        <Grid item sm="auto" sx={{display: {'xs': 'none', 'sm': 'flex'}}}>
            <FormControlLabel
                control={<Checkbox size="small" sx={{py: 0}} />}
                label={
                    <Typography sx={{fontSize: "1em"}}>
                        {t("Romanization")}
                    </Typography>
                }
                checked={props.romanize}
                onChange={(event) => props.handleRomanizeChange(event.target.checked)}
            />
        </Grid>

        {/* Pager on top */}
        <Grid item xs={12}>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center">
                {filtered_results_list.length > 0?
                    <Pagination
                        color="primary"
                        count={num_pages}
                        siblingCount={2}
                        boundaryCount={2}
                        page={props.page}
                        onChange={(_, page) => props.setPage(page)}
                    /> : null}
            </Box>
        </Grid>

        {/* Results area */}
        <Grid item xs={12}>
            {filtered_results_list.length > 0?
                null:
                <div>
                    <Trans i18nKey='No match. Please follow the instructions below for better results.' />
                    <HowToPage title=""/>
                </div>
            }
        </Grid>

        <SearchResultsList
            filteredResults={filtered_results_list}
            romanize={props.romanize}
            ignoreSep={props.ignoreSep}
            resultTerm={props.resultTerm}
        />

        {/* Pager on bottom */}
        <Grid item xs={12} marginTop={1}>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center">
                {filtered_results_list.length > 0?
                    <Pagination
                        color="primary"
                        count={num_pages}
                        siblingCount={2}
                        boundaryCount={2}
                        page={props.page}
                        onChange={(_, page) => props.setPage(page)}
                    /> : null}
            </Box>
        </Grid>
    </React.Fragment>;
}

function arePropsEqual(oldProps, newProps) {
    let equal = true;
    for (let key of Object.keys(oldProps)) {
        if (key === 'setPage') {
            continue;
        }
        const isEqual = Object.is(oldProps[key], newProps[key]);
        equal &&= isEqual;
    }
    return equal;
}
SearchResultsWrapper = React.memo(SearchResultsWrapper, arePropsEqual);

export default SearchResultsWrapper;
