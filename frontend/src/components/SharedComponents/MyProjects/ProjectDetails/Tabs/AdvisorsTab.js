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


class AdvisorsTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentEditableProject: this.props.currentEditableProject,
            error: null,
            clickedUserId: null,
            userLinkOpen: false
        };

    }

    handleUserLinkClose = () => {
        this.setState({ userLinkOpen: false });
    };

    render() {
        let industrialAdvisor = this.state.currentEditableProject.industrialAdvisorId;
        let academicAdvisor = this.state.currentEditableProject.academicAdvisorId;
        return (
            <>
                <Grid
                    justify="center"
                    alignItems="stretch" container
                    spacing={3}
                >
                    {academicAdvisor ?
                        <Button key={academicAdvisor.firebase_user_id} onClick={() => this.setState({ clickedUserId: academicAdvisor.firebase_user_id, userLinkOpen: true })}>
                            <Paper elevation={3}>
                                <Typography style={{fontSize: "x-large", color: '#3f51b5', textAlign: "center"}}>
                                    Academic Advisor
                                </Typography>
                                <Typography style={{fontSize: "x-large",paddingLeft:"15%"}}>
                                    {academicAdvisor.prefix}{'. '}{academicAdvisor.engFirstName + ' ' + academicAdvisor.engLastName}
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <EmailIcon style={{color: '#3f51b5'}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{academicAdvisor.email}</Typography>}/>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIphoneIcon style={{color: '#3f51b5'}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{academicAdvisor.cellPhone}</Typography>}/>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIcon style={{color: '#3f51b5'}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{academicAdvisor.homePhone}</Typography>}/>
                                    </ListItem>

                                </List>
                            </Paper>
                        </Button>
                        : <div/>
                    }
                    {industrialAdvisor ?
                        <Button key={industrialAdvisor.firebase_user_id} onClick={() => this.setState({ clickedUserId: industrialAdvisor.firebase_user_id, userLinkOpen: true })}>
                            <Paper elevation={3}>
                                <Typography style={{fontSize: "x-large", color: '#3f51b5', textAlign: "center"}}>
                                    Industrial Advisor
                                </Typography>
                                <Typography style={{fontSize: "x-large",paddingLeft:"15%"}}>
                                    {industrialAdvisor.prefix}{'. '}{industrialAdvisor.engFirstName + ' ' + industrialAdvisor.engLastName}
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <EmailIcon style={{color: '#3f51b5'}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{industrialAdvisor.email}</Typography>}/>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIphoneIcon style={{color: '#3f51b5'}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{industrialAdvisor.cellPhone}</Typography>}/>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIcon style={{color: '#3f51b5'}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{industrialAdvisor.homePhone}</Typography>}/>
                                    </ListItem>

                                </List>
                            </Paper>
                        </Button>
                        : <div/>
                    }
                    {(!industrialAdvisor && !academicAdvisor) ?
                        <Typography style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5'}}>
                            Project has no assigned advisors yet
                        </Typography> : ''}
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

export default withStyles(styles, {withTheme: true})(AdvisorsTab);
