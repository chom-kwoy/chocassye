import React from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import App from './components/App';
import EomiPage from './components/EomiPage';
import ConjTablePage from './components/ConjTablePage';
import SearchPage from './components/SearchPage';
import SourcePage from './components/SourcePage';
import HowToPage from './components/HowToPage';
import AboutPage from './components/AboutPage';
import TestPage from './components/TestPage';
import theme from './theme';


ReactDOM.render((
    //<React.StrictMode>
        <BrowserRouter>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App>
                    <Routes>
                        <Route exact path='/' element={<Navigate to='/search' />}></Route>
                        <Route exact path='/dict' element={<EomiPage index={1} />}></Route>
                        <Route exact path='/conj' element={<ConjTablePage />}></Route>
                        <Route exact path='/search' element={<SearchPage />}></Route>
                        <Route exact path='/howtouse' element={<HowToPage />}></Route>
                        <Route exact path='/about' element={<AboutPage />}></Route>
                        <Route exact path='/source' element={<SourcePage />}></Route>
                        <Route exact path='/test' element={<TestPage />}></Route>
                    </Routes>
                    </App>
                </ThemeProvider>
            </StyledEngineProvider>
        </BrowserRouter>
    //</React.StrictMode>
  ), document.getElementById('root')
);
