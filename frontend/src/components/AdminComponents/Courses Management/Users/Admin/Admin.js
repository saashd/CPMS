import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {editUser, editUserAccess, getUsersByType, removeUser} from "../../../../Services/usersService";
import MaterialTable, {MTableBodyRow} from "material-table";
import DeleteIcon from "@material-ui/icons/Delete";
import DialogActions from "@material-ui/core/DialogActions";
import CloseIcon from "@material-ui/icons/Close";
import AdminForm from "./AdminForm";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import BlockIcon from '@material-ui/icons/Block';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import EditIcon from "@material-ui/icons/Edit";
import {withSnackbar} from "notistack";
import tableConfig from "../../../../config";
import EditDetails from "../UserDetails/UserDetails";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class Admin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            open: false,
            admins: [],
            editDetails: false,
            currAdmin: null,
            columns: [
                {
                    title: 'ID',
                    field: 'id',
                    editable: 'onAdd',
                    // validate: rowData => (rowData.id ? true : 'field can not be empty')

                },
                {
                    title: 'Prefix',
                    field: 'prefix',
                    lookup: {'Mr': 'Mr', 'Ms': 'Ms', 'Dr': 'Dr', 'Prof': 'Prof'},
                    // validate: rowData => (rowData.prefix ? true : 'field can not be empty')
                },

                {
                    title: 'First Name',
                    field: 'engFirstName',
                    // validate: rowData => (rowData.engFirstName ? true : 'field can not be empty')
                }
                , {
                    title: 'Last Name',
                    field: 'engLastName',
                    // validate: rowData => (rowData.engLastName ? true : 'field can not be empty')

                },
                {
                    title: 'Heb First Name',
                    field: 'hebFirstName',
                    // validate: rowData => (rowData.hebFirstName ? true : 'field can not be empty')
                },
                {
                    title: 'Heb Last Name',
                    field: 'hebLastName',
                    // validate: rowData => (rowData.hebLastName ? true : 'field can not be empty')

                },
                {
                    title: 'Cell Phone',
                    field: 'cellPhone',
                    // validate: rowData => (rowData.cellPhone ? true : 'field can not be empty')

                },
                {
                    title: 'Work Phone',
                    field: 'workPhone',

                },
                {
                    title: 'Email',
                    field: 'email',
                    // validate: rowData => (rowData.email ? true : 'field can not be empty')

                },
            ]

        };


    }

    componentDidMount() {
        getUsersByType('admin')
            .then((response) => {
                this.setState({
                    admins: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that updates existing admin's properties.
     * @param    {Object} admin    Object with admin properties
     * @return   {Object} updated admins array
     */
    handleEdit = (admin) => {
        return editUser(admin)
            .then((response) => {
                let admins = [...this.state.admins];
                let i = admins.findIndex(obj => obj.id === admin.id);
                if (admins[i]) {
                    admins[i] = admin
                } else {
                    admins.unshift(admin);
                }
                this.setState({
                    admins: admins,
                });
                this.props.enqueueSnackbar("You Updated " + admin.engFirstName + ' ' + admin.engLastName, {variant: 'success'});
                return Promise.resolve(admins);
            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    };
    /**
     * Function that updates existing admin's access permissions..
     * @param    {Object} admin    Object with admin properties
     * @return   {Object} updated admins array
     */
    handleEditAccess = (admin) => {
        return editUserAccess(admin)
            .then((response) => {
                let admins = [...this.state.admins];
                let i = admins.findIndex(obj => obj.firebase_user_id === admin.firebase_user_id);
                if (admins[i]) {
                    admins[i].is_admin = admin.is_admin
                }
                this.setState({
                    admins: admins,
                });
                return Promise.resolve(admins);
            }).catch((error) => {
                this.setState({error: error});
                return Promise.reject(error);
            });
    };

    /**
     * Function that deletes existing admin.
     * @param    {Object} admin    Object with admin properties
     */
    handleDelete = (admin) => {
        removeUser(admin)
            .then((response) => {
                let admins = [...this.state.admins];
                let i = admins.findIndex(obj => obj.id === admin.id);
                admins.splice(i, 1);
                this.setState({
                    admins: admins,
                });
                this.props.enqueueSnackbar("You Deleted " + admin.engFirstName + ' ' + admin.engLastName, {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error})
        });
    };
    handleCloseEditDialog = () => {
        this.setState({editDetails: false})
    };


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
            const tableRef = React.createRef();

            /**
             * Function that opens Admin Form Dialog
             */
            const handleClickOpen = () => {
                this.setState({open: true});

            };
            /**
             * Function that closes Admin Form Dialog
             */
            const handleClose = () => {
                this.setState({open: false});
            };

            /**
             * Array of buttons that displayed in Actions column in material-table
             */
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
                                        this.setState({editDetails: true, currAdmin: rowData});
                                        resolve()
                                    }, 1000
                                )
                            })
                },
                {
                    name: "givePermission",
                    icon: props => (
                        <SupervisorAccountIcon style={{fontSize: 40, color: '#3f51b5'}}/>),
                    tooltip: "Give admin permission to existing user",
                    position: "toolbar",
                    onClick: (handleClickOpen)
                },
                {
                    name: 'removeAdmin',
                    position: "row",
                    icon: () => (<BlockIcon style={{color: '#e91e63'}}/>),
                    tooltip: 'Remove Admin Access',
                    hidden: true,
                    onClick:
                        (event, rowData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                        let updatedUser = {...rowData};
                                        const adminData = {
                                            'firebase_user_id': updatedUser.firebase_user_id,
                                            'is_admin': false
                                        }
                                        this.handleEditAccess(adminData).then((r) => {
                                            this.props.enqueueSnackbar("Permission taken", {variant: 'success'});

                                        });
                                        resolve()
                                    }, 1000
                                )
                            })
                }
            ];
            return (
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={<div><h2>{'Admin'}</h2><p> (Table displays users with admin
                            permissions.)</p></div>}
                        columns={this.state.columns}
                        data={this.state.admins}
                        icons={{
                            // Edit: props => (<EditIcon style={{color: '#009688'}}/>),
                            Delete: props => (<DeleteIcon style={{color: '#e91e63'}}/>)
                        }}
                        localization={{
                            body: {
                                deleteTooltip: 'Delete user',
                                editRow: {deleteText: 'Do you want to delete this user?'}
                            }
                        }}
                        editable={{
                            // onRowUpdate: (rowData, oldData) =>
                            //     new Promise((resolve, reject) => {
                            //         setTimeout(() => {
                            //             this.handleEdit(rowData).then((r) => {
                            //             });
                            //             resolve();
                            //         }, 1000)
                            //     }),
                            onRowDelete: rowData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleDelete(rowData);
                                        resolve()
                                    }, 1000)
                                }),
                        }}
                        actions={actions}
                        components={{
                            Row: props => {
                                const propsCopy = {...props};
                                propsCopy.actions.find(a => a.name === 'removeAdmin').hidden = !propsCopy.data.is_admin || propsCopy.data.user_type === 'admin';
                                return <MTableBodyRow {...propsCopy} />
                            }
                        }}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.admins.length),
                            columnsButton: true,
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            exportButton: {csv: true},
                            exportFileName: 'Admins',
                            exportAllData: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }

                        }}
                    />
                    <Dialog fullWidth={true}
                            maxWidth={'md'}
                            open={this.state.open} onClose={handleClose}
                            aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose} color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Add Admin</DialogTitle>
                        <DialogContent>
                            <DialogContentText style={{paddingLeft: '35%'}}>
                                Choose users from existing
                            </DialogContentText>
                            <AdminForm onUpdate={this.handleEditAccess} handleClose={handleClose}/>
                        </DialogContent>
                    </Dialog>
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
                                userDetails={this.state.currAdmin}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }
}


export default withSnackbar(Admin);
