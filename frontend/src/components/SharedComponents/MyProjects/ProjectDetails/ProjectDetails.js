import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import ProjectsForm from "./Tabs/ProjectsForm";
import withStyles from "@material-ui/core/styles/withStyles";
import AdvisorsTab from "./Tabs/AdvisorsTab";
import TeamTab from "./Tabs/TeamTab";
import GradesTab from "./Tabs/GradesTab";
import DelayRequestsTab from "./Tabs/DelayRequestsTab";
import FilesTab from "./Tabs/FilesTab"

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


const styles = theme => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        display: 'flex',


    },
    tabs: {
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: 'visible'
    },
    tab:{
        width:'100vw',
        marginLeft:'5vw',
        marginRight:'5vw'
    }
});


class ProjectDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 0,
            editFlag: this.props.editFlag,
            viewMoreFlag: this.props.viewMoreFlag,
            currentEditableProject: this.props.currentEditableProject,
            onUpdate: this.props.onUpdate,
            onSend: this.props.onSend,
            availableProjects: this.props.data,
        };

    }


    render() {
        const {classes} = this.props;
        const handleChange = (event, newValue) => {
            this.setState({value: newValue});
        };
        return (
            <div

                className={classes.root}
            >
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={this.state.value}
                    onChange={handleChange}
                    aria-label="Vertical tabs example"
                    className={classes.tabs}
                >
                    <Tab label="Description" {...a11yProps(0)} />
                    <Tab label="Advisors" {...a11yProps(1)} />
                    <Tab label="Team" {...a11yProps(2)} />
                    <Tab label="Grades" {...a11yProps(3)} />
                    <Tab label="Files" {...a11yProps(4)} />
                    <Tab label="Delay Requests" {...a11yProps(5)} />
                </Tabs>
                <TabPanel className={classes.tab} value={this.state.value} index={0}>
                    <ProjectsForm
                        userDetails={this.props.userDetails}
                        data={this.state.availableProjects}
                        currentEditableProject={this.state.currentEditableProject}
                        editFlag={this.state.editFlag}
                        viewMoreFlag={this.state.viewMoreFlag}
                    />
                </TabPanel>
                <TabPanel className={classes.tab} value={this.state.value} index={1}>
                    <AdvisorsTab
                        currentEditableProject={this.state.currentEditableProject}
                    />
                </TabPanel>
                <TabPanel className={classes.tab} value={this.state.value} index={2}>
                    <TeamTab
                        currentEditableProject={this.state.currentEditableProject}
                    />
                </TabPanel>
                <TabPanel  className={classes.tab} value={this.state.value} index={3}>
                    <GradesTab
                        userDetails={this.props.userDetails}
                        currentEditableProject={this.state.currentEditableProject}/>
                </TabPanel>
                <TabPanel  className={classes.tab} value={this.state.value} index={4}>
                    <FilesTab
                        currentEditableProject={this.state.currentEditableProject}
                        />
                </TabPanel>
                <TabPanel  className={classes.tab} value={this.state.value} index={5}>
                    <DelayRequestsTab
                        data={this.state.availableProjects}
                        currentEditableProject={this.state.currentEditableProject}
                        />
                </TabPanel>
            </div>
        );
    }
}

export default withStyles(styles, {withTheme: true})(ProjectDetails);
