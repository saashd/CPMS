import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import * as React from "react";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import {default as Tab} from '@material-ui/core/Tab';
import Projects from "../Legacy/CPMS2011Projects/Projects";
import Teams from "../Legacy/CPMS2011Teams/Teams";


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
                    <Tab label="Projects" {...a11yProps(0)} />
                    <Tab label="Teams" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            <div>
                <TabPanel className={classes.tabPanel} value={value} index={0}>
                    <Projects/>
                </TabPanel>
                <TabPanel className={classes.tabPanel} value={value} index={2}>
                    <Teams/>
                </TabPanel>
            </div>
        </div>
    );
}

export default (NavBar);
