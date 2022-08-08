import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import {withSnackbar} from "notistack";
import Grid from "@material-ui/core/Grid";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '45ch',
            display: 'flex',
            flexWrap: 'wrap',
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(0, 0, 0, 0.6)" // (default alpha is 0.38)
        }
    }

});


class SignInWithEmail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.open,
            userEmail: null,
            userPassword: null,
            error: null
        };
    }

    handleChange = (e) => {
        this.setState({[e.target.name]: e.target.value});
        this.forceUpdate();


    };
    handleLogInUser = () => {
        //TODO: check if there is user with such email and password.If so: sign in.Else: error.
        //    TODO: add option to restore password?


    };

    render() {
        const handleClose = () => {
            this.setState({open: false});
            window.history.back();
        };
        const {classes} = this.props;
        return (
            <div>
                <Dialog
                    fullWidth={true}
                    maxWidth={'sm'}
                    open={this.state.open} onClose={handleClose}
                    aria-labelledby="form-dialog-title">
                    <DialogActions>
                        <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose} color="primary">
                            <CloseIcon/>
                        </Button>
                    </DialogActions>
                    <DialogTitle style={{textAlign: 'center'}} id="form-dialog-title">
                        Welcome Back</DialogTitle>
                    <DialogContent style={{padding: '15%'}}>
                        <Grid
                            className={classes.selectFields}
                            justify="center"
                            alignItems="stretch" container spacing={5}
                        >
                            <TextField
                                onChange={this.handleChange}
                                required
                                id="userEmail"
                                name="userEmail"
                                label='Email'
                                value={this.state.userEmail}
                            />
                            <TextField
                                onChange={this.handleChange}
                                required
                                id="current-password"
                                name="userPassword"
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                value={this.state.userPassword}
                            />
                            <div style={{
                                position: 'absolute',
                                right: '30px',
                                bottom: '0'
                            }}>
                                <Button
                                    onClick={this.handleLogInUser}
                                    variant="contained" color="primary">
                                    Sign In
                                </Button>
                            </div>
                        </Grid>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(SignInWithEmail));
