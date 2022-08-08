import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import * as React from "react";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import {default as Tab} from '@material-ui/core/Tab';
import MyProjects from "../SharedComponents/MyProjects/MyProjects";
import TeamProjectRequests
    from "../AdminComponents/Courses Management/Projects/TeamProjectRequests/TeamProjectRequests";
import PendingProjectsProposals from "./PendingProjectsProposals/PendingProjectsProposals";
import {connect} from "react-redux";
import {getUsersByFireBaseIDs} from "../Services/usersService";
import {useEffect} from "react";


function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`nav-tabpanel-${index}`}
            aria-labelledby={`nav-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    {children}
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};


function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}


const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,

    },
    tabPanel: {
        width: '-webkit-fill-available',
    }
}));

function NavBar(props) {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const [userDetails, setDetails] = React.useState(null);
    const [isLoaded, setLoaded] = React.useState(false);
    let userRed = JSON.parse(props.userRed);
    let obj = {ids: [userRed.uid]};

    useEffect(() => {
        getUsersByFireBaseIDs(obj).then(result => {
            const user = result[userRed.uid];
            setDetails(user);
            setLoaded(true)
        })
    }, []);


    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    if (isLoaded) {
        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Tabs variant="scrollable" value={value} onChange={handleChange} aria-label="simple tabs example">
                        <Tab label="My Projects" {...a11yProps(0)} />
                        <Tab label="Pending Projects Proposals" {...a11yProps(1)} />
                        {(userDetails.advisorType === 'academic' || userDetails.advisorType === 'both') ?
                            <Tab label="Team-Project Requests" {...a11yProps(2)} />
                            : ""}
                    </Tabs>
                </AppBar>
                <div>
                    <TabPanel className={classes.tabPanel} value={value} index={0}>
                        <MyProjects/>
                    </TabPanel>
                    <TabPanel className={classes.tabPanel} value={value} index={1}>
                        <PendingProjectsProposals/>
                    </TabPanel>
                    {(userDetails.advisorType === 'academic' || userDetails.advisorType === 'both') ?
                        <TabPanel className={classes.tabPanel} value={value} index={2}>
                            <TeamProjectRequests isAdvisorView={true} userRed={props.userRed}/>
                        </TabPanel>
                        : ''}

                </div>
            </div>
        );
    } else {
        return <div></div>
    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};

export default connect(mapStateToProps)(NavBar);

