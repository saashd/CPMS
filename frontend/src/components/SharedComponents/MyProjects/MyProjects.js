import React from 'react';
import TableComponent from "./TableComponent";
import {getEntitiesByIDs} from "../../Services/mySqlServices";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import {connect} from "react-redux";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import ProposeProject from "../../AdvisorComponents/ProposeProject/ProposeProject";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import {CloseIcon} from "@material-ui/data-grid";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

class MyProjects extends React.Component {
    constructor() {
        super();
        this.state = {
            openDialog: false,
            error: null,
            isLoaded: false,
            userDetails: null,
            userRed: null,
            studentProject: null,
            academicProjects: null,
            industrialProjects: null,
            columns: [
                {
                    title: 'Project ID',
                    field: 'id',
                    editable: 'never',
                },
                {
                    title: 'Project Name',
                    field: 'name',
                }
                ,
                {
                    title: 'Organizations',
                    field: 'organizationName',
                },
                {
                    title: 'Status',
                    field: 'status',
                },
                {
                    title: 'Initiation Date',
                    field: 'initiationDate',
                    hidden: true
                }
            ]
        };

    }

    renderData = (projects) => {
        for (let project of projects) {
            if (project.organizationId) {
                project.organizationName = project.organizationId.name;
            } else {
                project.organizationName = "";

            }
            if (project.industrialAdvisorId) {
                project.industrialAdvisorName = project.industrialAdvisorId.engFirstName + ' ' + project.industrialAdvisorId.engLastName;
            } else {
                project.industrialAdvisorName = "";

            }
            if (project.academicAdvisorId) {
                project.academicAdvisorName = project.academicAdvisorId.engFirstName + ' ' + project.academicAdvisorId.engLastName;
            } else {
                project.academicAdvisorName = "";

            }
        }
        return projects;
    };


    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            const user = result[userRed.uid];
            this.setState({
                userRed: userRed,
                userDetails: user,
            });
            if (user.user_type === 'student') {
                const studentObj = {user_id: [user.firebase_user_id]};
                getEntitiesByIDs(studentObj, 'retrieve/studentProjects', true).then(r => {
                    let renderedProjects = this.renderData(r);
                    this.setState({
                        studentProject: renderedProjects,
                        isLoaded: true
                    });
                })
            } else if (user.user_type === 'advisor') {
                const advisorObj = {user_id: [user.firebase_user_id]};
                let promises = [];
                promises.push(getEntitiesByIDs(advisorObj, 'retrieve/academicProjects', true).then(r => {
                    let renderedProjects = this.renderData(r);
                    this.setState({
                        academicProjects: renderedProjects,
                    });
                }));
                promises.push(getEntitiesByIDs(advisorObj, 'retrieve/industrialProjects', true).then(r => {
                    let renderedProjects = this.renderData(r);
                    this.setState({
                        industrialProjects: renderedProjects,
                    });
                }));
                Promise.all(promises).then(r => {
                    this.setState({
                        isLoaded: true
                    });
                }).catch(e => {
                    this.setState({error: e})
                })
            }
        }).catch(error => {
            this.setState({error: error})
        });
    };

    handleClose = () => {
        this.setState({openDialog: false});
    };


    render() {
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
            return <div style={{textAlign: 'center', paddingTop: "15%"}}>
                <CircularProgress size="8rem"/>
            </div>;
        } else {
            if (this.state.userDetails.user_type === 'student') {
                return (
                    <div>
                        {this.state.studentProject.length === 0 ?
                            <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '10%'}}>
                                <Typography
                                    style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                                    No Project Assigned
                                </Typography>
                            </Paper>

                            :
                            <div>
                                <TableComponent
                                    userDetails={this.state.userDetails}
                                    data={this.state.studentProject}
                                    columns={[...this.state.columns]}
                                    title={'My Project'}
                                />
                            </div>
                        }
                    </div>
                );

            } else {
                return (
                    <div>
                        <Button
                            startIcon={<AddCircleOutlineIcon/>}
                            style={{margin: "2%", backgroundColor: "#4caf50", color: "#fff", padding: "1%"}}
                            onClick={() => {
                                this.setState({openDialog: true})
                            }}
                            color="default" variant="contained"> Offer a Project</Button>
                        {this.state.academicProjects.length === 0 ?
                            <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '3%'}}>
                                <Typography
                                    style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                                    No projects under your supervision as an academic superivsor
                                </Typography>
                            </Paper> :
                            <div>
                                <TableComponent
                                    userDetails={this.state.userDetails}
                                    data={this.state.academicProjects}
                                    columns={[...this.state.columns]}
                                    title={'Academic Projects'}
                                />
                            </div>}
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        {this.state.industrialProjects.length === 0 ?
                            <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '3%'}}>
                                <Typography
                                    style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                                    No projects under your supervision as an industrial superivsor
                                </Typography>
                            </Paper> :
                            <div>
                                <TableComponent
                                    userDetails={this.state.userDetails}
                                    data={this.state.industrialProjects}
                                    columns={[...this.state.columns]}
                                    title={'Industrial Projects'}
                                />
                            </div>}
                        <Dialog
                            fullWidth={true}
                            maxWidth={'md'}
                            open={this.state.openDialog} onClose={this.handleClose}
                            aria-labelledby="form-dialog-title">
                            <DialogActions>
                                <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleClose}
                                        color="primary">
                                    <CloseIcon/>
                                </Button>
                            </DialogActions>
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">
                                Fill Project's Details </DialogTitle>
                            <DialogContent>
                                <ProposeProject handleClose={this.handleClose}/>
                            </DialogContent></Dialog>
                    </div>
                );

            }
        }

    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};
export default connect(mapStateToProps)(MyProjects);
