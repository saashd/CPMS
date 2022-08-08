import React from 'react';
import TableComponent from "./TableComponent";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../../Services/mySqlServices";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

export default class NewProposals extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            newProjectProposals: [],
            renderedProjects: [],
            columns: [
                {
                    title: 'Project Name',
                    field: 'name',
                },
                {
                    title: 'Number of Semesters',
                    field: 'numOfSemesters',
                },
                {
                    title: 'Description',
                    field: 'description',
                    hidden: true
                },
                {
                    title: 'Organization',
                    field: 'organizationName',

                },
                {
                    title: 'Initiation Date',
                    field: 'initiationDate',
                    type: 'datetime',
                    render: rowData => {
                        if (rowData.initiationDate) {
                            return new Date(rowData.initiationDate).toLocaleDateString("en-US")
                        } else {
                            return null
                        }
                    }
                }
            ]
        };

    }

    /**
     * Function that adds additional properties to existing project's properties for feature display in material-table
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
        }
        return projects;
    };

    componentDidMount() {
        getAllEntities('projectProposals')
            .then((response) => {
                let renderedProjects = this.renderData(response);
                this.setState({
                    renderedProjects: renderedProjects,
                    newProjectProposals: response,
                    isLoaded: true
                });
            }).catch((error) => {
            this.setState({error: error});
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
                                title={'Proposed Projects'}
                                renderData={this.renderData}
                />
            );
        }

    }
}
