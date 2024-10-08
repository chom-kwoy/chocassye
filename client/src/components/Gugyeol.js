import {hangul_to_yale} from './YaleToHangul';


export const GUGYEOL_READINGS = {
    '\uf696': 'ㄱ/기', '\uf77c': '?(갑)', '\uf681': '거', '\uf686': '겨', '\uf687': '고', '\uf690': '곰',
    '\uf68c': '과', '\uf6ab': '근', '\uf779': '긔', '\uf755': '?(ᄀᆞᆮ)', '\uf693': '?(ᄀᆞᆺ)', '\uf6ac': 'ㄴ/은',
    '\uf69b': '나', '\uf6a0': '노', '\uf6a4': '누', '\uf6a5': '니', '\uf6a8': 'ᄂᆞ', '\uf6b0': '다',
    '\uf765': '?(다)', '\uf711': '뎌', '\uf6bc': '뎌', '\uf6c0': '도', '\uf6c2': '두', '\uf6c7': '디',
    '\uf6ce': 'ᄃᆞ', '\uf708': '?(ᄃᆞ로)', '\uf6cf': 'ᄃᆞᆯ', '\uf6d0': 'ᄃᆡ', '\uf6ec': 'ㄹ/을', '\uf6ea': 'ㄹ/을',
    '\uf6d6': '라', '\uf6de': '로', '\uf6e2': '리', '\uf6e3': '리', '\uf703': 'ㅁ/음', '\uf6f2': '마',
    '\uf6fe': '?(모)', '\uf6f8': '며', '\uf6ff': '믈', '\uf709': '?(ㅂ)', '捨': 'ᄇᆞ리', '\uf706': 'ᄇᆞ/ᄇᆞᆺ',
    '\uf722': 'ㅅ', '\uf70a': '사/삼', '\uf70c': '삼', '\uf712': '?(삼/일)', '\uf710': '셔', '\uf71f': '시',
    '\uf71a': '시', '\uf720': 'ᄉᆞᆸ', '\uf72a': '아', '\uf73c': '여', '\uf73b': '여', '\uf73a': '?(여)',
    '\uf76e': '오/호', '\uf740': '오', '\uf69f': '우', '\uf748': '우', '\uf74d': '의', '\uf750': '이',
    '\uf6d2': '익', '\uf757': '일', '\uf75c': '자', '\uf760': '져', '\uf77b': '?(지)', '\uf766': '?(지ᇫ)',
    '\uf764': '텨', '\uf76b': '하', '\uf76d': '호/오', '\uf772': '히', '\uf6b4': '?(히/디)', '\uf775': 'ᄒᆞ',
    '\uf695': 'ᄒᆞᆫ/ᄀᆞᆫ', '\uf6d5': 'ᄒᆡ'
};

export const GUGYEOL_REGEX = /([恨捨\uf681\uf686\uf687\uf68c\uf690\uf693\uf695\uf696\uf69b\uf69f\uf6a0\uf6a4\uf6a5\uf6a8\uf6ab\uf6ac\uf6b0\uf6b4\uf6bc\uf6c0\uf6c2\uf6c7\uf6ce\uf6cf\uf6d0\uf6d2\uf6d5\uf6d6\uf6de\uf6e2\uf6e3\uf6ea\uf6ec\uf6f2\uf6f8\uf6fe\uf6ff\uf703\uf706\uf708\uf709\uf70a\uf70c\uf710\uf711\uf712\uf71a\uf71f\uf720\uf722\uf72a\uf73a\uf73b\uf73c\uf740\uf748\uf74d\uf750\uf755\uf757\uf75c\uf760\uf764\uf765\uf766\uf76b\uf76d\uf76e\uf772\uf775\uf779\uf77b\uf77c])/g;


export function suggestGugyeol(input) {
    if (input.length === 0) {
        return [];
    }
    input = hangul_to_yale(input);
    let suggestions = [];
    let visited = new Set();
    for (let len = 1; len <= 4; len++) {
        let searchPart = input.slice(-len);
        for (const [gugyeol, pron] of Object.entries(GUGYEOL_READINGS)) {
            let norm_pron = pron;
            if (pron.startsWith('?(')) {
                norm_pron = pron.slice(2, -1);
            }
            if (norm_pron.split('/').some((p) => hangul_to_yale(p).startsWith(searchPart))) {
                if (visited.has(gugyeol)) {
                    continue;
                }
                visited.add(gugyeol);
                suggestions.push({gugyeol: gugyeol, pron: pron, replaceLength: len});
            }
        }
    }
    return suggestions;
}
