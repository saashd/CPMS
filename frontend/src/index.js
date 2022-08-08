import React from 'react';
import ReactDOM from 'react-dom';
import {Router} from "react-router-dom";
import {Provider} from "react-redux";
import {createStore} from "redux";
import {userReducer,reducers} from "./redux/userReducer";
import CssBaseline from '@material-ui/core/CssBaseline';
import {createBrowserHistory} from "history";
import * as serviceWorker from './serviceWorker';
import App from './App';
import "./style.css"
import {SnackbarProvider} from "notistack";
const store = createStore(reducers);

const history = createBrowserHistory();
ReactDOM.render(
    // <React.StrictMode>
    <Router history={history}>
        <CssBaseline/>
        <Provider store={store}>
            {/*<SnackbarProvider maxSnack={3}>*/}
            <App/>
            {/*</SnackbarProvider>*/}
        </Provider>
    </Router>,
    // </React.StrictMode>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA

// serviceWorker.unregister();
