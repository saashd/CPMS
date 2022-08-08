import React, {useEffect} from 'react';
import Badge from '@material-ui/core/Badge';
import NotificationsIcon from '@material-ui/icons/Notifications';
import List from '@material-ui/core/List';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import {connect} from "react-redux";
import {readNotifications} from "../../components/Services/usersService";
import Popover from '@material-ui/core/Popover';
import {removeNotifications} from "../../components/Services/loggedUserService";
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        height: "100%",
        width: "100%"
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
    container: {
        paddingTop: theme.spacing(3),
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


function Notifications(props) {
    const [state, setState] = React.useState({
        unreadNotifications: [],
        readNotifications: []
    });

    useEffect(() => {
        readNotifications(JSON.parse(props.userRed).uid).then(result => {
            let unreadNotifications = result ? Object.values(result['unread']) : [];
            let readNotifications = result ? Object.values(result['read']) : [];
            unreadNotifications = unreadNotifications.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
            readNotifications = readNotifications.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
            setState({
                ...state,
                unreadNotifications: unreadNotifications,
                readNotifications: readNotifications
            });
        })
    }, []);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const notificationPanelOpen = Boolean(anchorEl);
    const handleNotificationPanelClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleNotificationPanelClose = () => {
        let notificationsToRemove = state.unreadNotifications;
        removeNotifications(notificationsToRemove, JSON.parse(props.userRed).uid).then((notifications) => {
            let unreadNotifications = notifications ? Object.values(notifications['unread']) : [];
            let readNotifications = notifications ? Object.values(notifications['read']) : [];
            setState({
                ...state,
                unreadNotifications: unreadNotifications,
                readNotifications: readNotifications
            })
        }).catch((error) => {
            console.log(error)
        });
        setAnchorEl(null);
    };
    return (
        <div>
            <IconButton color="inherit">
                <Badge badgeContent={state.unreadNotifications.length}
                       color="secondary">
                    <NotificationsIcon
                        onClick={handleNotificationPanelClick}
                    />
                    {state.unreadNotifications.length !== 0 || state.readNotifications.length !== 0 ?
                        <Popover
                            open={notificationPanelOpen}
                            anchorEl={anchorEl}
                            onClose={handleNotificationPanelClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}>

                            <div style={{width: '20vw'}}>
                                {
                                    state.unreadNotifications.map(notification => (
                                        <List key={notification.id} component="nav" aria-label="main mailbox folders">
                                            <ListItem button>
                                                <ListItemText primary={notification.title}
                                                              secondary={notification.body}
                                                />
                                                <div>
                                                    <FiberManualRecordIcon
                                                        style={{color: '#e91e63', fontSize: 12}}/>
                                                </div>
                                                <div style={{fontSize: 12}}>
                                                    {notification.creationDate}
                                                </div>
                                            </ListItem>
                                        </List>))
                                }
                                <Divider/>
                                {
                                    state.readNotifications.map(notification => (
                                        <List key={notification.id} component="nav" aria-label="main mailbox folders">
                                            <ListItem button>
                                                <ListItemText primary={
                                                    notification.title
                                                } secondary={notification.body}/>
                                                <div style={{fontSize: 12}}>
                                                    {notification.creationDate}
                                                </div>
                                            </ListItem>
                                        </List>))
                                }
                            </div>


                        </Popover> : ''}
                </Badge>
            </IconButton>
        </div>
    );
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};


export default connect(mapStateToProps)(Notifications);
