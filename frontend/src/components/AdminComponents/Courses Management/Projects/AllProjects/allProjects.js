import React from 'react';
import TableComponent from "./TableComponent";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../../Services/mySqlServices";
import {withSnackbar} from "notistack";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class Projects extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            projects: [],
            renderedProjects: [],
        };

    }

    /**
     * Function that appends to each project object additional parsed fields to match future display
     * @param projects
     * @return {*}
     */
    renderData = (projects) => {
        if (projects) {
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
        }
        return projects;
    };

    componentDidMount() {
        let promises = [];
        let semesters = [];
        let projects = [];
        let renderedProjects = [];
        if (this.props.type === "search") {
            const searchProjects = this.props.searchProjects;
            renderedProjects = this.renderData(searchProjects);
            projects = searchProjects
        } else {
            promises.push(getAllEntities('projects')
                .then((response) => {
                    renderedProjects = this.renderData(response);
                    projects = response
                }))
        }
        promises.push(getAllEntities('semesters')
            .then((response) => {
                semesters = response
            }));
        Promise.all(promises).then(() => {
                this.setState({
                    renderedProjects: renderedProjects,
                    projects: projects,
                    semesters: semesters,
                    isLoaded: true
                });
            }
        ).catch(error => {
            this.setState({error: error})
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
                <TableComponent data={this.state.renderedProjects}
                                columns={this.state.columns}
                                title={'Projects'}
                                renderData={this.renderData}
                                semesters={this.state.semesters}
                />
            );
        }

    }
}

export default (withSnackbar(Projects));
