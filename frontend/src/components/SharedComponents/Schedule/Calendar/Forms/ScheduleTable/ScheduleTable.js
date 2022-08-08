import React, {Component} from "react";
import ReactDOM from "react-dom";
import moment from 'moment';
import ChooseTeamModal from "./ChooseTeamModal";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import IconButton from "@material-ui/core/IconButton";
import TimerIcon from '@material-ui/icons/Timer';
import UpdateIcon from '@material-ui/icons/Update';
import Tooltip from "@material-ui/core/Tooltip";
import {Column, defaultTableRowRenderer, Table} from "react-virtualized";
import {SortableContainer, SortableElement} from "react-sortable-hoc";
import "react-virtualized/styles.css";
import "./styles.css";
import EvaluationPage from "./Evaluation/EvaluationPage";
import DeleteDialog from "../../../../../SharedComponents/Yes_No_Dialog/Yes_No_Dialog"
import FileCopyIcon from "@material-ui/icons/FileCopy";
import SaveAltIcon from "@material-ui/icons/SaveAlt";


import {
    addEntity,
    editEntity,
    getAllEntities,
    getEntitiesByIDs,
    removeEntity
} from "../../../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import InfoIcon from '@material-ui/icons/Info';
import DeleteIcon from '@material-ui/icons/Delete';
import ExportPresentation from "./ExportPresentation/ExportPresentation";
import {withSnackbar} from "notistack";
import {connect} from "react-redux";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import TeamLink from "../../../../../AdminComponents/Links/TeamLink/TeamLink";
import ProjectLink from "../../../../../AdminComponents/Links/ProjectLink/ProjectLink";

class MyTable extends React.Component {
    render() {
        const {tableRef, ...rest} = this.props;
        return <Table ref={this.props.tableRef} {...rest} />;
    }
}

const SortableTable = SortableContainer(MyTable);
const SortableTableRowRenderer = SortableElement(({i, ...props}) => {
    props.index = i;
    return defaultTableRowRenderer(props);
});

class ScheduleTable extends Component {
    constructor(props, ref) {
        super(props, ref);
        this.state = {
            teams: [],
            schedule: [],
            sessionTime: this.props.sessionTime,
            startTime: this.props.startTime,
            endTime: this.props.endTime,
            breakDuration: '10',
            openAddTeam: false,
            openAddBreak: false,
            updateTable: false,
            openRowDelete: false,
            selectedRow: null,
            openRowEvaluation: false,
            rowsToEvaluate: [],
            openHelpModal: false,
            error: null,
            isLoaded: false,
            openExport: false,
            clickedTeamId: null,
            clickedProjectId: null,
            teamLinkOpen: false,
            projectLinkOpen: false

        };
    };


    /**
     * Update state fields while form inputs changed by user in PresentationForm.js
     * @param time
     * @param field
     */
    handleTimeChange(time, field) {
        if (field === 'sessionTime') {
            this.setState({sessionTime: time});
            this.setState({updateTable: true});
        } else if (field === 'startTime') {
            this.setState({startTime: time});
            this.setState({updateTable: true});
        } else if (field === 'endTime') {
            this.setState({endTime: time});
            this.setState({updateTable: true});
        }
    };

    /**
     * Update scheduled teams\breaks time.
     */
    updateScheduleTiming() {
        let nextPresentationStartDateTime = this.state.startTime;
        let schedule = [...this.state.schedule];
        for (let i = 0; i < schedule.length; i++) {
            let team = schedule[i];
            let time = moment(nextPresentationStartDateTime).format('YYYY-MM-DD HH:mm');
            team.time = time.substring(time.indexOf(' ') + 1);
            if (team.projectId) {
                nextPresentationStartDateTime = moment(nextPresentationStartDateTime).add(this.state.sessionTime, 'm').toDate();
            } else {
                nextPresentationStartDateTime = moment(nextPresentationStartDateTime).add(team.duration, 'm').toDate();
            }
            if (nextPresentationStartDateTime > new Date(this.state.endTime)) {
                this.props.enqueueSnackbar('Exceeded the end time of the presentation.', {variant: 'error'});
                return
            }
        }
        let promises = [];
        let ids = [];
        for (let obj of schedule) {
            let updatedObj = {
                id: obj.id,
                time: obj.time,
                duration: obj.duration,
                projectId: obj.projectId,
                teamId: obj.teamId,
                eventId: obj.eventId
            };
            promises.push(
                editEntity(updatedObj, 'schedule').then(r => {
                    ids.push(r)
                })
            )
        }
        Promise.all(promises).then(() => {
            let EventId = {ids: [this.props.event.id]};
            getEntitiesByIDs(EventId, 'retrieve/schedule', true)
                .then((retrievedSchedule) => {
                    let sortedSchedule = this.sortScheduledObjByTime(retrievedSchedule);
                    this.setState({
                        schedule: sortedSchedule,
                    });
                    this.props.enqueueSnackbar('Schedule Times Updated', {variant: 'success'});
                });
        }).catch(error => this.setState({error: error}));
    };

    handleUpdate = () => {
        this.updateScheduleTiming();
        this.setState({updateTable: false});

    };
    /**
     * Switches order of two rows that switched by user.
     * @param oldIndex
     * @param newIndex
     */
    onSortEnd = ({oldIndex, newIndex}) => {
        if (this.props.onlyViewForm) {
            return
        }
        if (newIndex === oldIndex) {
            return
        }
        let schedule = [...this.state.schedule];
        const row = schedule[oldIndex];
        schedule.splice(oldIndex, 1);
        schedule.splice(newIndex, 0, row);
        this.setState({schedule: schedule});
        this.updateScheduleTiming();
        this.forceUpdate() // Re-render
    };

    /**
     * Responsible for rendering a table row given an array of columns.
     * @param props
     * @return {*}
     */
    rowRenderer = props => {
        return <SortableTableRowRenderer index={props.index}
                                         i={props.index} {...props}   />;
    };

    getRow = ({index}) => {
        return this.state.schedule[index]
    };

    deleteRow = () => {
        let row = {
            id: this.state.selectedRow.id,
            time: this.state.selectedRow.time,
            duration: this.state.selectedRow.duration,
            projectId: this.state.selectedRow.projectId,
            teamId: this.state.selectedRow.teamId,
            eventId: this.state.selectedRow.eventId
        };
        removeEntity(row, 'schedule').then(r => {
            let row = this.state.selectedRow;
            let filteredSchedule = this.state.schedule.filter(function (item) {
                return item !== row
            });
            this.setState({
                schedule: filteredSchedule,
                selectedRow: null
            });
            this.updateScheduleTiming();
        }).catch(err => {
            this.setState({error: err})
        });
        this.setState({openRowDelete: false});
    };


    handleOpenRowDeleteModal = (rowData) => {
        if (!this.props.onlyViewForm) {
            this.setState({selectedRow: rowData});
            this.setState({openRowDelete: true});
        }
    };

    handleOpenEvaluationModal = (rowData) => {
        this.setState({selectedRow: rowData});
        this.setState({openRowEvaluation: true});
        this.forceUpdate();
        this.callEvaluation(rowData);

    };

    handleCloseEvaluationModal = () => {
        this.setState({selectedRow: null});
        this.setState({openRowEvaluation: false});

    };

    getTeamsFromTableData = (data) => {
        let schedule = [...data];
        let teams = [];
        for (let item of schedule) {
            if (item.id) {
                let team = this.state.teams.filter(team => {
                    return team.id === parseInt(item.teamId)
                })[0];
                teams.push(team)
            }
        }
        return teams

    };

    handleOpenDialog = (str) => {
        if (str === 'Add Team') {
            this.setState({openAddTeam: true});
        } else if (str === 'Add Break') {
            this.setState({openAddBreak: true});
        }
    };

    handleCloseDialog = (str) => {
        if (str === 'Add Team') {
            this.setState({openAddTeam: false});
        } else if (str === 'Add Break') {
            this.setState({openAddBreak: false});
        } else if (str === 'Delete Row') {
            this.setState({openRowDelete: false});
        }
    };

    /**
     * Auxiliary function. Returns time of last scheduled presentation\break.
     * @param schedule
     * @return array
     */
    getLatestTimeAux = (schedule) => {
        let duration = null;
        let time = null;
        for (let i = 0; i < schedule.length; i++) {
            if (i === 0) {
                duration = schedule[i].duration;
                time = schedule[i].time;
            }
            //Can not compare two string times directly. Used date: 01/01/2021 to allow compare dates.
            else if (Date.parse('01/01/2021 ' + schedule[i].time) > Date.parse('01/01/2021 ' + time)) {
                time = schedule[i].time;
                duration = schedule[i].duration
            }
        }
        return [time, duration]
    };
    /**
     * Returns next available time for presentation\break according
     * to last scheduled presentation\break time and sessionTime
     * @return {*}
     */
    getLatestTime = () => {
        let schedule = [...this.state.schedule];
        let nextStartDateTime = this.state.startTime;
        if (schedule.length !== 0) {
            let date = moment(this.state.startTime).format('YYYY-MM-DD HH:mm');
            date = date.substring(0, date.indexOf(' '));
            let time = this.getLatestTimeAux(schedule)[0];
            let duration = this.getLatestTimeAux(schedule)[1];
            nextStartDateTime = date + ' ' + time;

            nextStartDateTime = moment(nextStartDateTime).add(duration, 'm').toDate();
        }
        return nextStartDateTime
    };
    /**
     *  Before adding new teams to the schedule array(Array that displayed in the scheduler table)
     *  Need to update scheduled presentation time of each team.
     * @param teams
     */
    handleViewScheduledTeams = async (teams) => {
        let schedule = [...this.state.schedule];
        let nextPresentationStartDateTime = this.getLatestTime();
        let scheduledObjToAdd = [];
        for (let i = 0; i < teams.length; i++) {
            if (!(schedule.some(item => item.id === teams[i].id))) {
                let scheduledObj = {};
                let time = moment(nextPresentationStartDateTime).format('YYYY-MM-DD HH:mm');
                scheduledObj.duration = this.state.sessionTime;
                scheduledObj.time = time.substring(time.indexOf(' ') + 1);
                scheduledObj.eventId = this.props.event.id;
                scheduledObj.projectId = teams[i].projectId;
                scheduledObj.teamId = teams[i].id;
                let endTime = moment(this.state.endTime).format('YYYY-MM-DD HH:mm');
                endTime = endTime.substring(endTime.indexOf(' ') + 1);
                nextPresentationStartDateTime = moment(nextPresentationStartDateTime).add(this.state.sessionTime, 'm').toDate();
                if (nextPresentationStartDateTime > new Date(this.state.endTime)) {
                    this.props.enqueueSnackbar('Exceeded the end time of the presentation', {variant: 'error'});
                } else {
                    scheduledObjToAdd.push(scheduledObj);
                }
            }
        }
        let promises = [];
        for (let obj of scheduledObjToAdd) {
            promises.push(
                await addEntity(obj, 'schedule').then(r => {
                })
            )
        }
        Promise.all(promises).then(() => {
            let EventId = {ids: [this.props.event.id]};
            getEntitiesByIDs(EventId, 'retrieve/schedule', true)
                .then((retrievedSchedule) => {
                    let sortedSchedule = this.sortScheduledObjByTime(retrievedSchedule);
                    this.setState({
                        schedule: sortedSchedule,
                    });
                    this.props.enqueueSnackbar('Teams Added Successfully', {variant: 'success'});
                });
        }).catch(error => this.setState({error: error}));
        this.setState({openAddTeam: false});
    };

    /**
     * Function that updates state's property  with given value.
     * @param    {Object} e-Event object
     */
    handleChange = (e) => {
        this.setState({[e.target.name]: e.target.value});
        this.forceUpdate();

    };
    /**
     * Appends break to the scheduled table.
     */
    handleSubmitBreak = () => {
        let breakStartDateTime = this.getLatestTime();
        breakStartDateTime = moment(breakStartDateTime).format('YYYY-MM-DD HH:mm');
        let nextEventStartDateTime = moment(breakStartDateTime).add(this.state.breakDuration, 'm').toDate();

        let newBreak = {
            time: breakStartDateTime.substring(breakStartDateTime.indexOf(' ') + 1),
            projectId: null,
            teamId: null,
            eventId: this.props.event.id,
            duration: this.state.breakDuration
        };
        if (nextEventStartDateTime > new Date(this.state.endTime)) {
            this.props.enqueueSnackbar('Exceeded the end time of the presentation', {variant: 'error'});
        } else {
            addEntity(newBreak, 'schedule').then(r => {
                let EventId = {ids: [this.props.event.id]};
                getEntitiesByIDs(EventId, 'retrieve/schedule', true)
                    .then((retrievedSchedule) => {
                        let sortedSchedule = this.sortScheduledObjByTime(retrievedSchedule);
                        this.setState({
                            schedule: sortedSchedule,
                        });
                        this.props.enqueueSnackbar('Break Added Successfully', {variant: 'success'});
                    });
            }).catch(error => this.setState({error: error}));
        }
        this.setState({openAddBreak: false});
    };


    rowStyleFormat(row) {
        if (row.index < 0) return;
        if (!this.state.schedule[row.index].projectId) {
            return {
                backgroundColor: '#dee0e4',
            };
        }
    };

    componentDidMount() {
        getAllEntities('assignedTeams')
            .then((assignedTeams) => {
                this.setState({
                    teams: assignedTeams,
                });
                let EventId = {ids: [this.props.event.id]};
                getEntitiesByIDs(EventId, 'retrieve/schedule', true)
                    .then((retrievedSchedule) => {
                        let sortedSchedule = this.sortScheduledObjByTime(retrievedSchedule);
                        this.setState({
                            schedule: sortedSchedule,
                            isLoaded: true
                        });
                    });
                document.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                });

            }).catch((error) => {
            this.setState({error: error});
        });

    }

    callEvaluation = (rowData) => {
        let teams = [];
        if (rowData) {
            teams = this.getTeamsFromTableData([rowData]);
        } else {
            teams = this.getTeamsFromTableData(this.state.schedule);
        }
        this.setState({
            openRowEvaluation: true,
            rowsToEvaluate: teams
        })

    };

    projectCellRenderer = (cell) => {
        if (cell.cellData) {
            return cell.cellData.name
        }
        return ''
    };

    teamObjectCellRenderer = (cell) => {
        if (cell.cellData) {
            return cell.cellData.students.map(o => {
                if (o !== null) {
                    return o.engFirstName + ' ' + o.engLastName
                } else {
                    return ''
                }
            }).join(', ')
        }
        return '━━━━━━━Break━━━━━━━'
    };
    deleteRenderer = (cell) => {
        return (
            <div>
                <Tooltip title="Delete">
                    <IconButton onClick={() => this.handleOpenRowDeleteModal(cell.rowData)}><DeleteIcon
                        color="secondary" fontSize={"small"}/></IconButton>
                </Tooltip>
            </div>)
    };
    infoRenderer = (cell) => {
        return (<div>
            <Tooltip title="Evaluation page">
                <IconButton onClick={() => this.handleOpenEvaluationModal(cell.rowData)}><InfoIcon color="primary"
                                                                                                   fontSize={"small"}/></IconButton>
            </Tooltip>
        </div>)
    };


    sortScheduledObjByTime = (schedule) => {
        let sortedSchedule = [...schedule];
        sortedSchedule = sortedSchedule.sort((a, b) => (a.time > b.time) ? 1 : -1);
        for (let row of sortedSchedule) {
            if ("students" in row) {
                row.students = row.students.filter(x => x !== null)
            }
        }
        return sortedSchedule;
    };

    openExportDialog() {
        this.setState({openExport: true})
    };

    closeExportDialog() {
        this.setState({openExport: false})
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
                <div style={{textAlign: 'center', paddingTop: "15%"}}>
                    <CircularProgress size="8rem"/>
                </div>);
        } else {
            return (
                <>
                    <div style={{display: 'inline-flex'}}>
                        <Tooltip title={'Update'}>
                            <IconButton
                                style={{
                                    display: this.state.updateTable ? "inline" : "none",
                                }}
                                onClick={this.handleUpdate}
                                variant="contained"
                                color="secondary"
                            >
                                <UpdateIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Add Teams to Schedule'}>
                            <IconButton
                                style={{
                                    display: this.props.onlyViewForm ? "none" : "inline",
                                }}
                                onClick={() => this.handleOpenDialog('Add Team')}
                                variant="contained" color="primary"
                            >
                                <GroupAddIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Add Break'}>
                            <IconButton

                                style={{
                                    display: this.props.onlyViewForm ? "none" : "inline",
                                }}
                                onClick={() => this.handleOpenDialog('Add Break')}
                                variant="contained" color="primary"
                            >
                                <TimerIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Export Evaluation Pages'}>
                            <IconButton
                                style={{
                                    display: JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed ? "inline" : "none",
                                }}
                                color="primary"
                                onClick={() => this.callEvaluation(null)}
                                variant="contained"
                            >
                                <FileCopyIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={'Export Presentation Schedule'}>
                            <IconButton
                                onClick={() => this.openExportDialog()}
                                variant="contained" color="primary"
                            >
                                <SaveAltIcon/>
                            </IconButton>
                        </Tooltip>
                    </div>
                    <div style={{display: 'flex'}}>
                        <div
                            style={{
                                pointerEvents: this.props.onlyViewForm ? 'none' : '',
                                opacity: this.props.onlyViewForm ? 0.6 : 1
                            }}>
                            <SortableTable
                                distance={10}
                                width={1000}
                                height={450}
                                headerHeight={32}
                                rowHeight={45}
                                tableRef={ref => (this.tableRef = ref)}
                                getContainer={() => ReactDOM.findDOMNode(this.tableRef.Grid)}
                                rowCount={this.state.schedule.length}
                                rowGetter={this.getRow}
                                onSortEnd={this.onSortEnd}
                                rowRenderer={this.rowRenderer}
                                rowStyle={this.rowStyleFormat.bind(this)}
                            >
                                <Column
                                    label='Time'
                                    dataKey='time'
                                    flexGrow={1}
                                    width={60}
                                />
                                <Column
                                    label='Duration'
                                    dataKey='duration'
                                    flexGrow={1}
                                    width={110}
                                />
                                <Column
                                    label='Team'
                                    dataKey='teamId'
                                    flexGrow={1}
                                    width={100}
                                    cellRenderer={
                                        ({ cellData, rowIndex, dataKey }) => (cellData ?
                                            <Button onClick={() => this.setState({ clickedTeamId: cellData, teamLinkOpen: true })}>{cellData}</Button>
                                            : '---'
                                        )}
                                />
                                <Column
                                    label='Project'
                                    dataKey='projectObject'
                                    flexGrow={1}
                                    width={150}
                                    cellRenderer={
                                        ({ cellData, rowIndex, dataKey }) => (cellData ?
                                            <Button onClick={() => this.setState({ clickedProjectId: cellData.id, projectLinkOpen: true })}>{cellData.name}</Button>
                                            : '---'
                                        )}
                                />
                                <Column
                                    label='Students'
                                    dataKey='teamObject'
                                    flexGrow={1}
                                    width={700}
                                    cellRenderer={this.teamObjectCellRenderer}
                                />
                                <Column
                                    dataKey='teamObject'
                                    flexGrow={1}
                                    width={80}
                                    cellRenderer={this.deleteRenderer}
                                />
                                <Column
                                    dataKey='teamObject'
                                    flexGrow={1}
                                    width={80}
                                    cellRenderer={this.infoRenderer}
                                />

                            </SortableTable>
                        </div>
                    </div>
                    <div>
                        <Dialog fullWidth={true}
                                maxWidth={'md'}
                                open={this.state.openAddTeam} onClose={() => this.handleCloseDialog('Add Team')}
                                aria-labelledby="form-dialog-title">
                            <DialogActions>
                                <IconButton style={{right: '95%', position: 'sticky'}}
                                            onClick={() => this.handleCloseDialog('Add Team')}
                                            color="primary">
                                    <CloseIcon/>
                                </IconButton>
                            </DialogActions>
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Choose Teams</DialogTitle>
                            <DialogContent>
                                <DialogContentText style={{textAlign: "center"}}>
                                    Choose Teams by team id or team name or team members names.
                                </DialogContentText>
                                <ChooseTeamModal teams={this.state.teams}
                                                 alreadyDisplayedData={this.state.schedule}
                                                 handleViewScheduledTeams={this.handleViewScheduledTeams}/>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div>
                        <Dialog fullWidth={true}
                                open={this.state.openAddBreak} onClose={() => this.handleCloseDialog('Add Break')}
                                aria-labelledby="form-dialog-title">
                            <DialogActions>
                                <IconButton style={{right: '95%', position: 'sticky'}}
                                            onClick={() => this.handleCloseDialog('Add Break')}
                                            color="primary">
                                    <CloseIcon/>
                                </IconButton>
                            </DialogActions>
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Choose Break
                                Duration</DialogTitle>
                            <DialogContent>
                                <form>
                                    <div style={{marginLeft: '35%'}}>
                                        <TextField
                                            name="breakDuration"
                                            onChange={this.handleChange}
                                            value={this.state.breakDuration}
                                            id="breakDuration"
                                            type={'text'}
                                            label="Break duration (Min)"
                                            required/>
                                    </div>
                                </form>
                                <Button
                                    onClick={this.handleSubmitBreak}
                                    style={{
                                        marginTop: '5%',
                                        marginLeft: '45%',
                                    }}
                                    size={'small'}
                                    type={'submit'}
                                    variant="contained" color="primary">
                                    Add
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {this.state.openRowDelete ? (
                        <DeleteDialog
                            yesButtonText={'Delete'}
                            modalText={'Do you want to delete row?'}
                            isOpen={this.state.openRowDelete}
                            yesButtonFunction={this.deleteRow}
                            closeModal={() => this.handleCloseDialog('Delete Row')}
                        />) : ''
                    }
                    <div>
                        <Dialog fullWidth={true}
                                maxWidth={'lg'}
                                open={this.state.openRowEvaluation} onClose={this.handleCloseEvaluationModal}
                                aria-labelledby="form-dialog-title">
                            <DialogActions>
                                <IconButton style={{right: '95%', position: 'sticky'}}
                                            onClick={this.handleCloseEvaluationModal}
                                            color="primary">
                                    <CloseIcon/>
                                </IconButton>
                            </DialogActions>
                            <DialogContent>
                                <EvaluationPage teams={this.state.rowsToEvaluate} schedule={this.state.schedule}
                                                startTime={this.state.startTime}/>
                            </DialogContent>
                        </Dialog>
                        <Dialog fullWidth={true}
                                maxWidth={'lg'}
                                open={this.state.openExport} onClose={this.closeExportDialog.bind(this)}
                                aria-labelledby="form-dialog-title">
                            <DialogActions>
                                <IconButton style={{right: '95%', position: 'sticky'}}
                                            onClick={this.closeExportDialog.bind(this)}
                                            color="primary">
                                    <CloseIcon/>
                                </IconButton>
                            </DialogActions>
                            <DialogContent>
                                <ExportPresentation event={this.props.event} schedule={this.state.schedule}/>
                            </DialogContent>
                        </Dialog>
                    </div>
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
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};


export default connect(mapStateToProps)(withSnackbar(ScheduleTable))

