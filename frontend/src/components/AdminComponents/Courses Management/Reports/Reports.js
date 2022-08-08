import React from 'react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import StudentReport from "./StudentReports/StudentReport";
import AppBar from "@material-ui/core/AppBar";
import GradeReport from "./GradeReport/GradeReport";
import SecretariatReports from "./SecretariatReports/SecretariatReports";
import AcademicAdvisorsReport from "./AcademicAdvisorsReport/AcademicAdvisorsReport";

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
                <Box p={2}>
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

export default function Reports() {
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
                    <Tab label="Student Report" {...a11yProps(0)} />
                    <Tab label="Grade Report" {...a11yProps(1)} />
                    <Tab label="Secretariat Report" {...a11yProps(2)} />
                    <Tab label="Advisors Report" {...a11yProps(3)} />
                </Tabs>
            </AppBar>
            <TabPanel className={classes.tabPanel} value={value} index={0}>
                <StudentReport/>
            </TabPanel>
            <TabPanel className={classes.tabPanel} value={value} index={1}>
                <GradeReport/>
            </TabPanel>
             <TabPanel className={classes.tabPanel} value={value} index={2}>
                <SecretariatReports/>
            </TabPanel>
            <TabPanel className={classes.tabPanel} value={value} index={3}>
                <AcademicAdvisorsReport/>
            </TabPanel>

        </div>
    );
}
