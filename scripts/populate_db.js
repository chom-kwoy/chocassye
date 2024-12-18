'use strict';

import fs from 'fs';
import path from 'path';
import glob from 'glob';
import jsdom from 'jsdom';
import {promisify} from 'util';

import pg from 'pg';
import {hangul_to_yale} from '../client/src/components/YaleToHangul.mjs';
import {insert_into_db} from "./insert_into_db.js";
import {parse_year_string, year_and_bookname_from_filename} from "./parse_utils.js";

function uni(str) {
    return str.replace(/{{{[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]}}}/g, function(ch) {
        return String.fromCharCode(parseInt(ch.slice(3, 8), 16));
    });
}

function find_year(doc) {
    let year_elem = doc.querySelectorAll('meta year');
    if (year_elem !== null) {
        if (year_elem.attributes !== undefined && year_elem.attributes.n !== undefined) {
            return uni(year_elem.attributes.n.value).trim();
        }
    }
    year_elem = doc.querySelector('teiHeader date');
    if (year_elem !== null) {
        return uni(year_elem.textContent).trim();
    }

    return null;
}

function findAttributions(doc) {
    let respStmts = doc.querySelectorAll('teiHeader respStmt');
    let attributions = [];
    for (let respStmt of respStmts) {
        let resp = respStmt.querySelector('resp');
        let name = respStmt.querySelector('name');
        if (name !== null && uni(name.textContent).trim() !== '') {
            attributions.push({
                role: resp? uni(resp.textContent).trim() : null,
                name: uni(name.textContent).trim(),
            });
        }
    }
    return attributions;
}

function findBibl(doc) {
    let notesStmt = doc.querySelector('teiHeader notesStmt');
    if (notesStmt !== null) {
        let bibl = notesStmt.querySelector('bibl');
        if (bibl !== null) {
            let infos = [];
            for (let child of bibl.children) {
                if (child.tagName !== 'date' && child.tagName !== 'year') {
                    if (uni(child.textContent).trim() !== '') {
                        infos.push(uni(child.textContent).trim());
                    }
                }
            }
            return infos.join('; ')
        }
    }
    let meta = doc.querySelector('meta');
    if (meta !== null) {
        let photograph = meta.querySelectorAll('photograph');
        if (photograph.length > 0) {
            return [...photograph].map((p) => uni(p.textContent).trim()).join(', ');
        }
    }
    return null;
}

function add_file(file, xml) {
    const errorNode = xml.querySelector('parsererror');
    if (errorNode) {
        throw new Error("parse failed: " + errorNode.innerHTML);
    }

    let {filename, year_string} = year_and_bookname_from_filename(file);

    let doc = xml.documentElement;

    // check if doc has hasImages attribute
    let hasImages = (
        doc.attributes.hasImages !== undefined &&
        doc.attributes.hasImages.value === 'true'
    );

    if (year_string === null) {
        year_string = find_year(doc).normalize('NFKC');
    }
    let {year, year_start, year_end} = parse_year_string(year_string);
    
    let has_tone_tag = doc.querySelector('meta > has-tone');
    let has_tone = (has_tone_tag && has_tone_tag.attributes.value.value);

    let attributions = findAttributions(doc);
    let bibliography = findBibl(doc);

    let elements = doc.querySelectorAll(
        ':not(meta):not(titleStmt):not(bibl) > sent,' +
        ':not(meta):not(titleStmt):not(bibl) > mark,' +
        ':not(meta):not(titleStmt):not(bibl) > title,' +
        ':not(meta):not(titleStmt):not(bibl) > head,' +
        ':not(meta):not(titleStmt):not(bibl) > chr,' +
        ':not(meta):not(titleStmt):not(bibl) > c,' +
        ':not(meta):not(titleStmt):not(bibl) > page'
    );
    console.log(`${filename}: ${elements.length} sentences selected.`);

    let book_details = {
        filename: filename,
        year: year,
        year_sort: year?? 9999,
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
    let global_page = null;
    let non_chinese_sentence_count = 0;
    for (let sentence of elements) {
        if (sentence.tagName === "mark") {
            let attr = sentence.attributes;
            let type = attr.type === undefined? null : uni(attr.type.value.trim());
            let text = uni(sentence.textContent.trim());

            sentences.push({
                filename: filename,
                text: text,
                type: type,
                number_in_book: index
            });
            non_chinese_sentence_count += 1;
            index += 1;
        }
        else if (sentence.tagName === "page") {
            let attr = sentence.attributes;
            if (attr.n !== undefined) {
                global_page = uni(attr.n.value.trim());
            }
        }
        else {
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
                let page = attr.page === undefined? global_page : uni(attr.page.value.trim());
                let type = attr.type === undefined? null : uni(attr.type.value.trim());
                let lang = attr.lang === undefined? null : uni(attr.lang.value.trim());
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

                const text_without_sep = text.replace(/[ .^]/g, '');
                sentences.push({
                    filename: filename,
                    text: text,
                    text_without_sep: text_without_sep,
                    text_with_tone: text_with_tone,
                    html: html,
                    type: type,
                    lang: lang,
                    page: page,
                    orig_tag: sentence.tagName,
                    number_in_page: number_in_page,
                    number_in_book: index,
                    hasImages: hasImages,
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

    book_details['non_chinese_sentence_count'] = non_chinese_sentence_count;

    return [ book_details, sentences ];
}

function parse_xml(parser, data) {
    data = data.replace(/^\uFEFF/, '').replace(/[^\0-~]/g, function (ch) {
        return "{{{" + ("0000" + ch.charCodeAt().toString(16)).slice(-5) + "}}}";
    });
    return parser.parseFromString(data, "text/xml");
}

function insert_documents(pool) {
    const dom = new jsdom.JSDOM("");
    const DOMParser = dom.window.DOMParser;
    const parser = new DOMParser;

    return promisify(glob)(
        "chocassye-corpus/data/*/*.xml"
    ).then(async xmlFiles => {
        console.log("Total", xmlFiles.length, "files");

        let promises = [];
        for (let [i, file] of xmlFiles.entries()) {
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
                })
                .catch((err) => {
                    console.error(i, "ERROR", file, err.code, err.stack);
                });
            promises.push(pushTask);

            const BATCH_SIZE = process.env.BATCH || 16;
            if (i % BATCH_SIZE === BATCH_SIZE - 1) {
                await Promise.all(promises);
                promises = [];
            }
        }
        await Promise.all(promises);
    });
}


function populate_db() {
    const { Pool } = pg;
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'chocassye',
        password: 'password',
    });
    console.log("Connected successfully to server");

    // drop tables `books` and `sentences`
    return pool.query('DROP TABLE IF EXISTS books, sentences, ngrams, ngram_rel CASCADE;')
        .then(() => {
            console.log("Dropped tables.");
            const create_books = `
                CREATE TABLE books (
                    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                    filename TEXT,
                    year INTEGER,
                    year_sort INTEGER, 
                    decade_sort INTEGER, 
                    year_start INTEGER, 
                    year_end INTEGER, 
                    year_string TEXT, 
                    attributions JSONB, 
                    bibliography TEXT, 
                    num_sentences INTEGER, 
                    non_chinese_sentence_count INTEGER
                );
            `;
            const create_sentences = `
                CREATE TABLE sentences (
                    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                    filename TEXT,
                    text TEXT,
                    text_without_sep TEXT,
                    text_with_tone TEXT,
                    html TEXT, 
                    type TEXT, 
                    lang TEXT, 
                    page TEXT, 
                    orig_tag TEXT, 
                    number_in_page TEXT, 
                    number_in_book INTEGER, 
                    hasImages BOOLEAN, 
                    year_sort INTEGER, 
                    decade_sort INTEGER
                );
            `;
            const create_ngrams = `
                CREATE TABLE ngrams (
                    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                    ngram VARCHAR(4),
                    is_without_sep BOOLEAN,
                    UNIQUE(ngram, is_without_sep)
                );
            `;
            return Promise.all([
                pool.query(create_books),
                pool.query(create_sentences),
                pool.query(create_ngrams),
            ]);
        })
        .then(() => {
            const create_ngram_rel = `
                CREATE TABLE ngram_rel (
                    ngram_id INTEGER REFERENCES ngrams(id),
                    sentence_id INTEGER REFERENCES sentences(id),
                    PRIMARY KEY(ngram_id, sentence_id)
                );
            `;
            return pool.query(create_ngram_rel);
        })
        .then(() => {
            return insert_documents(pool);
        })
        .then(() => {
            console.log("Populated tables.");
            console.log("Creating indexes...");
            return pool.query(`
                CREATE INDEX IF NOT EXISTS sentence_id
                    ON public.ngram_rel USING btree
                    (sentence_id ASC NULLS LAST)
                    WITH (deduplicate_items=True)
                    TABLESPACE pg_default; 
           `);
        })
        .then(() => {
            return pool.query(`
                CREATE INDEX IF NOT EXISTS decade_sort
                    ON public.sentences USING btree
                    (decade_sort ASC NULLS LAST)
                    WITH (deduplicate_items=True)
                    TABLESPACE pg_default;
           `);
        })
        .then(() => {
            return pool.query(`
                CREATE INDEX IF NOT EXISTS sentences_year_sort_filename_number_in_book_idx
                    ON public.sentences USING btree
                    (year_sort ASC NULLS LAST, filename COLLATE pg_catalog."default" ASC NULLS LAST, number_in_book ASC NULLS LAST)
                    WITH (deduplicate_items=True)
                    TABLESPACE pg_default;
           `);
        })
        .then(() => {
            console.log("Created indexes.");
        });
}

await populate_db();
