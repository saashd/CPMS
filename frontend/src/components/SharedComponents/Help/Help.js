import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import {connect} from "react-redux";
import Items from "../CrudElements/Items";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import {getAllEntities} from "../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import Card from '@material-ui/core/Card';
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class Help extends Component {
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
                "item_type": 'help',
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

    iframe() {
        return {
            __html: '<iframe src="./telegram.html" frameBorder="0" width="540" height="350"></iframe>'
        }
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
                <div>
                    <Items items={this.state.itemsList} item_type={'help'}/>
                    <Card style={{float: 'right', marginRight: "40px"}} dangerouslySetInnerHTML={this.iframe()}/>
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

export default connect(mapStateToProps)((Help));
