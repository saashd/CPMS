import React from 'react';
import MaterialTable from 'material-table';
import Icon from "@material-ui/core/Icon";
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import TeamForm from "./TeamForm";
import {withSnackbar} from "notistack";
import {connect} from "react-redux";
import CircularProgress from "@material-ui/core/CircularProgress";
import {predictGrade} from "../../../Services/mySqlServices";
import tableConfig from "../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import TeamLink from '../../Links/TeamLink/TeamLink';
import ProjectLink from '../../Links/ProjectLink/ProjectLink';

class TableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            open: false,
            teams: this.props.teams,
            handleAdd: this.props.handleAdd,
            handleEdit: this.props.handleEdit,
            handleDelete: this.props.handleDelete,
            title: this.props.title,
            currentTeam: null,
            editFlag: false,
            predictDialogOpen: false,
            predictCurrentQuote: 'Loading...',
            predictLoading: false,
            clickedTeamId: null,
            clickedProjectId: null,
            teamLinkOpen: false,
            projectLinkOpen: false

        };

    }

    columns = [
        {
            title: 'Team ID',
            field: 'id',
            render: rowData => rowData.id > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.id, teamLinkOpen: true })} >{rowData.id}</Button> : '---'
        },
        {
            title: 'Project Id',
            field: 'projectId',
            render: rowData => rowData.projectId > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.projectId, projectLinkOpen: true })} >{rowData.projectId}</Button> : '---'
        },
        {
            title: 'Project Name',
            field: 'name'
        },
        {
            title: "Team's Students",
            field: 'studentsNames',

        },
    ]


    /**
     * Function that adds new team of updates existing team, updates array of teams.
     * @param    {Object} teamObj  team object
     * @return   error or success message
     */
    addTeamFromForm = (teamObj) => {
        if (this.state.editFlag) {
            return this.state.handleEdit(teamObj).then((response) => {
                this.setState({teams: response, currentTeam: null});
                this.props.enqueueSnackbar("Team Updated", {variant: 'success'});
                return Promise.resolve(teamObj);
            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
        } else {
            return this.state.handleAdd(teamObj).then((response) => {
                this.setState({teams: response, currentTeam: null});
                this.props.enqueueSnackbar("Team Created", {variant: 'success'});
                return Promise.resolve(teamObj);
            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
        }

    };

    handleTeamLinkClose = () => {
        this.setState({ teamLinkOpen: false, clickedTeamId: null });
    };

    handleProjectLinkClose = () => {
        this.setState({ projectLinkOpen: false, clickedProjectId: null });
    };

    render() {
        const tableRef = React.createRef();
        /**
         * Function that creates new team object, stores it in currentTeam
         */
        const handleCreateTeam = () => {
            this.setState({
                open: true,
                editFlag: false,
                currentTeam: {
                    comment: '',
                    name: null,
                    students: [],
                    projectId: null,
                    creatorId: null
                },
            });

        };


        /**
         * Function that closes Team Form Dialog
         */
        const handleClose = () => {
            this.setState({open: false});
        };

        const handlePredictDialogClose = () => {
            this.setState({predictCurrentQuote: 'Loading...', predictDialogOpen: false});
        };

        const actions = [
            {
                name: "createTeam",
                icon: props => (
                    <Icon style={{fontSize: 40, color: '#009688'}}>add_circle</Icon>),
                tooltip: "create New Team",
                position: "toolbar",
                onClick: (handleCreateTeam)
            },
            {
                name: "editTeam",
                icon: props => (<EditIcon style={{color: '#009688'}}/>),
                tooltip: "Edit Team",
                position: "row",
                onClick: (e, rowData) => {
                    let team = this.state.teams.find(obj => {
                        return obj.id === rowData.id
                    });
                    this.setState({
                        open: true, editFlag: true,
                        currentTeam: team
                    });
                }
            },
            {
                name: "predictTeam",
                icon: props => (<AccountTreeIcon style={{color: '#1976D2'}}/>),
                tooltip: "Predict Team Grade",
                position: "row",
                onClick: (e, rowData) => {
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            let team = this.state.teams.find(obj => {
                                return obj.id === rowData.id
                            });
                            this.setState({
                                predictLoading: true,
                                predictDialogOpen: true,
                                predictCurrentQuote: 'Loading...'
                            });
                            if (team.projectId) {
                                this.setState({predictLoading: true, predictDialogOpen: true});
                                predictGrade(team).then((prediction) => {
                                    this.setState({
                                        predictLoading: false,
                                        predictCurrentQuote: 'Current Grade Range Prediction is: ' + prediction
                                    });
                                }).catch((error) => {
                                        this.setState({error: error})
                                    }
                                )
                            } else {
                                this.setState({
                                    predictLoading: false,
                                    predictCurrentQuote: 'Cannot Predict Grade of a Team Without Assigned Project'
                                });
                            }
                            resolve()
                        }, 1000)
                    })
                },
            }
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
                <>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={this.state.title}
                        columns={this.columns}
                        data={this.state.teams}
                        icons={{
                            Delete: props => (<DeleteIcon style={{color: '#e91e63'}}/>)
                        }}
                        localization={{
                            body: {
                                deleteTooltip: 'Delete',
                                addTooltip: 'Add New Team',
                                editRow: {deleteText: 'Do you want to delete this team?'}
                            }
                        }}
                        editable={{
                            isEditable: rowData => {
                                return !!this.props.adminViewRed;
                            },
                            onRowDelete: this.props.adminViewRed ? oldData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.state.handleDelete(oldData)
                                            .then(response => {
                                                this.setState({
                                                    teams: response,
                                                });
                                                this.props.enqueueSnackbar("Team Removed", {variant: 'success'});
                                            })
                                            .catch(e => {
                                                this.setState({error: e})
                                                this.props.enqueueSnackbar('Error occurred while deleting row', {variant: 'error'});
                                            });
                                        resolve()
                                    }, 1000)
                                }):null,
                        }}
                        actions={this.props.adminViewRed ?actions:null}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.teams.length),
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }

                        }}
                    />
                    <Dialog fullWidth={true}
                            maxWidth={'sm'}
                            open={this.state.open} onClose={handleClose}
                            aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose} color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <TeamForm handleAdd={this.addTeamFromForm}
                                      onSend={handleClose}
                                      teams={this.state.teams}
                                      currentTeam={this.state.currentTeam}
                                      editFlag={this.state.editFlag}
                            />
                        </DialogContent>
                    </Dialog>
                    <Dialog
                        fullWidth
                        maxWidth="sm"
                        open={this.state.predictDialogOpen}
                        onClose={handlePredictDialogClose}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogContent>
                            <div style={{textAlign: 'center'}}>
                                {this.state.predictLoading ? <div><CircularProgress size="4rem"/></div> : null}
                                <p>{this.state.predictCurrentQuote}</p>
                            </div>
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
            )
        }
    }
}



const mapStateToProps = state => {
    return {
        adminViewRed: state['adminView'],
        userRed: state['user']
    }
};
export default connect(mapStateToProps)(withSnackbar(TableComponent));