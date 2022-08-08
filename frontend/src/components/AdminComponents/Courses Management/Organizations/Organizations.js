import React from 'react';
import {addEntity, editEntity, getAllEntities, removeEntity} from "../../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import MaterialTable from "material-table";
import Icon from "@material-ui/core/Icon";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from '@material-ui/icons/Edit';
import {withSnackbar} from "notistack";
import tableConfig from "../../../config";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

class Organizations extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            organizations: null,
            columns: [
                {
                    title: 'Code',
                    field: 'id',
                    editable: 'never',
                    cellStyle: {width: "10%",},
                },
                {
                    title: 'Name',
                    field: 'name',
                    cellStyle: {width: "30%",},
                    validate: rowData => (rowData.name ? true : 'field can not be empty')
                },
                {
                    title: 'Description',
                    field: 'description',
                    cellStyle: {width: "60%",},
                },
            ]
        };

    }

    componentDidMount() {
        getAllEntities('organizations')
            .then((response) => {
                this.setState({
                    organizations: response,
                    isLoaded: true,
                });
            }).catch((error) => {
            this.setState({error: error});

        });
    };


    /**
     * Function that adds organization.
     * @param    {Object} organizationObj object with organization's properties
     */
    handleAdd = (organizationObj) => {
        addEntity(organizationObj, 'organizations')
            .then((response) => {
                organizationObj.id = response;
                let organizations = [...this.state.organizations];
                organizations.unshift(organizationObj);
                this.setState({organizations: organizations});
                this.props.enqueueSnackbar("You Added " + organizationObj.name, {variant: 'success'});

            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that updates existing organization.
     * @param    {Object} organizationObj object with organization's properties
     */
    handleEdit = (organizationObj) => {
        editEntity(organizationObj, 'organizations')
            .then((response) => {
                let organizations = [...this.state.organizations];
                let i = organizations.findIndex(obj => obj.id === organizationObj.id);
                if (organizations[i]) {
                    organizations[i] = organizationObj
                }
                this.setState({organizations: organizations});
                this.props.enqueueSnackbar("You Updated " + organizationObj.name, {variant: 'success'});

            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that deletes organization.
     * @param    {Object} organizationObj object with organization's properties
     * @return   error message or updated organizations array
     */
    handleDelete = (organizationObj) => {
        removeEntity(organizationObj, 'organizations').then((response) => {
            let organizations = [...this.state.organizations];
            let i = organizations.findIndex(obj => obj.id === organizationObj.id);
            organizations.splice(i, 1);
            this.setState({
                organizations: organizations
            });
            this.props.enqueueSnackbar("You Deleted " + organizationObj.name, {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error});
        });
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
            return (<div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>

                    <MaterialTable
                        tableRef={tableRef}
                        title="Organizations"
                        columns={this.state.columns}
                        data={this.state.organizations}
                        icons={{
                            Add: props => (
                                <Icon style={{fontSize: 40, color: '#009688'}}>add_circle</Icon>
                            ),
                            Edit: props => (<EditIcon style={{color: '#009688'}}/>),
                            Delete: props => (<DeleteIcon style={{color: '#e91e63'}}/>)
                        }}
                        editable={{
                            onRowAdd: rowData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleAdd(rowData);
                                        resolve();

                                    }, 1000)
                                }),
                            onRowUpdate: (rowData, oldData) =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleEdit(rowData);
                                        resolve();
                                    }, 1000)
                                }),
                            onRowDelete: rowData =>
                                new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        this.handleDelete(rowData);
                                        resolve()
                                    }, 1000)
                                }),
                        }}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.organizations.length),
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            actionsColumnIndex: -1,
                            sorting: true,
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            },
                        }}
                    />
                </div>

            )
        }

    }
}

export default withSnackbar(Organizations);