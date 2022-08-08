import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Autocomplete from "@material-ui/lab/Autocomplete";
import validator from 'validator'
import CircularProgress from "@material-ui/core/CircularProgress";
import TeamLink from "../TeamLink/TeamLink"
import ProjectLink from "../ProjectLink/ProjectLink"
import { getAllEntities } from '../../../Services/mySqlServices';
import { withSnackbar } from "notistack";
import { editUser } from '../../../Services/usersService';

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(0,0,0,0.78)" // (default alpha is 0.38)
        },
        "& .MuiFormLabel-root.Mui-disabled": {
            color: "rgba(0,0,0,0.78)" // (default alpha is 0.38)
        }
    },
});


class UserLinkContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            semesters: null,
            courses: null,
            organizations: null,
            data: this.props.userDetails,
            error: null,
            isLoaded: false,
            teamLinkOpen: false,
            projectLinkOpen: false
        };
        this.type = [
            {
                value: 'student',
                label: 'student'
            }, {
                value: 'advisor',
                label: 'advisor'
            }];
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
                value: 'academic',
                label: 'academic'
            },
            {
                value: 'industrial',
                label: 'industrial'
            },
            {
                value: 'both',
                label: 'both'
            }];
        this.faculty = [{ value: 'IE', label: 'IE' }, { value: 'CS', label: 'CS' }]
    };

    componentDidMount() {
        let promises = []
        let user = { ...this.props.userDetails };
        if (!this.props.courses) {
            promises.push(getAllEntities('courses')
                .then((response) => {
                    user.courseId = response.filter(obj => {
                        return obj.id === user.courseId
                    })[0];
                    this.setState({ courses: response })
                }))
        }
        if (!this.props.semesters) {
            promises.push(getAllEntities('semesters')
                .then((response) => {
                    user.semesterId = response.filter(obj => {
                        return obj.id === user.semesterId
                    })[0];
                    this.setState({ semesters: response })
                }))

        }
        if (!this.props.organizations) {
            promises.push(getAllEntities('organizations')
                .then((response) => {
                    user.organizationId = response.filter(obj => {
                        return obj.id === user.organizationId
                    })[0];
                    this.setState({ organizations: response })
                }))
        }
        Promise.all(promises).then(() => {
            this.setState({ isLoaded: true, data: user });
        }).catch((error) => {
            this.setState({ error: error })
        })

    }

    handleChangeAutocomplete = (e, value, label) => {
        let data = { ...this.state.data };
        if (label === 'organization') {
            data.organizationId = value;
        } else if (label === 'course') {
            data.courseId = value;
        } else if (label === 'semester') {
            data.semesterId = value;
        }
        this.setState({ data: data });
    };

    handleChangeSelections = (e) => {
        let data = {
            ...this.state.data,
            [e.target.name]: e.target.value
        };
        if (e.target.name === 'user_type' && e.target.value === 'advisor' && this.state.organizations === undefined) {
            this.setState({ isLoaded: false });
            getAllEntities('organizations')
                .then((response) => {
                    data.organizationId = response.filter(obj => {
                        if (typeof data.organizationId === 'object' && data.organizationId !== null) {
                            return obj.id === data.organizationId.id
                        } else {
                            return obj.id === data.organizationId
                        }
                    })[0];
                    this.setState({
                        organizations: response,
                        isLoaded: true,
                    });
                }).catch((error) => {
                    this.setState({ error: error });
                })
        }
        if (e.target.name === 'user_type' && e.target.value === 'student') {
            this.setState({ isLoaded: false });
            let promises = [];
            promises.push(
                getAllEntities('courses')
                    .then((response) => {
                        data.courseId = response.filter(obj => {
                            if (typeof data.courseId === 'object' && data.courseId !== null) {
                                return obj.id === data.courseId.id
                            } else {
                                return obj.id === data.courseId
                            }
                        })[0];
                        this.setState({ courses: response })
                    }));
            promises.push(
                getAllEntities('semesters')
                    .then((response) => {
                        data.semesterId = response.filter(obj => {
                            if (typeof data.semesterId === 'object' && data.semesterId !== null) {
                                return obj.id === data.semesterId.id
                            } else {
                                return obj.id === data.semesterId
                            }
                        })[0];
                        this.setState({ semesters: response })
                    }));
            Promise.all(promises).then(() => {
                this.setState({ isLoaded: true });
            }).catch(error => this.setState({ error: error }));
        }
        this.setState({ data: data });
        this.forceUpdate()
    };

    /**
     * Function that updates data's properties with given value.
     * @param    {Object} e-Event object
     */
    handleChange = (e) => {
        const data = {
            ...this.state.data,
            [e.target.name]: e.target.value
        };

        this.setState({ data: data });
        this.forceUpdate();


    };
    handleUpdate = (e) => {
        e.preventDefault();
        let data = { ...this.state.data };
        if (!validator.isEmail(data.email)) {
            alert('Please enter valid Email!')
        } else {
            this.setState({ isLoaded: false });
            data.organizationId = data.organizationId ? data.organizationId.id : null;
            data.courseId = data.courseId ? data.courseId.id : null;
            data.semesterId = data.semesterId ? data.semesterId.id : null;
            delete data.projectId;
            return editUser(data)
                .then((response) => {
                    this.props.enqueueSnackbar("You Updated " + data.engFirstName + ' ' + data.engLastName, { variant: 'success' });
                    this.setState({ isLoaded: true });
                }).catch((error) => {
                    this.setState({ error: error });
                    return Promise.reject(error);
                });
        }
    };

    handleTeamLinkClose = () => {
        this.setState({ teamLinkOpen: false });
    };

    handleProjectLinkClose = () => {
        this.setState({ projectLinkOpen: false });
    };

    checkIid = () => {
        if (!(this.state.data) || !(this.state.data.id)) return true;
        var sID = String(this.state.data.id);
        if ((sID.length !== 9) || (isNaN(sID))) return true;
        var counter = 0, incNum;
        for (var i = 0; i < 9; i++) {
            incNum = Number(sID.charAt(i));
            incNum *= (i % 2) + 1;
            if (incNum > 9) incNum -= 9;
            counter += incNum;
        }
        return !(counter % 10 === 0);
    }

    render() {
        const { error, isLoaded } = this.state;
        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (!isLoaded) {
            return (
                <div style={{ textAlign: 'center' }}>
                    <CircularProgress />
                </div>);
        } else {
            const { classes } = this.props;
            return (

                <div className={classes.selectFields}>
                    <form onSubmit={this.handleUpdate}>
                        <Grid container spacing={3} justify="center">
                            <Grid item className={classes.selectFields} xs={12} sm={12}
                                style={{ marginLeft: '35%', marginRight: '35%' }}>
                                <TextField
                                    onChange={this.handleChangeSelections}
                                    required
                                    name="user_type"
                                    label='User Type'
                                    select
                                    value={this.state.data.user_type}
                                >
                                    {
                                        this.type.map((option) => (
                                            <MenuItem key={option.label} value={option.label}>
                                                {option.label}
                                            </MenuItem>
                                        ))
                                    }
                                </TextField>
                                {this.state.data.user_type === 'advisor' ?
                                    <TextField
                                        onChange={this.handleChangeSelections}
                                        required
                                        name="advisorType"
                                        label='Advisor Type'
                                        select
                                        value={this.state.data.advisorType}
                                    >
                                        {this.advisorType.map((option) => (
                                            <MenuItem key={option.label} value={option.label}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField> : ""}
                            </Grid>
                            <Grid item className={classes.selectFields} xs={6} sm={6}>
                                <TextField
                                    onChange={this.handleChangeSelections}
                                    required
                                    name="prefix"
                                    label='Prefix'
                                    select
                                    value={this.state.data.prefix}
                                >
                                    {
                                        this.prefix.map((option) => (
                                            <MenuItem key={option.label} value={option.label}>
                                                {option.label}
                                            </MenuItem>
                                        ))
                                    }
                                </TextField>
                                <TextField
                                    required
                                    onChange={this.handleChange}
                                    name="engFirstName"
                                    label='First Name (in English)'
                                    value={this.state.data.engFirstName}
                                />
                                <TextField
                                    required
                                    onChange={this.handleChange}
                                    name="engLastName"
                                    label='Last Name (in English)'
                                    value={this.state.data.engLastName}
                                />
                                <TextField
                                    required
                                    onChange={this.handleChange}
                                    name="hebFirstName"
                                    label='First Name (in Hebrew)'
                                    value={this.state.data.hebFirstName}
                                />
                                <TextField
                                    required
                                    onChange={this.handleChange}
                                    name="hebLastName"
                                    label='Last Name (in Hebrew)'
                                    value={this.state.data.hebLastName}
                                />
                            </Grid>
                            <Grid item className={classes.selectFields} xs={6} sm={6}>
                                <TextField
                                    required
                                    onChange={this.handleChange}
                                    name="id"
                                    label='ID'
                                    InputProps={{
                                        inputProps: {
                                            type: "text",
                                            maxLength: 9, minLength: 9
                                        }
                                    }}
                                    error={this.checkIid()}
                                    value={this.state.data.id}
                                />
                                <TextField
                                    required
                                    type="text"
                                    onChange={this.handleChange}
                                    name="email"
                                    label='Email'
                                    value={this.state.data.email}
                                />
                                <TextField
                                    required
                                    onChange={this.handleChange}
                                    name="cellPhone"
                                    label='Cell Phone'
                                    InputProps={{
                                        inputProps: {
                                            type: "text",
                                            maxLength: 10, minLength: 10
                                        }
                                    }}
                                    error={(this.state.data && this.state.data.id && this.state.data.cellPhone.length && this.state.data.cellPhone.length >= 10) ? false : true}
                                    value={this.state.data.cellPhone}
                                />
                                {this.state.data.user_type === 'advisor' ?
                                    <div>
                                        <TextField
                                            onChange={this.handleChange}
                                            name="workPhone"
                                            label='WorkPhone'
                                            InputProps={{
                                                inputProps: {
                                                    type: "text",
                                                    maxLength: 10, minLength: 9
                                                }
                                            }}
                                            error={this.state.data.workPhone && !(0 === this.state.data.workPhone.length || 9 === this.state.data.workPhone.length || this.state.data.workPhone.length === 10)}

                                            value={this.state.data.workPhone}
                                        />
                                        <Autocomplete
                                            onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'organization')}
                                            value={this.state.data.organizationId}
                                            options={this.state.organizations ? this.state.organizations : []}
                                            getOptionLabel={(option) => (option ? option.name : '')}
                                            getOptionSelected={(option, value) => (option.id === value.id)}
                                            renderInput={(params) => (
                                                <TextField {...params} fullWidth variant="standard"
                                                    label="Organization" required />
                                            )}
                                            filterSelectedOptions
                                            autoHighlight
                                        />
                                    </div>

                                    : ''}

                                {
                                    this.state.data.user_type === 'student' ?
                                        <div>
                                            <TextField
                                                onChange={this.handleChangeSelections}
                                                required
                                                name="faculty"
                                                label='Faculty'
                                                select
                                                value={this.state.data.faculty}
                                            >
                                                {this.faculty.map((option) => (
                                                    <MenuItem key={option.label} value={option.label}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            <Autocomplete
                                                onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'course')}
                                                value={this.state.data.courseId}
                                                options={this.state.courses ? this.state.courses : []}
                                                getOptionLabel={(option) => (option ? option.name : '')}
                                                getOptionSelected={(option, value) => (option.id === value.id)}
                                                renderInput={(params) => (
                                                    <TextField {...params} fullWidth variant="standard"
                                                        label="Course" required />
                                                )}
                                                filterSelectedOptions
                                                autoHighlight
                                            />
                                            <Autocomplete
                                                onChange={(e, value) => this.handleChangeAutocomplete(e, value, 'semester')}
                                                value={this.state.data.semesterId}
                                                options={this.state.semesters ? this.state.semesters : []}
                                                getOptionLabel={(option) => (option ? option.title : '')}
                                                getOptionSelected={(option, value) => (option.id === value.id)}
                                                renderInput={(params) => (
                                                    <TextField {...params} fullWidth variant="standard"
                                                        label="Semester" required />
                                                )}
                                                filterSelectedOptions
                                                autoHighlight
                                            />
                                            <Button name="teamId"
                                                onClick={() => this.setState({ teamLinkOpen: true })}>Team Id: {this.state.data.teamId}</Button>
                                            <Button name="projectId"
                                                onClick={() => this.setState({ projectLinkOpen: true })}>Project Id: {this.state.data.projectId}</Button>
                                        </div> : ''
                                }
                            </Grid>
                        </Grid>
                        <div style={{
                            position: 'sticky',
                            textAlign: 'center',
                            bottom: '0',
                            padding: '10px'
                        }}>
                            <Button
                                variant="contained" color="primary"
                                type="submit"
                            >
                                Update
                            </Button>
                        </div>
                    </form>
                    <TeamLink teamLinkOpen={this.state.teamLinkOpen} handleTeamLinkClose={this.handleTeamLinkClose} teamId={this.state.data.teamId} />
                    <ProjectLink projectLinkOpen={this.state.projectLinkOpen} handleProjectLinkClose={this.handleProjectLinkClose} projectId={this.state.data.projectId} />
                </div>
            );
        }
    }
}

export default (withStyles(styles, { withTheme: true })(withSnackbar(UserLinkContent)));
