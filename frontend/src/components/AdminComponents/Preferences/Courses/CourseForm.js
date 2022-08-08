import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import {withStyles} from "@material-ui/core/styles";
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        }
    },
});

class CourseForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: this.props.tab,
            updateCourse: this.props.updateCourse,
            courses: []
        };
    }


    /**
     * Function that updates tab's properties with given value.
     * @param    {Object} e-Event object
     */
    handleChange = (e) => {
        const tab = {
            ...this.state.tab,
            [e.target.name]: e.target.value
        };
        this.setState({tab: tab});
        this.forceUpdate();
    };
    /**
     *Function that updates continuation course property in current course.
     * @param e
     */
    handleChangeSelections = (e) => {
        let tab = {...this.state.tab};
        let courses = this.state.courses.filter(obj => {
            return obj.id === e.target.value
        });
        tab.continuationOfCourse = courses[0].id;
        this.setState({tab: tab});
        this.forceUpdate()
    };
    /**
     *Calls to updateCourse from Courses.js
     * @param e
     */
    handleSubmit = (e) => {
        e.preventDefault();
        this.state.updateCourse(this.state.tab);

    };
    /**
     * Clears continuationOfCourse property of viewed course
     */
    handleClear = () => {
        const tab = {
            ...this.state.tab,
            'continuationOfCourse': null
        };
        this.setState({tab: tab});
    };

    componentDidMount(): void {
        let courses = this.props.courses.filter((course) => course.id !== this.props.tab.id);
        this.setState({courses: courses, isLoaded: true})
    }


    render() {
        const {classes} = this.props;
        const {isLoaded} = this.state;
        if (!isLoaded) {
            return (
                <div style={{textAlign: 'center', paddingTop: "15%"}}>
                    <CircularProgress size="8rem"/>
                </div>);
        } else {
            return (
                <div className={classes.selectFields}>
                    <Paper elevation={3} style={{padding: '15px'}}>
                        <Grid
                            justify="center"
                            alignItems="stretch"
                            container
                        >
                            <Grid item xs={10}>
                                <form id={'course'} onSubmit={this.handleSubmit}>
                                    <TextField
                                        inputProps={{style: {textAlign: 'center'}}}
                                        style={{textAligh: 'center'}}
                                        onChange={this.handleChange}
                                        required
                                        id="name"
                                        name="name"
                                        label='Course Name'
                                        value={this.state.tab.name}
                                    />
                                    <TextField
                                        inputProps={{style: {textAlign: 'center'}}}
                                        onChange={this.handleChange}
                                        required
                                        type={'number'}
                                        id="id"
                                        name="id"
                                        label='Course Number'
                                        value={this.state.tab.id}
                                    />
                                    <TextField
                                        inputProps={{style: {textAlign: 'center'}}}
                                        onChange={this.handleChange}
                                        id="description"
                                        name="description"
                                        label='Course Description'
                                        value={this.state.tab.description}
                                    />
                                    {this.state.courses.length !== 0 ?
                                        <TextField
                                            inputProps={{style: {textAlign: 'center'}}}
                                            onChange={this.handleChangeSelections}
                                            id="continuationOfCourse"
                                            name="continuationOfCourse"
                                            label='In due course (קדם):'
                                            select
                                            value={this.state.tab.continuationOfCourse || this.state.tab.continuationOfCourse === 0 ? this.state.tab.continuationOfCourse : ''}
                                        >
                                            {this.state.courses.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>
                                                    {option.id}
                                                </MenuItem>
                                            ))}
                                        </TextField> : ""
                                    }
                                </form>
                                <div style={{display: 'grid', marginTop: 20}}>
                                    <Button
                                        form={'course'}
                                        type={'submit'}
                                        variant="contained" color="primary"
                                    >
                                        Update
                                    </Button>
                                </div>
                            </Grid>
                            {this.state.tab.continuationOfCourse || this.state.tab.continuationOfCourse === 0 ?
                                <Grid item xs={2} style={{marginTop: '20vh'}}>
                                    <IconButton
                                        variant="contained"
                                        onClick={this.handleClear}
                                        className="materialBtn"
                                        color={'secondary'}
                                    >
                                        <RemoveCircleOutlineIcon/>
                                    </IconButton>
                                </Grid> : ''
                            }
                        </Grid>
                    </Paper>
                </div>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(CourseForm);
