import React from 'react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import StudentsFindPartners from "./StudentsFindPartners/StudentsFindPartners";
import TeamFindPartners from "./TeamFindPartners/TeamFindPartners";

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
        root: {
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            height: '80vh'


        },
        tabs: {
            borderRight: `1px solid ${theme.palette.divider}`,
            overflow: 'visible'
        },
        tabPanel: {
            overflow:"auto",
            width: '-webkit-fill-available'
        }
    }))
;

export default function FindPartner() {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                className={classes.tabs}
            >
                <Tab label="Students Looking For Partner" {...a11yProps(0)} />
                <Tab label="Teams Looking For Partner" {...a11yProps(1)} />
            </Tabs>
            <TabPanel className={classes.tabPanel} value={value} index={0}>
                <StudentsFindPartners/>
            </TabPanel>
            <TabPanel className={classes.tabPanel} value={value} index={1}>
                <TeamFindPartners/>
            </TabPanel>
        </div>
    );
}
