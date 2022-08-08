import React, {Component} from "react";
import {Button, Grid, Tab, Tabs, withStyles} from "@material-ui/core";
import Add from "@material-ui/icons/Add";
import cloneDeep from "lodash/cloneDeep";
import TabPanel from "@material-ui/lab/TabPanel";
import TabContext from "@material-ui/lab/TabContext";
import Course from "./CourseForm";
import Tooltip from "@material-ui/core/Tooltip";
import DeleteIcon from "@material-ui/icons/Delete";
import DeleteDialog from "../../../SharedComponents/Yes_No_Dialog/Yes_No_Dialog";
import {addEntity, editEntity, getAllEntities, removeEntity} from "../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import {withSnackbar} from "notistack";
import AppBar from "@material-ui/core/AppBar";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    positionIcon: {
        flexDirection: "row-reverse",
        width: "auto",
        padding: 0
    },
    iconLabelWrapper: {
        flexDirection: "row"
    }
});

class Courses extends Component {
    constructor(...args) {
        super(...args);
        this.state = {
            isLoaded: false,
            error: null,
            openDeleteModal: false,
            tabToDelete: null,
            value: null,
            tabList: null
        };
    }

    /**
     * Appends newly created tab with with course number and name, selected by user.
     */
    addTab = () => {
        let name = prompt("Please enter course name:");
        if (name === '' || name === null) {
            return
        }
        let id = prompt("Please enter course number:");
        if (id === '' || id === null) {
            return
        }
        let course = {
            name: name,
            id: parseInt(id),
            description: null,
            continuationOfCourse: null
        };
        addEntity(course, 'courses')
            .then((response) => {
                course.id = response;
                course.key = response;
                this.setState((state, props) => {
                    let tabList = cloneDeep(state.tabList);
                    tabList.unshift(course);
                    return {tabList,}
                })
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Removes selected tab from the tabList.
     * @param e
     */
    deleteTab = (e) => {
        // prevent MaterialUI from switching tabs
        e.stopPropagation();
        removeEntity(this.state.tabToDelete, 'courses').then((response) => {

            // Cases:
            // Case 1: Single tab.
            // Case 2: Tab on which it's pressed to delete.
            // Case 3: Tab on which it's pressed but it's the first tab
            // Case 4: Rest all cases.
            // Also cleanup data pertaining to tab.

            // Case 1:
            if (this.state.tabList.length === 1) {
                return; // If you want all tabs to be deleted, then don't check for this case.
            }

            // Case 2,3,4:
            let tabID = parseInt(this.state.tabToDelete.id);
            let tabIDIndex = 0;

            let tabList = this.state.tabList.filter((value, index) => {
                if (value.id === tabID) {
                    tabIDIndex = index;
                }
                return value.id !== tabID;
            });

            this.setState((state, props) => {
                let curValue = parseInt(state.value);
                if (curValue === tabID) {
                    // Case 3:
                    if (tabIDIndex === 0) {
                        curValue = state.tabList[tabIDIndex + 1].id
                    }
                    // Case 2:
                    else {
                        curValue = state.tabList[tabIDIndex - 1].id
                    }
                }
                return {
                    value: curValue
                }
            }, () => {
                this.setState({
                    tabList: tabList
                })
            });
            this.setState({openDeleteModal: false, tabToDelete: null});
            this.props.enqueueSnackbar('Course Deleted', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error})
        });
    };
    /**
     * Function that switches to chosen course template tab.
     * @param    {Object} e-Event object
     * @param    {Object} value- event obj. value
     */
    handleTabChange = (event, value) => {
        this.setState({value});
    };

    /**
     * Update properties of existing course
     * @param course
     */
    handleUpdateCourse = (course) => {
        let courseToUpdate = {...course};
        courseToUpdate.newId = courseToUpdate.id;
        courseToUpdate.id = courseToUpdate.key;
        delete courseToUpdate.key;
        editEntity(courseToUpdate, 'courses')
            .then((response) => {
                getAllEntities('courses').then((response) => {
                    for (let course of response) {
                        course.key = course.id;
                    }
                    let tabs = response.reverse();
                    this.setState({
                        tabList: tabs,
                        isLoaded: true,
                        value: tabs[0] ? tabs[0].id : 0
                    });
                }).catch((error) => {
                    this.setState({error: error});
                });
                this.props.enqueueSnackbar('Course Updated', {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
        });


    };


    handleOpenDeleteModal = (tab) => {
        this.setState({openDeleteModal: true, tabToDelete: tab});

    };

    handleCloseDeleteModal = () => {
        this.setState({openDeleteModal: false, tabToDelete: null});
    };


    componentDidMount(): void {
        getAllEntities('courses')
            .then((response) => {
                for (let course of response) {
                    course.key = course.id;
                }
                let tabs = response.reverse();
                this.setState({
                    tabList: tabs,
                    isLoaded: true,
                    value: tabs[0] ? tabs[0].id : 0
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    }


    render() {
        const {classes} = this.props;
        const {value} = this.state;
        const {error, isLoaded} = this.state;
        if (error) {
            return (
                <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '5%', padding: '4%'}}>
                    <Typography display="block" variant="h6" align={'center'} color={"primary"}>
                        Please refresh the page and try again.

                    </Typography>
                    <Typography display="block" variant="h6" align={'center'} color={"primary"}>
                        If you have any questions or encounter issues,
                        please contact support via the "Help" tab.
                    </Typography> </Paper>);
        } else if (!isLoaded) {
            return (
                <div style={{textAlign: 'center', paddingTop: "15%"}}>
                    <CircularProgress size="8rem"/>
                </div>);
        } else {
            return (
                <Grid container direction="row">
                    <TabContext value={value.toString()}>
                        <AppBar position="static" color="default">
                            <Tabs
                                className={classes.tabs}
                                value={value}
                                onChange={this.handleTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tooltip title={'New Semester'}>

                                    <Button
                                        variant="outlined"
                                        onClick={this.addTab}
                                    >
                                        <Add/>
                                    </Button>
                                </Tooltip>
                                {
                                    this.state.tabList.map((tab) => (
                                        <Tab
                                            classes={{
                                                wrapper: classes.iconLabelWrapper,
                                            }}
                                            key={tab.key.toString()}
                                            value={tab.id}
                                            label={tab.name}
                                            icon={this.state.tabList.length !== 1 ? (
                                                <Tooltip title="Delete">
                                                    <DeleteIcon
                                                        fontSize={'small'}
                                                        color={"secondary"}
                                                        id={tab.id}
                                                        onClick={
                                                            () => this.handleOpenDeleteModal(tab)
                                                        }
                                                    />
                                                </Tooltip>) : ''
                                            }
                                            className="mytab"
                                        />
                                    ))
                                }
                            </Tabs>
                        </AppBar>
                        <Grid container
                              direction="row"
                              justify="center"
                              alignItems="center">
                            <Grid item xs={6}>

                                {
                                    this.state.tabList.map((tab) => (
                                        <TabPanel
                                            children={<Course
                                                courses={this.state.tabList}
                                                tab={tab}
                                                updateCourse={this.handleUpdateCourse}
                                            />
                                            }
                                            key={tab.key.toString()}
                                            value={tab.id.toString()}
                                            tabIndex={tab.id}
                                        />
                                    ))
                                }
                            </Grid>
                        </Grid>
                    </TabContext>
                    {this.state.openDeleteModal ? (
                        <DeleteDialog
                            yesButtonText={'Delete'}
                            modalText={'Do you want to delete course?'}
                            isOpen={this.state.openDeleteModal}
                            yesButtonFunction={this.deleteTab}
                            closeModal={this.handleCloseDeleteModal}
                        />) : ''
                    }
                </Grid>

            );
        }
    }
}

export default withStyles(styles)(withSnackbar(Courses));
