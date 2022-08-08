import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CreatableSelect from 'react-select/creatable';
import {addEntity} from "../../../../../Services/mySqlServices";
import {withSnackbar} from "notistack";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

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


class NewDelayRequestForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            admins: null,
            userDetails: this.props.userDetails,
            onSend: this.props.onSend,
            subject: '',
            body: '',
            requestedDate: null,
            error: null
        };
        this.subjects = [
            {value: 'General Delay', label: 'General Delay'},
            {value: 'Request End Project Date Delay', label: 'Request End Project Date Delay'},
            {value: 'Presentation Absence', label: 'Presentation Absence'}

        ]
    };

    handleChange = (newValue: any, actionMeta: any) => {
        if (newValue) {
            this.setState({subject: newValue.value});
        } else {
            this.setState({subject: ''});
        }
    };
    handleInputChange = (inputValue: any, actionMeta: any) => {
    };
    handleChangeBody = (e) => {
        this.setState({body: e.target.value});
        this.forceUpdate();
    };

    handleChangeDate = (e) => {
        this.setState({requestedDate: e.target.value});
        this.forceUpdate();

    };

    handleSendRequest = (e) => {
        e.preventDefault();
        {
            let request = {
                projectId: this.props.projectId,
                studentId: this.state.userDetails.firebase_user_id,
                teamId: this.state.userDetails.teamId,
                subject: this.state.subject,
                body: this.state.body,
                requestedDate: this.state.requestedDate ? this.state.requestedDate.toLocaleString("en-CA", {hour12: false}).replace(/,/, '') : null,
                answeredDate: null,
                answer: null,
                status: null
            };
            addEntity(request, 'delayRequests')
                .then((response) => {
                    this.props.enqueueSnackbar('Request Sent Successfully', {variant: 'success'});
                }).catch((error) => {
                this.setState({error: error});
            });
        }
        this.state.onSend();

    };


    render() {
        const {error} = this.state;
        const {classes} = this.props;
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
                <div className={classes.selectFields}>
                    <Grid
                        container style={{
                        paddingLeft: '15%',
                        paddingRight: '15%',
                    }}
                        justify="center"
                        alignItems="stretch" spacing={0}
                    >
                        <Grid item sm={12}>
                            <TextField
                                disabled
                                name="teamId"
                                label='Team Number'
                                value={this.state.userDetails.teamId}
                            />
                            <TextField
                                disabled
                                name="userId"
                                label='User ID'
                                value={this.state.userDetails.id}/>
                            <CreatableSelect
                                id="subject"
                                name="subject"
                                placeholder={'Request Subject'}
                                isClearable
                                onChange={this.handleChange}
                                onInputChange={this.handleInputChange}
                                options={this.subjects}
                            />
                            <TextField
                                onChange={this.handleChangeBody}
                                id="body"
                                name="body"
                                label='Request Body'
                                multiline
                                rows={10}
                                value={this.state.body}
                            />
                            <TextField
                                onChange={this.handleChangeDate}
                                id="requestedDate"
                                name="requestedDate"
                                type="date"
                                value={this.state.requestedDate}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    </Grid>
                    <div style={{marginLeft: "75%"}}>
                        <Button
                            onClick={this.handleSendRequest}
                            variant="contained" color="primary"
                        >
                            Send Request
                        </Button>
                    </div>
                </div>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(NewDelayRequestForm));
