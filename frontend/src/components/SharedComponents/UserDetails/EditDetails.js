import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Autocomplete from "@material-ui/lab/Autocomplete";
import validator from 'validator'


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


class EditDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            organizations: this.props.organizations,
            organizationId: {...this.props.userDetails.organizationId},
            onUpdate: this.props.onUpdate,
            onSend: this.props.onSend,
            data: this.props.userDetails,
            error: null,
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
        this.faculty = [{value: 'IE', label: 'IE'}, {value: 'CS', label: 'CS'}]
    };


    handleChangeAutocomplete = (e, value) => {
        let data = {...this.state.data};
        if (value === null) {
            this.setState({organizationId: null});
            data.organizationId = {};
        } else {
            let organization = this.state.organizations.filter(obj => {
                return obj.id === value.id
            });
            data.organizationId = organization[0];
            this.setState({organizationId: organization[0]});
        }
        this.setState({data: data});
    };

    handleChangeSelections = (e) => {
        let data = {...this.state.data};
        if (e.target.name === 'faculty') {
            data = {
                ...this.state.data,
                [e.target.name]: e.target.value
            };
        } else if (e.target.name === 'prefix') {
            data = {
                ...this.state.data,
                [e.target.name]: e.target.value
            };
        }
        this.setState({data: data});
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

        this.setState({data: data});
        this.forceUpdate();


    };
    handleUpdate = (e) => {
        e.preventDefault();
        let data = {...this.state.data};
        if (!validator.isEmail(data.email)) {
            alert('Enter valid Email!')
        } else {
            if (data.organizationId === {} || data.organizationId === null || data.organizationId === undefined) {
                data.organizationId = null;
            } else {
                data.organizationId = data.organizationId.id;
            }
            delete data.projectId;
            this.state.onUpdate(data);
            this.state.onSend();
        }
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
    };

    render() {
        const {classes} = this.props;
        return (

            <div className={classes.selectFields}>
                <form onSubmit={this.handleUpdate}>
                    <Grid container spacing={3} justify="center">
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
                                /> : ''}
                            {this.state.data.user_type === 'advisor' ?
                                <Autocomplete
                                    disabled={this.state.viewMoreFlag}
                                    onChange={(e, value) => this.handleChangeAutocomplete(e, value)}
                                    value={this.state.organizationId}
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
                                : ''}

                            {
                                this.state.data.user_type === 'student' ?
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
                                    </TextField> : ''
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
                            type={'submit'}
                            variant="contained" color="primary"
                        >
                            Update
                        </Button>
                    </div>
                </form>
            </div>
        );
    }
}


export default (withStyles(styles, {withTheme: true})(EditDetails));
