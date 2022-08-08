import React from 'react'
import moment from 'moment';
import {Calendar, momentLocalizer, Views} from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../Services/mySqlServices";
import {connect} from "react-redux";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const propTypes = {};
const localizer = momentLocalizer(moment);


class UpcomingEvents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            events: [],
            isLoaded: false,
            error: null,
            open: false,
            onlyViewForm: true,
        };
    }

    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
                let userDetails = result[userRed.uid];
                if (userDetails.user_type === 'advisor' && !this.props.adminViewRed) {
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
            }
        ).catch((error) => {
            this.setState({error: error});
        })
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
            return (
                <Calendar
                    localizer={localizer}
                    events={this.state.events}
                    defaultView={Views.MONTH}
                    scrollToTime={new Date(1970, 1, 1, 6)}
                    defaultDate={moment().toDate()}
                    eventPropGetter={event => {
                        const backgroundColor = event.color;
                        return {style: {backgroundColor, cursor: 'context-menu'}};
                    }}
                />
            )
        }
    }
}

UpcomingEvents.propTypes = propTypes;


const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};


export default connect(mapStateToProps)(UpcomingEvents)
