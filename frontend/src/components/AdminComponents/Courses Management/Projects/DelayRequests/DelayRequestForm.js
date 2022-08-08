import React from 'react';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import Button from "@material-ui/core/Button"
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import ThumbUpAltIcon from '@material-ui/icons/ThumbUpAlt';
import ThumbDownAltIcon from '@material-ui/icons/ThumbDownAlt';
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        "& .MuiInputBase-root.Mui-disabled": {
            color: "rgba(33,33,33,0.78)" // (default alpha is 0.38)
        },
        "& .MuiFormLabel-root.Mui-disabled": {
            color: "rgb(63,81,181)" // (default alpha is 0.38)
        }
    },
});


class DelayRequestForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentRequest: null,

        };
    }


    componentDidMount() {
        if (this.props.currentRequest) {
            this.setState({currentRequest: this.props.currentRequest, isLoaded: true})
        }
    };


    /**
     * Function that updates request's properties with given value.
     * @param    {Object} e-Event object
     */
    handleChange = (e) => {
        const request = {
            ...this.state.currentRequest,
            [e.target.name]: e.target.value
        };
        this.setState({currentRequest: request});
        this.forceUpdate();
    };

    /**
     * Function that changes request status and calls  this.props.handleRequest for update.
     * @param status
     */
    handleRequest = (status) => {
        let currentRequest = {...this.state.currentRequest};
        currentRequest.status = status;
        this.props.handleRequest(currentRequest);
        this.props.handleClose()

    };


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
                <div className={classes.selectFields}>
                    <Grid
                        justify="center"
                        alignItems="stretch" container
                    >
                        <Grid item md={10} xs={12}>
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                disabled
                                id="subject"
                                name="subject"
                                label='Subject'
                                value={this.state.currentRequest.subject}
                            />
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                disabled
                                id="body"
                                name="body"
                                label='Body'
                                multiline
                                value={this.state.currentRequest.body}
                            />
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                disabled
                                id="requestedDate"
                                name="requestedDate"
                                label='Requested Date'
                                value={this.state.currentRequest.requestedDate}
                            />
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={this.handleChange}
                                id="answeredDate"
                                name="answeredDate"
                                label='Allowed Delay Date'
                                type="date"
                                value={this.state.currentRequest.answeredDate}
                            />
                            <TextField
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={this.handleChange}
                                id="answer"
                                name="answer"
                                label='Reply'
                                value={this.state.currentRequest.answer}
                            />
                        </Grid>
                        <div style={{
                            position: 'sticky',
                            bottom: '0'
                        }}>
                            <div>
                                <Button
                                    startIcon={<ThumbUpAltIcon/>}
                                    onClick={() => this.handleRequest('approved')}
                                    variant="contained"
                                    color="primary"
                                >
                                    Approve
                                </Button>
                                <Button startIcon={<ThumbDownAltIcon/>}
                                        onClick={() => this.handleRequest('rejected')}
                                        variant="contained"
                                        color="primary">
                                    Reject
                                </Button>
                            </div>
                        </div>
                    </Grid>
                </div>
            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(DelayRequestForm);
