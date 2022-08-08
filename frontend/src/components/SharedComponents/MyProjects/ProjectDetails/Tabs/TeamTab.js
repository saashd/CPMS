import React from 'react';
import 'date-fns';
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import EmailIcon from '@material-ui/icons/Email';
import PhoneIcon from '@material-ui/icons/Phone';
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone';
import Paper from "@material-ui/core/Paper";
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import {getAllEntities} from "../../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Button } from '@material-ui/core';
import UserLink from '../../../../AdminComponents/Links/UserLink/UserLink';

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        '&.MuiBox-root': {
            width: '100%'
        }
    },
});


class TeamTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewMoreFlag: this.props.viewMoreFlag,
            currentEditableProject: this.props.currentEditableProject,
            teams: [],
            error: null,
            isLoaded: false,
            clickedUserId: null,
            userLinkOpen: false
        };

    }

    componentDidMount() {
        getAllEntities('assignedTeams')
            .then((response) => {
                this.setState({
                    teams: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    };


    getTeamById = () => {
        if (this.state.currentEditableProject.teamId) {
            let team = this.state.teams.filter(obj => {
                return parseInt(obj.id) === parseInt(this.state.currentEditableProject.teamId)
            })[0];
            return team.students;
        }
        return []
    };

    handleUserLinkClose = () => {
        this.setState({ userLinkOpen: false });
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
            let students = this.getTeamById();
            if (!this.state.currentEditableProject.teamId) {

                return (
                    <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '5%', padding: '4%'}}>
                        <Typography
                            style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5'}}>
                            No Team Assigned
                        </Typography>
                    </Paper>
                )
            }
            return (
                <>
                    <Typography style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5'}}>
                        {'Team Number : ' + this.state.currentEditableProject.teamId}
                    </Typography>
                    <Grid alignItems="stretch" container spacing={3}>
                        {
                            students.map(student => (
                                <Button key={student.firebase_user_id} onClick={() => this.setState({ clickedUserId: student.firebase_user_id, userLinkOpen: true })}>

                                    <Paper elevation={3} style={{overflow: 'auto'}}>
                                        <Typography style={{ fontSize: "large", textAlign: "center" }}>
                                            {student.prefix}{'. '}{student.engFirstName + ' ' + student.engLastName}
                                        </Typography>
                                        <List>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <EmailIcon style={{color: '#3f51b5'}}/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    secondary={<Typography
                                                        style={{ fontSize: "large" }}>{student.email}</Typography>} />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <PhoneIphoneIcon style={{color: '#3f51b5'}}/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    secondary={<Typography
                                                        style={{ fontSize: "large" }}>{student.cellPhone}</Typography>} />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <PhoneIcon style={{color: '#3f51b5'}}/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    secondary={<Typography
                                                        style={{fontSize: "1vw"}}>{student.homePhone}</Typography>}/>
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <AccountBalanceIcon style={{color: '#3f51b5'}}/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    secondary={<Typography
                                                        style={{ fontSize: "large" }}>{student.faculty}</Typography>} />
                                            </ListItem>
                                        </List>
                                    </Paper>

                                </Button>
                            ))}
                    </Grid>
                    <UserLink
                        userLinkOpen={this.state.userLinkOpen}
                        handleTeamLinkClose={this.handleUserLinkClose}
                        userId={this.state.clickedUserId}
                    />
                </>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(TeamTab);
