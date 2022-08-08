import React from 'react';
import MaterialTable from 'material-table';
import { getAllEntities } from "../../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import tableConfig from "../../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import UserLink from '../../../Links/UserLink/UserLink';
import { Button } from '@material-ui/core';
import TeamLink from '../../../Links/TeamLink/TeamLink';
import ProjectLink from '../../../Links/ProjectLink/ProjectLink';

class TableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            open: false,
            title: this.props.title,
            reports: null,
            clickedUserId: null,
            clickedTeamId: null,
            clickedProjectId: null,
            userLinkOpen: false,
            teamLinkOpen: false,
            projectLinkOpen: false
        };

    }

    columns = [
        {
            title: 'Student ID',
            field: 'id',
            render: rowData => <Button key={rowData.firebase_user_id} onClick={() => this.setState({ clickedUserId: rowData.firebase_user_id, userLinkOpen: true })} >{rowData.id}</Button>
        },
        {
            title: 'Student Name',
            field: 'studentName',
        },
        {
            title: 'Semester',
            field: 'semester',
        },
        {
            title: 'Course',
            field: 'courseId',
        },
        {
            title: 'Team ID',
            field: 'teamId',
            render: rowData => rowData.teamId > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.teamId, teamLinkOpen: true })} >{rowData.teamId}</Button> : '---'
        },
        {
            title: 'Project ID',
            field: 'projectId',
            render: rowData => rowData.projectId > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.projectId, projectLinkOpen: true })} >{rowData.projectId}</Button> : '---'
        },
        {
            title: 'Project Name',
            field: 'name',
        },
        {
            title: 'Faculty',
            field: 'faculty',
        },
        {
            title: 'Academic Advisor',
            field: 'academicAdvisorName',
            render: rowData => rowData.academicAdvisorId ? <Button key={rowData.academicAdvisorId} onClick={() => this.setState({ clickedUserId: rowData.academicAdvisorId, userLinkOpen: true })} >{rowData.academicAdvisorName}</Button> : '---'
        },
        {
            title: 'Industrial Advisor',
            field: 'industrialAdvisorName',
            render: rowData => rowData.industrialAdvisorId ? <Button key={rowData.industrialAdvisorId} onClick={() => this.setState({ clickedUserId: rowData.industrialAdvisorId, userLinkOpen: true })} >{rowData.industrialAdvisorName}</Button> : '---'
        },
        {
            title: 'Organization',
            field: 'organizationName',
        },

    ];


    componentDidMount() {
        getAllEntities('studentsReport')
            .then((response) => {
                this.setState({
                    reports: response,
                    isLoaded: true
                });
            }).catch((error) => {
                this.setState({ error: error });
            });
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
        const { error, isLoaded } = this.state;
        if (error) {
            return (
                <Paper style={{ border: 'dashed', borderColor: '#9e9e9e52', margin: '5%', padding: '4%' }}>
                    <Typography display="block" variant="h6" align={'center'} color={"primary"}>
                        Please refresh the page and try again.

                    </Typography>
                    <Typography display="block" variant="h6" align={'center'} color={"primary"}>
                        If you have any questions or encounter issues,
                        please contact support via the "Help" tab.
                    </Typography> </Paper>);
        } else if (!isLoaded) {
            return (
                <div style={{ textAlign: 'center' }}>
                    <CircularProgress />
                </div>);
        } else {
            return (
                <>
                    <div
                        dangerouslySetInnerHTML={{ __html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }" }}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={this.state.title}
                        columns={this.columns}
                        data={this.state.reports}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.reports.length),
                            emptyRowsWhenPaging: false,
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            exportButton: { csv: true },
                            exportAllData: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }

                        }}
                    />
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

export default TableComponent