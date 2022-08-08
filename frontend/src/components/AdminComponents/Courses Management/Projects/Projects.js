import React from 'react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import AllProjects from "./AllProjects/allProjects";
import TeamProjectRequests from "./TeamProjectRequests/TeamProjectRequests";
import NewProposals from "./NewProposals/NewProposals";
import DelayRequests from "./DelayRequests/DelayRequests";
import AppBar from "@material-ui/core/AppBar";

function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
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
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme) => ({
        tabs: {
            flexGrow: 1,
            backgroundColor: theme.palette.background.paper,
        },
        tabPanel: {
            width: '-webkit-fill-available',
            overflow: 'auto'
        }
    }))
;

export default function Projects() {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div>
            <AppBar position="static" color="default">
                <Tabs
                    variant={window.innerWidth < 900 ? 'scrollable' : 'standard'}
                    value={value}
                    onChange={handleChange}
                    className={classes.tabs}
                    indicatorColor="primary"
                    textColor="primary"
                    centered={window.innerWidth >= 900}
                >
                    <Tab label="All Projects" {...a11yProps(0)} />
                    <Tab label="Team-Project Requests" {...a11yProps(1)} />
                    <Tab label="New Project Proposals" {...a11yProps(2)} />
                    <Tab label="Delay Requests" {...a11yProps(3)} />
                </Tabs>
            </AppBar>
            <TabPanel className={classes.tabPanel} value={value} index={0}>
                <AllProjects/>
            </TabPanel>
            <TabPanel className={classes.tabPanel} value={value} index={1}>
                <TeamProjectRequests isAdvisorView={false}/>
            </TabPanel>
            <TabPanel className={classes.tabPanel} value={value} index={2}>
                <NewProposals/>
            </TabPanel>
            <TabPanel className={classes.tabPanel} value={value} index={3}>
                <DelayRequests/>
            </TabPanel>
        </div>
    );
}
