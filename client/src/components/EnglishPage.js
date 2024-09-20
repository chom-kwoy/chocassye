import React from 'react';
import './i18n';


async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        body: JSON.stringify(data)
    });
    return response.json();
}


function TestWrapper(props) {

    const [ state, setState ] = React.useState({
        hangulOutput: "우오티즈디쓰",
        englishInput: "What is this?",
    });

    function handleHangulChange(event) {

        postData('/api/hangulize', {
            text: event.target.value
        }).then((result) => {
            console.log(result);
            setState({
                ...state,
                englishInput: event.target.value,
                hangulOutput: result.hangul,
            });
        }).catch((err) => {
            console.log(err);
        });

        setState({
            ...state,
            englishInput: event.target.value,
        });
    }

    return <div>
        <h1>참괴로운 영어표기법 변환기</h1>
        {/*영어 입력 */}
        <textarea
            value={state.englishInput}
            onChange={(event) => handleHangulChange(event)}
        />
        {/*한글 출력 */}
        <div>
            ↓
        </div>
        <div>
            {state.hangulOutput}
        </div>
    </div>;
}

export default TestWrapper;