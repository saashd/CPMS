import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import MaterialTable from "material-table";
import Icon from "@material-ui/core/Icon";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from '@material-ui/icons/Edit';
import {withSnackbar} from "notistack";
import {editFBEntity} from "../../../Services/firebaseServices";
import tableConfig from "../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class GradeComponentsTable extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            tab: null,
            template: null,
            columns: [
                {
                    title: 'Proj. Stage',
                    field: 'stage',
                    lookup: {
                        '1': 1,
                        '2': 2,
                        '3': 3,
                        '4 Hold': 4
                    },
                    validate: rowData => (rowData.stage ? true : 'field can not be empty')
                },
                {
                    title: 'Description',
                    field: 'description',
                    validate: rowData => (rowData.description ? true : 'field can not be empty')
                },
                {
                    title: 'Percent',
                    field: 'percent',
                    validate: rowData => (rowData.percent ? true : 'field can not be empty'),
                },
                {
                    title: 'Submitted By',
                    field: 'submittedBy',
                    lookup: {
                        'Admin': 'Admin',
                        'Academic': 'Academic',
                    },
                    validate: rowData => (rowData.submittedBy ? true : 'field can not be empty')
                }

            ]
        };

    }

    componentDidMount() {
        let template = {...this.props.template};
        this.setState({
            tab: this.props.tab, template: Object.values(template),
            isLoaded: true
        })
    };


    /**
     * Function that adds grade component.
     * @param    {Object} gradeComponentObj object with grade component's properties
     */
    handleAdd = (gradeComponentObj) => {
        let updatedTab = {...this.state.tab};
        let template = [...this.state.template];
        let renderedTemplate = {};
        for (let component of template) {
            renderedTemplate[component.id] = component
        }
        updatedTab.template = renderedTemplate;
        editFBEntity(updatedTab, 'gradeTemplates', {"newComponent": gradeComponentObj})
            .then((response) => {
                gradeComponentObj.id = response;
                let template = [...this.state.template];
                template.push(gradeComponentObj);
                this.setState({tab: updatedTab, template: template});
                this.props.enqueueSnackbar("You Added Grade Component", {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that updates existing grade component.
     * @param    {Object} gradeComponentObj object with grade component's properties
     */
    handleEdit = (gradeComponentObj) => {
        let updatedTab = {...this.state.tab};
        let template = [...this.state.template];
        let i = template.findIndex(obj => obj.id === gradeComponentObj.id);
        if (template[i]) {
            template[i] = gradeComponentObj
        }
        let renderedTemplate = {};
        for (let component of template) {
            renderedTemplate[component.id] = component
        }
        updatedTab.template = renderedTemplate;
        editFBEntity(updatedTab, 'gradeTemplates')
            .then((response) => {
                this.setState({tab: updatedTab, template: template});
                this.props.enqueueSnackbar("You Updated Grade Component", {variant: 'success'});
            }).catch((error) => {
            this.setState({error: error});
        });
    };

    /**
     * Function that deletes grade component.
     * @param    {Object} gradeComponentObj object with grade component's properties
     * @return   error message or updated grade components array
     */
    handleDelete = (gradeComponentObj) => {
        let updatedTab = {...this.state.tab};
        let template = [...this.state.template];
        let i = template.findIndex(obj => obj.id === gradeComponentObj.id);
        template.splice(i, 1);
        let renderedTemplate = {};
        for (let component of template) {
            renderedTemplate[component.id] = component
        }
        updatedTab.template = renderedTemplate;
        editFBEntity(updatedTab, 'gradeTemplates').then((response) => {
            this.setState({tab: updatedTab, template: template});
            this.props.enqueueSnackbar("You Deleted Grade Component", {variant: 'success'});
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
                <div style={{textAlign: 'center', paddingTop: "15%"}}>
                    <CircularProgress size="8rem"/>
                </div>);
        } else {
            const tableRef = React.createRef();
            return (<div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>

                    <MaterialTable
                        tableRef={tableRef}
                        title="Grade's Components"
                        columns={this.state.columns}
                        data={this.state.template}
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
                            pageSizeOptions: tableConfig.calcPageSize(this.state.template.length),
                            emptyRowsWhenPaging: false,
                            addRowPosition: 'first',
                            actionsColumnIndex: -1,
                            paging: false,
                            // maxCellHeight: "40vh",
                            // minCellHeight: "40vh",
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }
                        }}
                    />
                </div>

            )
        }

    }
}

export default withSnackbar(GradeComponentsTable);