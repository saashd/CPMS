import React from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import {getUsersByType} from "../../../../Services/usersService";
import CircularProgress from "@material-ui/core/CircularProgress";
import {withSnackbar} from "notistack";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    options: {
        fontSize: 15,
        '& > span': {
            marginRight: 10,
            fontSize: 18,
        }
    },
});


class AdminForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            error: null,
            nonAdmins: null,
            onUpdate: this.props.onUpdate,
            onSend: this.props.onSend,
            onAdd: this.props.onAdd,
            admins: ''
        };
    }


    /**
     * Function changes is_admin porperty of new admins, and replaces existing 'admins' array
     * @param    {Object} e-Event object
     * @param    {Object} adminsArr array of admin objects.
     */
    handleChange = (e, adminsArr) => {
        for (let user of adminsArr) {
            user.is_admin = true;
        }
        this.setState({admins: adminsArr});
    };

    /**
     * Function that calls onUpdate (handleEditAccess function from Admin.js)  function to update admins properties in existing 'admins' array
     * @param    {Object} e-Event object
     */
    handleAdd = (e) => {
        e.preventDefault();
        const admins = this.state.admins;
        let adminsNames = [];
        let promises = [];
        for (let newAdmin of admins) {
            const adminData = {'firebase_user_id': newAdmin.firebase_user_id, 'is_admin': true};
            promises.push(
                this.state.onUpdate(adminData).then(r => {
                    adminsNames.push(newAdmin.engFirstName + ' ' + newAdmin.engLastName)
                })
            )
        }
        Promise.all(promises).then(() => {
            let AdminsNameStr = adminsNames.join(' ');
            this.props.enqueueSnackbar("Permissions  given to " + AdminsNameStr, {variant: 'success'});
        }).catch(error => this.setState({error: error}));
        this.props.handleClose()
    };

    componentDidMount() {
        getUsersByType('not admin')
            .then((response) => {
                this.setState({
                    nonAdmins: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    }


    render() {
        const {classes} = this.props;
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
                <div>
                    <Autocomplete
                        onChange={this.handleChange}
                        style={{width: 'full'}}
                        options={
                            this.state.nonAdmins
                        }
                        classes={{
                            option: classes.option,
                        }}
                        autoHighlight
                        multiple={true}
                        getOptionLabel={option => '[' + option.id + '] ' + option.engFirstName + ' ' + option.engLastName}

                        renderOption={option => (
                            <React.Fragment>
                                <p>[{option.id}]</p>&nbsp;&nbsp;
                                <p style={{fontWeight: 'bold'}}>{option.engFirstName} {option.engLastName}</p>
                                &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                                <p> {option.cellPhone} {option.email}</p>

                            </React.Fragment>
                        )}
                        renderInput={params => (
                            <TextField
                                {...params}
                                label="Choose users"
                                variant="outlined"
                                fullWidth
                                inputProps={{
                                    ...params.inputProps,
                                    autoComplete: 'disabled', // disable autocomplete and autofill
                                }}
                            />

                        )}
                    />
                    <Button style={{
                        marginTop: '5%',
                        left: '35%',
                        paddingLeft: '15%',
                        paddingRight: '15%'
                    }}
                            onClick={this.handleAdd}
                            variant="contained" color="primary"
                    >
                        Add
                    </Button>
                </div>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(AdminForm));
