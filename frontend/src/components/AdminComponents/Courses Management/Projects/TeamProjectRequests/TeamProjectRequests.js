import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {approveOrRejectEntity, getAllEntities} from "../../../../Services/mySqlServices";
import MaterialTable from "material-table";
import {withSnackbar} from "notistack";
import ThumbUpAltIcon from '@material-ui/icons/ThumbUpAlt';
import ThumbDownAltIcon from '@material-ui/icons/ThumbDownAlt';
import Dialog from "./RequestDialog";
import tableConfig from "../../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {connect} from "react-redux";
import { Button } from '@material-ui/core';
import TeamLink from '../../../Links/TeamLink/TeamLink';
import ProjectLink from '../../../Links/ProjectLink/ProjectLink';

class TeamProjectRequests extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            renderedRequests: [],
            teamProjectRequests: [],
            openModal: false,
            modalText: '',
            messageForTeams: "",
            endpoint: null,
            requestObject: null,
            columns: [
                {
                    title: 'Project ID',
                    field: 'projectIdRendered',
                    editable: 'never',
                    render: rowData => rowData.projectIdRendered > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.projectIdRendered, projectLinkOpen: true })} >{rowData.projectIdRendered}</Button> : ''

                },
                {
                    title: 'Project Name',
                    field: 'projectName',
                },
                {
                    title: 'Project Description',
                    field: 'description',
                    hidden: true,
                    export: true
                },
                {
                    title: 'Organization',
                    field: 'organizationName',
                },

                {
                    title: 'Team',
                    field: 'teamId',
                    render: rowData => rowData.teamId > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.teamId, teamLinkOpen: true })} >{rowData.teamId}</Button> : ''

                },
                {
                    title: 'Admin Status',
                    field: 'adminStatus',
                },
            ],
            clickedTeamId: null,
            clickedProjectId: null,
            teamLinkOpen: false,
            projectLinkOpen: false
        };

    }


    /**
     * Function that renders some of team-project request's properties to sting and adds as new properties,
     * for future display in material-table
     * @param    {Object} requests- array of team-project requests
     * @return   {Object} requests- array of team-project requests
     */
    renderData = (requests) => {
        for (let request of requests) {
            if (request.organizationId) {
                request.organizationName = request.organizationId.name;
            } else {
                request.organizationName = "";

            }
            if (request.projectId) {
                request.projectIdRendered = request.projectId.id;
                request.projectName = request.projectId.name;
            } else {
                request.projectIdRendered = '';
                request.projectName = '';
            }
        }
        return requests;
    };


    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let params = {
                isAdvisorView: this.props.isAdvisorView,
                advisorId: userRed.uid
            };
        getAllEntities('teamsProjectsRequests',params)
            .then((response) => {
                let renderedRequests = this.renderData(response);
                this.setState({
                    renderedRequests: renderedRequests,
                    teamProjectRequests: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});
        });

    };

    handleRequest = (endpoint, requestObject) => {
        let promises = [];
        let asignedProject = null;
        promises.push(
            getAllEntities('assignedProjects')
                .then((assignedProjects) => {
                    asignedProject = assignedProjects.filter((project) => project.teamId ? project.teamId.id === requestObject.teamId : false)[0];
                }));
        return Promise.all(promises).then(x => {
            if (asignedProject) {
                if (endpoint === 'reject') {
                    let modalText = 'This team assigned to project (#' + asignedProject.id.toString() + ').\n' +
                        'On reject, all files and grades assosiated with this team and project will be deleted.\n' +
                        'Are you sure?';
                    this.setState({
                        openModal: true,
                        modalText: modalText,
                        endpoint: endpoint,
                        requestObject: requestObject
                    })
                } else if (endpoint === 'approve') {
                    let modalText = 'This team assigned to another project (#' + asignedProject.id.toString() + ').\n' +
                        'On approval, all files and grades assosiated with this team and project will be deleted \n' +
                        ' and the team will be assigned to the selected project.\n' +
                        ' Are you sure?';
                    this.setState({
                        openModal: true,
                        modalText: modalText,
                        endpoint: endpoint,
                        requestObject: requestObject
                    })
                }
                return null
            } else {
                this.handleApproveOrReject(endpoint, requestObject);
                return endpoint
            }
        }).catch((error) => {
            this.setState({error: error});
            return null
        });

    };

    /**
     * Function that updates team-project request's adminStatus property
     * @param    {String} endpoint- string 'approve'\'reject'
     * @param {Object} requestObject- team-project request object
     */
    handleApproveOrReject = (endpoint, requestObject) => {
        approveOrRejectEntity(requestObject, endpoint + '/teamsProjectsRequests', {"message": this.state.messageForTeams})
            .then((response) => {
                if (endpoint === 'approve') {
                    requestObject.adminStatus = 'approved';
                } else {
                    requestObject.adminStatus = 'rejected';
                }
                this.setState({
                    openModal: false
                });
                this.props.enqueueSnackbar("You " + requestObject.adminStatus + " assignment of team " + requestObject.teamId + " to project " + requestObject.projectId.name, {variant: 'success'});

            }).catch(e => {
            this.setState({error: e})
        });
    };

    /**
     * Function that closes Modal Display.
     */
    handleCloseModal = () => {
        this.setState({openModal: false});
    };

    handleAddMessage = (message) => {
        this.setState({messageForTeams: message});
    };

    handleTeamLinkClose = () => {
        this.setState({ teamLinkOpen: false, clickedTeamId: null });
    };

    handleProjectLinkClose = () => {
        this.setState({ projectLinkOpen: false, clickedProjectId: null });
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
            return (
                <div style={{textAlign: 'center'}}>
                    <CircularProgress/>
                </div>);
        } else {
            const tableRef = React.createRef();
            const actions = [
                rowData => ({
                    name: 'approveProject',
                    icon: () => (<ThumbUpAltIcon/>),
                    tooltip: 'Approve Request',
                    position: "row",
                    onClick:
                        (event, rowData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    let request = {...rowData};
                                    delete request.organizationName;
                                    delete request.projectIdRendered;
                                    delete request.projectName;
                                    this.handleRequest('approve', request).then((endpoint) => {
                                        if (endpoint === 'approve') {

                                            rowData.adminStatus = 'approved';
                                        } else {
                                            rowData.adminStatus = 'rejected';
                                        }
                                    });
                                    resolve()
                                }, 1000);
                            }),
                    disabled: rowData.adminStatus === 'approved'
                }),
                rowData => ({
                    name: 'rejectProject',
                    icon: () => (<ThumbDownAltIcon/>),
                    tooltip: 'Reject Request',
                    position: "row",
                    hidden: false,
                    onClick:
                        (event, rowData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    let request = {...rowData};
                                    delete request.organizationName;
                                    delete request.projectIdRendered;
                                    delete request.projectName;
                                    this.handleRequest('reject', request).then((endpoint) => {
                                        if (endpoint === 'approve') {

                                            rowData.adminStatus = 'approved';
                                        } else {
                                            rowData.adminStatus = 'rejected';
                                        }
                                    });
                                    resolve()
                                }, 1000);
                            }),
                    disabled: rowData.adminStatus === 'rejected'
                }),
            ];
            return (
                <>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>

                    <MaterialTable
                        tableRef={tableRef}
                        title={<div style={{display: 'flex'}}><h2>Team-Project Requests</h2><p
                            style={{marginTop: '4.5%'}}><b>Notice:</b> while team-project request approved, all
                            other
                            team-project
                            requests for
                            same project rejected automatically</p></div>}
                        columns={this.state.columns}
                        data={this.state.renderedRequests}
                        actions={actions}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.renderedRequests.length),
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            exportAllData: true,
                            exportFileName: 'Team-Project Requests',
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }
                        }}
                    />
                    {
                        this.state.openModal ? (
                            <Dialog
                                yesButtonText={'Continue'}
                                modalText={this.state.modalText}
                                isOpen={this.state.openModal}
                                messageForTeams={this.state.messageForTeams}
                                handleAddMessage={this.handleAddMessage}
                                yesButtonFunction={() => this.handleApproveOrReject(this.state.endpoint, this.state.requestObject)}
                                closeModal={this.handleCloseModal}
                            />) : ''
                    }
                    <TeamLink
                        teamLinkOpen={this.state.teamLinkOpen}
                        handleTeamLinkClose={this.handleTeamLinkClose}
                        teamId={this.state.clickedTeamId}
                    />
                    <ProjectLink
                        projectLinkOpen={this.state.projectLinkOpen}
                        handleProjectLinkClose={this.handleProjectLinkClose}
                        projectId={this.state.clickedProjectId}
                    />
                </>

            );
        }

    }
}


const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};

export default connect(mapStateToProps)(withSnackbar(TeamProjectRequests));
