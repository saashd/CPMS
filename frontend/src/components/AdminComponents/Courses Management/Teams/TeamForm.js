import React from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import {getUsersByType} from "../../../Services/usersService";
import CircularProgress from "@material-ui/core/CircularProgress";
import {connect} from "react-redux";
import Paper from "@material-ui/core/Paper";
import { Chip } from '@material-ui/core';
import UserLink from '../../Links/UserLink/UserLink';

const styles = theme => ({
    options: {
        fontSize: 15,
        '& > span': {
            marginRight: 10,
            fontSize: 18,
        }
    },
});


class TeamForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editFlag: this.props.editFlag,
            studentsWithoutTeam: null,
            currentTeam: {
                id: this.props.currentTeam.id,
                comment: this.props.currentTeam.comment,
                projectId: this.props.currentTeam.projectId,
                creatorId: this.props.currentTeam.creatorId,
                students: this.props.currentTeam.students.filter(x => x !== null)
            },
            teamMembers: this.props.currentTeam.students.filter(x => x !== null),
            handleAdd: this.props.handleAdd,
            onSend: this.props.onSend,
            teams: this.props.teams,
            isLoaded: false,
            error: null,
            clickedUserId: null,
            userLinkOpen: false,
        };
    }

    componentDidMount() {
        getUsersByType('studentsWithoutATeam').then((response) => {
            this.setState({
                studentsWithoutTeam: response,
                isLoaded: true
            });
        }).catch((error) => {
            this.setState({error: error});
        });
    }


    /**
     * Function that changes comment property of a team
     * @param    {Object} e-Event object
     * @return   error or success message
     */
    handleChangeComment = (e) => {
        let team = {...this.state.currentTeam};
        team.comment = e.target.value;
        this.setState({currentTeam: team});
        this.forceUpdate();

    };

    /**
     * Function that updates team members.
     * @param    {Object} e-Event object
     * @param    {Object} arrFromAutocomplete arr. of students chosen in autocomplete.
     */
    handleChange = (e, arrFromAutocomplete) => {
        let teams = this.state.teams ? [...this.state.teams] : [];
        let team = {...this.state.currentTeam};
        let newTeamMembers = arrFromAutocomplete;
        let studentsWithoutTeam = [...this.state.studentsWithoutTeam];
        let removedMembers = team.students.filter(s => !newTeamMembers.includes(s));
        studentsWithoutTeam = studentsWithoutTeam.concat(removedMembers);
        team.students = newTeamMembers;
        this.setState({
            teams: teams,
            teamMembers: newTeamMembers,
            studentsWithoutTeam: studentsWithoutTeam
        });
        this.forceUpdate();


    };

    /**
     * Function that adds chosen team members in autocomplete to the existing team.
     * @param    {Object} e-Event object
     */
    handleAdd = (e) => {
        e.preventDefault();
        const members = this.state.teamMembers;
        let team = {...this.state.currentTeam};
        team.students = members;
        team.comment = this.state.currentTeam.comment;
        if (team.creatorId === null && team.students.length !== 0) {
            team.creatorId = team.students[0].firebase_user_id
        }
        this.state.handleAdd(team).then(response => {
            let team = response;
            getUsersByType('studentsWithoutATeam').then((studentsWithoutTeam) => {
                this.setState({
                    currentTeam: team,
                    teamMembers: [...team.students],
                    studentsWithoutTeam: studentsWithoutTeam
                });
                this.forceUpdate();
                this.state.onSend();
            }).catch((error) => {
                this.setState({error: error});
            });
        }).catch((error) => {
            this.setState({error: error});
        });

    };

    handleUserLinkClose = () => {
        this.setState({ userLinkOpen: false, clickedUserId: null });
    };

    render() {
        let members = this.state.currentTeam.students;
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
                <>
                <div style={{textAlign: 'center'}}>
                    {this.state.editFlag ?
                        <Typography variant="h6" component="h2" style={{marginLeft: '20px'}}>
                            {'Team Number: ' + this.state.currentTeam.id}
                        </Typography> :
                        <> </>
                    }
                    <div style={{marginTop: '5%'}}>
                        <TextField
                            id="comment"
                            name='comment'
                            label='Description'
                            onChange={this.handleChangeComment}
                            multiline
                            variant="outlined"
                            value={this.state.currentTeam.comment}
                        />
                    </div>
                    <div style={{marginTop: '5%'}}>
                        <Autocomplete
                            defaultValue={members}
                            onChange={this.handleChange}
                            options={this.state.studentsWithoutTeam}
                            filterSelectedOptions
                            classes={{option: classes.option,}}
                            autoHighlight
                            multiple={true}
                            getOptionSelected={(option, value) => {
                                if (value.id === option.id) {
                                    return true;
                                }
                            }}
                            getOptionLabel={(student) => (student ? '[' + student.id + '] ' + student.engFirstName + ' ' + student.engLastName : '')}
                                renderTags={(value, getTagProps) =>
                                    value.map((student, index) => (
                                        student ?
                                            <Chip variant="outlined" label={'[' + student.id + '] ' + student.engFirstName + ' ' + student.engLastName} {...getTagProps({ index })}
                                                onClick={() => this.setState({ clickedUserId: student.firebase_user_id, userLinkOpen: true })} /> : ''
                                    ))
                                }
                            renderOption={option => (
                                <React.Fragment>
                                    <p>[{option.id}]</p>&nbsp;&nbsp;
                                    <p style={{fontWeight: 'bold'}}>{option.engFirstName} {option.engLastName}</p>
                                    &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                                    <p> {option.cellPhone} {option.email}</p>
                                </React.Fragment>)}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label="Choose students"
                                    variant="outlined"
                                    fullWidth
                                    inputProps={{
                                        ...params.inputProps,
                                        autoComplete: 'disabled', // disable autocomplete and autofill
                                    }}
                                />)}
                        />
                    </div>
                    <Button
                        onClick={this.handleAdd}
                        style={{marginTop: "2%", display: this.state.editFlag ? "none" : "inline"}}
                        variant="contained" color="primary">Add</Button>
                    <Button onClick={this.handleAdd}
                            style={{marginTop: "2%", display: this.state.editFlag ? "inline" : "none"}}
                            variant="contained" color="primary">Update</Button>
                </div>
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


const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(TeamForm));

