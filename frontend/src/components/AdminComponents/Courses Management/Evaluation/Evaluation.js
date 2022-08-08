import React, {Component} from "react";
import {Button, Grid, Tab, Tabs, withStyles} from "@material-ui/core";
import Add from "@material-ui/icons/Add";
import cloneDeep from "lodash/cloneDeep";
import TabPanel from "@material-ui/lab/TabPanel";
import TabContext from "@material-ui/lab/TabContext";
import DeleteIcon from '@material-ui/icons/Delete';
import EvaluationPageTemplate from "./EvaluationPageTemplate";
import Tooltip from "@material-ui/core/Tooltip";
import DeleteDialog from "../../../SharedComponents/Yes_No_Dialog/Yes_No_Dialog";
import {addFBEntity, editFBEntity, getAllFBEntities, removeFBEntity} from "../../../Services/firebaseServices";
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
    iconLabelWrapper: {
        flexDirection: "row",
    }
});


class CustomTabs extends Component {
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
     * Function that updates existing evaluation page tab properties
     * @param    {Object} updateTab  -  evaluation page tab object
     */
    updateTabContent = (updateTab) => {
        let tab = {...updateTab};
        delete tab.key;
        editFBEntity(tab, 'evaluationPages')
            .then((response) => {
                let tabs = [...this.state.tabList];
                let foundIndex = tabs.findIndex(x => x.id === updateTab.id);
                tabs[foundIndex] = updateTab;
                this.setState({tabList: tabs});
                this.props.enqueueSnackbar('Evaluation Page Updated', {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
            this.props.enqueueSnackbar('Evaluation Page Update Failed', {variant: 'error'});
        });
    };


    /**
     * Function that creates new evaluation page tab.
     */
    addTab = () => {
        let title = prompt("Please enter evaluation page name:");
        if (title === '' || title === null) {
            return
        }
        let evaluationPage = {
            title: title,
            template: {}
        };
        addFBEntity(evaluationPage, 'evaluationPages')
            .then((response) => {
                evaluationPage.id = response;
                evaluationPage.key = response;
                this.setState((state, props) => {
                    let tabList = cloneDeep(state.tabList);
                    tabList.unshift(evaluationPage);
                    return {tabList,}
                })
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that removes existing evaluation page tab.
     * @param    {Object} e-Event object
     */
    deleteTab = (e) => {
        // prevent MaterialUI from switching tabs
        e.stopPropagation();
        removeFBEntity(this.state.tabToDelete, 'evaluationPages').then((response) => {
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
            this.props.enqueueSnackbar('Evaluation Page Deleted', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error});
            this.props.enqueueSnackbar('Evaluation Page Delete Failed', {variant: 'error'});
        });
    };


    /**
     * Function that switches to chosen evaluation page tab.
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
        getAllFBEntities('evaluationPages')
            .then((response) => {
                for (let evaluation of response) {
                    evaluation.key = evaluation.id;
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
                <div style={{textAlign: 'center'}}>
                    <CircularProgress/>
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
                                <Tooltip title={'New Evaluation Template'}>
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
                            <Grid item xs={6}>
                                {
                                    this.state.tabList.map((tab) => (
                                        tab ?
                                            <TabPanel
                                                children={<EvaluationPageTemplate
                                                    tab={tab}
                                                    template={tab.template}
                                                    title={tab.title}
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
                                modalText={'Do you want to delete evaluation template?'}
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

export default withStyles(styles)(withSnackbar(CustomTabs));
