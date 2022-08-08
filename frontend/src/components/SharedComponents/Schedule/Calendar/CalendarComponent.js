import React from 'react'
import moment from 'moment';
import {Calendar, momentLocalizer, Views} from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from '@material-ui/core/DialogContent';
import EventForm from "./Forms/EventForm";
import PresentationForm from "./Forms/PresentationForm";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ICalendarLink from "react-icalendar-link";
import CircularProgress from "@material-ui/core/CircularProgress";
import {addEntity, editEntity, getAllEntities, removeEntity} from "../../../Services/mySqlServices";
import {connect} from "react-redux";
import {getUsersByFireBaseIDs} from "../../../Services/usersService";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";


const propTypes = {};
const localizer = momentLocalizer(moment);

class CalendarComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            events: [],
            //if true: open dialog with event\presentation form to fill
            open: false,
            //if true: displays event form inside dialog, otherwise displays presentation form
            openEventForm: true,
            onlyViewForm: false,
            maxWidth: 'sm',
            isLoaded: false,
            error: null,
            //Current chosen/new event.
            event: {
                displayToAll: false,
                title: "",
                courseId: "",
                location: "",
                start: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                end: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                sessionTime: "10",
                type: 'event',
                color: '#3f51b5'
            },
        };
    }

    /**
     * Switches between two components on button click and changes with of dialog window.
     * @param event
     * @return PresentationForm/EventForm component
     */
    handleEventPresentationSwitch = ({event}) => {
        let eventData = event;
        if (this.state.openEventForm) {
            if (this.state.maxWidth !== 'sm') {
                this.setState({maxWidth: 'sm'});
            }
            return <EventForm
                event={eventData}
                onlyViewForm={this.state.onlyViewForm}
                handleClose={this.handleClose}
                deleteEvent={this.deleteEvent}
                updateEvent={this.updateEvent}
                addEvent={this.addEvent}

            />;
        } else {
            return <PresentationForm dialogWidth={this.handleMaxWidthChange}
                                     maxWidth={this.state.maxWidth}
                                     event={eventData}
                                     onlyViewForm={this.state.onlyViewForm}
                                     handleClose={this.handleClose}
                                     deleteEvent={this.deleteEvent}
                                     updateEvent={this.updateEvent}
                                     addEvent={this.addEvent}/>;
        }
    };


    handleMaxWidthChange = (width) => {
        this.setState({maxWidth: width});
    };

    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            let userDetails = result[userRed.uid];
            if (userDetails.user_type === 'student' && !this.props.adminViewRed) {
                getAllEntities('eventsByCourse', {
                    "courseId": userDetails.courseId,
                    "semesterId": userDetails.semesterId
                })
                    .then((response) => {
                        let events = [...response];
                        for (let event of events) {
                            event.start = new Date(event.start);
                            event.end = new Date(event.end);
                        }
                        this.setState({
                            events: events,
                            isLoaded: true
                        });
                    })
            } else if (userDetails.user_type === 'advisor' && !this.props.adminViewRed) {
                getAllEntities('eventsDisplayedToAll')
                    .then((response) => {
                        let events = [...response];
                        for (let event of events) {
                            event.start = new Date(event.start);
                            event.end = new Date(event.end);
                        }
                        this.setState({
                            events: events,
                            isLoaded: true
                        });
                    })
            } else {
                getAllEntities('events')
                    .then((response) => {
                        let events = [...response];
                        for (let event of events) {
                            event.start = new Date(event.start);
                            event.end = new Date(event.end);
                        }
                        this.setState({
                            events: events,
                            isLoaded: true
                        });
                    })
            }
        }).catch((error) => {
            this.setState({error: error});
        })
    };

    handleClose = () => {
        this.setState({
            open: false, openEventForm: true,
            onlyViewForm: false,
            maxWidth: 'sm',
        });
    };

    /**
     * Removes provided event from event array.
     * @param event
     * @return updated array of event objects
     */
    deleteEvent = (event) => {
        return removeEntity(event, 'events').then((response) => {
            let events = [...this.state.events];
            let i = events.findIndex(obj => obj.id === event.id);
            events.splice(i, 1);
            this.setState({
                events: events,
            });
            return Promise.resolve(events);

        }).catch((error) => {
            this.setState({error: error});
            return Promise.reject(error);
        });
    };

    /**
     * Updates provided event from event array.
     * @param event
     * @return error or nothing.
     */
    updateEvent = (event) => {
        let updatedEvent = {...event};
        delete updatedEvent.schedule;
        updatedEvent.start = new Date(event.start).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        updatedEvent.end = new Date(event.end).toLocaleString("en-CA", {hour12: false}).replace(/,/, '')
        return editEntity(updatedEvent, "events")
            .then((response) => {
                let events = [...this.state.events];
                events = events.filter(function (obj) {
                    return obj.id !== event.id;
                });
                events.push(event);
                this.setState({events: events});
                this.setState({open: false});
                return Promise.resolve();
            }).catch((error) => {
                this.setState({open: false});
                this.setState({error: error});
                return Promise.reject(error);
            });
    };
    /**
     * Creates new event from provided event object corresponding to prvided type.
     * @param event
     * @param type
     * @return updated events array or error
     */
    addEvent = (event, type) => {
        event.type = type;
        event.start = new Date(event.start).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        event.end = new Date(event.end).toLocaleString("en-CA", {hour12: false}).replace(/,/, '')
        if (type === 'event') {
            delete event.schedule;
        } else {
        }
        event.description = event.description ? event.description : "";
        event.displayToAll = event.displayToAll ? event.displayToAll : false;
        return addEntity(event, 'events')
            .then((response) => {
                event.id = response;
                let events = [...this.state.events];
                events.unshift(event);
                this.setState({
                    events: events,
                    open: false,
                });
                return Promise.resolve(events);

            }).catch((error) => {
                this.setState({open: false});
                this.setState({error: error});
                return Promise.reject(error);
            });
    };

    /**
     * Creates object from selected event properties to be exported at .ical format.
     * @return object
     */
    handleIcalExport = () => {
        if (this.state.event) {
            let startTime = this.state.event.start;
            let endTime = this.state.event.end;
            return {
                title: this.state.event.title,
                description: this.state.event.description,
                startTime: startTime,
                endTime: endTime,
                location: this.state.event.location
            };
        }

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
            const handleClickOpen = (event, title) => {
                if (title === 'onSelectEvent') {
                    this.setState({event: event});
                    if (event.type === 'event') {
                        this.setState({showEventForm: true});
                        this.setState({showEventPresentation: false});
                        handleEvent();
                    } else if (event.type === 'presentation') {
                        this.setState({showEventForm: false});
                        this.setState({showEventPresentation: true});
                        handlePresentation();
                    }
                    this.setState({onlyViewForm: true});
                } else if (title === 'onSelectSlot') {
                    let newEvent = {
                        title: "",
                        courseId: "",
                        location: "",
                        start: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                        end: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                        sessionTime: "10",
                        schedule: [],
                        type: 'event',
                        color: '#3f51b5'
                    };
                    let date;
                    let startTime = moment(event.start).format('YYYY-MM-DD HH:mm');
                    startTime = startTime.substring(startTime.indexOf(' ') + 1);
                    let endTime = moment(event.end).format('YYYY-MM-DD HH:mm');
                    endTime = endTime.substring(endTime.indexOf(' ') + 1);
                    if (startTime === endTime && startTime === '00:00') {
                        startTime = '17:30';
                        endTime = '19:30';
                        date = moment(event.start).format('YYYY-MM-DD HH:mm');
                        date = date.substring(0, date.indexOf(' '));
                        newEvent.start = new Date(date + ' ' + startTime);
                        newEvent.end = new Date(date + ' ' + endTime);

                    } else {
                        newEvent.start = event.start;
                        newEvent.end = event.end;
                    }
                    this.setState({event: newEvent});
                    this.setState({showEventForm: true});
                    this.setState({showEventPresentation: true});
                    this.setState({onlyViewForm: false});

                }
                this.setState({open: true});
            };

            const handlePresentation = () => {
                this.setState({openEventForm: false});

            };
            const handleEvent = () => {
                this.setState({openEventForm: true});
            };
            return (
                <div>
                    <div style={{padding: '4%'}}>
                        <Calendar
                            style={{
                                height: '60vh',
                            }}
                            selectable
                            localizer={localizer}
                            events={this.state.events}
                            defaultView={Views.MONTH}
                            scrollToTime={new Date(1970, 1, 1, 6)}
                            defaultDate={moment().toDate()}
                            onSelectEvent={event => handleClickOpen(event, 'onSelectEvent')}
                            onSelectSlot={(event) => {
                                if (JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed) {
                                    handleClickOpen(event, 'onSelectSlot')
                                }
                            }}
                            eventPropGetter={event => {
                                const backgroundColor = event.color;
                                return {style: {backgroundColor}};
                            }}
                        />
                    </div>

                    <div style={{paddingBottom: 15}}>
                        <div>
                            <Dialog
                                fullWidth={true}
                                maxWidth={this.state.maxWidth}
                                open={this.state.open} onClose={this.handleClose}
                                aria-labelledby="form-dialog-title"

                            >
                                <DialogActions style={{display: 'block'}}>
                                    <div style={{right: '95%', position: 'sticky'}}>
                                        <IconButton
                                            onClick={this.handleClose}
                                            color="primary">
                                            <CloseIcon/>
                                        </IconButton>
                                        <Tooltip title={'Export ICAL'}>
                                            <ICalendarLink event={this.handleIcalExport()}>
                                                <IconButton variant="contained" color="primary">
                                                    <EventAvailableIcon/>
                                                </IconButton>
                                            </ICalendarLink>
                                        </Tooltip>
                                    </div>
                                    <div
                                        style={{
                                            display: this.state.onlyViewForm ? "none" : "block",
                                            textAlign: 'center'
                                        }}>
                                        <Button
                                            color="primary"
                                            variant={this.state.openEventForm ? "contained" : "outlined"}
                                            onClick={handleEvent}>

                                            Event
                                        </Button>
                                        <Button
                                            color="primary"
                                            variant={this.state.openEventForm ? "outlined" : "contained"}
                                            onClick={handlePresentation}>
                                            Presentation
                                        </Button>
                                    </div>
                                </DialogActions>
                                <DialogContent>
                                    <this.handleEventPresentationSwitch event={this.state.event}/>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>


            )
        }

    }
}

CalendarComponent
    .propTypes = propTypes;


const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};


export default connect(mapStateToProps)(CalendarComponent)
