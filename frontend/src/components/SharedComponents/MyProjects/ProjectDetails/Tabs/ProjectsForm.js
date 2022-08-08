import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import CloseIcon from "@material-ui/icons/Close";
import RequestDelay from "./NewDelayRequestForm/NewDelayRequestForm";
import DialogContent from "@material-ui/core/DialogContent";
import Paper from "@material-ui/core/Paper";
import {addEntity, getAllEntities, getEntitiesByIDs} from "../../../../Services/mySqlServices";
import {getUsersByType} from "../../../../Services/usersService";
import ThumbUpAltIcon from '@material-ui/icons/ThumbUpAlt';
import ThumbDownAltIcon from '@material-ui/icons/ThumbDownAlt';
import Autocomplete from "@material-ui/lab/Autocomplete";
import {connect} from "react-redux";
import {levenshteinDistance} from "../../../../../levenshtein_distance/LevenshteinDistance"
import Typography from "@material-ui/core/Typography";
import ShowMoreText from "react-show-more-text";
import axios from "axios";
import {withSnackbar} from "notistack";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(0,0,0,0.65)" // (default alpha is 0.38)
        },
        "& .MuiFormLabel-root.Mui-disabled": {
            color: "rgba(0,0,0,0.65)" // (default alpha is 0.38)
        }
    },
});


class ProjectsForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formStatus: null,
            userDetails: this.props.userDetails,
            editFlag: this.props.editFlag,
            viewMoreFlag: this.props.viewMoreFlag,
            aproveRejectProject: this.props.aproveRejectProject,
            currentEditableProject: this.props.currentEditableProject,
            projects: this.props.data,
            industrialAdvisors: [],
            academicAdvisors: [],
            organizations: [],
            similarOrganizations: [],
            teams: [],
            onUpdate: this.props.onUpdate,
            onAdd: this.props.onAdd,
            onSend: this.props.onSend,
            isLoaded: false,
            openRequestDisplay: false,
            openCreateNewOrganization: false,
            newOrganization: {},
            emailMessage: ''
        };
        this.status = [{
            value: 'Active',
            label: 'Active'
        },
            {
                value: 'Available',
                label: 'Available'
            },
            {
                value: 'Complete',
                label: 'Complete'
            },
            {
                value: 'On Hold',
                label: 'On Hold'
            }];
        this.numOfSemesters = [{
            value: '2',
            label: '2'
        },
            {
                value: '1',
                label: '1'
            }]
    }


    componentDidMount() {
        let usersEndpoints = {
            industrialAdvisors: 'industrial',
            academicAdvisors: 'academic',
        };
        let advisorsPromises = [];
        let promises = [];
        for (const key in usersEndpoints) {
            advisorsPromises.push(
                getUsersByType(usersEndpoints[key])
                    .then((response) => {
                        this.setState({
                            [key]: response,
                        });
                    }));
        }
        promises.push(
            Promise.all(advisorsPromises).then(() => {
                getUsersByType('both')
                    .then((response) => {
                        let academicAdvisors = [...this.state.academicAdvisors];
                        let industrialAdvisors = [...this.state.industrialAdvisors];
                        academicAdvisors = academicAdvisors.concat(response);
                        industrialAdvisors = industrialAdvisors.concat(response);
                        this.setState({
                            industrialAdvisors: industrialAdvisors,
                            academicAdvisors: academicAdvisors
                        })
                    })
            }));
        let organization_promises = [];
        if (typeof this.state.currentEditableProject.organizationId === "object" && this.state.currentEditableProject.organizationId !== null) {
            if (!('id' in this.state.currentEditableProject.organizationId)) {
                organization_promises.push(
                    addEntity(this.state.currentEditableProject.organizationId, 'organizations')
                        .then((response) => {
                            let currentEditableProject = {...this.state.currentEditableProject};
                            currentEditableProject.organizationId.id = response;
                            this.setState({currentEditableProject: currentEditableProject})
                        }));
            }
        }
        promises.push(
            Promise.all(organization_promises).then(() => {
                getAllEntities('organizations')
                    .then((response) => {
                        this.setState({
                            organizations: response
                        });
                    })
            }));
        if (this.state.viewMoreFlag) {
            const teamObj = {ids: [this.state.currentEditableProject.teamId]};
            promises.push(getEntitiesByIDs(teamObj, 'retrieve/teams', true).then(response => {
                let project = {...this.state.currentEditableProject};
                let team = response[0];
                project.teamId = team ? team : null;
                this.setState({
                    currentEditableProject: project,
                    teams: response
                });
            }))
        } else {
            promises.push(getAllEntities('teams')
                .then((response) => {
                    let project = {...this.state.currentEditableProject};
                    let team = response.filter(obj => {
                        return obj.id === this.state.currentEditableProject.teamId
                    });
                    project.teamId = team[0] ? team[0] : null;
                    this.setState({
                        currentEditableProject: project,
                        teams: response
                    });
                }))
        }
        Promise.all(promises).then(() => {
            this.setState({isLoaded: true});
        }).catch(error => this.setState({error: error}));

    };

    hanldeChangeFormStatus = (status) => {
        this.setState({formStatus: status});
    };

    submitForm = (e) => {
        e.preventDefault();
        if (this.state.formStatus === 'approve') {
            this.handleApproveProject(e)
        } else if (this.state.formStatus === 'reject') {
            this.handleRejectProject(e)

        } else if (this.state.formStatus === 'submit') {
            this.handleSubmit(e)
        }
        this.setState({formStatus: null})
    };


    handleCheck = (e) => {
        let project = {...this.state.currentEditableProject};
        project.contactIsAdvisor = e.target.checked;
        this.setState({currentEditableProject: project});
        this.forceUpdate();
    };

    /**
     * Changes selected property of currentEditableProject to value passed by user to autocomplete component
     * @param e
     * @param value
     * @param name
     */
    handleChangeAutocomplete = (e, value, name) => {
        let project = {...this.state.currentEditableProject};
        if (name === 'organization') {
            if (value === null) {
                project.organizationId = null;
            } else {
                let organization = this.state.organizations.filter(obj => {
                    return obj.id === value.id
                });
                project.organizationId = organization[0];
            }
        } else if (name === 'academicAdvisor') {
            if (value === null) {
                project.academicAdvisorId = null;
            } else {
                let academicAdvisor = this.state.academicAdvisors.filter(obj => {
                    return obj.firebase_user_id === value.firebase_user_id
                });
                project.academicAdvisorId = academicAdvisor[0];
            }

        } else if (name === 'industrialAdvisor') {
            if (value === null) {
                project.industrialAdvisorId = null;
            } else {
                let industrialAdvisor = this.state.industrialAdvisors.filter(obj => {
                    return obj.firebase_user_id === value.firebase_user_id
                });
                project.industrialAdvisorId = industrialAdvisor[0];
            }
        } else if (name === 'team') {
            if (value === null) {
                project.teamId = null;
            } else {
                let team = this.state.teams.filter(obj => {
                    return obj.id === value.id
                });
                project.teamId = team[0];
            }
        }
        this.setState({currentEditableProject: project});
    };
    /**
     * Function that updates currentEditableProject's properties with given value.
     * @param    {Object} e-Event object
     */
    handleChange = (e) => {
        const project = {
            ...this.state.currentEditableProject,
            [e.target.name]: e.target.value
        };
        this.setState({currentEditableProject: project});
        this.forceUpdate();
    };

    changeEmailMessage = (e) => {
        this.setState({emailMessage: e.target.value})
    };

    /**
     * Checks if organization selected by user already exists, creates new if needed.
     * Calls to handleRequest for project submission  or update.
     * @param e - Event object
     */
    handleSubmit = (e) => {
        e.preventDefault();
        if (!this.state.newOrganization.name) {
            this.handleRequest();
        } else {
            let promises = [];
            let organizationObj = this.state.newOrganization;
            let exists = false;
            for (let org of this.state.organizations) {
                if (org.name === organizationObj.name) {
                    exists = true;
                    break
                }
            }
            if (exists) {
                alert('There is an organization with the same name, as the one you trying to add')
            } else {
                promises.push(
                    //create new organization if user selectes new one.
                    addEntity(organizationObj, 'organizations')
                        .then((response) => {
                            organizationObj.id = response;
                            let organizations = [...this.state.organizations];
                            organizations.unshift(organizationObj);
                            this.setState({
                                organizations: organizations,
                                newOrganization: organizationObj,
                            });
                        })
                );
                Promise.all(promises).then(() => {
                    this.handleRequest(organizationObj);
                }).catch(error => {
                    this.setState({error: error});
                })
            }
        }
    };

    checkIfTeamAlreadyAssigned(teamId, projectId) {
        if (teamId) {
            const team = this.state.teams.filter(obj => {
                return parseInt(obj.id) === parseInt(teamId.id)
            })[0];
            if (team && team.projectId && team.projectId !== projectId) {
                alert('This team already assigned to project #' + team.projectId);
                return true
            }
        }
        return false
    }

    /**
     * Calls to onUpdate or onAdd functions depending on if selected project already exists or has to be created in db.
     * @param organization
     */
    handleRequest = (organization = null) => {
        let newProject = {...this.state.currentEditableProject};
        if (organization) {
            newProject.organizationId = organization;
        }
        if (!this.checkIfTeamAlreadyAssigned(newProject.teamId, newProject.id)) {
            if (!(this.state.editFlag || this.state.viewMoreFlag)) {
                this.state.onAdd(newProject);
            } else {
                this.state.onUpdate(newProject);
            }
            this.state.onSend();
        }
    };

    handleOpenRequestDisplay = () => {
        this.setState({openRequestDisplay: true})
    };
    handleCloseRequestDisplay = () => {
        this.setState({openRequestDisplay: false})
    };
    handleCloseEmailDisplay = (e, sendWithputMessage = false) => {
        this.setState({openEmailModal: false});
        if (sendWithputMessage) {
            this.setState({formStatus: 'reject'});
            this.handleRejectProject(e)
        }
    };
    sendEmail = (e) => {
        let genericMessage =
            "<br> You have received this message because you are listed as a project contact.<br>";
        let formData = new FormData();
        formData.append("receivers", this.state.currentEditableProject.contactEmail);
        formData.append("subject", 'Rejection of ' + this.state.currentEditableProject.name + ' project');
        formData.append("message", this.state.emailMessage + genericMessage);
        return axios.post('/sendEmail', formData)
            .then(response => response.data)
            .then(result => {
                if (result['status'] === 'success') {
                    this.props.enqueueSnackbar('Email Sent Successfully', {variant: 'success'});
                    this.setState({formStatus: 'reject', openEmailModal: false});
                    this.handleRejectProject(e);
                    return Promise.resolve(result['message']);
                } else {
                    this.props.enqueueSnackbar('Error Occured While Sending Email', {variant: 'error'});
                    return Promise.reject(result['message']);
                }

            })
            .catch(error => {
                return Promise.reject(error);
            });
    };

    handleApproveProject = (e) => {
        e.preventDefault();
        let approvedProject = {...this.state.currentEditableProject};
        approvedProject.approvedRequestsIds = null;
        approvedProject.lastVerified = null;
        approvedProject.academicAdvisorId = approvedProject.academicAdvisorId ? approvedProject.academicAdvisorId.firebase_user_id : null;
        approvedProject.industrialAdvisorId = approvedProject.industrialAdvisorId ? approvedProject.industrialAdvisorId.firebase_user_id : null;
        approvedProject.teamId = approvedProject.teamId ? approvedProject.teamId.id : null;
        delete approvedProject.organizationName;
        if (approvedProject.organizationId) {
            approvedProject.organizationId = approvedProject.organizationId.id;
        }

        if (!this.state.newOrganization.name) {
            this.props.approveProject(approvedProject, this.state.currentEditableProject);
            this.props.handleClose();
        } else {
            let promises = [];
            let organizationObj = this.state.newOrganization;
            let exists = false;
            for (let org of this.state.organizations) {
                if (org.name === organizationObj.name) {
                    exists = true;
                    break
                }
            }
            if (exists) {
                alert('There is an organization with the same name, as the one you trying to add')
            } else {
                promises.push(
                    //create new organization if user selectes new one.
                    addEntity(organizationObj, 'organizations')
                        .then((response) => {
                            organizationObj.id = response;
                            let organizations = [...this.state.organizations];
                            organizations.unshift(organizationObj);
                            this.setState({
                                organizations: organizations,
                                newOrganization: organizationObj,
                            });
                        })
                );
                Promise.all(promises).then(() => {
                    approvedProject.organizationId = organizationObj.id;
                    this.props.approveProject(approvedProject);
                    this.props.handleClose();
                }).catch(error => {
                    this.setState({error: error});
                })
            }
        }

    };

    handleRejectProject = (e) => {
        e.preventDefault();
        let rejectedProject = {...this.state.currentEditableProject};
        this.props.rejectProject(rejectedProject);
        this.props.handleClose();
    };

    /**
     * Changes new organization name and description. Also computes the ration between new organization name
     * and existing organizations using levenshteinDistance(), to notify user if there is organizations with similar name.
     * @param e
     */
    handleChangeOrganization = (e) => {
        const organizations = [...this.state.organizations];
        let similarOrganizations = [];
        for (let org of organizations) {
            const ratio = levenshteinDistance(org.name, e.target.value);
            if (ratio > 0.5) {
                org.ratio = ratio;
                if (org.name.includes(e.target.value)) {
                    org.ratio = 1
                }
                similarOrganizations.push(org)
            }
        }
        similarOrganizations = similarOrganizations.sort(function (a, b) {
            return b.ratio - a.ratio;
        }).splice(0, 5);


        const organization = {
            ...this.state.newOrganization,
            [e.target.name]: e.target.value
        };
        this.setState({newOrganization: organization, similarOrganizations: similarOrganizations});
        this.forceUpdate();
    };


    render() {
        const {classes} = this.props;
        const {error, isLoaded} = this.state;

        const openCreateNewOrganization = () => {
            this.setState({openCreateNewOrganization: true});
        };
        const closeCreateNewOrganization = () => {
            this.setState({openCreateNewOrganization: false, newOrganization: {}});
        };

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
                <div className={classes.selectFields}>
                    <Paper elevation={3} style={{padding: '15px'}}>
                        <form
                            id="projectForm"
                            onSubmit={this.submitForm}>
                            <Grid
                                justify="center"
                                alignItems="stretch" container spacing={5}
                            >
                                <Grid item md={6} xs={12}>
                                    <TextField
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        fullWidth
                                        onChange={this.handleChange}
                                        disabled={this.state.viewMoreFlag}
                                        required
                                        id="name"
                                        name="name"
                                        label='Project Name'
                                        value={this.state.currentEditableProject.name}
                                    />
                                    <TextField
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        fullWidth
                                        disabled={true}
                                        id="initiationDate"
                                        name="initiationDate"
                                        label='Initiation Date'
                                        value={this.state.currentEditableProject.initiationDate ? new Date(this.state.currentEditableProject.initiationDate).toISOString().slice(0, 10) : ''}
                                    />
                                    <TextField
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        fullWidth
                                        disabled={true}
                                        id="assignDate"
                                        name="assignDate"
                                        label='Assign Date'
                                        value={this.state.currentEditableProject.assignDate ? new Date(this.state.currentEditableProject.assignDate).toISOString().slice(0, 10) : ''}
                                    />
                                    <TextField
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        fullWidth
                                        disabled={true}
                                        id="endDate"
                                        name="endDate"
                                        label='End Date'
                                        value={this.state.currentEditableProject.endDate ? new Date(this.state.currentEditableProject.endDate).toISOString().slice(0, 10) : ''}
                                    />
                                    <Autocomplete
                                        onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'team')}
                                        value={this.state.currentEditableProject.teamId ? this.state.currentEditableProject.teamId : null}
                                        options={this.state.teams ? this.state.teams : []}
                                        getOptionLabel={(option) => (option ? option.id.toString() : '')}
                                        getOptionSelected={(option, value) => (parseInt(option.id) === parseInt(value.id))}
                                        renderInput={(params) => (
                                            <TextField
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}{...params} fullWidth variant="standard"
                                                label="Team"/>
                                        )}
                                        disabled={this.state.viewMoreFlag}
                                        filterSelectedOptions
                                        autoHighlight
                                    />
                                    {this.state.openCreateNewOrganization ?
                                        <>
                                            <TextField
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                onChange={this.handleChangeOrganization}
                                                required
                                                name="name"
                                                label='Organization Name'
                                                value={this.state.newOrganization.name ? this.state.newOrganization.name : ''}
                                            />
                                            {
                                                this.state.similarOrganizations.length !== 0 ?
                                                    <Paper style={{padding: '5%'}}>
                                                        <Typography style={{
                                                            color: '#3f51b5',
                                                            textAlign: "center"
                                                        }}>
                                                            Existing organizations with a similar name:
                                                        </Typography>
                                                        {
                                                            this.state.similarOrganizations.map(data => (
                                                                <p key={data.id} value={data.name}>{data.name}</p>
                                                            ))
                                                        }</Paper> : ''
                                            }

                                            <TextField
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                required
                                                name="description"
                                                label="Organization Description"
                                                placeholder="Description"
                                                multiline
                                                value={this.state.newOrganization.description ? this.state.newOrganization.description : ''}
                                                onChange={this.handleChangeOrganization}
                                            />
                                            <Button onClick={closeCreateNewOrganization}
                                                    color="primary">
                                                Choose From Existing Organizations List
                                            </Button>
                                        </>
                                        :
                                        <>
                                            <Autocomplete
                                                disabled={this.state.viewMoreFlag}
                                                onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'organization')}
                                                value={this.state.currentEditableProject.organizationId ? this.state.currentEditableProject.organizationId : null}
                                                options={this.state.organizations ? this.state.organizations : []}
                                                getOptionLabel={(option) => (option ? option.name : '')}
                                                getOptionSelected={(option, value) => (option.id === value.id)}
                                                renderInput={(params) => (
                                                    <TextField InputLabelProps={{
                                                        shrink: true,
                                                    }}{...params} fullWidth variant="standard"
                                                               label="Organization"
                                                               required/>
                                                )}
                                                filterSelectedOptions
                                                autoHighlight
                                            />
                                            {this.state.viewMoreFlag ? "" :
                                                <Button onClick={openCreateNewOrganization}
                                                        color="primary">
                                                    New Organization
                                                </Button>
                                            }
                                        </>}
                                    <TextField InputLabelProps={{
                                        shrink: true,
                                    }}
                                               fullWidth
                                               disabled={this.state.viewMoreFlag}
                                               name="status"
                                               id="status"
                                               select
                                               label="Project Status"
                                               value={this.state.currentEditableProject.status ? this.state.currentEditableProject.status : ''}
                                               onChange={this.handleChange}
                                               required
                                    >
                                        {this.status.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    {this.state.viewMoreFlag ?
                                        <div style={{margin: '8px', display: 'flex', flexWrap: 'wrap'}}>
                                            <div>
                                                Description
                                            </div>
                                            <div style={{padding: '6px 0 7px'}}>
                                                <ShowMoreText
                                                    lines={4}
                                                    more="Show more"
                                                    less="Show less"
                                                    expanded={false}
                                                    truncatedEndingComponent={"... "}>
                                                    {this.state.currentEditableProject.description}
                                                </ShowMoreText>
                                            </div>
                                        </div>
                                        :
                                        <TextField InputLabelProps={{
                                            shrink: true,
                                        }}
                                                   fullWidth
                                                   disabled={this.state.viewMoreFlag}
                                                   id="description"
                                                   name="description"
                                                   label="Description"
                                                   placeholder="Description"
                                                   multiline
                                                   value={this.state.currentEditableProject.description}
                                                   onChange={this.handleChange}
                                        />

                                    }
                                </Grid>
                                <Grid item md={6} xs={12}>
                                    <TextField InputLabelProps={{
                                        shrink: true,
                                    }}
                                               fullWidth
                                               disabled={this.state.viewMoreFlag}
                                               onChange={this.handleChange}
                                               id="numOfSemesters"
                                               name="numOfSemesters"
                                               label='Number Of Semesters'
                                               select
                                               required
                                               value={this.state.currentEditableProject.numOfSemesters ? this.state.currentEditableProject.numOfSemesters : ''}
                                    >
                                        {this.numOfSemesters.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <Autocomplete
                                        onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'academicAdvisor')}
                                        value={this.state.currentEditableProject.academicAdvisorId ? this.state.currentEditableProject.academicAdvisorId : null}
                                        options={this.state.academicAdvisors ? this.state.academicAdvisors : []}
                                        getOptionLabel={(option) => (option ? option.engFirstName + ' ' + option.engLastName : '')}
                                        getOptionSelected={(option, value) => {
                                            return option.firebase_user_id === value.firebase_user_id
                                        }}
                                        renderInput={(params) => (
                                            <TextField InputLabelProps={{
                                                shrink: true,
                                            }}{...params} fullWidth variant="standard"
                                                       label="Academic Advisor"/>
                                        )}
                                        disabled={this.state.viewMoreFlag}
                                        filterSelectedOptions
                                        autoHighlight
                                    />
                                    <Autocomplete
                                        onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'industrialAdvisor')}
                                        value={this.state.currentEditableProject.industrialAdvisorId ? this.state.currentEditableProject.industrialAdvisorId : null}
                                        options={this.state.industrialAdvisors ? this.state.industrialAdvisors : []}
                                        getOptionLabel={(option) => (option ? option.engFirstName + ' ' + option.engLastName : '')}
                                        getOptionSelected={(option, value) => {
                                            return option.firebase_user_id === value.firebase_user_id
                                        }}
                                        renderInput={(params) => (
                                            <TextField InputLabelProps={{
                                                shrink: true,
                                            }}{...params} fullWidth variant="standard"
                                                       label="Industrial Advisor"/>
                                        )}
                                        disabled={this.state.viewMoreFlag}
                                        filterSelectedOptions
                                        autoHighlight
                                    />
                                    <TextField InputLabelProps={{
                                        shrink: true,
                                    }}
                                               fullWidth
                                               disabled={this.state.viewMoreFlag}
                                               onChange={this.handleChange}
                                               id="contactName"
                                               name="contactName"
                                               label='Contact Name'
                                               value={this.state.currentEditableProject.contactName}
                                    />
                                    <FormControlLabel
                                        labelPlacement="end"
                                        label='This contact is an advisor'
                                        control={
                                            <Checkbox
                                                disabled={this.state.viewMoreFlag}
                                                checked={this.state.currentEditableProject.contactIsAdvisor ? this.state.currentEditableProject.contactIsAdvisor : false}
                                                color="primary"
                                                onChange={this.handleCheck}
                                            />}
                                    />

                                    <TextField InputLabelProps={{
                                        shrink: true,
                                    }}
                                               fullWidth
                                               disabled={this.state.viewMoreFlag}
                                               onChange={this.handleChange}
                                               id="contactPhone"
                                               name="contactPhone"
                                               label='Contact Phone'
                                               value={this.state.currentEditableProject.contactPhone}
                                    />
                                    <TextField InputLabelProps={{
                                        shrink: true,
                                    }}
                                               fullWidth
                                               disabled={this.state.viewMoreFlag}
                                               onChange={this.handleChange}
                                               id="contactEmail"
                                               name="contactEmail"
                                               label='Contact Email'
                                               value={this.state.currentEditableProject.contactEmail}
                                    />
                                    <Button
                                        style={{display: (this.state.userDetails && this.state.userDetails.user_type === 'student' && !this.props.adminViewRed) && this.state.viewMoreFlag ? "inline" : "none",}}
                                        variant="contained" color="primary" onClick={this.handleOpenRequestDisplay}>
                                        Request Delay
                                    </Button>

                                </Grid>
                            </Grid>
                        </form>
                        <div style={{textAlign: "center"}}>
                            <ButtonGroup orientation="vertical">
                                <Button
                                    type="submit"
                                    form="projectForm"
                                    style={{
                                        display: this.state.aproveRejectProject || this.state.viewMoreFlag || this.state.editFlag ? "none" : "inline",
                                    }}
                                    onClick={() => this.hanldeChangeFormStatus('submit')}
                                    variant="contained" color="primary"
                                >
                                    Add
                                </Button>
                                <Button
                                    type="submit"
                                    form="projectForm"
                                    style={{
                                        display: !this.state.aproveRejectProject && this.state.editFlag && !this.state.viewMoreFlag ? "inline" : "none",
                                    }}
                                    onClick={() => this.hanldeChangeFormStatus('submit')}
                                    variant="contained" color="primary"
                                >
                                    Update
                                </Button>
                            </ButtonGroup>
                            {this.state.aproveRejectProject ?
                                <ButtonGroup>
                                    <Button
                                        type="submit"
                                        form="projectForm"
                                        startIcon={<ThumbUpAltIcon/>}
                                        onClick={() => this.hanldeChangeFormStatus('approve')}
                                        variant="contained"
                                        color="primary">
                                        Approve
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="projectForm"
                                        startIcon={<ThumbDownAltIcon/>}
                                        // onClick={() => this.hanldeChangeFormStatus('reject')}
                                        onClick={() => this.setState({openEmailModal: true})}
                                        variant="contained"
                                        color="primary">
                                        Reject
                                    </Button>
                                </ButtonGroup>
                                : ''}
                        </div>
                    </Paper>
                    <Dialog
                        fullWidth={true}
                        maxWidth={'sm'}
                        open={this.state.openRequestDisplay} onClose={this.handleCloseRequestDisplay}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleCloseRequestDisplay}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <RequestDelay
                                projectId={this.state.currentEditableProject.id}
                                onSend={this.handleCloseRequestDisplay}
                                userDetails={this.state.userDetails}
                            />
                        </DialogContent>
                    </Dialog>
                    <Dialog
                        fullWidth={true}
                        maxWidth={'sm'}
                        open={this.state.openEmailModal} onClose={this.handleCloseEmailDisplay}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleCloseEmailDisplay}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <Typography style={{margin: '5%'}} variant="subtitle1">
                                <strong>{this.state.currentEditableProject.contactName}</strong> can be notified by
                                email of the project rejection.
                                To do this, enter the message and press the "Send Email" button. To reject without
                                reporting, press the "Skip" button
                            </Typography>
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                multiline
                                variant="outlined"
                                fullWidth
                                onChange={this.changeEmailMessage}
                                id="message"
                                name="message"
                                label='Message'
                                value={this.state.emailMessage}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                autoFocus
                                onClick={(event) => this.handleCloseEmailDisplay(event,true)}
                                color="primary">
                                Skip
                            </Button>
                            <Button
                                autoFocus
                                onClick={this.sendEmail}
                                color="primary">
                                Send Email
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            )
                ;
        }
    }

}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(ProjectsForm)));