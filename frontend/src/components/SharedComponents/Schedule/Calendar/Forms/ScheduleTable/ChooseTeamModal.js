import React from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import {connect} from "react-redux";


const styles = theme => ({
    options: {
        fontSize: 15,
        '& > span': {
            marginRight: 10,
            fontSize: 18,
        }
    },
});


class ChooseTeamModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            handleViewScheduledTeams: this.props.handleViewScheduledTeams,
            teams: this.props.teams,
            chosenTeams: this.props.alreadyDisplayedData,
            error: null
        };
    }


    handleChange = (e, value) => {
        this.setState({chosenTeams: value});


    };
    handleSubmit = (e) => {
        e.preventDefault();
        this.state.handleViewScheduledTeams(this.state.chosenTeams);
    };


    render() {
        let chosenTeams = this.props.alreadyDisplayedData ? this.props.alreadyDisplayedData : [];
        const {classes} = this.props;
        return (
            <div>
                <Autocomplete
                    onChange={this.handleChange}
                    style={{width: 'full'}}
                    options={
                        this.state.teams.filter(function (team) {
                            return !chosenTeams.find(function (team2) {
                                return team.id === team2.teamId
                            })
                        })
                    }
                    classes={{
                        option: classes.option,
                    }}
                    autoHighlight
                    multiple={true}
                    getOptionLabel={option => 'Team #' + option.id + ' - ' + option.name + ' -  ' + option.students.map(o => o.engFirstName + ' ' + o.engLastName).join(', ') + ' '}
                    renderOption={option => (
                        <React.Fragment>
                            <p>Team #{option.id}</p>
                            &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                            <p style={{fontWeight: 'bold'}}>Project "{option.name}"</p>
                            &nbsp;&nbsp;&middot;&nbsp;&nbsp;

                            {
                                option.students.map(o => o.engFirstName + ' ' + o.engLastName).join(', ')
                            }

                        </React.Fragment>
                    )}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label="Choose teams"
                            variant="outlined"
                            fullWidth
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'disabled', // disable autocomplete and autofill
                            }}
                        />

                    )}
                />
                <Button style={{
                    marginTop: '5%',
                    left: '40%',
                }}
                        onClick={this.handleSubmit}
                        variant="contained" color="primary"
                >
                    Add to Schedule
                </Button>
            </div>
        );
    }
}


const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};


export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(ChooseTeamModal));


