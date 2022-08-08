import React, {Fragment} from 'react';
import MaterialTable from 'material-table';
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import ProjectForm from "../../../../SharedComponents/MyProjects/ProjectDetails/Tabs/ProjectsForm";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DialogTitle from "@material-ui/core/DialogTitle";
import {addEntity, editEntity, removeEntity} from "../../../../Services/mySqlServices";
import {withSnackbar} from "notistack";
import tableConfig from "../../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class TableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            columns: this.props.columns,
            newProjectProposals: this.props.data,
            title: this.props.title,
            currentEditableProject: '',
            newelyCreatedProject: null,
            error: null,
            editFlag: false


        };
        this.action = key => (
            <Fragment>
                <Button style={{color: '#fff'}} onClick={() => {
                    this.setState({editFlag: true})
                }}>
                    Open Project Details
                </Button>
                <Button style={{color: '#fff'}} onClick={() => {
                    this.props.closeSnackbar(key)
                }}>
                    Dismiss
                </Button>
            </Fragment>
        );

    }


    /**
     * Function that approves newly proposed project by calling function that update projects table and proposed project table.
     * @param approvedProject
     */
    approveProject = (approvedProject, unrenderedApprovedProject) => {
        addEntity(approvedProject, 'projects').then((response) => {
            removeEntity(approvedProject, 'projectProposals').then(() => {
                let proposals = [...this.state.newProjectProposals];
                let i = proposals.findIndex(obj => obj.id === approvedProject.id);
                proposals.splice(i, 1);
                response.organizationId = unrenderedApprovedProject.organizationId;
                response.organizationName = unrenderedApprovedProject.organizationName;
                response.academicAdvisorId = unrenderedApprovedProject.academicAdvisorId;
                response.industrialAdvisorId = unrenderedApprovedProject.industrialAdvisorId;
                this.setState({
                    newProjectProposals: proposals,
                    newelyCreatedProject: response
                });
                this.props.enqueueSnackbar('Project Approved', {
                    variant: 'success',
                    autoHideDuration: 3000,
                    action: this.action,
                });
            }).catch((error) => {
                this.setState({error: error})
            });
        }).catch((error) => {
            this.setState({error: error})
        });
    };
    /**
     * Function that approves newly proposed project by calling function that update proposed project table.
     * @param rejectedProject
     */
    rejectProject = (rejectedProject) => {
        removeEntity(rejectedProject, 'projectProposals').then(() => {
            let proposals = [...this.state.newProjectProposals];
            let i = proposals.findIndex(obj => obj.id === rejectedProject.id);
            proposals.splice(i, 1);
            this.setState({
                newProjectProposals: proposals
            });
            this.props.enqueueSnackbar('Project Rejected', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error})
        });
    };


    /**
     * Function that removes unnecessary properties from project.(properties that were added in renderData function),
     * Then updates existing project.
     * @param    {Object} projectObj- existing project object
     * @return   error message or updated projects array.
     */
    handleProjectUpdate(projectObj) {
        let unrenderedProject = {...projectObj};
        delete unrenderedProject.organizationName;
        delete unrenderedProject.industrialAdvisorName;
        delete unrenderedProject.academicAdvisorName;
        unrenderedProject.industrialAdvisorId = unrenderedProject.industrialAdvisorId ? unrenderedProject.industrialAdvisorId.firebase_user_id : null;
        unrenderedProject.academicAdvisorId = unrenderedProject.academicAdvisorId ? unrenderedProject.academicAdvisorId.firebase_user_id : null;
        unrenderedProject.organizationId = unrenderedProject.organizationId ? unrenderedProject.organizationId.id : null;
        unrenderedProject.teamId = unrenderedProject.teamId ? unrenderedProject.teamId.id : null;
        return editEntity(unrenderedProject, 'projects')
            .then((response) => {
                this.props.enqueueSnackbar('Project Updated Successfully', {variant: 'success'});
                return Promise.resolve(response);

            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    }


    render() {
        const tableRef = React.createRef();

        const handleClose = () => {
            this.setState({open: false, editFlag: false});
        };

        const actions = [
            {
                name: "editProject",
                icon: props => (<MoreVertIcon/>),
                tooltip: "View More",
                position: "row",
                onClick: (e, rowData) => {
                    let project = this.state.newProjectProposals.find(obj => {
                        return obj.id === rowData.id
                    });
                    if (!('status' in project)) {
                        project.status = 'Available';
                    }
                    this.setState({
                        open: true,
                        currentEditableProject: project
                    });
                }
            },
        ];
        const {error} = this.state;
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
        } else {
            return (
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={this.state.title}
                        columns={this.state.columns}
                        data={this.state.newProjectProposals}
                        actions={actions}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.newProjectProposals.length),
                            emptyRowsWhenPaging: false,
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }

                        }}
                    />
                    <Dialog
                        fullWidth={true}
                        maxWidth={'md'}
                        open={this.state.open} onClose={handleClose}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose} color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project </DialogTitle>
                        <DialogContent>
                            <ProjectForm
                                aproveRejectProject={true}
                                currentEditableProject={this.state.currentEditableProject}
                                handleClose={handleClose}
                                rejectProject={this.rejectProject}
                                approveProject={this.approveProject}

                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog fullWidth={true}
                            maxWidth={'xl'}
                            open={this.state.editFlag} onClose={handleClose}
                            aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        {this.state.newelyCreatedProject ?
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project: {' '}
                                {this.state.newelyCreatedProject.id} </DialogTitle>
                            : ''
                        }
                        <DialogContent>
                            <ProjectForm
                                onSend={handleClose}
                                currentEditableProject={this.state.newelyCreatedProject}
                                editFlag={true}
                                viewMoreFlag={false}
                                onUpdate={this.handleProjectUpdate.bind(this)}
                            />

                        </DialogContent>
                    </Dialog>
                </div>
            )
        }
    }
}


export default (withSnackbar(TableComponent));