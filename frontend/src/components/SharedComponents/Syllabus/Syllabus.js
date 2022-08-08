import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import {connect} from "react-redux";
import Items from "../CrudElements/Items";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import {editEntity, getAllEntities, getEntitiesByIDs} from "../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {Button} from "@material-ui/core";
import MuiAlert from '@material-ui/lab/Alert';
import {withSnackbar} from "notistack";

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled"
                     style={{
                         background: '#3f51b5',
                         display: 'inline-flex',
                         width: '30%',
                         right: '2%',
                         position: 'absolute',
                         bottom: '10%'
                     }}
                     {...props} />;
}

class Syllabus extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itemsList: [],
            userDetails: null,
            syllabusConfirmation: null,
            isLoaded: false,
            error: null
        };
    }

    async componentDidMount() {
        let promises = [];
        let params = {};
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        promises.push(
            await getEntitiesByIDs({ids: [userRed.uid]}, 'retrieve/syllabusconfirmation', true)
                .then((response) => {
                    this.setState({
                        syllabusConfirmation: response[0] ? response[0]['confirmation'] : true

                    });
                }));
        promises.push(
            await getUsersByFireBaseIDs(obj).then(result => {
                let userDetails = result[userRed.uid];
                params = {
                    "item_type": 'syllabus',
                    courseId: (userDetails.is_admin && this.props.adminViewRed) ? null : userDetails.courseId

                };
                this.setState({userDetails: userDetails})
            }));
        promises.push(
            await getAllEntities('genericItems', params)
                .then((response) => {
                    this.setState({
                        itemsList: response,
                    });
                }));
        Promise.all(promises).then(() => {
            this.setState({
                isLoaded: true
            });
        }).catch(error => {
            this.setState({error: error})
        });
    }

    updateSyllabusConfirmation = (syllabusConfirmation) => {
        let userRed = JSON.parse(this.props.userRed);
        editEntity({id: userRed.uid, confirmation: syllabusConfirmation}, 'syllabusconfirmation').then((response) => {
            this.setState({syllabusConfirmation: syllabusConfirmation});
            this.props.enqueueSnackbar("Syllabus Confirmaton status updated", {variant: 'success'});
        }).catch((error) => {
            this.props.enqueueSnackbar("Couldnt update Syllabus Confirmaton status", {variant: 'error'});
            this.setState({error: error});

        })
    };


    render() {
        const action = (
            <div>
                <Button style={{color: '#fff'}} size="small" onClick={() =>
                    this.updateSyllabusConfirmation(true)}>
                    Accept
                </Button>

            </div>
        );
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
                <div>
                    <Items items={this.state.itemsList} item_type={'syllabus'}/>
                    {this.state.userDetails.user_type === 'student' && this.state.syllabusConfirmation !== true ?
                        <Alert action={action} severity={'info'}> "I have read the Syllabus and agree to the terms
                            listed in
                            it." </Alert> : ''}
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

export default connect(mapStateToProps)(withSnackbar(Syllabus));
