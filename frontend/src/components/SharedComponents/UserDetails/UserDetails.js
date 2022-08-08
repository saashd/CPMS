import React from 'react';
import 'date-fns';
import {withStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import EmailIcon from '@material-ui/icons/Email';
import PhoneIcon from '@material-ui/icons/Phone';
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone';
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import WorkIcon from '@material-ui/icons/Work';
import {connect} from "react-redux";
import Button from "@material-ui/core/Button";
import DialogActions from "@material-ui/core/DialogActions";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import CloseIcon from "@material-ui/icons/Close";
import EditDetails from "./EditDetails";
import {editLoggedUser} from "../../Services/loggedUserService";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import {withSnackbar} from "notistack";
import {getAllEntities} from "../../Services/mySqlServices";
import Card from "@material-ui/core/Card";
import Paper from "@material-ui/core/Paper";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        '&.MuiBox-root': {
            width: '100%'
        }
    },
    root: {padding: '2%'}
});


class UserDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openChangePassword: false,
            openEdit: false,
            isLoaded: false,
            userRed: null,
            userDetails: {},
            organizations: null,
            error: null
        }

    }

    componentDidMount() {
        let promises = [];
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        let userDetails = null;
        let organizations = [];
        promises.push(getUsersByFireBaseIDs(obj).then(result => {
            userDetails = result[userRed.uid];
        }));
        Promise.all(promises).then(() => {
            getAllEntities('organizations')
                .then((response) => {
                    let organization = response.filter(obj => {
                        return obj.id === userDetails.organizationId
                    });
                    userDetails.organizationId = organization[0] ? organization[0] : null;
                    organizations = response;
                    this.setState({
                        userRed: userRed,
                        userDetails: userDetails,
                        isLoaded: true,
                        organizations: organizations,
                    });
                })
        }).catch(error => {
            this.setState({error: error})
        });
    };

    handleOpenChangePasswordDialog = () => {
        this.setState({openChangePassword: true})
    };
    handleCloseChangePasswordDialog = () => {
        this.setState({openChangePassword: false})
    };

    handleOpenEditDialog = () => {
        this.setState({openEdit: true})
    };
    handleCloseEditDialog = () => {
        this.setState({openEdit: false})
    };

    onUpdate = (newUserDetails) => {
        editLoggedUser(newUserDetails).then(result => {
            let organization = this.state.organizations.filter(obj => {
                return obj.id === newUserDetails.organizationId
            });
            newUserDetails.organizationId = organization[0];
            this.setState({userDetails: newUserDetails});
            this.props.enqueueSnackbar('Details Updated Successfully', {variant: 'success'});
            window.location.reload();
        })
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
                <div style={{textAlign: 'center', paddingTop: "15%"}}>
                    <CircularProgress size="8rem"/>
                </div>);
        } else {
            let user = this.state.userDetails;
            return (
                <div style={{marginLeft: '35%', paddingTop: '5%', textAlign: "center"}}>
                    <Grid container>
                        <Card className={classes.root}>
                            <Grid item sx={12}>
                                <Typography
                                    style={{fontSize: "x-large"}}>
                                    {user.prefix}{'. '}{user.engFirstName + ' ' + user.engLastName}
                                    <br/>
                                    {user.hebFirstName + ' ' + user.hebLastName}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                <ListItem>
                                    <ListItemIcon>
                                        <FingerprintIcon style={{color: '#3f51b5', fontSize: "x-large"}}/>
                                    </ListItemIcon>
                                    <ListItemText
                                        secondary={<Typography style={{fontSize: "x-large"}}>{user.id}</Typography>}
                                    />
                                </ListItem>
                            </Grid>
                            <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                <ListItem>
                                    <ListItemIcon>
                                        <EmailIcon style={{color: '#3f51b5', fontSize: "x-large"}}/>
                                    </ListItemIcon>
                                    <ListItemText
                                        secondary={<Typography
                                            style={{fontSize: "x-large"}}>{user.email}</Typography>}
                                    />
                                </ListItem>
                            </Grid>
                            <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                <ListItem>
                                    <ListItemIcon>
                                        <PhoneIphoneIcon style={{color: '#3f51b5', fontSize: "x-large"}}/>
                                    </ListItemIcon>
                                    <ListItemText
                                        secondary={<Typography
                                            style={{fontSize: "x-large"}}>{user.cellPhone}</Typography>}
                                    />
                                </ListItem>
                            </Grid>
                            {user.user_type === 'advisor' && user.workPhone ?
                                <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIcon style={{color: '#3f51b5', fontSize: "x-large"}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{user.workPhone}</Typography>}

                                        />
                                    </ListItem>
                                </Grid> : ""}
                            {user.user_type === 'advisor' && user.organizationId ?
                                <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <WorkIcon style={{color: '#3f51b5', fontSize: "x-large"}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{user.organizationId.name}</Typography>}
                                        />
                                    </ListItem>
                                </Grid> : ""}
                            {user.user_type === 'student' && user.faculty ?
                                <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <AccountBalanceIcon style={{color: '#3f51b5', fontSize: "x-large"}}/>
                                        </ListItemIcon>
                                        <ListItemText
                                            secondary={<Typography
                                                style={{fontSize: "x-large"}}>{user.faculty}</Typography>}
                                        />
                                    </ListItem>
                                </Grid> : ""}
                            {user.user_type === 'student' && user.courseId ?
                                <Grid item xs={12} style={{alignSelf: 'flex-start'}}>
                                    <ListItem>
                                        <ListItemText
                                            style={{color: '#3f51b5', textAlign: "center"}}
                                            primary={'Student registered to course:'}
                                            secondary={user.courseId}
                                        />
                                    </ListItem>
                                </Grid> : ""}
                            <div style={{textAlign: "center"}}>
                                <Button onClick={this.handleOpenEditDialog}
                                        variant="contained" color="primary">
                                    Edit Details
                                </Button>
                                {/*{user.password ? <Button onClick={this.handleOpenChangePasswordDialog}>*/}
                                {/*    Change Password*/}
                                {/*</Button> : ''*/}
                                {/*}*/}
                            </div>
                        </Card>
                    </Grid>
                    <Dialog
                        fullWidth={true}
                        maxWidth={'sm'}
                        open={this.state.openEdit} onClose={this.handleCloseEditDialog}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}}
                                    onClick={this.handleCloseEditDialog}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <EditDetails
                                onUpdate={this.onUpdate}
                                onSend={this.handleCloseEditDialog}
                                userDetails={this.state.userDetails}
                                organizations={this.state.organizations}
                            />
                        </DialogContent>
                    </Dialog>
                    {/*<Dialog*/}
                    {/*    fullWidth={true}*/}
                    {/*    maxWidth={'md'}*/}
                    {/*    open={this.state.openChangePassword} onClose={this.handleCloseChangePasswordDialog}*/}
                    {/*    aria-labelledby="form-dialog-title">*/}
                    {/*    <DialogActions>*/}
                    {/*        <Button style={{right: '95%', position: 'sticky'}}*/}
                    {/*                onClick={this.handleCloseChangePasswordDialog}*/}
                    {/*                color="primary">*/}
                    {/*            <CloseIcon/>*/}
                    {/*        </Button>*/}
                    {/*    </DialogActions>*/}
                    {/*    <DialogContent>*/}
                    {/*        <ChangePassword*/}
                    {/*            onUpdate={this.onUpdate}*/}
                    {/*            onSend={this.handleCloseChangePasswordDialog}*/}
                    {/*            userDetails={this.state.userDetails}*/}
                    {/*        />*/}
                    {/*    </DialogContent>*/}
                    {/*</Dialog>*/}
                </div>
            );
        }
    }
}

const mapStateToProps = (state) => {
    return {
        userRed: state['user'],
    }
};

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(UserDetails)));
