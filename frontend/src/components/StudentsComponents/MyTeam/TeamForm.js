import React from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import {getUsersByType} from "../../Services/usersService";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";

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
            error: null,
            isLoaded: false,
            teamCreator: null,
            studentsWithoutTeam: [],
            newTeamMembers: null,
            currentEditableTeam: {
                id: this.props.data.id,
                comment: this.props.data.comment,
                projectId: this.props.data.projectId,
                creatorId: this.props.data.creatorId,
                students: [...this.props.data.students]
            },
            teamMembers: [...this.props.data.students],
            onUpdate: this.props.onUpdate,
            onSend: this.props.onSend,
        };
    }


    /**
     * Function that updates property comment of a team
     * @param    {Object} e-Event object
     */
    handleTextFieldChange = (e) => {
        let team = {...this.state.currentEditableTeam};
        team.comment = e.target.value;
        this.setState({currentEditableTeam: team});
        this.forceUpdate();

    };

    /**
     * Function updates team members
     * @param    {Object} e-Event object
     * @param    {Object} arrFromAutocomplete array of student objects.
     */
    handleChange = (e, arrFromAutocomplete) => {
        let team = {...this.state.currentEditableTeam};
        let newTeamMembers = arrFromAutocomplete;
        let studentsWithoutTeam = [...this.state.studentsWithoutTeam];
        let leftMembers = team.students.filter(s => !newTeamMembers.includes(s));
        this.setState({
            newTeamMembers: newTeamMembers,
            teamMembers: newTeamMembers.concat(leftMembers),
            studentsWithoutTeam: studentsWithoutTeam
        });
    };

    /**
     * Function add selected members to team
     * @param    {Object} e-Event object
     */
    handleAdd = (e) => {
        e.preventDefault();
        const members = [...this.state.teamMembers];
        let team = {...this.state.currentEditableTeam};
        let studentsWithoutTeam = [...this.state.studentsWithoutTeam];
        studentsWithoutTeam = studentsWithoutTeam.filter((el) => !members.includes(el));
        team.students = members;
        team.comment = this.state.currentEditableTeam.comment;
        this.setState({currentEditableTeam: team, studentsWithoutTeam: studentsWithoutTeam});
        this.forceUpdate();
        this.state.onUpdate(team);
        this.state.onSend();
    };

    componentDidMount() {
        getUsersByType('studentsWithoutATeam').then((studentsWithoutTeam) => {
            let teamCreator = this.props.data.students.filter(obj => {
                return obj.id === this.props.studentId
            })[0];
            let team = {...this.props.data};
            this.setState({
                currentEditableTeam: team,
                teamCreator: teamCreator,
                studentsWithoutTeam: studentsWithoutTeam,
                isLoaded: true
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
                <div style={{textAlign: 'center'}}>
                    <Typography variant="h6" component="h2" style={{marginLeft: '20px'}}>
                        {'Team Number: ' + this.state.currentEditableTeam.id}
                    </Typography>
                    <div style={{marginTop: '5%'}}>
                        <TextField
                            id="comment"
                            name='comment'
                            label='Description'
                            onChange={this.handleTextFieldChange}
                            multiline
                            variant="outlined"
                            value={this.state.currentEditableTeam.comment ? this.state.currentEditableTeam.comment : ""}
                        />
                    </div>
                    <div style={{marginTop: '5%'}}>
                        <Autocomplete
                            defaultValue={[]}
                            onChange={this.handleChange}
                            options={
                                this.state.studentsWithoutTeam}
                            filterSelectedOptions
                            classes={{
                                option: classes.option,
                            }}
                            autoHighlight
                            multiple={true}
                            getOptionLabel={option => '[' + option.id + '] ' + option.engFirstName + ' ' + option.engLastName}
                            renderOption={option => (
                                <React.Fragment>
                                    <p>[{option.id}]</p>&nbsp;&nbsp;
                                    <p style={{fontWeight: 'bold'}}>{option.engFirstName} {option.engLastName}</p>
                                    &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                                    <p> {option.cellPhone} {option.email}</p>

                                </React.Fragment>
                            )}
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
                                />

                            )}
                        />
                    </div>
                    <Button style={{marginTop: '5%'}}
                            onClick={this.handleAdd}
                            variant="contained" color="primary"
                    >
                        Update
                    </Button>
                </div>
            )
                ;
        }
    }
}

export default withStyles(styles, {withTheme: true})(TeamForm);