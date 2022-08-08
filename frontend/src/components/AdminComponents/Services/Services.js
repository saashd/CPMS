import React from 'react';
import {Button,} from "@material-ui/core";
import {
    trainGradeModel,
    update_logTable,
    updateCourseAndSemester,
    updateProjectsStatus,
    updateStatusOfCompletedProjects
} from "../../Services/mySqlServices";
import {withSnackbar} from "notistack";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

class Services extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};

    }

    render() {
        return (
            <Paper elevation={3} style={{textAlign: '-webkit-center', margin: '10%'}}>
                <Typography display="block" variant="body1" align={'center'} color={"primary"}>
                    If one of the services is not working automatically, you can try to activate one of the options below manually
                </Typography>
                <Divider/>
                <Button style={{width: '30%', textAlign: 'center', margin: '2%'}} variant="contained"
                        color="primary"
                        onClick={() => {
                            updateCourseAndSemester().then(r => {
                                    this.props.enqueueSnackbar("Users transferred to current course and semester", {variant: 'success'})
                                }
                            ).catch(e => {
                                this.props.enqueueSnackbar("Could not transfer users to current course and semester", {variant: 'Error'})

                            })
                        }}
                >Transfer users to current course and semester</Button>
                <Button style={{width: '30%', textAlign: 'center', margin: '2%'}} variant="contained"
                        color="primary" onClick={() => {
                    update_logTable().then(r => {
                            this.props.enqueueSnackbar("Logs cleared", {variant: 'success'})
                        }
                    ).catch(e => {
                        this.props.enqueueSnackbar("Could not clear Logs ", {variant: 'Error'})

                    })
                }}>Clear logTable</Button>
                <Button style={{width: '30%', textAlign: 'center', margin: '2%'}} variant="contained"
                        color="primary"
                        onClick={() => {
                            updateProjectsStatus().then(r => {
                                    this.props.enqueueSnackbar("Projects updated", {variant: 'success'})
                                }
                            ).catch(e => {
                                this.props.enqueueSnackbar("Could not update the  Projects", {variant: 'Error'})

                            })
                        }}
                >Update Projects
                    Status</Button>
                <Button style={{width: '30%', textAlign: 'center', margin: '2%'}} variant="contained"
                        color="primary"
                        onClick={() => {
                            updateStatusOfCompletedProjects().then(r => {
                                    this.props.enqueueSnackbar("Projects updated", {variant: 'success'})
                                }
                            ).catch(e => {
                                this.props.enqueueSnackbar("Could not update the  Projects", {variant: 'Error'})

                            })
                        }}
                >Update Status Of
                    Completed Projects</Button>
                <Button style={{width: '30%', textAlign: 'center', margin: '2%'}} variant="contained"
                        color="primary"
                        onClick={() => {
                            trainGradeModel().then(r => {
                                    this.props.enqueueSnackbar("Model trained", {variant: 'success'})
                                }
                            ).catch(e => {
                                this.props.enqueueSnackbar("Could not train the model ", {variant: 'Error'})

                            })
                        }}
                >Train Grade Model</Button>
            </Paper>

        );
    }
}

export default withSnackbar(Services);
