import React from 'react';
import 'date-fns';
import {withStyles} from "@material-ui/core/styles";
import MaterialTable from "material-table";
import MenuItem from "@material-ui/core/MenuItem";
import EditIcon from "@material-ui/icons/Edit";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import {withSnackbar} from "notistack";
import {editAllStudentsGrades, editSpecificStudentGrades} from "../../../../Services/usersService";
import {getAllFBEntities} from "../../../../Services/firebaseServices";
import {cloneDeep} from "lodash";
import Typography from "@material-ui/core/Typography";
import {connect} from "react-redux";
import Paper from "@material-ui/core/Paper";

const styles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
        width: '150px'
    },
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        '&.MuiBox-root': {
            width: '100%'
        }
    },
});


class GradesTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userDetails: this.props.userDetails,
            teamMembers: null,
            isEqual: null,
            currGradeTemplate: null,
            currentStudent: null,
            currentEditableProject: this.props.currentEditableProject,
            columnsForAdmin: [
                {
                    title: 'Project Stage',
                    field: 'stage',
                    defaultGroupOrder: 0
                },
                {
                    title: 'Description',
                    field: 'description',
                    validate: rowData => (rowData.description ? true : 'field can not be empty')
                },
                {
                    title: 'Percent',
                    field: 'percent',
                    validate: rowData => (rowData.percent ? true : 'field can not be empty'),
                },
                {
                    title: 'Submitted By',
                    field: 'submittedBy',
                    lookup: {
                        'Admin': 'Admin',
                        'Academic': 'Academic',
                    },
                    validate: rowData => (rowData.submittedBy ? true : 'field can not be empty')
                },
                {
                    title: 'Grade',
                    field: 'grade',
                    render: rowData => {
                        return rowData.grade == null ? "Not graded yet" : rowData.grade
                    },
                }
            ],
            columnsForAdvisor: [
                {
                    title: 'Project Stage',
                    field: 'stage',
                    defaultGroupOrder: 0
                },
                {
                    title: 'Description',
                    field: 'description',
                    validate: rowData => (rowData.description ? true : 'field can not be empty'),
                    editable: 'never'
                },
                {
                    title: 'Percent',
                    field: 'percent',
                    validate: rowData => (rowData.percent ? true : 'field can not be empty'),
                    editable: 'never'
                },
                {
                    title: 'Submitted By',
                    field: 'submittedBy',
                    lookup: {
                        'Admin': 'Admin',
                        'Academic': 'Academic',
                    },
                    validate: rowData => (rowData.submittedBy ? true : 'field can not be empty'),
                    editable: 'never'
                },
                {
                    title: 'Grade',
                    field: 'grade',
                    render: rowData => {
                        return rowData.grade == null ? "Not graded yet" : rowData.grade
                    }

                }

            ],
            columnsForStudent: [
                {
                    title: 'Project Stage',
                    field: 'stage',
                    defaultGroupOrder: 0
                },
                {
                    title: 'Description',
                    field: 'description',
                },
                {
                    title: 'Submitted By',
                    field: 'submittedBy',
                },
                {
                    title: 'Grade',
                    field: 'grade',
                    render: rowData => {
                        return rowData.grade == null ? "Not graded yet" : rowData.grade
                    }
                }

            ]
        };

    }

    componentDidMount() {
        let promises = [];
        let currGradeTemplate = {};
        let teamMembers = [];
        let isEqual = false;
        promises.push(getAllFBEntities('studentsGrades', {'teamId': this.state.currentEditableProject.teamId}).then((response) => {
            isEqual = response[1];
            teamMembers = response[0] ? cloneDeep(response[0]) : [];
            for (let student of teamMembers) {
                student.gradeTemplate.template = student.gradeTemplate.template ? Object.values(student.gradeTemplate.template) : [];
            }
        }));
        promises.push(getAllFBEntities('gradeTemplates')
            .then((response) => {
                currGradeTemplate = cloneDeep(response.filter(t => t.isCurrent)[0]);
                currGradeTemplate.template = currGradeTemplate.template ? Object.values(currGradeTemplate.template) : [];
            }));
        Promise.all(promises).then(() => {
            let gradeAllFakeStudent = {
                id: -1,
                gradeTemplate: teamMembers[0].gradeTemplate
            };
            console.log(gradeAllFakeStudent)
            teamMembers.push(gradeAllFakeStudent);

            this.setState({
                currGradeTemplate: currGradeTemplate,
                teamMembers: cloneDeep(teamMembers),
                isEqual: isEqual,
                currentStudent: gradeAllFakeStudent,
                // currentStudent: cloneDeep(teamMembers[0]),
                isLoaded: true
            })
        }).catch((error) => {
            this.setState({error: error})
        })
    };

    onUpdate = (studentObj) => {
        let template = studentObj.gradeTemplate.template;
        template.map(o => delete o.tableData);
        let studentToUpdate = cloneDeep(studentObj);
        studentToUpdate.gradeTemplate.template = template ? Object.assign({}, ...template.map((x) => ({[x.id]: x}))) : [];
        if (studentObj.id === -1) {
            //Update Grade to all Students
            return editAllStudentsGrades(this.state.currentEditableProject.teamId, studentToUpdate.gradeTemplate.template)
                .then(updatedGradeTemplate => {
                    getAllFBEntities('studentsGrades', {'teamId': this.state.currentEditableProject.teamId}).then((response) => {

                        let updatedteamMembers = response[0] ? cloneDeep(response[0]) : [];
                        let isEqual = response[1];
                        for (let student of updatedteamMembers) {
                            student.gradeTemplate.template = student.gradeTemplate.template ? Object.values(student.gradeTemplate.template) : [];
                        }
                        let gradeAllFakeStudent = {
                            id: -1,
                            gradeTemplate: updatedteamMembers[0].gradeTemplate
                        };
                        console.log(gradeAllFakeStudent);
                        updatedteamMembers.push(gradeAllFakeStudent);

                        this.setState({
                            teamMembers: cloneDeep(updatedteamMembers),
                            currentStudent: gradeAllFakeStudent,
                            isEqual: isEqual
                        });
                        return Promise.resolve(studentToUpdate);
                    })

                }).catch((error) => {
                    this.setState({error: error})
                });

        } else {
            // Update to spesific student
            return editSpecificStudentGrades(studentToUpdate.firebase_user_id, studentToUpdate.gradeTemplate.template)
                .then(updatedGradeTemplate => {

                    getAllFBEntities('studentsGrades', {'teamId': this.state.currentEditableProject.teamId}).then((response) => {

                        let updatedteamMembers = response[0] ? cloneDeep(response[0]) : [];
                        let isEqual = response[1];
                        for (let student of updatedteamMembers) {
                            student.gradeTemplate.template = student.gradeTemplate.template ? Object.values(student.gradeTemplate.template) : [];
                        }
                        let gradeAllFakeStudent = {
                            id: -1,
                            gradeTemplate: updatedteamMembers[0].gradeTemplate
                        };
                        console.log(gradeAllFakeStudent);
                        updatedteamMembers.push(gradeAllFakeStudent);

                        studentToUpdate.gradeTemplate.template = updatedGradeTemplate.template ? Object.values(updatedGradeTemplate.template) : [];


                        this.setState({
                            teamMembers: cloneDeep(updatedteamMembers),
                            currentStudent: studentToUpdate,
                            isEqual: isEqual
                        });
                        return Promise.resolve(studentToUpdate);
                    })


                    // studentToUpdate.gradeTemplate.template = updatedGradeTemplate.template ? Object.values(updatedGradeTemplate.template) : [];
                    // let teamMembers = cloneDeep(this.state.teamMembers);
                    // let i = teamMembers.findIndex(obj => obj.id === this.state.currentStudent.id);
                    // teamMembers[i] = studentToUpdate;
                    //
                    // this.setState({
                    //     teamMembers: teamMembers,
                    //     currentStudent: studentToUpdate,
                    //     isEqual: false
                    // });
                    // return Promise.resolve(studentToUpdate);


                }).catch((error) => {
                    this.setState({error: error})
                });
        }

    };


    render() {
        const tableRef = React.createRef();
        const handleChange = (e) => {
            let studentID = e.target.value;
            let student = this.state.teamMembers.filter(s => {
                return s.id === studentID
            })[0];
            this.setState({currentStudent: student});

        };
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
            if (this.state.teamMembers.length === 0) {
                return (
                    <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '5%', padding: '4%'}}>
                        <Typography
                            style={{fontSize: "x-large", textAlign: "center"}} color={"primary"}>
                            No Team Assigned
                        </Typography>
                    </Paper>
                )
            }
            let columns;
            if (this.props.adminViewRed || this.state.userDetails.user_type === 'admin') {
                columns = this.state.columnsForAdmin
            } else if (this.state.userDetails.user_type === 'advisor' && !this.props.adminViewRed) {
                columns = this.state.columnsForAdvisor
            } else {
                columns = this.state.columnsForStudent

            }
            let currGradeTemplate = this.state.currentStudent.gradeTemplate.template;
            let calculatedFinals = {};
            for (let temp in currGradeTemplate) {
                if (currGradeTemplate[temp].description === 'Final Grade') {
                    calculatedFinals[currGradeTemplate[temp].stage] = currGradeTemplate[temp].final_grade ? currGradeTemplate[temp].final_grade : null
                }
            }
            const sumValues = obj => Object.values(obj).reduce((a, b) => a + b);

            return (
                <div>
                    <div style={{textAlign: 'center'}}>
                        {
                            (this.state.userDetails.user_type === 'student' && !this.props.adminViewRed) ?
                                <TextField
                                    disabled
                                    style={{width: 500}}
                                    label={'Student'}
                                    value={'[' + this.state.userDetails.id + '] ' + this.state.userDetails.engFirstName + ' ' + this.state.userDetails.engLastName}
                                />
                                :
                                <TextField
                                    style={{width: 500}}
                                    label={'Student'}
                                    value={this.state.currentStudent ? this.state.currentStudent.id : ''}
                                    onChange={handleChange}
                                    select
                                >
                                    {this.state.teamMembers.map((option) => (
                                        option.id === -1 ?
                                            <MenuItem key={option.id} value={option.id}>
                                                {"Grade All"}
                                            </MenuItem> :
                                            <MenuItem key={option.id} value={option.id}>
                                                {'[' + option.id + '] ' + option.engFirstName + ' ' + option.engLastName}
                                            </MenuItem>
                                    ))}
                                </TextField>
                        }

                    </div>
                    <div style={{padding: '10px'}}
                         dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <Grid justify={"center"} alignItems="stretch" container spacing={3}>
                        <Grid item xs={12}>
                            {!this.state.isEqual && this.state.currentStudent.id === -1 ?
                                <div>
                                    <Typography color={"primary"}
                                                style={{display: 'block'}}
                                                align={'center'}>
                                        Grades cannot be entered for all students in the group,
                                    </Typography>
                                    <Typography color={"primary"}
                                                style={{display: 'block'}}
                                                align={'center'}>

                                        because different grades have already been entered.
                                    </Typography>
                                    <Typography color={"primary"}
                                                style={{display: 'block'}}
                                                align={'center'}>
                                        You can select student from the list and enter a grade separately.</Typography>
                                </div>
                                :

                                <MaterialTable
                                    tableRef={tableRef}
                                    title={
                                        <div>
                                            <Typography variant="h6" align={'center'}
                                            >Project Grades</Typography>
                                            {this.props.adminViewRed ?
                                                <div>
                                                    <Typography color={"primary"} variant="button"
                                                                style={{display: 'block'}}>
                                                        Automatically calculated grades to help evaluate
                                                        performance:</Typography>
                                                    {
                                                        Object.entries(calculatedFinals).map(([key, value]) => (
                                                            <Typography variant="button" style={{display: 'block'}}
                                                                        key={key}>&emsp; Final Grade of
                                                                stage {key} is: {value}</Typography>
                                                        ))
                                                    }
                                                    <Typography variant="button">&emsp; Final Grade of
                                                        the Project
                                                        : {sumValues(calculatedFinals) / Object.keys(calculatedFinals).length}</Typography>
                                                </div>
                                                : ' '}
                                        </div>
                                    }
                                    columns={columns}
                                    data={this.state.currentStudent.gradeTemplate.template}
                                    icons={{
                                        Edit: props => (props.disabled ? '' : <EditIcon style={{color: '#009688'}}/>)
                                    }}
                                    editable={{
                                        isEditable: rowData => {
                                            if (!this.state.isEqual && this.state.currentStudent.id === -1) {
                                                return false

                                            } else {
                                                if (this.props.adminViewRed) {
                                                    return true
                                                } else if (this.state.userDetails.user_type === 'advisor') {
                                                    return (rowData.submittedBy === "Academic") && rowData
                                                } else {
                                                    return false
                                                }
                                            }

                                        },
                                        onRowUpdate: (this.props.adminViewRed || this.state.userDetails.user_type === 'admin' || this.state.userDetails.user_type === 'advisor') ? (newData) =>
                                            new Promise((resolve, reject) => {
                                                setTimeout(() => {
                                                    let teamMembers = cloneDeep(this.state.teamMembers);
                                                    let student = {
                                                        ...teamMembers.filter(s => {
                                                            return s.id === this.state.currentStudent.id
                                                        })[0]
                                                    };
                                                    const gradeIdx = student.gradeTemplate.template.findIndex(element => element.id === newData.id);
                                                    newData.grade = parseInt(newData.grade);
                                                    student.gradeTemplate.template[gradeIdx] = newData;
                                                    this.onUpdate(cloneDeep(student)).then((r) => {
                                                        this.props.enqueueSnackbar('Grades Updated Successfully', {variant: 'success'});
                                                    });
                                                    resolve();
                                                }, 1000)
                                            }) : null,
                                    }}
                                    options={{
                                        actionsColumnIndex: -1,
                                        pageSize: 4,
                                        paging: false,
                                        search: false,
                                        sorting: false,
                                        headerStyle: {
                                            color: '#3f51b5',
                                            fontSize: 'larger'
                                        }
                                    }}

                                />
                            }
                        </Grid>
                    </Grid>
                </div>
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

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(GradesTab)));
