import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import {withSnackbar} from "notistack";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import ReCaptchaV2 from 'react-google-recaptcha'
import {addEntity, getAllEntities} from "../../components/Services/mySqlServices";
import Autocomplete from "@material-ui/lab/Autocomplete";
import {levenshteinDistance} from "../../levenshtein_distance/LevenshteinDistance";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(2),
            width: '45ch',
            display: 'flex',
            flexWrap: 'wrap',
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(0, 0, 0, 0.6)" // (default alpha is 0.38)
        }
    },
});


class ProposeProject extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openCreateNewOrganization: false,
            newOrganization: {},
            open: this.props.open,
            organizations: [],
            similarOrganizations: [],
            newProject: {
                contactEmail: null,
                contactIsAdvisor: false,
                contactName: null,
                contactPhone: null,
                description: '',
                initiationDate: new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, ''),
                name: null,
                numOfSemesters: null,
                organizationId: null,
                academicAdvisorId: null,
                industrialAdvisorId: null,
                token: null
            },
            isLoaded: false,
            error: null
        };
        this.numOfSemesters = [{
            value: '2',
            label: '2'
        },
            {
                value: '1',
                label: '1'
            }]
    }

    handleCheck = (e) => {
        const project = {
            ...this.state.newProject,
            'contactIsAdvisor': e.target.checked
        };
        this.setState({newProject: project});
        this.forceUpdate();
    };

    handleChangeAutocomplete = (e, value) => {
        let project = {...this.state.newProject};
        if (value === null) {
            project.organizationId = null;
        } else {
            let organization = this.state.organizations.filter(obj => {
                return obj.id === value.id
            });
            project.organizationId = organization[0]
        }
        this.setState({newProject: project});
    };


    handleChange = (e) => {
        const project = {
            ...this.state.newProject,
            [e.target.name]: e.target.value
        };

        this.setState({newProject: project});
        this.forceUpdate();


    };
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

    handleAddProjectRequest = (organiztionId = null) => {
        let newProject = {...this.state.newProject};
        if (organiztionId) {
            newProject.organizationId = organiztionId;
        } else {
            newProject.organizationId = newProject.organizationId.id;
        }
        addEntity(newProject, 'projectProposals')
            .then((response) => {
                newProject.id = response;
                this.setState({
                    newProject: newProject
                });
                this.props.enqueueSnackbar("Project Proposal Created", {variant: 'success'});
                this.handleClose();
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    handleAddRequest = (e) => {
        if (this.state.newProject.token !== null) {
            e.preventDefault();
            if (!this.state.newOrganization.name) {
                this.handleAddProjectRequest();
            } else {
                let promises = [];
                let organiztionId = null;
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
                                organiztionId = response;
                                let organizations = [...this.state.organizations];
                                organizations.unshift(organizationObj);
                                this.setState({
                                    organizations: organizations,
                                    newOrganization: organizationObj,
                                });
                            })
                    );
                    Promise.all(promises).then(() => {
                        this.handleAddProjectRequest(organiztionId);
                    }).catch(error => {
                        this.setState({error: error});
                    })
                }
            }
        } else {
            e.preventDefault();
            alert('please verify captcha')
        }
    };

    handleClose = () => {
        this.setState({open: false});
        window.history.back();
    };


    componentDidMount() {
        getAllEntities('organizations')
            .then((response) => {
                this.setState({
                    organizations: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});
        });

    }

    render() {
        const {classes} = this.props;

        const openCreateNewOrganization = () => {
            this.setState({openCreateNewOrganization: true});
        };
        const closeCreateNewOrganization = () => {
            this.setState({openCreateNewOrganization: false, newOrganization: {}});
        };


        const handleToken = (token) => {
            let newProject = {...this.state.newProject};
            newProject.token = token;
            this.setState({newProject: newProject});
        };

        const handleExpire = () => {
            let newProject = {...this.state.newProject};
            newProject.token = null;
            this.setState({newProject: newProject});
        };
        const {error, isLoaded} = this.state;
        if (error) {
            console.log(error);
            return <div/>;
        } else if (!isLoaded) {
            return (<div/>);
        } else {
            return (
                <div>
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
                        <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">
                            Fill Project's Details </DialogTitle>
                        <DialogContent>
                            <Paper elevation={3} style={{padding: '2%'}}>
                                <Grid
                                    justify="center"
                                    alignItems="stretch" container spacing={5}
                                    className={classes.selectFields}
                                >
                                    <Grid item xs={6}>
                                        <TextField
                                            onChange={this.handleChange}
                                            required
                                            id="name"
                                            name="name"
                                            label='Project Name'
                                            value={this.state.newProject.name ? this.state.newProject.name : ''}
                                        />
                                        <TextField
                                            id="description"
                                            name="description"
                                            label="Description"
                                            placeholder="Description"
                                            multiline
                                            value={this.state.newProject.description ? this.state.newProject.description : ''}
                                            onChange={this.handleChange}
                                        />
                                        {this.state.openCreateNewOrganization ?
                                            <>
                                                <TextField
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
                                                    required
                                                    name="description"
                                                    label="Organization Description"
                                                    placeholder="Description"
                                                    multiline
                                                    value={this.state.newOrganization.description ? this.state.newOrganization.description : ""}
                                                    onChange={this.handleChangeOrganization}
                                                />
                                                <Button onClick={closeCreateNewOrganization}
                                                        color="primary">
                                                    Choose From Existing Organizations List
                                                </Button>
                                            </>
                                            :
                                            <div style={{display: "block", textAlign: "center"}}>
                                                <Autocomplete
                                                    onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'organization')}
                                                    value={this.state.newProject.organizationId}
                                                    options={this.state.organizations ? this.state.organizations : []}
                                                    getOptionLabel={(option) => (option ? option.name : '')}
                                                    getOptionSelected={(option, value) => (option.id === value.id)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} fullWidth variant="standard"
                                                                   label="Organization"
                                                                   required/>
                                                    )}
                                                    filterSelectedOptions
                                                    autoHighlight
                                                />
                                                <Button onClick={openCreateNewOrganization}
                                                        color="primary">
                                                    New Organization
                                                </Button>
                                            </div>}
                                        <TextField
                                            onChange={this.handleChange}
                                            required
                                            id="numOfSemesters"
                                            name="numOfSemesters"
                                            label='Number Of Semesters'
                                            select
                                            value={this.state.newProject.numOfSemesters ? this.state.newProject.numOfSemesters : ''}
                                        >
                                            {this.numOfSemesters.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            onChange={this.handleChange}
                                            id="contactName"
                                            name="contactName"
                                            label='Contact Name'
                                            value={this.state.newProject.contactName ? this.state.newProject.contactName : ""}
                                        />
                                        <FormControlLabel
                                            labelPlacement="end"
                                            label='This contact is an advisor'
                                            control={
                                                <Checkbox
                                                    checked={this.state.newProject.contactIsAdvisor ? this.state.newProject.contactIsAdvisor : false}
                                                    color="primary"
                                                    onChange={this.handleCheck}
                                                />}
                                        />

                                        <TextField
                                            onChange={this.handleChange}
                                            id="contactPhone"
                                            name="contactPhone"
                                            label='Contact Cell Phone'
                                            value={this.state.newProject.contactPhone ? this.state.newProject.contactPhone : ""}
                                        />
                                        <TextField
                                            onChange={this.handleChange}
                                            id="contactEmail"
                                            name="contactEmail"
                                            label='Contact Email'
                                            value={this.state.newProject.contactEmail ? this.state.newProject.contactEmail : ""}
                                        />
                                    </Grid>
                                </Grid>
                                <div style={{textAlign: '-webkit-center'}}>
                                    <ReCaptchaV2
                                        sitekey={process.env.REACT_APP_SITE_KEY}
                                        onChange={handleToken}
                                        onExpired={handleExpire}
                                    />
                                    <div style={{margin: "1%", width: "25%"}}>
                                        <Button
                                            onClick={this.handleAddRequest}
                                            variant="contained" color="primary">
                                            Submit
                                        </Button>
                                    </div>
                                </div>
                            </Paper>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(ProposeProject));
