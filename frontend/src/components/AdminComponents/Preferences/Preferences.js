import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import * as React from "react";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import {default as Tab} from '@material-ui/core/Tab';
import Courses from "./Courses/Courses"
import Grades from "./GradesTemplates/Grades";
import Files from "./FilesTemplates/Files";
import SetUp from "./SetUp/SetUp";
import Semesters from "./Semesters/Semesters";


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
        backgroundColor: theme.palette.background.paper,
        overflow: "auto"
    },
    tabPanel: {
        width: '-webkit-fill-available'
    }
}));

export default function NavBar() {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Tabs variant="scrollable" value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label="Setup" {...a11yProps(0)} />
                    <Tab label="File Templates" {...a11yProps(1)} />
                    <Tab label="Grade Templates" {...a11yProps(2)} />
                    <Tab label="Courses" {...a11yProps(3)} />
                    <Tab label="Semesters" {...a11yProps(4)} />
                </Tabs>
            </AppBar>
            <div>
                <TabPanel className={classes.tabPanel} value={value} index={0}>
                    <SetUp/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={1}>
                    <Files/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={2}>
                    <Grades/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={3}>
                    <Courses/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={4}>
                    <Semesters/>
                </TabPanel>
            </div>
        </div>
    );
}

