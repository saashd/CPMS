import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button";
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Tooltip from "@material-ui/core/Tooltip";
import moment from "moment";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import DeleteDialog from "../../../../SharedComponents/Yes_No_Dialog/Yes_No_Dialog";
import {connect} from "react-redux";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import MenuItem from "@material-ui/core/MenuItem";
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
        container: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        textField: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            width: 200,
        },
    },
});

class Event extends React.Component {
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
            deleteEvent: false,
            event: this.props.event ? this.props.event : {
                displayToAll: false,
                title: "",
                location: "",
                start: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                end: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                description: "",
                sessionTime: "",
                courseId: ""
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

        }
    };

    /**
     * Parses Date from js Date format to string
     * (calendar works only with js Date format, while date input works with strings)
     * @param name
     * @return {string}
     */
    handleParseDateTimeToString = (name) => {
        let dateTime;
        if (name === 'start') {
            dateTime = moment(this.state.event.start).format('YYYY-MM-DD HH:mm');
            let date = dateTime.substring(0, dateTime.indexOf(' '));
            let time = dateTime.substring(dateTime.indexOf(' ') + 1);
            return date + 'T' + time
        } else if (name === 'end') {
            dateTime = moment(this.state.event.end).format('YYYY-MM-DD HH:mm');
            let date = dateTime.substring(0, dateTime.indexOf(' '));
            let time = dateTime.substring(dateTime.indexOf(' ') + 1);
            return date + 'T' + time
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

    };
    /**
     * Change date according to user preferences and parse from string to js Date format
     * @param e - Event object
     */
    handleChangeDate = (e) => {
        let dateTime = e.target.value;
        dateTime = new Date(dateTime).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        const event = {
            ...this.state.event,
            [e.target.name]: dateTime
        };
        this.setState({event: event});
        this.forceUpdate();
    };

    /**
     * Changes color of event to color picked by user.
     * @param color
     */
    handleChangeComplete = (color) => {
        let event = {...this.state.event};
        event.color = color.hex;
        this.setState({event: event});
    };

    handleEdit = () => {
        this.setState({editForm: true});
        this.setState({onlyViewForm: false});
    };

    handleOpenEventDeleteModal = () => {
        this.setState({deleteEvent: true});

    };
    handleCloseEventDeleteModal = () => {
        this.setState({deleteEvent: false});

    };
    handleDelete = () => {
        this.state.deleteEventFunction(this.state.event).then(x => {
            this.setState({onlyViewForm: false});
        }).catch(e => {
            this.props.enqueueSnackbar('Error Occurred While Deleting', {variant: 'error'});
        });
        this.state.handleClose();
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


    handleUpdate = () => {
        this.state.updateEvent(this.state.event).then(x => {
            this.setState({onlyViewForm: false});
            this.props.enqueueSnackbar("Event Updated Successfully", {variant: 'success'});
        }).catch(e => {
            this.props.enqueueSnackbar('Error Occurred While Updating', {variant: 'error'});
        });
        this.setState({onlyViewForm: false, formStatus: null});
        this.state.handleClose();
    };

    handleAdd = () => {
        this.state.addEvent(this.state.event, 'event')
            .then(x => {
                this.props.enqueueSnackbar("Event Created Successfully", {variant: 'success'});
            }).catch(e => {
            this.props.enqueueSnackbar('Error Occurred While Creating', {variant: 'error'});
        });
        this.setState({onlyViewForm: false, formStatus: null});
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
                    <div
                        style={{
                            position: 'absolute',
                            top: '0',
                            marginTop: '7px',
                            marginLeft: '80px',
                        }}
                    >
                        {JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed ? <div>
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
                            <Tooltip title={'Delete Event'}>
                                <IconButton
                                    style={{display: !this.state.onlyViewForm && !this.state.editForm ? "none" : "inline",}}
                                    onClick={this.handleOpenEventDeleteModal}
                                    variant="contained" color="primary">
                                    <DeleteIcon/>
                                </IconButton>
                            </Tooltip>
                        </div> : ""}
                    </div>
                    <div className={classes.selectFields}>
                        <form onSubmit={this.submitForm} id={'event'}>
                            <Grid justify="center"
                                  alignItems="stretch" container spacing={3}>
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
                                <Grid item xs={12}>
                                    <Grid container justify="center" spacing={0}>
                                        <Grid item>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                onChange={this.handleChangeDate}
                                                style={{width: '20%'}}
                                                required={true}
                                                id="start"
                                                name="start"
                                                type="datetime-local"
                                                value={this.handleParseDateTimeToString('start')}
                                                className={classes.textField}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>
                                        <p>-</p>
                                        <Grid item>
                                            <TextField
                                                disabled={this.state.onlyViewForm}
                                                onChange={this.handleChangeDate}
                                                required={true}
                                                id="end"
                                                name="end"
                                                type="datetime-local"
                                                value={this.handleParseDateTimeToString('end')}
                                                className={classes.textField}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <div style={{display: 'inline'}}>
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

                                    <div>
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
                                </div>
                            </Grid>
                        </form>
                        <div style={{marginLeft: '80%'}}>
                            <ButtonGroup orientation="vertical">
                                <Button
                                    style={{
                                        display: !this.state.onlyViewForm && !this.state.editForm ? "inline" : "none",
                                    }}
                                    form={'event'}
                                    type={'submit'}
                                    onClick={() => this.hanldeChangeFormStatus('create')}
                                    // onClick={this.handleAdd}
                                    variant="contained" color="primary"
                                >
                                    Add
                                </Button>
                                <Button
                                    style={{
                                        display: this.state.editForm ? "inline" : "none",
                                    }}
                                    form={'event'}
                                    type={'submit'}
                                    onClick={() => this.hanldeChangeFormStatus('update')}
                                    // onClick={this.handleUpdate}
                                    variant="contained" color="primary"
                                >
                                    Update
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>
                    {this.state.deleteEvent ? (
                        <DeleteDialog
                            yesButtonText={'Delete'}
                            modalText={'Do you want to delete event?'}
                            isOpen={this.state.deleteEvent}
                            yesButtonFunction={this.handleDelete}
                            closeModal={this.handleCloseEventDeleteModal}
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


export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(Event)));