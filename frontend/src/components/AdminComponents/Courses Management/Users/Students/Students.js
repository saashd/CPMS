import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {editUser, getUsersByType, removeUser} from '../../../../Services/usersService'
import {getAllEntities} from "../../../../Services/mySqlServices";
import MaterialTable from "material-table";
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import {withSnackbar} from "notistack";
import tableConfig from "../../../../config";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import EditDetails from "../UserDetails/UserDetails";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {connect} from "react-redux";
import TeamLink from '../../../Links/TeamLink/TeamLink';
import ProjectLink from '../../../Links/ProjectLink/ProjectLink';

class Students extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            students: null,
            semesters: null,
            courses: null,
            semestersDict: null,
            coursesDict: null,
            editDetails: false,
            currStudent: null,
            clickedTeamId: null,
            clickedProjectId: null,
            teamLinkOpen: false,
            projectLinkOpen: false
        };


    }

    /**
     * Function that renders some of student's properties and adds as new properties, for future display in material-table
     * @param studentsArr
     * @return {*}
     */
    renderData = (studentsArr) => {
        for (let s of studentsArr) {
            if (s.courseId) {
                s.courseId = parseInt(s.courseId);
            } else {
                s.courseId = ''
            }
            if (s.semesterId) {
                s.semesterId = parseInt(s.semesterId);
            } else {
                s.semesterId = '';
            }
            if (!s.faculty) {
                s.faculty = '';
            }
        }
        return studentsArr
    };

    componentDidMount() {
        let promises = [];
        if (this.props.type === "search") {
            const searchUsers = this.props.searchUsers;
            this.setState({students: this.renderData(searchUsers)});
        } else {
            promises.push(
                getUsersByType('student')
                    .then((students) => {
                        students = this.renderData(students);
                        this.setState({students: students});
                    }));
        }
        promises.push(
            getAllEntities('courses')
                .then((response) => {

                    let coursesDict = response.reduce((a, x) => ({...a, [parseInt(x.id)]: parseInt(x.id)}), {});
                    this.setState({coursesDict: coursesDict, courses: response})
                }));
        promises.push(
            getAllEntities('semesters')
                .then((response) => {
                    let semestersDict = response.reduce((a, x) => ({...a, [parseInt(x.id)]: x.title}), {});
                    this.setState({semestersDict: semestersDict, semesters: response})
                }));
        Promise.all(promises).then(() => {
            this.setState({isLoaded: true});
        }).catch(error => this.setState({error: error}));

    }

    /**
     * Function that updates student.
     * @param    {Object} studentObj object with student's properties
     */
    handleEdit = (studentObj) => {
        let objToUpdate = {...studentObj};
        delete objToUpdate.syllabusConfirmation;
        editUser(objToUpdate)
            .then((response) => {
                let students = [...this.state.students];
                let i = students.findIndex(obj => obj.id === studentObj.id);
                if (students[i]) {
                    students[i] = studentObj
                }
                this.setState({students: students});
                this.props.enqueueSnackbar("You Updated " + studentObj.engFirstName + ' ' + studentObj.engLastName, {variant: 'success'});

            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that deletes student.
     * @param    {Object} studentObj object with student's properties
     * @return   error message or updated students array
     */
    handleDelete = (studentObj) => {
        return removeUser(studentObj)
            .then((response) => {
                let students = [...this.state.students];
                let i = students.findIndex(obj => obj.id === studentObj.id);
                students.splice(i, 1);
                this.setState({
                    students: students
                });
                this.props.enqueueSnackbar("You Deleted " + studentObj.engFirstName + ' ' + studentObj.engLastName, {variant: 'success'});
            }).catch((error) => {
                this.setState({error: error});
            });
    };

    handleCloseEditDialog = () => {
        this.setState({editDetails: false})
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
            const actions = [
                {
                    name: "editDetails",
                    icon: props => (
                        <EditIcon style={{color: '#009688'}}/>),
                    tooltip: "Edit User",
                    position: "row",
                    onClick:
                        (event, rowData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                        this.setState({editDetails: true, currStudent: rowData});
                                        resolve()
                                    }, 1000
                                )
                            })
                }];
            const tableRef = React.createRef();
            return (
                <>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={"Students"}
                        actions={this.props.adminViewRed ? actions : null}
                        columns={
                            [
                                {
                                    title: 'ID',
                                    field: 'id',
                                    editable: 'onAdd',
                                },
                                {
                                    title: 'Prefix',
                                    field: 'prefix',
                                    lookup: {'Mr': 'Mr', 'Ms': 'Ms', 'Dr': 'Dr', 'Prof': 'Prof'},
                                },

                                {
                                    title: 'First Name',
                                    field: 'engFirstName',
                                },
                                {
                                    title: 'Last Name',
                                    field: 'engLastName',
                                },
                                {
                                    title: 'Heb First Name',
                                    field: 'hebFirstName',
                                },
                                {
                                    title: 'Heb Last Name',
                                    field: 'hebLastName',
                                },
                                {
                                    title: 'Cell Phone',
                                    field: 'cellPhone',
                                },
                                {
                                    title: 'Email',
                                    field: 'email',
                                },
                                {
                                    title: 'Faculty',
                                    field: 'faculty',
                                    lookup: {"CS": 'CS', "IE": "IE"},
                                },
                                {
                                    title: 'Semester',
                                    field: 'semesterId',
                                    lookup: this.state.semestersDict,
                                },
                                {
                                    title: 'Course',
                                    field: 'courseId',
                                    lookup: this.state.coursesDict,
                                }
                                ,
                                {
                                    title: 'Team',
                                    field: 'teamId',
                                    render: rowData => rowData.teamId > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.teamId, teamLinkOpen: true })} >{rowData.teamId}</Button> : '---'
                                },
                                {
                                    title: 'Project',
                                    field: 'projectId',
                                    render: rowData => rowData.projectId > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.projectId, projectLinkOpen: true })} >{rowData.projectId}</Button> : '---'
                                },
                                {
                                    title: 'Syllabus Confirmation',
                                    field: 'syllabusConfirmation',
                                }
                            ]
                        }
                        data={this.state.students}
                        icons={{
                            Delete: props => (<DeleteIcon style={{color: '#e91e63'}}/>)
                        }}
                        editable={{
                            isEditable: rowData => {
                                return !!this.props.adminViewRed;
                            },
                            onRowDelete: this.props.adminViewRed ? rowData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleDelete(rowData);
                                        resolve()
                                    }, 1000)
                                }) : null,
                        }}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.students.length),
                            columnsButton: true,
                            emptyRowsWhenPaging: false,
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
                            sorting: true,
                            actionsColumnIndex: -1,
                            doubleHorizontalScroll: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }
                        }}
                    />
                    <Dialog
                        fullWidth={true}
                        maxWidth={'sm'}
                        open={this.state.editDetails} onClose={this.handleCloseEditDialog}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}}
                                    onClick={this.handleCloseEditDialog}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <EditDetails
                                onUpdate={this.handleEdit}
                                onSend={this.handleCloseEditDialog}
                                userDetails={this.state.currStudent}
                                semesters={this.state.semesters}
                                courses={this.state.courses}
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

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};

export default connect(mapStateToProps)(withSnackbar(Students));
