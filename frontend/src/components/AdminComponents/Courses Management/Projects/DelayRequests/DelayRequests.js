import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {editEntity, getAllEntities} from "../../../../Services/mySqlServices";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import MaterialTable from "material-table";
import CloseIcon from "@material-ui/icons/Close";
import DialogContent from "@material-ui/core/DialogContent";
import DelayRequestForm from "./DelayRequestForm";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import {withSnackbar} from "notistack";
import tableConfig from "../../../../config";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import TeamLink from '../../../Links/TeamLink/TeamLink';
import ProjectLink from '../../../Links/ProjectLink/ProjectLink';

class DelayRequests extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            delayRequests: [],
            renderedRequests: [],
            currentRequest: null,
            columns: [
                {
                    title: 'Project ID',
                    field: 'projectId',
                    editable: 'never',
                    render: rowData => rowData.projectId > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.projectId, projectLinkOpen: true })} >{rowData.projectId}</Button> : ''
                },
                {
                    title: 'Team Id',
                    field: 'teamId',
                    render: rowData => rowData.teamId > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.teamId, teamLinkOpen: true })} >{rowData.teamId}</Button> : ''
                },
                {
                    title: 'Student Id',
                    field: 'studentID',
                },
                {
                    title: 'Student Name',
                    field: 'studentName',
                },
                {
                    title: 'Status',
                    field: 'status',
                    render: rowData => {
                        return rowData.status ? rowData.status : 'pending'
                    }
                }
            ],
            clickedTeamId: null,
            clickedProjectId: null,
            teamLinkOpen: false,
            projectLinkOpen: false
        };

    }


    /**
     * Function that adds properties to existing delay request's properties.
     * for feature display in material-table
     * @param    {Object} requests  Object with delay requests properties
     * @return   {Object} rendered requests
     */
    renderData = (requests) => {
        for (let request of requests) {
            request.studentID = request.studentId ? request.studentId.id : '';
            request.studentName = request.studentId ? request.studentId.engFirstName + " " + request.studentId.engLastName : '';
        }
        return requests;
    };

    componentDidMount() {
        getAllEntities('delayRequests')
            .then((response) => {
                let renderedRequests = this.renderData(response);
                this.setState({
                    renderedRequests: renderedRequests,
                    delayRequests: response,
                    isLoaded: true
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    };


    /**
     * Function that updates delay request.
     * @param    {Object} currentRequest - existing request
     */
    handleRequest = (currentRequest) => {
        let sendRequest = {...currentRequest};
        delete sendRequest.studentID;
        delete sendRequest.studentName;
        sendRequest.studentId = currentRequest.studentId ? currentRequest.studentId.firebase_user_id : null;
        sendRequest.requestedDate = currentRequest.requestedDate ? new Date(currentRequest.requestedDate).toLocaleString("en-CA", {hour12: false}).replace(/,/, '') : null;
        sendRequest.answeredDate = currentRequest.answeredDate ? new Date(currentRequest.answeredDate).toLocaleString("en-CA", {hour12: false}).replace(/,/, '') : null;
        editEntity(sendRequest, 'delayRequests')
            .then((response) => {
                let delayRequests = [...this.state.delayRequests];
                let i = delayRequests.findIndex(obj => obj.id === currentRequest.id);
                if (delayRequests[i]) {
                    delayRequests[i] = currentRequest
                }
                let renderedRequests = this.renderData(delayRequests);
                this.setState({
                    delayRequests: delayRequests,
                    renderedRequests: renderedRequests
                });
                this.props.enqueueSnackbar('Delay Request ' + currentRequest.status, {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
        });


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

            /**
             * Function that closes Delay Request Form Display.
             */
            const handleClose = () => {
                this.setState({open: false});
            };

            const actions = [
                {
                    name: "editRequest",
                    icon: props => (<MoreVertIcon/>),
                    tooltip: "View More",
                    position: "row",
                    onClick: (e, rowData) => {
                        let request = this.state.renderedRequests.find(obj => {
                            return obj.id === rowData.id
                        });
                        this.setState({
                            open: true,
                            currentRequest: request
                        });
                    }
                },
            ];
            return (
                <>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={'Delay Request'}
                        columns={this.state.columns}
                        data={this.state.renderedRequests}
                        actions={actions}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.renderedRequests.length),
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
                        <DialogContent>
                            <DelayRequestForm
                                currentRequest={this.state.currentRequest}
                                handleClose={handleClose}
                                handleRequest={this.handleRequest}
                            />
                        </DialogContent>
                    </Dialog>
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

export default withSnackbar(DelayRequests)