import React from "react";
import axios from 'axios';
import { SnackbarProvider } from 'notistack';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import firebaseConfig from "./config"
import firebase from 'firebase/app'
import Routings from "./pages/Routings/Routings";
import { useDispatch } from "react-redux";

const notistackRef = React.createRef();
const onClickDismiss = key => () => {
    notistackRef.current.closeSnackbar(key);
};

const useStyles = makeStyles(() => ({
    root: {
        height: '100vh',
    },
    snackbarAction: {
        color: 'white',
    }

}));

axios.defaults.baseURL = process.env.REACT_APP_DOMAIN_DEV
axios.defaults.headers.get['Accept'] = 'application/json'
axios.defaults.headers.post['Accept'] = 'application/json'
axios.defaults.headers.get['Content-Type'] = 'application/json'
axios.defaults.headers.post['Content-Type'] = 'application/json'

export default function App() {
  const classes = useStyles();
  const dispatch = useDispatch();

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  axios.interceptors.request.use(async function (config) {
    dispatch({ type: "SET_LOADING", payload: true });
    // TODO: refresh token only if expired
    const user = firebase.auth().currentUser;
    if (user) {
      let token = await user.getIdToken(false)
      config.headers.Authorization = token ? `Bearer ${token}` : '';
      return config;
    }

    return config;
  });

  axios.interceptors.response.use((response) => {
    dispatch({ type: "SET_LOADING", payload: false });
    return response;
  });

  return (
    <SnackbarProvider
      maxSnack={4}
      ref={notistackRef}
      action={(key) => (
        <Button
          className={classes.snackbarAction}
          onClick={onClickDismiss(key)}>
          Dismiss
        </Button>
      )}>
      <Routings/>
    </SnackbarProvider>
  );
}