import React, {Component} from "react";
import {Button, Grid, Tab, Tabs, withStyles} from "@material-ui/core";
import Add from "@material-ui/icons/Add";
import cloneDeep from "lodash/cloneDeep";
import TabPanel from "@material-ui/lab/TabPanel";
import TabContext from "@material-ui/lab/TabContext";
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from "@material-ui/core/Tooltip";
import DeleteDialog from "../../../SharedComponents/Yes_No_Dialog/Yes_No_Dialog";
import {addFBEntity, getAllFBEntities, removeFBEntity} from "../../../Services/firebaseServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import {withSnackbar} from "notistack";
import AppBar from "@material-ui/core/AppBar";
import GradeComponentsTable from "./GradeComponentsTable";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    iconLabelWrapper: {
        flexDirection: "row",
    }
});


class Grades extends Component {
    constructor(...args) {
        super(...args);
        this.state = {
            openDeleteModal: false,
            tabToDelete: null,
            value: null,
            tabList: null
        };
    }

    /**
     * Function that creates new Grade Template tab.
     */
    addTab = () => {
        let title = prompt("Please enter Grade Template name:");
        if (title === '' || title === null) {
            return
        }
        let gradeTemplate = {
            title: title,
            isCurrent: false,
            template: {}
        };
        addFBEntity(gradeTemplate, 'gradeTemplates')
            .then((response) => {
                gradeTemplate.id = response;
                gradeTemplate.key = response;
                this.setState((state, props) => {
                    let tabList = cloneDeep(state.tabList);
                    tabList.unshift(gradeTemplate);
                    return {tabList,}
                })
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that removes existing grade template tab.
     * @param    {Object} e-Event object
     */
    deleteTab = (e) => {
        // prevent MaterialUI from switching tabs
        e.stopPropagation();
        removeFBEntity(this.state.tabToDelete, 'gradeTemplates').then((response) => {
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
            let tabID = this.state.tabToDelete.id;
            // let tabID = parseInt(e.target.id);
            let tabIDIndex = 0;

            let tabList = this.state.tabList.filter((value, index) => {
                if (value.id === tabID) {
                    tabIDIndex = index;
                }
                return value.id !== tabID;
            });
            this.setState((state, props) => {
                let curValue = state.value;
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
            this.props.enqueueSnackbar('Grade Template Deleted', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error});
            this.props.enqueueSnackbar('Frade Template Delete Failed', {variant: 'error'});
        });
    };


    /**
     * Function that switches to chosen grade template tab.
     * @param    {Object} e-Event object
     * @param    {Object} value- event obj. value
     */
    handleTabChange = (event, value) => {
        this.setState({value});
    };

    /**
     * Function that opens Delete Display and sets chosen tab to be deleted
     * @param    {Object} tab
     */
    handleOpenDeleteModal = (tab) => {
        this.setState({openDeleteModal: true, tabToDelete: tab});

    };

    /**
     * Function that closes Delete Display.
     */
    handleCloseDeleteModal = () => {
        this.setState({openDeleteModal: false, tabToDelete: null});
    };

    componentDidMount(): void {
        getAllFBEntities('gradeTemplates')
            .then((response) => {
                for (let template of response) {
                    template.key = template.id;
                }
                let tabs = [];
                let value = 0;
                if (response.length !== 0) {
                    tabs = response.reverse();
                    value = tabs[0] ? tabs[0].id : 0
                }
                this.setState({
                    tabList: tabs,
                    isLoaded: true,
                    value: value
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
                <div>
                    <TabContext value={value}>
                        <AppBar position="static" color="default">
                            <Tabs
                                className={classes.root}
                                value={value}
                                onChange={this.handleTabChange}
                                indicatorColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tooltip title={'New Grade Template'}>
                                    <Button
                                        variant="outlined"
                                        onClick={this.addTab}>
                                        <Add/>
                                    </Button>
                                </Tooltip>
                                {
                                    this.state.tabList.map((tab) => (
                                        <Tab
                                            classes={{
                                                wrapper: classes.iconLabelWrapper,
                                            }}
                                            key={tab.key}
                                            value={tab.id}
                                            label={tab.title}
                                            icon={this.state.tabList.length !== 1 ? (
                                                <Tooltip title="Delete">
                                                    <DeleteIcon
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
                        <Grid
                            container
                            direction="row"
                            justify="center"
                            alignItems="center">
                            <Grid item xs={8}>
                                {
                                    this.state.tabList.map((tab) => (
                                        tab ?
                                            <TabPanel
                                                children={<GradeComponentsTable
                                                    tab={tab}
                                                    template={tab.template}
                                                    onSubmit={this.updateTabContent}
                                                />
                                                }
                                                key={tab.key}
                                                value={tab.id}
                                                tabIndex={tab.id}
                                            /> : null
                                    ))
                                }
                            </Grid>
                        </Grid>
                    </TabContext>
                    {
                        this.state.openDeleteModal ? (
                            <DeleteDialog
                                yesButtonText={'Delete'}
                                modalText={'Do you want to delete grade template?'}
                                isOpen={this.state.openDeleteModal}
                                yesButtonFunction={this.deleteTab}
                                closeModal={this.handleCloseDeleteModal}
                            />) : ''
                    }

                </div>

            );
        }
    }
}

export default withStyles(styles)(withSnackbar(Grades));
