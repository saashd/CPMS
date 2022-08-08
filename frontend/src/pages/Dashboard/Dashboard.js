import React, {useEffect} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Container from '@material-ui/core/Container';
import MenuIcon from '@material-ui/icons/Menu';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import Tooltip from '@material-ui/core/Tooltip';
import firebase from 'firebase/app'
import AdminMain from "../AdminPages/Main"
import AdvisorMain from "../AdvisorPages/Main"
import StudentMain from "../StudentsPages/Main"
import {NavLink as RouterLink} from "react-router-dom";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AdminListItems from "../../components/AdminComponents/ListItems/ListItems"
import AdvisorListItems from "../../components/AdvisorComponents/ListItems/ListItems"
import StudentListItems from "../../components/StudentsComponents/ListItems/ListItems"
import EmailIcon from "@material-ui/icons/Email";
import SendEmail from "../../components/AdminComponents/SendEmail/SendEmail"
import { connect, useDispatch, useSelector } from "react-redux";
import Copyright from '../../components/SharedComponents/Copyright/Copyright';
import Switch from "@material-ui/core/Switch";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getUsersByFireBaseIDs} from "../../components/Services/usersService";
import ContactMailIcon from '@material-ui/icons/ContactMail';
import AssignmentIcon from '@material-ui/icons/Assignment';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import ListItemIcon from "@material-ui/core/ListItemIcon";
import SettingsIcon from '@material-ui/icons/Settings';
import Notifications from "./Notifications";
import LinearProgress from '@material-ui/core/LinearProgress';
import Fade from '@material-ui/core/Fade';

const drawerWidth = 245;
const appBarHeight = 65;
const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        height: "100%",
        width: "100%"
    },
    appBar: {
        height: appBarHeight,
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    toolbar: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    logotype: {
        color: "white",
        marginLeft: theme.spacing(2.5),
        marginRight: theme.spacing(2.5),
        fontWeight: 500,
        fontSize: 18,
        whiteSpace: "nowrap",
        [theme.breakpoints.down("xs")]: {
            display: "none",
        },
    },
    menuButton: {
        marginLeft: 20,
        [theme.breakpoints.down("sm")]: {
            marginLeft: 0
        },
        padding: theme.spacing(0.5),
        marginRight: theme.spacing(2),
    },
    menuButtonHidden: {
        display: 'none',
    },
    drawerPaper: {
        height: '100vh',
        width: drawerWidth,
        paddingTop: appBarHeight,
        position: 'relative',
        whiteSpace: 'nowrap',
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
            width: theme.spacing(9),
        },
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        width: '95%',
    },
    contentShift: {
        width: `calc(100% - ${drawerWidth}px)`,
    },
    container: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(0),



    },
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',


    },
    grow: {
        flexGrow: 1,
    },
}));


function Dashboard(props) {

    const classes = useStyles();
    const systemLoading = useSelector((state) => state.settings)
    const [state, setState] = React.useState({
        userDetails: null,
        switchToAdminView: false,
        openDrawer: false,
        openEmailDialog: false,
    });

    useEffect(() => {
        if (state.userDetails === null) {
            let obj = {ids: [JSON.parse(props.userRed).uid]};
            getUsersByFireBaseIDs(obj).then(result => {
                setState({
                    ...state,
                    userDetails: result[JSON.parse(props.userRed).uid],
                });
            })
        }
    }, [state, state.userDetails, props.userRed]);
    const dispatch = useDispatch();
    const handleDrawerOpen = () => {
        setState({...state, openDrawer: true});
    };
    const handleDrawerClose = () => {
        setState({...state, openDrawer: false});
    };
    const handleOpenEmailDialog = () => {
        setState({...state, openEmailDialog: true});
    };
    const handleCloseEmailDialog = () => {
        setState({...state, openEmailDialog: false});
    };
    const handleChange = (event) => {
        setState({...state, [event.target.name]: event.target.checked});
        dispatch({type: "SET_VIEW", payload: event.target.checked})

    };
    if (!state.userDetails) {
        return (<div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: "5%"
        }}>
            <CircularProgress size="8rem"/>
        </div>)

    } else if (state.userDetails) {
        return (
            <div>
                <div
                    className={classes.root}
                >
                    <CssBaseline/>
                    <AppBar position="fixed" className={classes.appBar}>
                        <Toolbar className={classes.toolbar}>
                            {!state.openDrawer ? (
                                <IconButton
                                    color="inherit"
                                    onClick={handleDrawerOpen}
                                    className={clsx(classes.menuButton, state.openDrawer && classes.menuButtonHidden)}
                                >
                                    <MenuIcon/>
                                </IconButton>) : (
                                <IconButton color="inherit" className={(classes.menuButton)}
                                            onClick={handleDrawerClose}>
                                    <ArrowBackIcon/>
                                </IconButton>
                            )}
                            {
                                JSON.parse(props.userRed).is_admin && state.userDetails.user_type !== 'admin' ?
                                    <Switch
                                        size="medium"
                                        checked={state.switchToAdminView}
                                        onChange={handleChange}
                                        name="switchToAdminView"
                                        inputProps={{'aria-label': 'secondary checkbox'}}
                                    /> : ''
                            }

                            <Typography style={{fontSize: '2vh'}}
                                        color="inherit"
                                        className={classes.logotype}
                            >
                                Welcome {state.userDetails.engFirstName + ' ' + state.userDetails.engLastName + ' '}
                                {
                                    JSON.parse(props.userRed).is_admin ? (
                                            state.switchToAdminView ? '(Admin view)' :
                                                "(" + state.userDetails.user_type.charAt(0).toUpperCase() + state.userDetails.user_type.slice(1) + ' view)')
                                        : ""
                                }
                            </Typography>
                            <div className={classes.grow}/>
                            {(window.innerWidth >= 1100) ?
                                <List component="nav" style={{boxShadow: 'none'}}>
                                    <ListItem component="div">
                                        <ListItem
                                            button component={RouterLink} to={"/Syllabus"}>
                                            <ListItemIcon>
                                                <AssignmentIcon style={{color: "#fff"}}/>
                                            </ListItemIcon>
                                            <ListItemText primary="Syllabus"/>
                                        </ListItem>
                                        <ListItem
                                            button component={RouterLink} to={"/Staff"}>
                                            <ListItemIcon>
                                                <ContactMailIcon style={{color: "#fff"}}/>
                                            </ListItemIcon>
                                            <ListItemText primary="Staff"/>
                                        </ListItem>
                                        <ListItem
                                            button component={RouterLink} to={"/CourseMaterial"}>
                                            <ListItemIcon>
                                                <BookmarksIcon style={{color: "#fff"}}/>
                                            </ListItemIcon>
                                            <ListItemText style={{width: 'max-content'}} primary="Course Material"/>
                                        </ListItem>
                                        {
                                            JSON.parse(props.userRed).is_admin && state.switchToAdminView ?
                                                <ListItem
                                                    button component={RouterLink} to={"/Preferences"}>
                                                    <ListItemIcon>
                                                        <SettingsIcon style={{color: "#fff"}}/>
                                                    </ListItemIcon>
                                                    <ListItemText style={{width: 'max-content'}} primary="Preferences"/>
                                                </ListItem> : ""}
                                    </ListItem>
                                </List>
                                : ""}
                            {
                                JSON.parse(props.userRed).is_admin && state.switchToAdminView ?
                                    <Tooltip title="Send Email" aria-label="Send Email" arrow>
                                        <IconButton color="inherit" onClick={handleOpenEmailDialog}>
                                            <EmailIcon/>
                                        </IconButton>
                                    </Tooltip> : ''
                            }
                            <Notifications/>
                            <Tooltip title="Sign Out" aria-label="Sign Out" arrow>
                                <IconButton color="inherit" onClick={() => {
                                    dispatch({type: "SET_VIEW", payload: false})
                                    return (firebase.auth().signOut())
                                }}>
                                    <ExitToAppIcon/>
                                </IconButton>
                            </Tooltip>
                        </Toolbar>
                        <Fade
                            in={systemLoading}
                            style={{
                                transitionDelay: systemLoading ? '800ms' : '0ms',
                            }}
                            unmountOnExit>
                            <LinearProgress
                                style={{
                                    marginTop: "61px",
                                    position: "absolute",
                                    width: "100%"
                                }}
                            />
                        </Fade>

                    </AppBar>


                    <Drawer
                        variant="permanent"
                        classes={
                            {
                                paper: clsx(classes.drawerPaper, !state.openDrawer && classes.drawerPaperClose),
                            }
                        }
                        open={state.openDrawer}
                    >
                        <Divider/>
                        {(() => {
                            if (state.userDetails.user_type === 'student' && (!JSON.parse(props.userRed).is_admin || !state.switchToAdminView)) {
                                return <StudentListItems drawerOpen={state.openDrawer} />
                            } else if (state.userDetails.user_type === 'advisor' && (!JSON.parse(props.userRed).is_admin || !state.switchToAdminView)) {
                                return <AdvisorListItems drawerOpen={state.openDrawer} />
                            } else if ((JSON.parse(props.userRed).is_admin && state.switchToAdminView) || state.userDetails.user_type === 'admin') {
                                return <AdminListItems drawerOpen={state.openDrawer} />
                            }
                        })()}
                    </Drawer>

                    <main className={clsx(classes.content, {
                        [classes.contentShift]: state.openDrawer,
                    })}>
                        <div
                            className={classes.appBarSpacer}
                        />
                        <Container maxWidth={"xl"} className={classes.container}
                        >
                            {(() => {
                                if (state.userDetails.user_type === 'student' && (!JSON.parse(props.userRed).is_admin || !state.switchToAdminView)) {
                                    return <StudentMain/>
                                } else if (state.userDetails.user_type === 'advisor' && (!JSON.parse(props.userRed).is_admin || !state.switchToAdminView)) {
                                    return <AdvisorMain/>
                                } else if ((JSON.parse(props.userRed).is_admin && state.switchToAdminView) || state.userDetails.user_type === 'admin') {
                                    return <AdminMain/>
                                }
                            })()}
                            <Box pt={0}>
                                <Copyright/>
                            </Box>
                        </Container>
                    </main>
                </div>
                {
                    JSON.parse(props.userRed).is_admin && state.switchToAdminView && state.openEmailDialog ?
                        (<SendEmail
                            open={state.openEmailDialog}
                            handleClose={handleCloseEmailDialog}
                        />) : ''
                }
            </div>
        );
    }

}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};


export default connect(mapStateToProps)(Dashboard);
