import React from 'react';
import TableComponent from "./TableComponent";
import CircularProgress from "@material-ui/core/CircularProgress";
import {addEntity, editEntity, getAllEntities, removeEntity} from "../../../Services/mySqlServices";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class Teams extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            teams: null
        };

    }

    componentDidMount() {
        if (this.props.type === "search") {
            const searchTeams = this.props.searchTeams;
            this.setState({
                teams: this.handleDataFieldsToSrt(searchTeams),
                isLoaded: true,
            });
        } else {
        getAllEntities('teams')
            .then((response) => {
                let dataFromDB = response;
                dataFromDB = this.handleDataFieldsToSrt(dataFromDB);
                this.setState({
                    teams: dataFromDB,
                    isLoaded: true,
                });

            }).catch((error) => {
                this.setState({ error: error });
        });
        }
    };


    /**
     * Function parses team's property 'students': from arr. of objects to arr. of name strings
     * @param    {Object} teamsArray    array with team-objects
     * @return   {Object } teamsArray
     */
    handleDataFieldsToSrt = (teamsArray) => {
        let renderedTeams = [];
        for (let team of teamsArray) {
            let renderedTeam = {
                id: team.id,
                projectId: team.projectId,
                comment: team.comment,
                students: team.students,
                creatorId: team.creatorId,
                name: team.name
            };
            let studentsNames = [];
            if (team.students) {
                for (let student of team.students) {
                    if (student && student.engFirstName && student.engLastName) {
                        studentsNames.push(student.engFirstName + ' ' + student.engLastName)
                    }
                }
                renderedTeam.studentsNames = studentsNames.join(', ');
            } else {
                renderedTeam.studentsNames = ''
            }
            renderedTeams.push(renderedTeam);

        }
        return renderedTeams;
    };


    /**
     * Function that adds new team, updates array of teams.
     * @param    {Object} newTeamObj    new team object
     * @return   error or success message
     */
    handleAdd = (newTeamObj) => {
        return addEntity(newTeamObj, 'teams')
            .then((response) => {
                newTeamObj.id = response;
                newTeamObj = this.handleDataFieldsToSrt([newTeamObj])[0];
                let teams = [...this.state.teams];
                teams.unshift(newTeamObj);
                this.setState({teams: teams});
                return Promise.resolve(teams);
            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    };

    /**
     * Function that edits existing team, updates array of teams.
     * @param    {Object} teamObj  team object
     * @return   error or success message
     */
    handleEdit = (teamObj) => {
        return editEntity(teamObj, 'teams')
            .then((response) => {
                teamObj = this.handleDataFieldsToSrt([teamObj])[0];
                let teams = [...this.state.teams];
                let i = teams.findIndex(obj => obj.id === teamObj.id);
                if (teams[i]) {
                    let studentsNames = [];
                    if (teamObj.students) {
                        for (let student of teamObj.students) {
                            if (student && student.engFirstName && student.engLastName) {
                                studentsNames.push(student.engFirstName + ' ' + student.engLastName)
                            }
                        }
                        teams[i].studentsNames = studentsNames.join(', ');
                    } else {
                        teams[i].studentsNames = ''
                    }
                    teams[i].students = teamObj.students;
                    teams[i].comment = teamObj.comment;
                    teams[i].creatorId = teamObj.creatorId;
                }
                this.setState({teams: teams});
                return Promise.resolve(teams);

            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    };

    /**
     * Function that deletes existing team, updates array of teams.
     * @param    {Object} teamObj  team object
     * @return   error or success message
     */
    handleDelete = (teamObj) => {
        return removeEntity(teamObj, 'teams').then((response) => {
            let teams = [...this.state.teams];
            let i = teams.findIndex(obj => obj.id === teamObj.id);
            teams.splice(i, 1);
            this.setState({teams: teams});
            return Promise.resolve(teams);
        }).catch((error) => {
            this.setState({error: error});
            return Promise.reject(error);
        });
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
                <TableComponent teams={this.state.teams}
                                columns={this.state.columns}
                                title='Teams'
                                handleDelete={this.handleDelete}
                                handleAdd={this.handleAdd}
                                handleEdit={this.handleEdit}
                />
            );
        }
    }
}

export default Teams;
