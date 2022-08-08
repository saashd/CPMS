import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import {addEntity, getAllEntities, getEntitiesByIDs, removeEntity} from "../../Services/mySqlServices";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import {connect} from "react-redux";
import {withSnackbar} from "notistack";
import Typography from "@material-ui/core/Typography";
import ShowMoreText from "react-show-more-text";
import {FormControlLabel} from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
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


class ProjectDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            error: null,
            userDetails: this.props.userDetails,
            userTeam: null,
            currentProject: this.props.currentProject,
            teamsProjectsRequests: []
        };
    }

    /**
     * Creates new request object from state properties and passes object for creation in mySQL db.
     */
    handleAddTeamProjectRequest = () => {
        let request = {
            teamId: this.state.userDetails.teamId,
            projectId: this.state.currentProject.id,
            adminStatus: null
        };
        let teamsProjectsRequests = [...this.state.teamsProjectsRequests];
        addEntity(request, 'teamsProjectsRequests')
            .then((response) => {
                request.id = response;
                teamsProjectsRequests.push(request);
                this.props.enqueueSnackbar('Request Send Successfully', {variant: 'success'});
                this.props.handleClose(teamsProjectsRequests);
            }).catch((error) => {
            this.setState(error)
        });
    };

    /**
     * Removes current team-rpoject request accordint to team and project ids, stored in classe's state.
     */
    handleRemoveTeamProjectRequest = () => {
        let result = null;
        for (let request of this.state.teamsProjectsRequests) {
            if (request.teamId === this.state.userTeam.id && request.projectId.id === this.state.currentProject.id) {
                result = request;
            }
        }
        let teamsProjectsRequests = [...this.state.teamsProjectsRequests];
        let i = teamsProjectsRequests.findIndex(obj => obj.id === result.id);
        teamsProjectsRequests.splice(i, 1);
        removeEntity(result, 'teamsProjectsRequests').then((response) => {
            this.props.enqueueSnackbar('Request Removed Successfully', {variant: 'success'});
            this.props.handleClose(teamsProjectsRequests);
        }).catch((error) => {
            this.setState({error})
        });
    };

    /**
     * Checks it team can place team-project request.
     * @return {boolean}
     * @constructor
     */
    CheckIfCanRequestProject() {
        let result = this.CheckIfUserHasTeamAndProject();
        if (!result) {
            return false
        }
        if (this.state.teamsProjectsRequests.length === 0) {
            return true
        }
        // if already placed request, cannot place another one
        for (let request of this.state.teamsProjectsRequests) {
            if (request.teamId === this.state.userTeam.id) {
                return false
            }
        }
        return true;
    }


    CheckIfUserHasTeamAndProject() {
        let isStudent = this.state.userDetails.user_type === 'student';
        let hasTeam = !!this.state.userTeam;
        //if not student or in admin view or students without team, cannot remove request
        if (!isStudent || !hasTeam || this.props.adminViewRed) {
            return false
        }
        //if student with team and assigned project,cannot remove request
        return !this.state.userTeam.projectId;

    }

    CheckIfCanRemoveRequestProject() {
        let result = this.CheckIfUserHasTeamAndProject();
        if (!result) {
            return false
        }
        // if placed request to current project, then can remove it
        for (let request of this.state.teamsProjectsRequests) {
            if (request.teamId === this.state.userTeam.id && request.projectId.id === this.state.currentProject.id) {
                return true
            }
        }
        return false
    }

    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        let promises = [];
        promises.push(
            getUsersByFireBaseIDs(obj).then(result => {
                this.setState({userDetails: result[userRed.uid]});
                let teamObj = {ids: [this.state.userDetails.teamId]};
                getEntitiesByIDs(teamObj, 'retrieve/teams', true).then(result => {
                    this.setState({userTeam: result[0]});
                });
                getAllEntities('teamsProjectsRequests', {team_id: this.state.userDetails.teamId})
                    .then((response) => {
                        this.setState({teamsProjectsRequests: response ? response : []})
                    });
            }));

        Promise.all(promises).then(() => {
            this.setState({isLoaded: true})

        }).catch(error => {
            this.setState({error: error})
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
            return <div style={{textAlign: 'center'}}>
                <CircularProgress/>
            </div>
        } else {
            return (
                <div className={classes.selectFields}>
                    <Paper elevation={3} style={{padding: '15px'}}>
                        <Grid
                            justify="center"
                            alignItems="stretch"
                            container
                            spacing={5}
                        >
                            <Grid item md={6} xs={12}>
                                <TextField
                                    disabled
                                    label='Project Name'
                                    value={this.state.currentProject.name}
                                />
                                <TextField
                                    disabled
                                    label='Initiation Date'
                                    value={this.state.currentProject.initiationDate ? new Date(this.state.currentProject.initiationDate).toISOString().slice(0, 10) : ''}
                                />
                                <TextField
                                    disabled
                                    label='Organization'
                                    value={this.state.currentProject.organizationId ? this.state.currentProject.organizationId.name : ''}
                                />
                                <div style={{margin: '8px', display: 'flex', flexWrap: 'wrap'}}>
                                    <div>
                                        Description
                                    </div>
                                    <div style={{padding: '6px 0 7px'}}>
                                        <ShowMoreText
                                            lines={4}
                                            more="Show more"
                                            less="Show less"
                                            expanded={false}
                                            truncatedEndingComponent={"... "}>
                                            {this.state.currentProject.description}
                                        </ShowMoreText>
                                    </div>
                                </div>
                            </Grid>
                            <Grid item md={6} xs={12}>
                                <TextField
                                    disabled
                                    label='Number Of Semesters'
                                    value={this.state.currentProject.numOfSemesters}
                                />
                                <TextField
                                    disabled
                                    label='Academic Advisor'
                                    value={this.state.currentProject.academicAdvisorName}
                                />
                                <TextField
                                    disabled
                                    label='Industrial Advisor'
                                    value={this.state.currentProject.industrialAdvisorName}
                                />
                                <TextField InputLabelProps={{
                                    shrink: true,
                                }}
                                           fullWidth
                                           disabled={true}
                                           id="contactName"
                                           name="contactName"
                                           label='Contact Name'
                                           value={this.state.currentProject.contactName}
                                />
                                <FormControlLabel
                                    labelPlacement="end"
                                    label='This contact is an advisor'
                                    control={
                                        <Checkbox
                                            disabled={true}
                                            checked={this.state.currentProject.contactIsAdvisor}
                                            color="primary"
                                        />}
                                />

                                <TextField InputLabelProps={{
                                    shrink: true,
                                }}
                                           fullWidth
                                           disabled={true}
                                           id="contactPhone"
                                           name="contactPhone"
                                           label='Contact Phone'
                                           value={this.state.currentProject.contactPhone}
                                />
                                <TextField InputLabelProps={{
                                    shrink: true,
                                }}
                                           fullWidth
                                           disabled={true}
                                           id="contactEmail"
                                           name="contactEmail"
                                           label='Contact Email'
                                           value={this.state.currentProject.contactEmail}
                                />
                            </Grid>
                        </Grid>
                        <div style={{textAlign: 'center'}}>
                            {!this.state.userDetails.teamId && this.state.userDetails.user_type === 'student' ?
                                <Typography variant="h5" align={'center'} color="primary">
                                    You must be in a team to ask for this project
                                </Typography> : ""}
                            {this.CheckIfCanRequestProject() ?
                                <Button
                                    variant="contained" color="primary"
                                    onClick={() => {
                                        this.handleAddTeamProjectRequest();
                                    }}>
                                    Request Project
                                </Button> : ""}
                            {this.CheckIfCanRemoveRequestProject() ?
                                <Button
                                    variant="contained" color="primary"
                                    onClick={() => {
                                        this.handleRemoveTeamProjectRequest();
                                    }}>
                                    Remove Request
                                </Button> : ''
                            }
                        </div>
                    </Paper>
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

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(ProjectDetails)));
