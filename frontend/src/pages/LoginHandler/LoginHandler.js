import React, {useState} from "react";
import {BrowserRouter, Route} from "react-router-dom";
import {useDispatch} from "react-redux";
import CircularProgress from '@material-ui/core/CircularProgress';
import firebase from 'firebase/app'
import "firebase/auth";
import {FirebaseAuthConsumer, FirebaseAuthProvider,} from "@react-firebase/auth";
import Dashboard from "../Dashboard/Dashboard"
import firebaseConfig from "../../config";
import SignIn from "../SignIn/SignIn";
import FillStudentDetails from "../FillUserDetails/FillStudentDetails";

import FillAdvisorDetails from "../FillUserDetails/FillAdvisorDetails";

export default function LoginHandler() {
    const dispatch = useDispatch();
    const [userDetails, setUserDetails] = useState(null);
    const [userIsExists, setUserIsExists] = useState(false);
    const [counter, setCounter] = useState(0);
    const [fillDetails, setFillDetails] = useState('student');

    const verify_user_info = (user) => {
        let token = JSON.parse(user)['stsTokenManager']['accessToken'];
        user = JSON.parse(user);
        fetch(process.env.REACT_APP_DOMAIN_DEV + "/verify_user", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
            .then(response => response.json())
            .then(result => {
                if (result['status'] !== 'success') {
                    console.log(result);
                    firebase.auth().signOut();
                }
                if (result['is_exists']) {
                    setUserDetails(result['user_details'])
                    setUserIsExists(true);
                    user['is_admin'] = result['is_admin'];
                    user['advisorType'] = result['user_details']['advisorType'];
                    user['user_type'] = result['user_details']['user_type'];
                    dispatch({type: "SET", payload: JSON.stringify(user)})
                } else {
                    setUserDetails({});
                    setUserIsExists(false);
                }
            })
            .catch(error => console.log(error));
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    return (

        <FirebaseAuthProvider {...firebaseConfig} firebase={firebase}>
            <div>
                <FirebaseAuthConsumer>
                    {({isSignedIn, user, providerId}) => {
                        if (isSignedIn) {
                            if (counter === 1) {
                                user['is_admin'] = false;
                                dispatch({type: "SET", payload: JSON.stringify(user)})
                                setCounter(0)
                                verify_user_info(JSON.stringify(user));
                            }
                            if (userDetails) {
                                if (!userIsExists) {
                                    if (fillDetails === 'advisor') return (<FillAdvisorDetails/>);
                                    return (<FillStudentDetails/>);
                                }
                                if (['admin', 'student', 'advisor'].includes(userDetails.user_type) && 'is_admin' in user) {
                                    return (
                                        <BrowserRouter>
                                            <Route component={Dashboard}/>
                                        </BrowserRouter>
                                    );
                                }
                            } else {
                                return (<div style={{
                                    minHeight: '100vh',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingTop: "5%"
                                }}>
                                    <CircularProgress size="8rem"/>
                                </div>)
                            }
                        } else {
                            if (counter < 1) {
                                dispatch({type: "DELETE"})
                                setCounter(1)
                            }
                            setUserDetails(null);
                            return (
                                <SignIn firebaseConfig={firebaseConfig} setUserType={setFillDetails}/>
                            );
                        }

                    }
                    }
                </FirebaseAuthConsumer>
            </div>
        </FirebaseAuthProvider>
    );
};