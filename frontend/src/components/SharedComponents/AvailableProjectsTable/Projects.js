import React from 'react';
import TableComponent from "./TableComponent";
import {getAllEntities} from "../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import {connect} from "react-redux";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

const shallowequal = require("shallowequal");

class Projects extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            renderedProjects: [],
            availableProjects: [],
            columns: [
                {
                    title: 'Project ID',
                    field: 'id',

                },
                {
                    title: 'Project Name',
                    field: 'name',
                }
                ,
                {
                    title: 'Organization',
                    field: 'organizationName',

                },

                {
                    title: 'Number of Semesters',
                    field: 'numOfSemesters',
                },
                {
                    title: 'Description',
                    field: 'description',
                    // hidden: true
                },
                {
                    title: 'Academic Advisor',
                    field: 'academicAdvisorName',
                    hidden: true
                },
                {
                    title: 'Industrial Advisor',
                    field: 'industrialAdvisorName',
                    hidden: true
                }
            ]
        };

    }

    /**
     *Function that appends to each project object additional parsed fields to match future display.
     * @param projects
     * @return {*}
     */
    renderData = (projects) => {
        for (let project of projects) {
            if (project.organizationId) {
                project.organizationName = project.organizationId.name;
            } else {
                project.organizationName = "";

            }
            if (project.industrialAdvisorId) {
                project.industrialAdvisorName = project.industrialAdvisorId.engFirstName + ' ' + project.industrialAdvisorId.engLastName;
            } else {
                project.industrialAdvisorName = "";

            }
            if (project.academicAdvisorId) {
                project.academicAdvisorName = project.academicAdvisorId.engFirstName + ' ' + project.academicAdvisorId.engLastName;
            } else {
                project.academicAdvisorName = "";

            }
        }
        return projects;
    };

    componentDidMount() {
        getAllEntities('availableProjects')
            .then((response) => {
                let renderedProjects = this.renderData(response);
                this.setState({
                    renderedProjects: renderedProjects,
                    projects: response
                });
            }).catch((error) => {
            this.setState({error: error});
        });
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            const teamId = (result[userRed.uid]).teamId;
            if (!teamId) {
                this.setState({
                    teamsProjectsRequests: [], isLoaded: true
                });
            } else {
                getAllEntities('teamsProjectsRequests', {team_id: teamId})
                    .then((response) => {

                        this.setState({teamsProjectsRequests: response ? response : [], isLoaded: true})
                    }).catch((error) => {
                    this.setState({error: error});
                });
            }
        }).catch((error) => {
            this.setState({error: error});
        });

    };


    shouldComponentUpdate(nextProps, nextState) {
        return !shallowequal(nextProps, this.props) || !shallowequal(nextState, this.state);
    }


    render() {
        const {error, isLoaded} = this.state;
        if (error) {
            return (<div>Error: {error.message}</div>)
        } else if (!isLoaded) {
            return (<div style={{textAlign: 'center', paddingTop: "15%"}}>
                <CircularProgress size="8rem"/>
            </div>)
        } else if (isLoaded && this.state.renderedProjects.length === 0) {
            return (<Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '10%'}}>
                <Typography
                    style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                    There are no available projects to display.
                </Typography>
            </Paper>)
        } else {
            return (
                <TableComponent data={this.state.renderedProjects}
                                columns={this.state.columns}
                                teamsProjectsRequests={this.state.teamsProjectsRequests}
                />
            );
        }

    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};
export default connect(mapStateToProps)(Projects);
