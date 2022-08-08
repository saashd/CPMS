import React from 'react';
import Button from '@material-ui/core/Button';
import Icon from "@material-ui/core/Icon";
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import firebase from 'firebase/app'
import "firebase/auth";
import {FirebaseAuthProvider} from "@react-firebase/auth";
import grey from "@material-ui/core/colors/grey";
import Copyright from '../../components/SharedComponents/Copyright/Copyright';
import {Route, Link, Switch} from "react-router-dom";
import ProposeProject from "../ProposeProject/ProposeProject"
import Paper from "@material-ui/core/Paper";
import {Collapse, Tooltip} from '@material-ui/core';
import clsx from 'clsx';
import CardActions from '@material-ui/core/CardActions';
import Fab from '@material-ui/core/Fab';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';


const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(140,140,140,0.373284347918855) 100%)',
    },
    main: {
        marginBottom: theme.spacing(2),
    },
    title: {
        fontFamily: 'monospace',
        color: '#fff',
        fontWeight: 'bolder'
    },
    footer: {
        padding: theme.spacing(3, 2),
        marginTop: 'auto',
    },
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',

    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    msSignIn: {
        paddingTop: '8px',
        marginBottom: '1em',

        borderRadius: '5em',
        color: theme.palette.getContrastText('#fff'),
        backgroundColor: '#e0e0e0',
        "&:hover": {
            backgroundColor: grey[200],
            // Reset on touch devices, it doesn't add specificity
            "@media (hover: none)": {
                backgroundColor: '#e0e0e0'
            }
        }
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
    fab: {
        position: 'fixed',
        bottom: theme.spacing(6),
        left: theme.spacing(2),
    },
    collapse: {
        margin: 'auto',
        width: '90%',
    }
}));

export default function SignIn(props) {
    const [advisorExpanded, setAdvisorExpanded] = React.useState(false);
    const [studentExpanded, setStudentExpanded] = React.useState(true);

    const classes = useStyles();

    const handleExpandClick = () => {
        setAdvisorExpanded(!advisorExpanded);
        setStudentExpanded(!studentExpanded);
    };
    const technionLogo = (
        <Icon>
            <img alt="technion_logo" height="20" width="15" src="resources/Technion_Logo.png"/>
        </Icon>
    );
    const msLogo = (
        <Icon>
            <img alt="ms_logo" height="20" width="20" src="resources/ms_sign_in.png"/>
        </Icon>
    );
    const googleLogo = (
        <Icon>
            <img alt="google_logo" height="20" width="20" src="resources/google_sign_in.png" />
        </Icon>
    );
    return (
        <>
            <div className={classes.root}>
                <img alt="cpms_logo" height="150" width="150" style={{margin: 10}} src="resources/icon_cpms.png"/>
                <Container component="main" className={classes.main} maxWidth="lg">
                    <div className={classes.paper}>
                        <Grid item xs={12}>
                            <Paper style={{
                                height: '100%', padding: '10px 30px 10px 30px', borderRadius: '1em', width: "450px",
                                boxShadow: 'rgb(50 50 93 / 5%) 0px 20px 11px, rgb(0 0 0 / 24%) -4px 7px 11px',
                                backgroundColor: '#33364dcc'
                            }}>
                                <CardActions disableSpacing style={{cursor: "pointer"}} onClick={handleExpandClick}>
                                    <Typography
                                        className={classes.title} variant="h6">
                                        Students Login
                                    </Typography>
                                </CardActions>
                                <Collapse in={studentExpanded} timeout="auto" unmountOnExit
                                          className={classes.collapse}>
                                    <FirebaseAuthProvider {...props.firebaseConfig} firebase={firebase}>
                                        <Tooltip title="Students sign in">
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="primary"
                                                startIcon={technionLogo}
                                                className={classes.msSignIn}
                                                onClick={() => {
                                                    props.setUserType('student');
                                                    const microsoftAuthProvider = new firebase.auth.OAuthProvider('microsoft.com');
                                                    microsoftAuthProvider.setCustomParameters({
                                                        tenant: 'f1502c4c-ee2e-411c-9715-c855f6753b84'
                                                    });
                                                    firebase.auth().signInWithPopup(microsoftAuthProvider);
                                                }}>
                                                Technion SSO
                                            </Button>
                                        </Tooltip>
                                    </FirebaseAuthProvider>
                                </Collapse>
                                <CardActions disableSpacing style={{cursor: "pointer"}} onClick={handleExpandClick}>
                                    <Typography
                                        className={classes.title} variant="h6">
                                        Advisors Login
                                    </Typography>
                                    <IconButton
                                        className={clsx(classes.expand, {
                                            [classes.expandOpen]: advisorExpanded,
                                        })}
                                        onClick={handleExpandClick}
                                        aria-expanded={advisorExpanded}
                                        aria-label="show more"
                                    >
                                        <ExpandMoreIcon style={{color: "#ffffff"}}/>
                                    </IconButton>
                                </CardActions>
                                <Collapse in={advisorExpanded} timeout="auto" unmountOnExit
                                          className={classes.collapse}>
                                    <FirebaseAuthProvider {...props.firebaseConfig} firebase={firebase}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            startIcon={msLogo}
                                            className={classes.msSignIn}
                                            onClick={() => {
                                                props.setUserType('advisor');
                                                const microsoftAuthProvider = new firebase.auth.OAuthProvider('microsoft.com');
                                                firebase.auth().signInWithPopup(microsoftAuthProvider);
                                            }}>
                                            Sign in with Microsoft
                                        </Button>
                                    </FirebaseAuthProvider>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        startIcon={googleLogo}
                                        className={classes.msSignIn}
                                        onClick={() => {
                                            props.setUserType('advisor');
                                            const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
                                            firebase.auth().signInWithPopup(googleAuthProvider);
                                        }}
                                    >
                                        Sign In with Google
                                    </Button>
                                    {/* <Router>
                                        <div>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="primary"
                                                startIcon={emailLogo}
                                                className={classes.msSignIn}
                                                component={Link}
                                                to={{
                                                    pathname: "/SignInWithEmail",
                                                    state: { open: true }
                                                }}>
                                                Sign In with Email
                                            </Button>
                                            <Route path="/SignInWithEmail"
                                                component={() => <SignInWithEmail open={true} />} />
                                        </div>
                                    </Router> */}
                                </Collapse>
                            </Paper>
                        </Grid>
                    </div>
                    <Switch>
                        <React.Fragment>
                        <div>
                            <Fab variant="extended" color="primary" aria-label="offer project" className={classes.fab}
                                 component={Link} to={{pathname: "/ProposeProject", state: {open: true}}}>
                                Offer A Project&nbsp; <NoteAddIcon/>
                            </Fab>
                            <Route path="/ProposeProject" component={() => <ProposeProject open={true}/>}/>
                        </div>
                        </React.Fragment>
                    </Switch>
                </Container>
                <footer className={classes.footer}>
                    <Container maxWidth="sm">
                        <Copyright/>
                    </Container>
                </footer>
            </div>


        </>
    );
}