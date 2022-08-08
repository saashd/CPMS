import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import {withStyles} from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import {addEntity, getAllEntities} from "../../components/Services/mySqlServices";
import {connect} from "react-redux";
import firebase from 'firebase/app'
import CircularProgress from "@material-ui/core/CircularProgress";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Copyright from "../../components/SharedComponents/Copyright/Copyright";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import axios from "axios";
import validator from "validator";


const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            width: '35ch',
            display: 'flex',
            flexWrap: 'wrap',
            marginLeft: '20%'
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(0, 0, 0, 0.6)" // (default alpha is 0.38)
        }
    },
    root: {
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '50vh',
        paddingLeft: "10%",
        paddingRight: "10%",
    },

    title: {
        fontFamily: 'monospace',
        color: '#33364d',
        fontWeight: 'bolder',
        marginTop: "-20px",
        marginBottom: "15px",
        display: 'table',
        margin: 'auto',
    },
    footer: {
        padding: theme.spacing(1, 1),
        marginTop: 'auto',
        position: 'fixed',
        width: '100%',
        left: 0,
        bottom: 0,
    },
    button: {
        float: 'right',
        margin: theme.spacing(7.5, 7.5, 0, 0),
    },
});


class FillAdvisorDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userDetails: null,
            openCreateNewOrganization: false,
            newOrganization: {},
            open: this.props.open,
            organizations: [],
            formData: null,
            isLoaded: false,
            error: null,
            loading: false
        };
        this.prefix = [
            {
                value: 'Ms',
                label: 'Ms'
            },
            {
                value: 'Mr',
                label: 'Mr'
            },
            {
                value: 'Prof',
                label: 'Prof'
            },
            {
                value: 'Dr',
                label: 'Dr'
            }];
        this.advisorType = [
            {
                value: 'both',
                label: 'Both'
            },
            {
                value: 'industrial',
                label: 'Industrial'
            },
            {
                value: 'academic',
                label: 'Academic'
            }];
    }

    handleChangeAutocomplete = (e, value) => {
        let formData = {...this.state.formData};
        let organization = null;
        if (value) {
            organization = this.state.organizations.filter(obj => {
                return obj.id === value.id
            });
        }
        formData.organizationId = organization[0];
        this.setState({formData: formData});
    };
    handleChangeSelections = (e) => {
        let formData = {
            ...this.state.formData,
            [e.target.name]: e.target.value
        };
        this.setState({formData: formData});
        this.forceUpdate()
    };


    handleChange = (e) => {
        const formData = {
            ...this.state.formData,
            [e.target.name]: e.target.value
        };

        this.setState({formData: formData});
        this.forceUpdate();


    };
    handleChangeOrganization = (e) => {
        const organization = {
            ...this.state.newOrganization,
            [e.target.name]: e.target.value
        };
        this.setState({newOrganization: organization});
        this.forceUpdate();


    };

    handleAddAdvisor = (organiztionId = null) => {
        let formData = {...this.state.formData};
        if (organiztionId) {
            formData.organizationId = organiztionId;
        } else {
            formData.organizationId = formData.organizationId.id;
        }
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true)
            .then(idToken => {
                formData.firebase_user_id = this.state.userDetails.uid;
                formData.is_admin = false;
                formData.user_type = 'advisor';
                axios.post("/createUser/" + this.state.userDetails.uid, JSON.stringify(formData))
                    .then(response => {
                        window.location.reload();
                        this.props.history.push("/");
                        return Promise.resolve(response['status']);
                    })
                    .catch(error => {
                        return Promise.reject(error)
                    });
            }).catch(error => {
            return Promise.reject(error);
        });
    };

    checkIid = (s) => {
        var sID = String(s);
        if ((sID.length !== 9) || (isNaN(sID))) return false;
        var counter = 0, incNum;
        for (var i = 0; i < 9; i++) {
            incNum = Number(sID.charAt(i));
            incNum *= (i % 2) + 1;
            if (incNum > 9) incNum -= 9;
            counter += incNum;
        }
        return (counter % 10 === 0);
    }

    handleSubmit = (e) => {
        e.preventDefault();
        let formData = {...this.state.formData};
        if (!validator.isEmail(formData.email)) {
            alert('Enter valid Email!')
        } else if (!this.checkIid(formData.id)) {
            alert('Enter valid Id!');
        } else if (formData.cellPhone.length !== 10) {
            alert('Enter valid Cell Phone Number!');
        } else if (!(formData.workPhone.length === 0 || formData.workPhone.length === 9 || formData.workPhone.length === 10)) {
            alert('Enter valid Work Phone Number!');
        } else {
            //create new organization if user added.
            if (!this.state.newOrganization.name) {
                this.setState({loading: true});
                this.handleAddAdvisor();
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
                        this.setState({loading: true});
                        this.handleAddAdvisor(organiztionId);
                    }).catch(error => {
                        this.setState({loading: false});
                        this.setState({error: error});
                    })
                }
            }
            this.handleClose();
        }
    };

    handleClose = () => {
        this.setState({open: false});
    };


    componentDidMount() {
        getAllEntities('organizations')
            .then((response) => {
                const userDetails = JSON.parse(this.props.userRed);
                let formData = {
                    engFirstName: '',
                    engLastName: '',
                    hebFirstName: '',
                    hebLastName: '',
                    id: '',
                    email: '',
                    cellPhone: '',
                    workPhone: '',
                    organizationId: null,
                    prefix: ''
                };
                formData.engFirstName = userDetails.displayName.split(/ (.+)/)[0];
                formData.engLastName = userDetails.displayName.split(/ (.+)/)[1];
                formData.email = userDetails.email;
                this.setState({
                    userDetails: userDetails,
                    formData: formData,
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
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: "15%"
                }}>
                    <CircularProgress size="8rem"/>
                </div>);
        } else {
            return (
                <div>
                    <div>
                        <img alt="cpms_logo" height="150" width="150" style={{margin: 10}}
                             src="resources/icon_cpms.png"/>
                        <Button
                            variant="contained"
                            color="primary"
                            className={classes.button}
                            onClick={() => firebase.auth().signOut()}
                            endIcon={<ExitToAppIcon/>}
                        > Go back</Button>
                    </div>
                    <Typography className={classes.title} variant="h4">
                        Seems like you are new here..
                    </Typography>
                    <Typography className={classes.title} variant="h6">
                        Advisors Form
                    </Typography>
                    <Paper style={{width: "50%", padding: "1%", marginLeft: "25%"}}>
                        <Typography style={{textAlign: "center"}} variant="h6">
                            Please fill the following fields:
                        </Typography>
                        <form onSubmit={this.handleSubmit}>
                            <Grid container style={{textAlign: 'center', overflow: 'auto'}}>
                                <Grid item className={classes.selectFields} xs={6} sm={6}>
                                    <TextField
                                        onChange={this.handleChange}
                                        required
                                        id="engFirstName"
                                        name="engFirstName"
                                        label='First name in English'
                                        value={this.state.formData.engFirstName}
                                    />
                                    <TextField
                                        onChange={this.handleChange}
                                        required
                                        id="engLastName"
                                        name="engLastName"
                                        label='Last name in English'
                                        value={this.state.formData.engLastName}
                                    />
                                    <TextField
                                        onChange={this.handleChange}
                                        required
                                        id="hebFirstName"
                                        name="hebFirstName"
                                        label='First name in Hebrew'
                                        value={this.state.formData.hebFirstName}
                                    />
                                    <TextField
                                        onChange={this.handleChange}
                                        required
                                        id="hebLastName"
                                        name="hebLastName"
                                        label='Last name in Hebrew'
                                        value={this.state.formData.hebLastName}
                                    />
                                    <TextField
                                        onChange={this.handleChange}
                                        required
                                        type={'number'}
                                        id="id"
                                        name="id"
                                        label='Id Number'
                                        InputProps={{
                                            inputProps: {
                                                type: "number",
                                                maxLength: 9, minLength: 9
                                            }
                                        }}
                                        error={!(this.state.formData.id.length === 9)}
                                        value={this.state.formData.id}
                                    />
                                    <TextField
                                        type="text"
                                        onChange={this.handleChange}
                                        required
                                        id="email"
                                        name="email"
                                        label='Email'
                                        autoComplete="new-password"
                                        value={this.state.formData.email}
                                    />
                                </Grid>
                                <Grid item className={classes.selectFields} xs={6} sm={6}>
                                    <TextField
                                        onChange={this.handleChange}
                                        required
                                        maxLength={14}
                                        minLength={10}
                                        id="cellPhone"
                                        name="cellPhone"
                                        label='Mobile phone number'
                                        InputProps={{
                                            inputProps: {
                                                type: "number",
                                                maxLength: 10, minLength: 10
                                            }
                                        }}
                                        error={this.state.formData.cellPhone.length !== 10}
                                        value={this.state.formData.cellPhone}
                                    />
                                    <TextField
                                        onChange={this.handleChange}
                                        id="workPhone"
                                        name="workPhone"
                                        label='Work phone number'
                                        InputProps={{
                                            inputProps: {
                                                type: "number",
                                                maxLength: 10, minLength: 9
                                            }
                                        }}
                                        error={!(0 === this.state.formData.workPhone.length || 9 === this.state.formData.workPhone.length || this.state.formData.workPhone.length === 10)}

                                        value={this.state.formData.workPhone}
                                    />
                                    <TextField
                                        onChange={this.handleChangeSelections}
                                        required
                                        id="prefix"
                                        name="prefix"
                                        label='Prefix'
                                        select
                                        value={this.state.formData.prefix}
                                    >{
                                        this.prefix.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))
                                    }
                                    </TextField>
                                    <TextField
                                        onChange={this.handleChangeSelections}
                                        required
                                        id="advisorType"
                                        name="advisorType"
                                        label='Advisor Type'
                                        select
                                        value={this.state.formData.advisorType ? this.state.formData.advisorType : ''}
                                    >{
                                        this.advisorType.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))
                                    }
                                    </TextField>
                                    {this.state.openCreateNewOrganization ?
                                        <>
                                            <TextField
                                                onChange={this.handleChangeOrganization}
                                                required
                                                name="name"
                                                label='Organization Name'
                                                value={this.state.newOrganization.name ? this.state.newOrganization.name : ''}
                                            />
                                            <TextField
                                                required
                                                name="description"
                                                label="Organization Description"
                                                placeholder="Description"
                                                multiline
                                                variant="outlined"
                                                value={this.state.newOrganization.description ? this.state.newOrganization.description : ""}
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
                                                onChange={(e, value) => this.handleChangeAutocomplete(e, value)}
                                                value={this.state.formData.organizationId}
                                                options={this.state.organizations ? this.state.organizations : []}
                                                getOptionLabel={(option) => (option ? option.name : '')}
                                                getOptionSelected={(option, value) => (option.id === value.id)}
                                                renderInput={(params) => (
                                                    <TextField {...params} fullWidth variant="standard"
                                                               label="Organization" required/>
                                                )}
                                                filterSelectedOptions
                                                autoHighlight
                                            />
                                            <Button onClick={openCreateNewOrganization}
                                                    color="primary">
                                                New Organization
                                            </Button>
                                        </>}
                                </Grid>
                                <Grid item xs={12} style={{textAlign: '-webkit-center', margin: "2%"}}>
                                    <div>
                                        <Button type={'submit'}
                                                variant="contained"
                                                color="primary"
                                                disabled={this.state.loading}>
                                            {this.state.loading && <CircularProgress size={14}/>}&nbsp;
                                            Submit
                                        </Button>
                                    </div>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>

                    <footer className={classes.footer}>
                        <Container maxWidth="md">
                            <Copyright/>
                        </Container>
                    </footer>
                </div>
            );
        }
    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(FillAdvisorDetails));
