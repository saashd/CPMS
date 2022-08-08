import React from 'react';
import MaterialTable from 'material-table';
import {getAllEntities} from "../../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import MenuItem from "@material-ui/core/MenuItem";
import Grid from "@material-ui/core/Grid";
import tableConfig from "../../../../config";
import { Button } from '@material-ui/core';
import UserLink from '../../../Links/UserLink/UserLink';
import TeamLink from '../../../Links/TeamLink/TeamLink';
import ProjectLink from '../../../Links/ProjectLink/ProjectLink';

class AdvisorsReport extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            open: false,
            currSemester: null,
            semesters: null,
            columns: [
                {
                    title: 'Acadmic Advisor',
                    field: 'academicAdvisorName',
                    render: rowData => <Button key={rowData.academicAdvisorId} onClick={() => this.setState({ clickedUserId: rowData.academicAdvisorId, userLinkOpen: true })} >{rowData.academicAdvisorName}</Button>
                },
                {
                    title: 'Project Id',
                    field: 'projectId',
                    render: rowData => rowData.projectId > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.projectId, projectLinkOpen: true })} >{rowData.projectId}</Button> : '---'
                },
                {
                    title: 'Team ID',
                    field: 'teamId_y',
                    render: rowData => rowData.teamId_y > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.teamId_y, teamLinkOpen: true })} >{rowData.teamId_y}</Button> : '---'
                },
            ],
            reports: null,
            clickedUserId: null,
            clickedTeamId: null,
            clickedProjectId: null,
            userLinkOpen: false,
            teamLinkOpen: false,
            projectLinkOpen: false
        };

    }

    /**
     * Function that appends filed academicAdvisorName
     to advisorsReport's properties for future display in material-table
     * @param advisorsReports
     * @return {*}
     */
    renderData = (advisorsReports) => {
        for (let obj of advisorsReports) {
            obj.academicAdvisorName = obj.engFirstName + ' ' + obj.engLastName;

        }
        return advisorsReports;
    };

    componentDidMount() {
        let promises = [];
        let semesters = [];
        promises.push(
            getAllEntities('semesters')
                .then((response) => {
                    semesters = response;
                }));
        Promise.all(promises).then(() => {
            if (semesters[0]) {
                getAllEntities('advisorsReports', {semesterId: semesters[0].id})
                    .then((response) => {
                        let dataFromDB = this.renderData(response);
                        this.setState({
                            reports: dataFromDB,
                            semesters: semesters,
                            currSemester: semesters[0] ? semesters[0] : null,
                            isLoaded: true
                        });
                    })
            } else {
                this.setState({
                    reports: null,
                    semesters: semesters,
                    currSemester: null,
                    isLoaded: true
                });
            }
        }).catch((error) => {
            this.setState({error: error})
        });
    };

    handleChangeSemester = (e) => {
        let semesters = [...this.state.semesters];
        let selectedSemester = semesters.filter(c => {
            return c.id === e.target.value
        })[0];
        let promise = [];
        let reports = [];
        promise.push(
            getAllEntities('advisorsReports', {semesterId: selectedSemester.id})
                .then((response) => {
                    reports = this.renderData(response);
                })
        );
        Promise.all(promise).then(() => {
            this.setState({currSemester: selectedSemester, reports: reports});
        }).catch((error) => {
            this.setState({error: error})
        })

    };

    handleUserLinkClose = () => {
        this.setState({ userLinkOpen: false, clickedUserId: null });
    };

    handleTeamLinkClose = () => {
        this.setState({ teamLinkOpen: false, clickedTeamId: null });
    };

    handleProjectLinkClose = () => {
        this.setState({ projectLinkOpen: false, clickedProjectId: null });
    };


    render() {
        const tableRef = React.createRef();
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
            if (!this.state.currSemester) {
                return (
                    <Typography variant="h6" align={'center'} color={"primary"}>
                        There is no semesters yet. Can not display the report.
                    </Typography>
                )
            }
            return (
                <>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={10}>
                        <div
                            dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                        <MaterialTable
                            tableRef={tableRef}
                            title={<div><h2>List of Academic Advisors</h2><p> The table includes details of advisors
                                whose project under their supervision was marked as "Active" during
                                the <b>{this.state.currSemester.title}</b> semester.</p></div>}
                            columns={this.state.columns}
                            data={this.state.reports}
                            options={{
                                cellStyle: tableConfig.cellStyle,
                                pageSize: tableConfig.initPageSize,
                                pageSizeOptions: tableConfig.calcPageSize(this.state.reports.length),
                                emptyRowsWhenPaging: false,
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
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Paper style={{padding: '10px', display: 'block'}} elevation={3}>
                            <Typography variant="h6" align={'right'} color={"primary"}>
                                :בחר סמסטר
                            </Typography>
                            <TextField
                                style={{textAlign: 'center'}}
                                size={'small'}
                                onChange={this.handleChangeSemester}
                                name="semester"
                                select
                                value={this.state.currSemester.id}
                            >
                                {this.state.semesters.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.title}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Paper>
                    </Grid>
                </Grid>
                    <UserLink
                        userLinkOpen={this.state.userLinkOpen}
                        handleTeamLinkClose={this.handleUserLinkClose}
                        userId={this.state.clickedUserId}
                    />
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

export default AdvisorsReport