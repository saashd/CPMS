import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {withSnackbar} from "notistack";

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


class ChangePassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            onUpdate: this.props.onUpdate,
            onSend: this.props.onSend,
            data: this.props.userDetails,
            oldPassword: null,
            newPassword: null,
            newPasswordVerification: null
        };
    };


    handleChange = (e) => {
        if (e.target.name === 'newPassword') {
            this.setState({newPassword: e.target.value})
        } else if (e.target.name === 'newPasswordVerification') {
            this.setState({newPasswordVerification: e.target.value})
        } else if (e.target.name === 'oldPassword') {
            this.setState({oldPassword: e.target.value})
        }
        this.forceUpdate();


    };
    handleUpdate = (e) => {
        e.preventDefault();

        if (this.state.oldPassword !== this.state.data.password) {
            this.props.enqueueSnackbar('Old Password is incorrect', {variant: 'error'});
        } else {
            if (this.state.newPasswordVerification !== this.state.newPassword) {
                this.props.enqueueSnackbar('Mismatch in passwords', {variant: 'error'});
            } else {
                const data = {
                    ...this.state.data,
                    ['password']: this.state.newPassword
                };
                this.setState({data: data});
                this.state.onUpdate(data);
                this.state.onSend();

            }

        }
    };

    render() {
        const {classes} = this.props;
        return (
            <div className={classes.selectFields}>
                <Grid style={{
                    paddingLeft: '25%',
                }}
                      justify="center"
                      alignItems="stretch" container spacing={0}
                >
                    < Grid item sm={12}>
                        <TextField
                            required={true}
                            onChange={this.handleChange}
                            type="password"
                            name="oldPassword"
                            label='Old password'
                            value={this.state.data.oldPassword}
                        />
                        <TextField
                            required={true}
                            onChange={this.handleChange}
                            type="password"
                            name="newPassword"
                            label='New password'
                            value={this.state.newPassword}
                        />
                        <TextField
                            required={true}
                            onChange={this.handleChange}
                            type="password"
                            name="newPasswordVerification"
                            label='Confirm New Password'
                            value={this.state.newPasswordVerification}
                        />
                    </Grid>
                    <div style={{
                        position: 'absolute',
                        right: '0',
                        bottom: '0'}}>
                        <Button
                            onClick={this.handleUpdate}
                            variant="contained" color="primary">
                            Update
                        </Button>
                    </div>
                </Grid>
            </div>
        );
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(ChangePassword));
