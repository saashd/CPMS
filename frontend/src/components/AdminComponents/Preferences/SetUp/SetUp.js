import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import {withStyles} from "@material-ui/core/styles";
import {editEntity, getAllEntities} from "../../../Services/mySqlServices";
import {editFBEntity, getAllFBEntities} from "../../../Services/firebaseServices";
import {withSnackbar} from "notistack";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        }
    },
});

class SetUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            semesters: null,
            gradeTemplates: null,
            fileTemplates: null,
            currSemester: null,
            currGradeTemplate: null,
            currFileTemplate: null,
            error: null,
            isLoaded: false
        };
    }

    /**
     * Changes selected semester\course\template
     * @param e
     */
    handleChangeSelections = (e) => {
        let arrOfObj = [];
        if (e.target.name === 'currSemester') {
            arrOfObj = [...this.state.semesters];
        } else if (e.target.name === 'currFileTemplate') {
            arrOfObj = [...this.state.fileTemplates];
        } else if (e.target.name === 'currGradeTemplate') {
            arrOfObj = [...this.state.gradeTemplates];
        }
        let i = arrOfObj.findIndex(obj => obj.id === e.target.value);
        arrOfObj[i].isCurrent = true;
        if (e.target.name === 'currSemester') {
            this.setState({semesters: arrOfObj, currSemester: arrOfObj[i]})
        } else if (e.target.name === 'currFileTemplate') {

            this.setState({fileTemplates: arrOfObj, currFileTemplate: arrOfObj[i]})
        } else if (e.target.name === 'currGradeTemplate') {
            this.setState({gradeTemplates: arrOfObj, currGradeTemplate: arrOfObj[i]})
        }
    };

    /**
     * Submitts changes that were made.
     * @param e
     */
    handleSubmit = (e) => {
        e.preventDefault();
        let promises = [];
        let updateSemester = {...this.state.currSemester};
        updateSemester.startDate = new Date(this.state.currSemester.startDate).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        updateSemester.endDate = new Date(this.state.currSemester.endDate).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        updateSemester.isCurrent = true;
        promises.push(editEntity(updateSemester, 'semesters')
            .then((response) => {
            }));
        promises.push(editFBEntity(this.state.currFileTemplate, 'fileTemplates', {makeCurrent: true}).then((response) => {
        }));
        promises.push(
            editFBEntity(this.state.currGradeTemplate, 'gradeTemplates', {makeCurrent: true}).then((response) => {
            }));
        Promise.all(promises).then(() => {
            this.props.enqueueSnackbar('SetUp Updated', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error})
        })


    };

    componentDidMount() {
        let promises = [];
        let semesters = [];
        let gradeTemplates = [];
        let fileTemplates = [];
        let currSemester = {};
        let currGradeTemplate = {};
        let currFileTemplate = {};

        promises.push(
            getAllEntities('semesters')
                .then((response) => {
                    semesters = response;
                    currSemester = semesters.filter(s => s.isCurrent)[0]
                })
        );
        promises.push(
            getAllFBEntities('gradeTemplates')
                .then((response) => {
                    gradeTemplates = response;
                    currGradeTemplate = gradeTemplates.filter(g => g.isCurrent)[0]
                })
        );
        promises.push(
            getAllFBEntities('fileTemplates')
                .then((response) => {
                    fileTemplates = response;
                    currFileTemplate = fileTemplates.filter(f => f.isCurrent)[0]
                })
        );
        Promise.all(promises).then(() => {
                this.setState({
                    semesters: semesters,
                    gradeTemplates: gradeTemplates,
                    fileTemplates: fileTemplates,
                    currSemester: currSemester,
                    currGradeTemplate: currGradeTemplate,
                    currFileTemplate: currFileTemplate,
                    isLoaded: true
                })
            }
        ).catch((error) => {
            this.setState({error: error})
        })


    }


    render() {
        const {classes} = this.props;
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
                <div className={classes.selectFields}>
                    <Grid
                        justify="center"
                        alignItems="stretch"
                        container
                    >

                        <Grid item xs={12} lg={6} md={6}>
                            <Paper elevation={3} style={{padding: '5%'}}>
                                {this.state.semesters.length !== 0 ?
                                    <TextField
                                        inputProps={{style: {textAlign: 'center'}}}
                                        onChange={this.handleChangeSelections}
                                        id="currSemester"
                                        name="currSemester"
                                        label='Current Semester'
                                        select
                                        value={this.state.currSemester ? this.state.currSemester.id : ''}
                                    >
                                        {this.state.semesters.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>
                                                {option.title}
                                            </MenuItem>
                                        ))}
                                    </TextField> : ""
                                }
                                {this.state.gradeTemplates.length !== 0 ?
                                    <TextField
                                        inputProps={{style: {textAlign: 'center'}}}
                                        onChange={this.handleChangeSelections}
                                        id="currGradeTemplate"
                                        name="currGradeTemplate"
                                        label='Current Grade Template'
                                        select
                                        value={this.state.currGradeTemplate ? this.state.currGradeTemplate.id : ''}
                                    >
                                        {this.state.gradeTemplates.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>
                                                {option.title}
                                            </MenuItem>
                                        ))}
                                    </TextField> : ""
                                }
                                {this.state.fileTemplates.length !== 0 ?
                                    <TextField
                                        inputProps={{style: {textAlign: 'center'}}}
                                        onChange={this.handleChangeSelections}
                                        id="currFileTemplate"
                                        name="currFileTemplate"
                                        label='Current File Template'
                                        select
                                        value={this.state.currFileTemplate ? this.state.currFileTemplate.id : ""}
                                    >
                                        {this.state.fileTemplates.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>
                                                {option.title}
                                            </MenuItem>
                                        ))}
                                    </TextField> : ""
                                }
                                <div style={{display: 'grid', marginTop: 20}}>
                                    <Button
                                        onClick={this.handleSubmit}
                                        variant="contained" color="primary"
                                    >
                                        Update
                                    </Button>
                                </div>
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(SetUp));
