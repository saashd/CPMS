import React from 'react';
import {getAllEntities} from "../../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { getSecretariatReport } from "../../../../Services/mySqlServices";
import { withSnackbar } from 'notistack';

class SecretariatReports extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            courses: [],
            semester: [],
            currCourse: null,
            currSemester: null,
            isLoaded: false,
            open: false,
            reports: null,
            reportsByCurrCourseAndSemester: null,
            chosenTeams: [],
            teams: []
        };

    }

    /**
     * Function that appends filed studentName
     to report's properties for future display in material-table
     * @param reports
     * @return {*}
     */
    renderData = (reports) => {
        for (let obj of reports) {
            obj.studentName = obj.hebFirstName + ' ' + obj.hebLastName;

        }
        return reports;
    };

    getDataBySemesterAndCourse = (semester, course, chosenTeams) => {
        getAllEntities('secretariatReport', {
            semesterId: semester.id,
            courseId: course.id,
            chosenTeams: JSON.stringify(chosenTeams)
        }).then((response) => {
            this.setState({reportsByCurrCourseAndSemester: this.renderData(response)})
        }).catch((error) => {
            this.setState({error: error})
        })
    };

    handleChange = (e, value) => {
        this.setState({chosenTeams: value});
        this.getDataBySemesterAndCourse(this.state.currSemester, this.state.currCourse, value);


    };

    /**
     * Function parses team's property 'students': from arr. of objects to arr. of name strings
     * @param    {Object} teamsArray    array with team-objects
     * @return   {Object } teamsArray
     */
    handleDataFieldsToSrt = (teamsArray) => {
        let renderedTeams = [];
        for (let team of teamsArray) {
            let renderedTeam = {
                id: team.id,
                projectId: team.projectId,
                comment: team.comment,
                students: team.students,
                creatorId: team.creatorId,
                name: team.name
            };
            let studentsNames = [];
            if (team.students) {
                for (let student of team.students) {
                    if (student && student.engFirstName && student.engLastName) {
                        studentsNames.push(student.engFirstName + ' ' + student.engLastName)
                    }
                }
                renderedTeam.studentsNames = studentsNames.join(', ');
            } else {
                renderedTeam.studentsNames = ''
            }
            renderedTeams.push(renderedTeam);

        }
        return renderedTeams;
    };


    componentDidMount() {
        let promises = [];
        let reports = [];
        let courses = [];
        let semesters = [];
        let teams = [];
        // promises.push(
        //     getAllEntities('teams')
        //         .then((response) => {
        //             teams = this.handleDataFieldsToSrt(response);
        //         }));
        promises.push(
            getAllEntities('courses')
                .then((response) => {
                    courses = response;
                }));
        promises.push(
            getAllEntities('semesters')
                .then((response) => {
                    semesters = response;
                }));
        Promise.all(promises).then(() => {
            promises.push(
                getAllEntities('secretariatReport', {semesterId: semesters[0].id, courseId: courses[0].id})
                    .then((response) => {
                        reports = this.renderData(response);
                    }));
        }).catch((error) => {
            this.setState({error: error})
        });
        Promise.all(promises).then(() => {
            this.setState({
                teams: teams,
                reports: reports,
                courses: courses,
                currCourse: courses[0],
                semesters: semesters,
                currSemester: semesters[0],
                reportsByCurrCourseAndSemester: reports,
                isLoaded: true
            });
        }).catch((error) => {
            this.setState({error: error})
        })
    };

    handleChangeCourse = (e) => {
        let courses = [...this.state.courses];
        let selectedCourse = courses.filter(c => {
            return c.id === e.target.value
        })[0];
        this.setState({currCourse: selectedCourse});
        this.getDataBySemesterAndCourse(this.state.currSemester, selectedCourse, this.state.chosenTeams);
    };

    handleChangeSemester = (e) => {
        let semesters = [...this.state.semesters];
        let selectedSemester = semesters.filter(c => {
            return c.id === e.target.value
        })[0];
        this.setState({currSemester: selectedSemester});
        this.getDataBySemesterAndCourse(selectedSemester, this.state.currCourse, this.state.chosenTeams);
    };

    generatePdf() {
        let myWindow = window.open('', '');
        let divText = document.getElementById("export").outerHTML;
        myWindow.document.write(divText);
        myWindow.document.close();
        myWindow.document.title = "Report";
        myWindow.focus();
        myWindow.print();
        myWindow.close();
    };

    exportToDoc = () => {
        const reportDate = new Date().toLocaleString('fr-FR', { year: 'numeric', month: 'numeric', day: 'numeric' });
        const reports = this.state.reportsByCurrCourseAndSemester.sort((a, b) => parseInt(a.teamId) - parseInt(b.teamId));
        const context = {
            "reportDate": reportDate,
            "courseId": this.state.currCourse.id,
            "courseName": this.state.currCourse.name,
            "students": reports,
            "templates": { "test": "test" }
        }

        const filename = "SecretariatReport.docx";
        getSecretariatReport(context, filename).then(result => {
        }).catch(error => {
            this.props.enqueueSnackbar('Failed to create SecretariatReport, please check your parameters', { variant: 'error' });
        });
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
                    <CircularProgress />
                </div>);
        } else {
            if (!this.state.currSemester) {
                return (
                    <Typography variant="h6" align={'center'} color={"primary"}>
                        There is no semesters yet. Can not display the report.
                    </Typography>
                )
            } else if (!this.state.currCourse) {
                return (
                    <Typography variant="h6" align={'center'} color={"primary"}>
                        There is no courses yet. Can not display the report.
                    </Typography>
                )
            }
            let reports = this.state.reportsByCurrCourseAndSemester.sort((a, b) => parseInt(a.teamId) - parseInt(b.teamId));
            return (
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={10}>
                        <Paper style={{ padding: '20px' }} elevation={3}>
                            <Typography variant="h6" align={'right'} color={"primary"}>
                                :תצוגה מקדימה
                            </Typography>
                            <div id={'export'}>
                                <div dir="ltr">
                                    <h3>
                                        {new Date().toLocaleString('fr-FR', {
                                            year: 'numeric',
                                            month: 'numeric',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                </div>
                                <div dir="rtl">
                                    <p>
                                        אל: מזכירות לימודי הסמכה
                                        <br/>
                                        מאת: ________________
                                        <br/>
                                        הנדון: <b>{'ציונים במקצוע ' + this.state.currCourse.id}</b>
                                        <br/>
                                    </p>
                                </div>

                                <div dir="rtl">
                                    <p>
                                        שם המקצוע: <b>{this.state.currCourse.name}</b>
                                        <br/>
                                        מספר מקצוע:<b>{this.state.currCourse.id}</b>
                                        <br/>
                                    </p>
                                </div>
                                <ul
                                    style={{textAlign: '-webkit-center'}}
                                >
                                    <table dir="rtl" className={"styledTable"}
                                           style={{
                                               borderCollapse: "collapse",
                                               margin: "25px 0",
                                               fontSize: "0.9em",
                                               fontFamily: "sans-serif",
                                               minWidth: "400px",
                                               boxShadow: "0 0 20px rgba(0, 0, 0, 0.15)",
                                           }}
                                    >
                                        <thead>
                                        <tr style={{backgroundColor: "#3f51b5", color: "#ffffff"}}>
                                            <th style={{padding: "12px 15px"}}>צוות</th>
                                            <th style={{padding: "12px 15px"}}>מס' פרויקט</th>
                                            <th style={{padding: "12px 15px"}}>שם סטודנט</th>
                                            <th style={{padding: "12px 15px"}}>מס' סטודנט</th>
                                            <th style={{padding: "12px 10px"}}>ציון בסמסטר 1</th>
                                            <th style={{padding: "12px 10px"}}>ציון בסמסטר 2</th>
                                            <th style={{padding: "12px 10px"}}>ציון בסמסטר 3</th>
                                            <th style={{padding: "12px 10px"}}>ציון בסמסטר 4</th>
                                            <th style={{padding: "12px 15px"}}>הערות</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {reports.map((item) => (
                                            <tr style={{borderBottom: "1px solid #dddddd"}} key={item.id}>
                                                <td style={{padding: "12px 15px"}}> {item.teamId} </td>
                                                <td style={{padding: "12px 15px"}}> {item.projectId} </td>
                                                <td style={{padding: "12px 15px"}}> {item.studentName} </td>
                                                <td style={{padding: "12px 15px"}}> {item.id} </td>
                                                <td style={{padding: "12px 15px"}}> {item.gradeStage1} </td>
                                                <td style={{padding: "12px 15px"}}> {item.gradeStage2} </td>
                                                <td style={{padding: "12px 15px"}}> {item.gradeStage3} </td>
                                                <td style={{padding: "12px 15px"}}> {item.gradeStage4} </td>
                                                <td style={{padding: "12px 200px"}}/>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </ul>
                            </div>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Paper style={{padding: '20px', display: 'grid'}} elevation={3}>
                            <Typography variant="h6" align={'right'} color={"primary"}>
                                :בחר קורס
                            </Typography>
                            <TextField
                                style={{textAlign: 'center'}}
                                size={'small'}
                                onChange={this.handleChangeCourse}
                                name="course"
                                select
                                value={this.state.currCourse.id}
                            >
                                {this.state.courses.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.id}
                                    </MenuItem>
                                ))}
                            </TextField>
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

                            {/*<Autocomplete*/}
                            {/*    onChange={this.handleChange.bind(this)}*/}
                            {/*    style={{width: 'full'}}*/}
                            {/*    options={*/}
                            {/*        this.state.teams*/}
                            {/*    }*/}
                            {/*    autoHighlight*/}
                            {/*    multiple={true}*/}
                            {/*    getOptionLabel={option => 'Team #' + option.id}*/}
                            {/*    // + ' - ' + option.name + ' -  ' + option.students.map(o => o.engFirstName + ' ' + o.engLastName).join(', ') + ' '}*/}
                            {/*    renderOption={option => (*/}
                            {/*        <React.Fragment>*/}
                            {/*            <p>Team #{option.id}</p>*/}
                            {/*            /!*&nbsp;&nbsp;&middot;&nbsp;&nbsp;*!/*/}
                            {/*            /!*<p style={{fontWeight: 'bold'}}>Project "{option.name}"</p>*!/*/}
                            {/*            /!*&nbsp;&nbsp;&middot;&nbsp;&nbsp;*!/*/}

                            {/*            /!*{*!/*/}
                            {/*            /!*    option.students.map(o => o.engFirstName + ' ' + o.engLastName).join(', ')*!/*/}
                            {/*            /!*}*!/*/}
                            {/*        </React.Fragment>*/}
                            {/*    )}*/}
                            {/*    renderInput={params => (*/}
                            {/*        <TextField*/}
                            {/*            {...params}*/}
                            {/*            label="Choose teams"*/}
                            {/*            variant="outlined"*/}
                            {/*            fullWidth*/}
                            {/*            inputProps={{*/}
                            {/*                ...params.inputProps,*/}
                            {/*                autoComplete: 'disabled', // disable autocomplete and autofill*/}
                            {/*            }}*/}
                            {/*        />*/}

                            {/*    )}*/}
                            {/*/>*/}

                            <Button
                                style={{margin: '20px'}}
                                color="primary"
                                variant="contained"
                                onClick={this.generatePdf.bind(this)}
                            >Print
                            </Button>
                            <Button
                                style={{margin: '20px'}}
                                color="primary"
                                variant="contained"
                                onClick={this.exportToDoc.bind(this)}
                            >Export .doc
                            </Button>
                        </Paper>
                    </Grid>

                </Grid>
            )
        }
    }
}

export default withSnackbar(SecretariatReports)