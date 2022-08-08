import React from 'react';
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import TextField from '@material-ui/core/TextField';
import MenuItem from "@material-ui/core/MenuItem";
import 'date-fns';
import {withStyles} from "@material-ui/core/styles";
import moment from 'moment';
import Grid from "@material-ui/core/Grid";
import ScheduleTable from "./ScheduleTable/ScheduleTable"
import EditIcon from '@material-ui/icons/Edit';
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from "@material-ui/core/Tooltip";
import DeleteDialog from "../../../../SharedComponents/Yes_No_Dialog/Yes_No_Dialog";
import {connect} from "react-redux";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import {CirclePicker} from 'react-color';
import {getAllEntities} from "../../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import {withSnackbar} from "notistack";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '25ch',
            display: 'flex',
            flexWrap: 'wrap',
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(0,0,0,0.78)" // (default alpha is 0.38)
        },
        "& .MuiFormLabel-root.Mui-disabled": {
            color: "rgba(0,0,0,0.78)" // (default alpha is 0.38)
        }
    },

});


class Presentation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formStatus: null,
            isLoaded: false,
            error: null,
            updateEvent: this.props.updateEvent,
            addEvent: this.props.addEvent,
            deleteEventFunction: this.props.deleteEvent,
            handleClose: this.props.handleClose,
            openOptions: false,
            editForm: false,
            onlyViewForm: this.props.onlyViewForm,
            dialogWidth: this.props.dialogWidth,
            deletePresentation: false,
            event: this.props.event ? this.props.event : {
                displayToAll: false,
                title: "",
                courseId: "",
                location: "",
                start: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                end: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                sessionTime: "10",
            },
            courses: null
        };
    }

    hanldeChangeFormStatus = (status) => {
        this.setState({formStatus: status});
    };

    submitForm = (e) => {
        e.preventDefault();
        if (this.state.formStatus === 'create') {
            this.handleAdd()
        } else if (this.state.formStatus === 'update') {
            this.handleUpdate();
            this.setState({formStatus: null})
        }
    };

    callChildMethodHandleTimeChange(time, field) {
        if (this.refs.child) {
            this.refs.child.handleTimeChange(time, field);
        }
    }

    callChildMethodGetItems() {
        if (this.refs.child) {
            return this.refs.child.getItems();
        }
    }

    /**
     * Changes color of event to color picked by user.
     * @param color
     */
    handleChangeComplete = (color) => {
        let event = {...this.state.event};
        event.color = color.hex;
        this.setState({event: event});
    };


    /**
     * Parses Date from js Date format to string
     * (calendar works only with js Date format, while date input works with strings)
     * @param name
     * @return {string}
     */    handleParseDateTimeToString = (name) => {
        let date;
        if (name === 'start') {
            date = moment(this.state.event.start).format('YYYY-MM-DD HH:mm');
            return date.substring(0, date.indexOf(' '));
        } else if (name === 'startTime') {
            date = moment(this.state.event.start).format('YYYY-MM-DD HH:mm');
            return date.substring(date.indexOf(' ') + 1)
        } else if (name === 'endTime') {
            date = moment(this.state.event.end).format('YYYY-MM-DD HH:mm');
            return date.substring(date.indexOf(' ') + 1)
        }
    };

    handleCheck = (e) => {
        const event = {
            ...this.state.event,
            'displayToAll': e.target.checked
        };
        this.setState({event: event});
        this.forceUpdate();
    };

    /**
     * Function that updates event's properties with given value.
     * @param    {Object} e-Event object
     */
    handleChange = (e) => {
        const event = {
            ...this.state.event,
            [e.target.name]: e.target.value
        };
        this.setState({event: event});
        this.forceUpdate();
        this.callChildMethodHandleTimeChange(e.target.value, e.target.name)
    };

    handleChangeCourseSelections = (e) => {
        let event = {...this.state.event};
        let courses = this.state.courses.filter(obj => {
            return obj.id === e.target.value
        });
        event.courseId = courses[0].id;
        this.setState({event: event});
        this.forceUpdate()
    };

    /**
     * Change time according to user preferences and parse time from string to js Date format
     * @param e
     */
    handleChangeTime = (e) => {
        let time = e.target.value;
        let date = moment(this.state.event.start).format('YYYY-MM-DD HH:mm');
        date = date.substring(0, date.indexOf(' '));
        let startPresentation = moment(this.state.event.start).format('YYYY-MM-DD HH:mm');
        let endPresentation = moment(this.state.event.end).format('YYYY-MM-DD HH:mm');
        if (e.target.name === 'start') {
            startPresentation = date + ' ' + time;
        } else {
            endPresentation = date + ' ' + time;
        }
        if (Date.parse(moment(endPresentation)) < Date.parse(moment(startPresentation))) {
            this.props.enqueueSnackbar('Start time can not be later than/equal to end time', {variant: 'error'});
            return 0
        } else if (e.target.name === 'start') {
            startPresentation = new Date(startPresentation).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
            const event = {
                ...this.state.event,
                [e.target.name]: startPresentation
            };
            this.setState({event: event});
            this.callChildMethodHandleTimeChange(startPresentation, 'startTime')
        } else {
            endPresentation = new Date(endPresentation).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
            const event = {
                ...this.state.event,
                [e.target.name]: endPresentation
            };
            this.setState({event: event});
            this.callChildMethodHandleTimeChange(endPresentation, 'endTime')
        }
        this.forceUpdate();
    };
    /**
     * Change date according to user preferences and parse from string to js Date format
     * @param e- Event object
     */
    handleChangeDate = (e) => {
        let date = e.target.value;
        let dateTimeStart = moment(this.state.event.start).format('YYYY-MM-DD HH:mm');
        dateTimeStart = dateTimeStart.substring(dateTimeStart.indexOf(' ') + 1);
        dateTimeStart = date + ' ' + dateTimeStart;
        //end\start date share same date, because presentation can be scheduled only to one date.
        let dateTimeEnd = moment(this.state.event.end).format('YYYY-MM-DD HH:mm');
        dateTimeEnd = dateTimeEnd.substring(dateTimeEnd.indexOf(' ') + 1);
        dateTimeEnd = date + ' ' + dateTimeEnd;
        dateTimeStart = new Date(dateTimeStart).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        dateTimeEnd = new Date(dateTimeEnd).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        const event = {
            ...this.state.event,
            start: dateTimeStart,
            end: dateTimeEnd
        };
        this.setState({event: event});
        this.forceUpdate();

    };


    handleEdit = () => {
        this.setState({editForm: true});
        this.setState({onlyViewForm: false});
    };

    handleOpenPresentationDeleteModal = () => {
        this.setState({deletePresentation: true});

    };
    handleClosePresentationDeleteModal = () => {
        this.setState({deletePresentation: false});

    };
    handleDelete = () => {
        this.state.deleteEventFunction(this.state.event).then(x => {
        }).catch(e => {
            this.setState({error: e})
        });
        this.state.handleClose();
    };

    handleUpdate = () => {
        this.forceUpdate();
        this.state.updateEvent(this.state.event).then(x => {
            let event = {...this.state.event};
            event.schedule = this.callChildMethodGetItems();
            this.setState({event: event});
            this.props.enqueueSnackbar("Event Updated Successfully", {variant: 'success'});
        }).catch(e => {
            this.setState({error: e})
        });
        this.setState({onlyViewForm: false});
        this.state.handleClose();
    };

    handleAdd = () => {
        this.forceUpdate();
        delete this.state.event.schedule;
        this.state.addEvent(this.state.event, 'presentation').then(x => {
            let event = {...this.state.event};
            event.schedule = this.callChildMethodGetItems();
            this.setState({event: event});
            this.props.enqueueSnackbar("Event Updated Successfully", {variant: 'success'});
        }).catch(e => {
            this.setState({error: e})
        });
        this.setState({onlyViewForm: false});
        this.state.handleClose();
    };

    componentDidMount() {
        getAllEntities('courses')
            .then((response) => {
                this.setState({
                    courses: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    }


    render() {
        const handleMore = () => {
            this.state.dialogWidth('xl');
            this.setState({openOptions: true});
        };
        const handleLess = () => {
            this.state.dialogWidth('sm');
            this.setState({openOptions: false});
        };
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
                <div style={{textAlign: 'center'}}>
                    <CircularProgress/>
                </div>);
        } else {
            return (

                <div>
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        marginTop: '7px',
                        marginLeft: '80px',
                    }}>
                        {JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed ?
                            <>
                                <Tooltip title={'Edit Form'}>
                                    <IconButton
                                        style={{
                                            display: this.state.onlyViewForm ? "inline" : "none",
                                        }}
                                        onClick={this.handleEdit}
                                        variant="contained" color="primary">
                                        <EditIcon/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={'Delete Presentation'}>
                                    <IconButton
                                        style={{display: !this.state.onlyViewForm && !this.state.editForm ? "none" : "inline",}}
                                        onClick={this.handleOpenPresentationDeleteModal}
                                        variant="contained" color="primary">
                                        <DeleteIcon/>
                                    </IconButton>
                                </Tooltip>
                            </>
                            : ""}
                    </div>
                    <div className={classes.selectFields}>
                        <form onSubmit={this.submitForm} id={'presentation'}>
                            <Grid justify="center"
                                  alignItems="stretch" container spacing={3}>
                                <Grid item xs={this.state.openOptions ? 3 : 9}>
                                    <div style={{
                                        display: 'grid',
                                        justifyContent: 'center'
                                    }}>
                                        <div>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                name="title"
                                                onChange={this.handleChange}
                                                value={this.state.event.title}
                                                id="title"
                                                label="Title"
                                                required/>
                                        </div>
                                        <div>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                onChange={this.handleChangeDate}
                                                required
                                                id="start"
                                                name="start"
                                                type="date"
                                                value={this.handleParseDateTimeToString('start')}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </div>
                                        <Grid container spacing={0}>
                                            <Grid>
                                                <TextField
                                                    disabled={this.state.onlyViewForm}
                                                    onChange={this.handleChangeTime}
                                                    required
                                                    style={{width: '5%'}}
                                                    id="startTime"
                                                    name='start'
                                                    type="time"
                                                    value={this.handleParseDateTimeToString('startTime')}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            </Grid>
                                            <Grid>
                                                <p>-</p></Grid>
                                            <Grid>
                                                <TextField
                                                    disabled={this.state.onlyViewForm}
                                                    onChange={this.handleChangeTime}
                                                    required
                                                    style={{width: '5%'}}
                                                    id="endTime"
                                                    type="time"
                                                    name="end"
                                                    value={this.handleParseDateTimeToString('endTime')}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}

                                                />
                                            </Grid>
                                        </Grid>
                                        <div>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                name="sessionTime"
                                                type={"number"}
                                                onChange={this.handleChange}
                                                value={this.state.event.sessionTime}
                                                id="sessionTime"
                                                label="session Time (Min)"
                                                required/>
                                        </div>

                                        <div>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                name="courseId"
                                                id="courseId"
                                                select
                                                label="Course:"
                                                value={this.state.event.courseId || this.state.event.courseId === 0 ? this.state.event.courseId : ''}
                                                onChange={this.handleChangeCourseSelections}
                                                required
                                            >
                                                {this.state.courses.map((option) => (
                                                    <MenuItem key={option.id} value={option.id}>
                                                        {option.id}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </div>
                                        <div>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                name="location"
                                                onChange={this.handleChange}
                                                value={this.state.event.location} required id="location"
                                                label="Location"/>
                                        </div>
                                        <TextField
                                            disabled={this.state.onlyViewForm}
                                            id="description"
                                            name="description"
                                            label="description"
                                            placeholder="Description"
                                            multiline
                                            variant="outlined"
                                            value={this.state.event.description}
                                            onChange={this.handleChange}
                                        />
                                        {this.state.onlyViewForm ? "" :
                                            <CirclePicker
                                                circleSize={28}
                                                circleSpacing={10}
                                                colors={["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39"]}
                                                color={this.state.event.color}
                                                onChangeComplete={this.handleChangeComplete}
                                            />
                                        }
                                        <FormControlLabel
                                            labelPlacement="end"
                                            label='Allow users to see event'
                                            control={
                                                <Checkbox
                                                    disabled={this.state.onlyViewForm}
                                                    checked={this.state.event.displayToAll ? this.state.event.displayToAll : false}
                                                    color="primary"
                                                    onChange={this.handleCheck}
                                                />}
                                        />
                                    </div>
                                </Grid>
                                {this.state.openOptions &&
                                <Grid item xs={9}>
                                    <ScheduleTable ref="child"
                                                   onlyViewForm={this.state.onlyViewForm}
                                                   event={this.state.event}
                                                   sessionTime={this.state.event.sessionTime}
                                                   startTime={moment(this.state.event.start).format('YYYY-MM-DD HH:mm')}
                                                   endTime={moment(this.state.event.end).format('YYYY-MM-DD HH:mm')}/>
                                </Grid>
                                }

                            </Grid>
                        </form>
                        <div>
                            <ButtonGroup orientation="horizontal"
                                         style={{marginLeft: this.props.maxWidth === 'sm' ? "60%" : "85%"}}>
                                <Button
                                    style={{display: this.state.editForm ? "inline" : "none",}}
                                    // onClick={this.handleUpdate}
                                    form={'presentation'}
                                    type={'submit'}
                                    onClick={() => this.hanldeChangeFormStatus('update')}
                                    variant="contained" color="primary">
                                    Update
                                </Button>
                                {this.state.event.id ?
                                    <Button
                                        onClick={handleMore}
                                        variant="contained" color="primary"
                                        style={{
                                            left: this.state.editForm ? "0" : '90%',
                                            display: (this.state.openOptions) ? "none" : "inline"
                                        }}>
                                        View More
                                    </Button> : ""}
                                {this.state.event.id ?
                                    <Button
                                        style={{
                                            display: this.state.openOptions ? "inline" : "none"
                                        }}
                                        onClick={handleLess}
                                        variant="contained" color="primary"
                                    >
                                        View Less
                                    </Button>

                                    : ""}
                            </ButtonGroup>
                            <Button
                                style={{
                                    marginLeft: '80%', marginTop: "-15%",
                                    display: !this.state.onlyViewForm && !this.state.editForm ? "inline" : "none"
                                }}
                                // onClick={this.handleAdd}
                                form={'presentation'}
                                type={'submit'}
                                onClick={() => this.hanldeChangeFormStatus('create')}
                                variant="contained" color="primary"
                            >
                                Add
                            </Button>

                        </div>
                    </div>

                    {this.state.deletePresentation ? (
                        <DeleteDialog
                            yesButtonText={'Delete'}
                            modalText={'Do you want to delete presentation?'}
                            isOpen={this.state.deletePresentation}
                            yesButtonFunction={this.handleDelete}
                            closeModal={this.handleClosePresentationDeleteModal}
                        />) : ''
                    }
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


export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(Presentation)));