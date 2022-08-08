import React from 'react';
import MaterialTable from "material-table";
import Icon from "@material-ui/core/Icon";
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import ProjectsForm from "../../../../SharedComponents/MyProjects/ProjectDetails/Tabs/ProjectsForm"
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DialogTitle from "@material-ui/core/DialogTitle";
import ProjectDetails from "../../../../SharedComponents/MyProjects/ProjectDetails/ProjectDetails"
import {addEntity, editEntity, removeEntity} from "../../../../Services/mySqlServices";
import {getUsersByFireBaseIDs} from "../../../../Services/usersService";
import {connect} from "react-redux";
import {withSnackbar} from "notistack";
import tableConfig from "../../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import FilterListIcon from '@material-ui/icons/FilterList';
import TextField from "@material-ui/core/TextField";
import {getTime, parseISO} from 'date-fns';
import MenuItem from "@material-ui/core/MenuItem";
import TeamLink from '../../../Links/TeamLink/TeamLink';
import ProjectLink from '../../../Links/ProjectLink/ProjectLink';


class TableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userDetails: null,
            open: false,
            projects: this.props.data,
            title: this.props.title,
            editFlag: false,
            viewMoreFlag: false,
            currentEditableProject: '',
            error: null,
            Date1: null, /* add state for starting date */
            Date2: null, /* add state for ending date */
            sortByDate:false,
            semesters: this.props.semesters,
            currSemester: null,
            clickedTeamId: null,
            clickedProjectId: null,
            teamLinkOpen: false,
            projectLinkOpen: false
        };
    }

    columns = [
        {
            title: 'Project ID',
            field: 'id',
            editable: 'never',
            render: rowData => rowData.id > 0 ? <Button onClick={() => this.setState({ clickedProjectId: rowData.id, projectLinkOpen: true })} >{rowData.id}</Button> : '---'
        },
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
            title: 'Status',
            field: 'status',
            validate: rowData => (rowData.status ? true : 'field can not be empty'),
            lookup: {
                'Active': 'Active',
                'Available': 'Available',
                'Complete': 'Complete',
                'On Hold': 'On Hold'
            },
        },
        {
            title: 'Assigned Team',
            field: 'teamId',
            render: rowData => rowData.teamId > 0 ? <Button onClick={() => this.setState({ clickedTeamId: rowData.teamId, teamLinkOpen: true })} >{rowData.teamId}</Button> : ''

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
            },
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
            },
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
            },
        },
        {
            title: 'Last Verified',
            field: 'lastVerified',
            type: 'date',
        },
        {
            title: "",
            field: "description",
            sorting: false,
            filtering: false,
            hidden: true,
            searchable: true,
            width: "0px"
        }

    ]

    /**
     * Function that removes unnecessary properties from project.(properties that were added in renderData function),
     * Then adds new project.
     * @param    {Object} newProjectObj- new project object
     * @return   error message or updated projects array.
     */
    handleProjectCreation(newProjectObj) {
        let unrenderedProject = {...newProjectObj};
        delete unrenderedProject.organizationName;
        delete unrenderedProject.industrialAdvisorName;
        delete unrenderedProject.academicAdvisorName;
        unrenderedProject.industrialAdvisorId = unrenderedProject.industrialAdvisorId ? unrenderedProject.industrialAdvisorId.firebase_user_id : null;
        unrenderedProject.academicAdvisorId = unrenderedProject.academicAdvisorId ? unrenderedProject.academicAdvisorId.firebase_user_id : null;
        unrenderedProject.organizationId = unrenderedProject.organizationId ? unrenderedProject.organizationId.id : null;
        unrenderedProject.teamId = unrenderedProject.teamId ? unrenderedProject.teamId.id : null;
        unrenderedProject.lastVerified = null;
        return addEntity(unrenderedProject, 'projects')
            .then((response) => {
                response.industrialAdvisorId = newProjectObj.industrialAdvisorId;
                response.academicAdvisorId = newProjectObj.academicAdvisorId;
                response.organizationId = newProjectObj.organizationId;
                // response.teamId = newProjectObj.teamId;
                let projects = [...this.state.projects];
                projects.unshift(response);
                let renderedProjects = this.props.renderData(projects);
                this.setState({
                    projects: renderedProjects,
                });
                this.props.enqueueSnackbar('Project Created Successfully', {variant: 'success'});
                return Promise.resolve(projects);
            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    };


    /**
     * Function that removes unnecessary properties from project.(properties that were added in renderData function),
     * Then updates existing project.
     * @param    {Object} projectObj- existing project object
     * @return   error message or updated projects array.
     */
    handleProjectUpdate(projectObj) {
        let unrenderedProject = {...projectObj};
        delete unrenderedProject.organizationName;
        delete unrenderedProject.industrialAdvisorName;
        delete unrenderedProject.academicAdvisorName;
        unrenderedProject.industrialAdvisorId = unrenderedProject.industrialAdvisorId ? unrenderedProject.industrialAdvisorId.firebase_user_id : null;
        unrenderedProject.academicAdvisorId = unrenderedProject.academicAdvisorId ? unrenderedProject.academicAdvisorId.firebase_user_id : null;
        unrenderedProject.organizationId = unrenderedProject.organizationId ? unrenderedProject.organizationId.id : null;
        unrenderedProject.teamId = unrenderedProject.teamId ? unrenderedProject.teamId.id : null;
        return editEntity(unrenderedProject, 'projects')
            .then((response) => {
                response.industrialAdvisorId = projectObj.industrialAdvisorId;
                response.academicAdvisorId = projectObj.academicAdvisorId;
                response.organizationId = projectObj.organizationId;
                let projects = [...this.state.projects];
                let i = projects.findIndex(obj => obj.id === projectObj.id);
                if (projects[i]) {
                    projects[i] = response
                }
                let renderedProjects = this.props.renderData(projects);
                this.setState({
                    projects: renderedProjects,
                });
                this.props.enqueueSnackbar('Project Updated Successfully', {variant: 'success'});
                return Promise.resolve(projects);

            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    }


    /**
     * Function that removes unnecessary properties from project.(properties that were added in renderData function),
     * Then removes existing project.
     * @param    {Object} projectObj- existing project object
     * @return   error message or updated projects array.
     */
    handleProjectDelete(projectObj) {
        return removeEntity(projectObj, 'projects').then((response) => {
            let projects = [...this.state.projects];
            let i = projects.findIndex(obj => obj.id === projectObj.id);
            projects.splice(i, 1);
            this.setState({
                projects: projects
            });
            this.props.enqueueSnackbar('Project Deleted Successfully', {variant: 'success'});
            return Promise.resolve(projects);
        }).catch((error) => {
            this.setState({error: error});
            return Promise.reject(error);
        });
    }

    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            this.setState({
                userRed: userRed,
                userDetails: result[userRed.uid],
                isLoaded: true
            });
        }).catch(error => {
            this.setState({error: error})
        });
    }

    handleChangeSemester = (e) => {
        let semesters = [...this.state.semesters];
        let selectedSemester = semesters.filter(c => {
            return c.id === e.target.value
        })[0];
        this.setState({currSemester: selectedSemester});
    };

    /**
     * Function that closes Projects Form Dialog or Project Details dialog
     * (Depends on if we want to view project's details or to update them)
     */
    handleClose = () => {
        this.setState({open: false, editFlag: false, viewMoreFlag: false, sortByDate: false});
    };


    myData = (e) => {  /* function to determine the data to be rendered to the table */
        // let myArr = [];
        // if (this.state.Date1 && this.state.Date2) {
        //     const formatted_start_date = getTime(parseISO(this.state.Date1))
        //     const formatted_end_date = getTime(parseISO(this.state.Date2))
        //     this.state.projects.map((item) => {
        //             const formatted_assignDate = Date.parse(item.assignDate)
        //             return formatted_assignDate >= formatted_start_date && formatted_assignDate <= formatted_end_date ? myArr?.push(item) : null
        //         }
        //     );
        // } else {
        //     myArr = this.state.projects;
        // }
        //
        // return myArr;
        let myArr = [];
        if (this.state.currSemester) {
            let selectedSemester = {...this.state.currSemester}
            const formatted_start_date = getTime(parseISO(selectedSemester.startDate))
            const formatted_end_date = getTime(parseISO(selectedSemester.endDate))
            this.state.projects.map((item) => {
                    const formatted_assignDate = Date.parse(item.assignDate);
                    return formatted_assignDate >= formatted_start_date && formatted_assignDate <= formatted_end_date ? myArr?.push(item) : null
                }
            );
        } else {
            myArr = this.state.projects;
        }

        return myArr;
    };

    handleTeamLinkClose = () => {
        this.setState({ teamLinkOpen: false, clickedTeamId: null });
    };

    handleProjectLinkClose = () => {
        this.setState({ projectLinkOpen: false, clickedProjectId: null });
    };

    render() {
        const tableRef = React.createRef();

        /**
         * Function that creates new project.
         */
        const handleAdd = () => {
            this.setState({
                open: true, editFlag: false,
                currentEditableProject: {
                    academicAdvisorId: null,
                    approvedRequestsIds: null,
                    assignDate: null,
                    contactEmail: null,
                    contactIsAdvisor: null,
                    contactName: null,
                    contactPhone: null,
                    description: '',
                    endDate: null,
                    industrialAdvisorId: null,
                    initiationDate: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                    name: null,
                    numOfSemesters: null,
                    organizationId: null,
                    status: null,
                    teamId: null,
                    organizationName: '',
                    academicAdvisorName: '',
                    industrialAdvisorName: '',

                },
            });
        };

        const actions = [
            {
                name: "create Project",
                icon: props => (
                    <Icon style={{fontSize: 40, color: '#009688'}}>add_circle</Icon>),
                tooltip: "create New Project",
                position: "toolbar",
                onClick: (handleAdd)
            },
            {
                name: "filter by assignDate",
                icon: props => (<FilterListIcon/>),
                tooltip: "Filter Projects by assignDate",
                position: "toolbar",
                onClick: () => {
                    this.setState({sortByDate: true})
                }
            },
            {
                name: "viewProject",
                icon: props => (<MoreVertIcon/>),
                tooltip: "View More",
                position: "row",
                onClick: (e, rowData) => {
                    let project = this.state.projects.find(obj => {
                        return obj.id === rowData.id
                    });
                    this.setState({
                        currentEditableProject: project, viewMoreFlag: true, editFlag: false
                    });
                }
            },
            {
                name: "editProject",
                icon: props => (<EditIcon style={{color: '#009688'}}/>),
                tooltip: "Edit Project",
                position: "row",
                onClick: (e, rowData) => {
                    let project = this.state.projects.find(obj => {
                        return obj.id === rowData.id
                    });
                    this.setState({
                        open: true, viewMoreFlag: false, editFlag: true,
                        currentEditableProject: project
                    });
                }
            },
        ];

        const {error} = this.state;
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
        } else {
            return (
                <>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={this.state.title}
                        columns={this.columns}
                        data={this.myData()}
                        icons={{
                            Delete: props => (<DeleteIcon style={{color: '#e91e63'}}/>)
                        }}
                        localization={{
                            body: {
                                deleteTooltip: 'Delete',
                                addTooltip: 'Add New Project',
                                editRow: {deleteText: 'Do you want to delete this project?'}
                            }
                        }}
                        editable={{
                            isEditable: rowData => {
                                return !!this.props.adminViewRed;
                            },
                            onRowDelete: this.props.adminViewRed ? oldData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleProjectDelete(oldData)
                                            .then(response => {
                                                this.setState({
                                                    projects: response,
                                                });
                                            })
                                            .catch(e => {
                                                this.props.enqueueSnackbar('Error occurred while deleting row', {variant: 'error'});
                                            });
                                        resolve()
                                    }, 1000)
                                }) : null,
                        }}
                        actions={this.props.adminViewRed ? actions : null}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.projects.length),
                            maxBodyHeight: 500,
                            tableLayout: "fixed",
                            columnResizable: true,
                            columnsButton: true,
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }

                        }}
                    />
                    <Dialog
                        fullWidth={true}
                        maxWidth={'md'}
                        open={this.state.open} onClose={this.handleClose}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleClose}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        {this.state.currentEditableProject ?
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project: {' '}
                                {this.state.currentEditableProject.id} </DialogTitle>
                            : ''
                        }

                        <DialogContent>
                            <ProjectsForm
                                userDetails={this.state.userDetails}
                                onSend={this.handleClose}
                                data={this.state.projects}
                                currentEditableProject={this.state.currentEditableProject}
                                viewMoreFlag={this.state.viewMoreFlag}
                                editFlag={this.state.editFlag}
                                onUpdate={this.handleProjectUpdate.bind(this)}
                                onAdd={this.handleProjectCreation.bind(this)}

                            />
                        </DialogContent>
                    </Dialog>
                    <Dialog fullWidth={true}
                            maxWidth={'xl'}
                            open={this.state.viewMoreFlag} onClose={this.handleClose}
                            aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleClose}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        {this.state.currentEditableProject ?
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project: {' '}
                                {this.state.currentEditableProject.id} </DialogTitle>
                            : ''
                        }
                        <DialogContent>
                            <ProjectDetails
                                userDetails={this.state.userDetails}
                                onSend={this.handleClose}
                                data={this.state.projects}
                                currentEditableProject={this.state.currentEditableProject}
                                editFlag={this.state.editFlag}
                                viewMoreFlag={this.state.viewMoreFlag}
                                onUpdate={this.handleProjectUpdate.bind(this)}
                            />

                        </DialogContent>
                    </Dialog>

                    <Dialog
                        fullWidth={true}
                        maxWidth={'sm'}
                        open={this.state.sortByDate} onClose={this.handleClose}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleClose}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <Paper
                                elevation={3}
                                style={{
                                    margin: "10px auto",
                                    textAlign: "center",
                                    padding: "10px",
                                }}
                            >
                                <Typography variant="h6" align={'right'} color={"primary"}>
                                    :בחר סמסטר
                                </Typography>
                                <TextField
                                    style={{textAlign: 'center'}}
                                    size={'small'}
                                    onChange={this.handleChangeSemester}
                                    name="semester"
                                    select
                                    value={this.state.currSemester ? this.state.currSemester.id : ''}
                                >
                                    {this.state.semesters.map((option) => (
                                        <MenuItem key={option.id} value={option.id}>
                                            {option.title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {/*<Typography> Search by Date Range </Typography>*/}
                                {/*<TextField*/}
                                {/*    value={this.state.Date1}*/}
                                {/*    onChange={(e) => this.setState({Date1: e.target.value})}*/}
                                {/*    type="date"*/}
                                {/*    id="date"*/}
                                {/*    label='Start Date'*/}
                                {/*    InputLabelProps={{*/}
                                {/*        shrink: true,*/}
                                {/*    }}*/}
                                {/*    style={{margin: "10px"}}*/}
                                {/*/>*/}
                                {/*<TextField*/}
                                {/*    value={this.state.Date2}*/}
                                {/*    label='End Date'*/}
                                {/*    onChange={(e) => this.setState({Date2: e.target.value})}*/}
                                {/*    type="date"*/}
                                {/*    id="date"*/}
                                {/*    InputLabelProps={{*/}
                                {/*        shrink: true,*/}
                                {/*    }}*/}
                                {/*    style={{margin: "10px"}}*/}
                                {/*/>*/}
                                {/*<div>*/}
                                {/*    <Button*/}
                                {/*        onClick={() => {*/}
                                {/*            this.setState({Date1: null, Date2: null})*/}
                                {/*        }}*/}
                                {/*        variant="contained"*/}
                                {/*        color="primary">*/}
                                {/*        Clear*/}
                                {/*    </Button>*/}
                                {/*</div>*/}
                            </Paper>
                            <Button style={{left:'44%'}}
                                        onClick={() => {
                                            this.setState({currSemester: null})
                                        }}
                                        variant="contained"
                                        color="primary">
                                    Clear
                                </Button>
                        </DialogContent>
                    </Dialog>
                    <TeamLink
                        teamLinkOpen={this.state.teamLinkOpen}
                        handleTeamLinkClose={this.handleTeamLinkClose}
                        teamId={this.state.clickedTeamId}
                    />
                    <ProjectLink
                        projectLinkOpen={this.state.projectLinkOpen}
                        handleProjectLinkClose={this.handleProjectLinkClose}
                        projectId={this.state.clickedProjectId}
                    />
                </>
            )
        }
    }
}

const mapStateToProps = state => {
    return {
        adminViewRed: state['adminView'],
        userRed: state['user']
    }
};
export default connect(mapStateToProps)(withSnackbar(TableComponent));