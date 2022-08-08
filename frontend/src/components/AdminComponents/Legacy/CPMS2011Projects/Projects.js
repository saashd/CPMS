import React from 'react';
import TableComponent from "./TableComponent";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../Services/mySqlServices";
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
            columns: [
                {
                    title: 'Project ID',
                    field: 'id',
                },
                {
                    title: 'Project Name',
                    field: 'name',
                },
                {
                    title: 'Number of Semesters',
                    field: 'numOfSemesters',
                    hidden: true,
                    export: true,
                },
                {
                    title: 'Academic Advisor Id',
                    field: 'academicAdvisorId',
                },
                {
                    title: 'Industrial Advisor Id',
                    field: 'industrialAdvisorId',
                },
                {
                    title: 'Description',
                    field: 'description',
                    hidden: true,
                    export: true,
                },
                {
                    title: 'organization Name',
                    field: 'organizationName',

                },

                {
                    title: 'Status',
                    field: 'status',

                },
                {
                    title: 'Assigned Team',
                    field: 'teamId',
                },
                {
                    title: 'Initiation Date',
                    field: 'initiationDate',
                    type: 'date',
                    render: rowData => {
                        if (rowData.initiationDate) {
                            return new Date(rowData.initiationDate).toLocaleDateString("en-US")
                        } else {
                            return null
                        }
                    }
                },
                {
                    title: 'Assign Date',
                    field: 'assignDate',
                    type: 'date',
                    render: rowData => {
                        if (rowData.assignDate) {
                            return new Date(rowData.assignDate).toLocaleDateString("en-US")
                        } else {
                            return null
                        }
                    }
                },
                {
                    title: 'End Date',
                    field: 'endDate',
                    type: 'date',
                    render: rowData => {
                        if (rowData.endDate) {
                            return new Date(rowData.endDate).toLocaleDateString("en-US")
                        } else {
                            return null
                        }
                    }
                },
                {
                    title: 'Contact Name',
                    field: 'contactName'
                },
                {
                    title: 'Contact Phone',
                    field: 'contactPhone'
                },
                {
                    title: 'Contact Email',
                    field: 'contactEmail'
                },
                {
                    title: 'Contact Is Advisor',
                    field: 'contactIsAdvisor'
                }
            ]
        };

    }


    componentDidMount() {
        getAllEntities('projects_cpms2011')
            .then((response) => {
                this.setState({
                    projects: response,
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
                <TableComponent data={this.state.projects}
                                columns={this.state.columns}
                                title={'Projects from CPMS2011 System'}
                />
            );
        }

    }
}

export default Projects
