import React from 'react';
import MaterialTable from 'material-table';
import {getAllEntities} from "../../Services/mySqlServices";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import {connect} from "react-redux";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import CircularProgress from "@material-ui/core/CircularProgress";

class PendingProjectsProposals extends React.Component {
    constructor() {
        super();
        this.state = {
            userDetials: null,
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
                    title: 'Academic Advisor',
                    field: 'academicAdvisorName',
                },
                {
                    title: 'Industrial Advisor',
                    field: 'industrialAdvisorName',
                },
                {
                    title: 'Organization',
                    field: 'organizationName',
                },
                {
                    title: 'Date of Request',
                    field: 'initiationDate',
                    type: 'date',
                    render: rowData => {
                        if (rowData.initiationDate) {
                            return new Date(rowData.initiationDate).toLocaleDateString("en-US")
                        } else {
                            return null
                        }
                    },
                },
                {
                    title: 'Description',
                    field: 'description',
                },

            ],
            renderedProjects: null,
        };

    }

    /**
     * Function that appends to each project object additional parsed fields to match future display
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
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        let projects = null;
        let userDetails = null;
        let promises = [];
        promises.push(getUsersByFireBaseIDs(obj).then(result => {
            const user = result[userRed.uid];
            userDetails = user;
        }));

        promises.push(getAllEntities('projectProposals')
            .then((response) => {
                projects = response;

            }));
        Promise.all(promises).then(() => {
            let pendingProjects = projects.filter(obj => {
                if (obj.academicAdvisorId && 'firebase_user_id' in obj.academicAdvisorId) {
                    return obj.academicAdvisorId.firebase_user_id === userDetails.firebase_user_id
                } else if (obj.industrialAdvisorId && 'firebase_user_id' in obj.industrialAdvisorId) {
                    return obj.industrialAdvisorId.firebase_user_id === userDetails.firebase_user_id
                }
            });
            let renderedProjects = this.renderData(pendingProjects);
            this.setState({
                userRed: userRed,
                userDetails: userDetails,
                renderedProjects: renderedProjects,
                isLoaded: true
            });

        }).catch((error) => {
            this.setState({error: error});
        });
    }


    render() {

        const tableRef = React.createRef();
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
            return <div style={{textAlign: 'center', paddingTop: "15%"}}>
                <CircularProgress size="8rem"/>
            </div>;
        } else {
            return (

                <div style={{padding: '2%'}}>
                    {this.state.renderedProjects.length !== 0 ?
                        <div>
                            <div
                                dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                            <MaterialTable id={Math.floor(Math.random() * 11)}
                                           tableRef={tableRef}
                                           title={
                                               <Typography variant="h6" component="h2">
                                                   Project Requests <mark>Pending for Approval</mark>
                                               </Typography>

                                           }
                                           columns={this.state.columns}
                                           data={this.state.renderedProjects}
                                           options={{
                                               paging: false,
                                               sorting: true,
                                               actionsColumnIndex: -1,
                                               headerStyle: {
                                                   backgroundColor: '#3f51b5',
                                                   color: '#FFF'
                                               }

                                           }}
                            />
                        </div>
                        :  <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '3%'}}>
                                <Typography
                                    style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                                    No pending projects under your supervision
                                </Typography>
                            </Paper>}
                </div>
            )
        }
    }
}


const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};

export default connect(mapStateToProps)(PendingProjectsProposals);
