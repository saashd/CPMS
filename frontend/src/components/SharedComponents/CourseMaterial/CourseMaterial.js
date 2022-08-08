import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import {connect} from "react-redux";
import Items from "../CrudElements/Items";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import {getAllEntities} from "../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class CourseMaterial extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itemsList: [],
            isLoaded: false,
            error: null
        };
    }

    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            let userDetails = result[userRed.uid];
            let params = {
                "item_type": 'courseMaterial',
                courseId: (userDetails.is_admin && this.props.adminViewRed) ? null : userDetails.courseId

            };
            getAllEntities('genericItems', params)
                .then((response) => {
                    this.setState({
                        itemsList: response,
                        isLoaded: true
                    });
                }).catch((error) => {
                this.setState({error: error})
            });
        }).catch(error => {
            this.setState({error: error})
        });
    }


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
            return (
                <Items items={this.state.itemsList} item_type={'courseMaterial'}/>
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

export default connect(mapStateToProps)((CourseMaterial));