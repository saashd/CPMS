import React from 'react';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import {editUser, getUsersByFireBaseIDs} from "../../Services/usersService";
import {addEntity, editEntity, getEntitiesByIDs, removeEntity} from "../../Services/mySqlServices";
import {connect} from "react-redux";
import MaterialTable, {MTableBodyRow} from "material-table";
import DialogActions from "@material-ui/core/DialogActions";
import TeamForm from "./TeamForm";
import DialogContent from "@material-ui/core/DialogContent";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import {withSnackbar} from "notistack";
import Paper from "@material-ui/core/Paper";

class MyTeam extends React.Component {
    constructor() {
        super();
        this.state = {
            userDetails: null,
            error: null,
            isLoaded: false,
            myTeam: null,
            open: false,
            columns: [

                {
                    title: 'ID',
                    field: 'id',
                },
                {
                    title: 'First Name',
                    field: 'engFirstName'
                },
                {
                    title: "Last Name",
                    field: 'engLastName',

                }
            ]

        };


    }

    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            let userDetails = result[userRed.uid];
            if (!userDetails.teamId) {
                this.setState({
                    userDetails: userDetails,
                    myTeam: null,
                    isLoaded: true,
                });
            } else {
                let teamObj = {ids: [userDetails.teamId]};
                getEntitiesByIDs(teamObj, 'retrieve/teams', true).then(result => {
                    let team = null;
                    if (result[0]) {
                        team = {
                            id: result[0].id,
                            projectId: result[0].projectId,
                            comment: result[0].comment,
                            students: result[0].students,
                            creatorId: result[0].creatorId,
                        };
                    }
                    this.setState({
                        userDetails: userDetails,
                        myTeam: team,
                        isLoaded: true,
                    });
                }).catch(error => {
                    this.setState({error: error})
                });
            }
        }).catch(error => {
            this.setState({error: error})
        });
    };

    /**
     * Function that removes existing team
     */
    removeTeam = () => {
        removeEntity(this.state.myTeam, 'teams').then((response) => {
            this.setState({
                myTeam: null,
            });
            this.props.enqueueSnackbar("Team Removed", {variant: 'success'});
        }).catch(
            (error) => {
                this.setState({error: error});
            });
    };

    /**
     * Function that creates new team
     */
    createTeam = () => {
        let teamObj = {
            comment: null,
            students: [this.state.userDetails],
            projectId: null,
            creatorId: this.state.userDetails.firebase_user_id
        };
        addEntity(teamObj, 'teams')
            .then((response) => {
                teamObj.id = response;
                this.setState({
                    myTeam: teamObj,
                    isLoaded: true
                });
                let userDetails = {...this.state.userDetails};
                userDetails.teamId = teamObj.id;
                editUser(userDetails).then(r => {
                    this.setState({userDetails: userDetails})
                }).catch(error => {
                    this.setState({error: error});
                });
                this.props.enqueueSnackbar("Team Created", {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
        });
    };


    /**
     * Function that updates existing team
     * @param    {Objects} teamObj
     */
    editTeam = (teamObj) => {
        editEntity(teamObj, 'teams')
            .then((response) => {
                this.setState({
                    myTeam: teamObj
                });
                this.props.enqueueSnackbar("Team Updated", {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
        });
    };


    render() {
        const {error, isLoaded} = this.state;
        const tableRef = React.createRef();
        const actions = [
            {
                name: "editTeam",
                icon: props => (<EditIcon style={{color: '#009688'}}/>),
                tooltip: "Edit Team",
                position: "toolbar",
                onClick: (e, rowData) => {
                    this.setState({open: true});
                }
            }, {
                name: 'removeStudent',
                icon: () => (<DeleteIcon style={{color: '#e91e63'}}/>),
                tooltip: 'Remove Student',
                position: "row",
                onClick:
                    (event, rowData) =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                const team = {...this.state.myTeam};
                                const index = rowData.tableData.id;
                                team.students.splice(index, 1);
                                this.editTeam(team);
                                //retireving team again to re-render table data.
                                let teamObj = {ids: [this.state.userDetails.teamId]};
                                getEntitiesByIDs(teamObj, 'retrieve/teams', true).then(result => {
                                    let team = {
                                        id: result[0].id,
                                        projectId: result[0].projectId,
                                        comment: result[0].comment,
                                        students: result[0].students,
                                        creatorId: result[0].creatorId,
                                    };
                                    this.setState({
                                        myTeam: team,
                                    });
                                }).catch(error => {
                                    this.setState({error: error})
                                });
                                resolve()
                            }, 1000)
                        })
            },
        ];
        const handleClose = () => {
            this.setState({open: false});
        };

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
            if (this.state.myTeam) {
                return (
                    <div style={{textAlign: 'center', padding: '1%'}}>
                        {this.state.userDetails.firebase_user_id === this.state.myTeam.creatorId ?
                            <Button variant="contained" color="secondary" onClick={this.removeTeam}>
                                Remove Team
                            </Button> : ''
                        }
                        <div
                            style={{padding: '1%'}}
                            dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                        <MaterialTable

                            tableRef={tableRef}
                            title={<Typography
                                variant="h6">
                                {'Team Number: ' + this.state.myTeam.id}<br/>
                                {'Description: ' + this.state.myTeam.comment ? this.state.myTeam.comment : ""}
                            </Typography>}
                            columns={this.state.columns}
                            data={this.state.myTeam.students}
                            actions={actions}
                            components={{
                                Row: props => {
                                    const propsCopy = {...props};
                                    propsCopy.actions.find(a => a.name === 'removeStudent').hidden = ((propsCopy.data.id === this.state.userDetails.id && this.state.userDetails.firebase_user_id === this.state.myTeam.creatorId) || (propsCopy.data.id !== this.state.userDetails.id && this.state.userDetails.firebase_user_id !== this.state.myTeam.creatorId));
                                    propsCopy.actions.find(a => a.name === 'editTeam').hidden = (this.state.userDetails.firebase_user_id !== this.state.myTeam.creatorId);
                                    return <MTableBodyRow {...propsCopy} />
                                }
                            }}
                            localization={{
                                   header: {
                                       actions: 'Remove'
                                   },
                               }}
                            options={{
                                paging: false,
                                actionsColumnIndex: -1,
                                headerStyle: {
                                    backgroundColor: '#3f51b5',
                                    color: '#FFF'
                                }

                            }}
                        />
                        <Dialog fullWidth={true}
                                maxWidth={'sm'}
                                open={this.state.open} onClose={handleClose}
                                aria-labelledby="form-dialog-title">
                            <DialogActions>
                                <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose}
                                        color="primary">
                                    <CloseIcon/>
                                </Button>
                            </DialogActions>
                            <DialogContent>
                                <TeamForm onUpdate={this.editTeam}
                                          onSend={handleClose}
                                          data={this.state.myTeam}
                                          courseId={this.state.userDetails.courseId}
                                          studentId={this.state.userDetails.id}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                );
            } else {
                return (
                    <div style={{textAlign: 'center'}}>
                        <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '10%', padding: '4%'}}>
                            <Typography
                                style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5'}}>
                                No Team Assigned
                            </Typography>
                            <br/>
                            <div>
                                <Button variant="contained" color="primary" onClick={this.createTeam}>
                                    Create Team
                                </Button>
                            </div>
                        </Paper>
                    </div>
                )
            }
        }
    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};
export default connect(mapStateToProps)(withSnackbar(MyTeam));