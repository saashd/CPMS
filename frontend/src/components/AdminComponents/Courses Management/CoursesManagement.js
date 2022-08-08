import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import * as React from "react";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import {default as Tab} from '@material-ui/core/Tab';
import Students from './Users/Students/Students'
import Projects from "./Projects/Projects";
import Personnel from "./Users/Personnel/Personnel";
import Teams from "./Teams/Teams";
import Admin from "./Users/Admin/Admin"
import Organizations from "./Organizations/Organizations";
import Evaluation from "./Evaluation/Evaluation";
import Reports from "./Reports/Reports";
import FindPartner from "../../SharedComponents/FindPartner/FindPartner";


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

function NavBar() {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Tabs variant="scrollable" value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label="Manage Requests" {...a11yProps(0)} />
                    <Tab label="Students" {...a11yProps(1)} />
                    <Tab label="Personnel" {...a11yProps(2)} />
                    <Tab label="Admins" {...a11yProps(3)} />
                    <Tab label="Teams" {...a11yProps(4)} />
                    <Tab label="Projects" {...a11yProps(5)} />
                    <Tab label="Organizations" {...a11yProps(6)} />
                    <Tab label="Reports" {...a11yProps(7)} />
                    <Tab label="Evaluation Pages" {...a11yProps(8)} />
                </Tabs>
            </AppBar>
            <div>
                <TabPanel className={classes.tabPanel} value={value} index={0}>
                    <FindPartner/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={1}>
                    <Students/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={2}>
                    <Personnel/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={3}>
                    <Admin/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={4}>
                    <Teams/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={5}>
                    <Projects/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={6}>
                    <Organizations/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={7}>
                    <Reports/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={8}>
                    <Evaluation/>
                </TabPanel>
            </div>
        </div>
    );
}

export default (NavBar);
