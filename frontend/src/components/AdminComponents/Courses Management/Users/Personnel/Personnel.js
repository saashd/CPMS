import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {addIndustrialAdvisor, editUser, getUsersByType, removeUser} from "../../../../Services/usersService";
import {getAllEntities} from "../../../../Services/mySqlServices";
import MaterialTable from "material-table";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import {withSnackbar} from "notistack";
import tableConfig from "../../../../config";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import EditDetails from "../UserDetails/UserDetails";
import Dialog from "@material-ui/core/Dialog";
import {CloseIcon} from "@material-ui/data-grid";
import DialogContent from "@material-ui/core/DialogContent";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {connect} from "react-redux";

class Personnel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            organizationsLookup: null,
            organizations: null,
            error: null,
            isLoaded: false,
            advisors: null,
            editDetails: false,
            currAdvisor: null

        };


    }

    componentDidMount() {
        let promises = [];
        if (this.props.type === "search") {
            const searchUsers = this.props.searchUsers;

            this.setState({ advisors: searchUsers });
        } else {
        promises.push(
            getUsersByType('advisor')
                .then((response) => {
                    this.setState({
                        advisors: response,
                    });
                }));
        }
        promises.push(
            getAllEntities('organizations')
                .then((response) => {
                    let lookup = {};
                    for (let organization of response) {
                        lookup[organization.id] = organization.name
                    }
                    this.setState({organizationsLookup: lookup, organizations: response});
                }));
        Promise.all(promises).then(() => {
            this.setState({isLoaded: true});
        }).catch(error => this.setState({error: error}));


    };

    /**
     * Function that adds advisor.
     * @param    {Object} advisorObj object with advisors's properties
     */
    handleAdd = (advisorObj) => {
        advisorObj.user_type = 'advisor';
        if (advisorObj.advisorType !== 'industrial') {
            alert('Only industrial advisors can be added manually.Academic advisors should register via SSO.')
        } else {
            addIndustrialAdvisor(advisorObj)
                .then((response) => {
                    advisorObj = response;
                    let advisors = [...this.state.advisors];
                    advisors.unshift(advisorObj);
                    this.setState({advisors: advisors});
                    this.props.enqueueSnackbar("You Added " + advisorObj.engFirstName + ' ' + advisorObj.engLastName, {variant: 'success'});

                }).catch((error) => {
                this.setState({error: error});
            });
        }

    };

    /**
     * Function that updates advisor.
     * @param    {Object} advisorObj object with advisor's properties
     */
    handleEdit = (advisorObj) => {
        editUser(advisorObj)
            .then((response) => {
                let advisors = [...this.state.advisors];
                let i = advisors.findIndex(obj => obj.id === advisorObj.id);
                if (advisors[i]) {
                    advisors[i] = advisorObj
                }
                this.setState({advisors: advisors});
                this.props.enqueueSnackbar("You Updated " + advisorObj.engFirstName + ' ' + advisorObj.engLastName, {variant: 'success'});

            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that deletes advisor.
     * @param    {Object} advisorObj object with advisor's properties
     * @return   error message or updated advisors array
     */
    handleDelete = (advisorObj) => {
        return removeUser(advisorObj)
            .then((response) => {
                let advisors = [...this.state.advisors];
                let i = advisors.findIndex(obj => obj.id === advisorObj.id);
                advisors.splice(i, 1);
                this.setState({
                    advisors: advisors
                });
                this.props.enqueueSnackbar("You Deleted " + advisorObj.engFirstName + ' ' + advisorObj.engLastName, {variant: 'success'});
            }).catch((error) => {
                this.setState({error: error});
            });
    };

    handleCloseEditDialog = () => {
        this.setState({editDetails: false})
    };

    handleRowClick = (event, rowData) =>
        new Promise((resolve, reject) => {
            setTimeout(() => {
                this.setState({ editDetails: true, currAdvisor: rowData });
                resolve()
            }, 100
            )
        })

    render() {
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
            const actions = [
                {
                    name: "editDetails",
                    icon: props => (
                        <EditIcon style={{color: '#009688'}}/>),
                    tooltip: "Edit User",
                    position: "row",
                    onClick:
                        (event, rowData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                        this.setState({editDetails: true, currAdvisor: rowData});
                                        resolve()
                                    }, 1000
                                )
                            })
                }];
            const tableRef = React.createRef();
            return (
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={"Personnel"}
                        columns={
                            [
                                {
                                    title: 'ID',
                                    field: 'id',
                                },
                                {
                                    title: 'Prefix',
                                    field: 'prefix',
                                    lookup: {'Mr': 'Mr', 'Ms': 'Ms', 'Dr': 'Dr', 'Prof': 'Prof'},
                                },
                                {
                                    title: 'First Name',
                                    field: 'engFirstName',
                                },
                                {
                                    title: 'Last Name',
                                    field: 'engLastName',
                                },
                                {
                                    title: 'Heb First Name',
                                    field: 'hebFirstName',
                                },
                                {
                                    title: 'Heb Last Name',
                                    field: 'hebLastName',
                                },
                                {
                                    title: 'Work Phone',
                                    field: 'workPhone',
                                },
                                {
                                    title: 'Cell Phone',
                                    field: 'cellPhone',
                                },
                                {
                                    title: 'Email',
                                    field: 'email',
                                },
                                {
                                    title: 'Organization',
                                    field: 'organizationId',
                                    lookup: this.state.organizationsLookup,
                                },
                                {
                                    title: 'Type',
                                    field: 'advisorType',
                                    lookup: {'industrial': 'Industrial', 'academic': 'Academic', 'both': 'Both '},

                                }
                            ]
                        }
                        actions={this.props.adminViewRed ?actions:null}
                        onRowClick={this.handleRowClick}
                        data={this.state.advisors}
                        icons={{
                            Delete: props => (<DeleteIcon style={{color: '#e91e63'}}/>),
                        }}
                        editable={{
                              isEditable: rowData => {
                                return !!this.props.adminViewRed;
                            },
                            onRowDelete: this.props.adminViewRed ?rowData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleDelete(rowData);
                                        resolve()
                                    }, 1000)
                                }):null,
                        }}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.advisors.length),
                            columnsButton: true,
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
                            sorting: true,
                            actionsColumnIndex: -1,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }
                        }}
                    />
                    <Dialog
                        fullWidth={true}
                        maxWidth={'sm'}
                        open={this.state.editDetails} onClose={this.handleCloseEditDialog}
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
                                onUpdate={this.handleEdit}
                                onSend={this.handleCloseEditDialog}
                                userDetails={this.state.currAdvisor}
                                organizations={this.state.organizations}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};

export default connect(mapStateToProps)(withSnackbar(Personnel));
