import React from 'react';
import MaterialTable from 'material-table';
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DialogTitle from "@material-ui/core/DialogTitle";
import FilesTab from "./FilesTab";
import tableConfig from "../../../config";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

class TableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            columns: this.props.columns,
            projects: this.props.data,
            title: this.props.title,
            currentProject: '',
            error: null
        };
    }


    componentDidMount(): void {
        this.setState({
            isLoaded: true
        });
    }

    /**
     * Function that closes Projects Form Dialog or Project Details dialog
     * (Depends on if we want to view project's details or to update them)
     */
    handleClose = () => {
        this.setState({open: false, editFlag: false, viewMoreFlag: false});
    };


    render() {
        const tableRef = React.createRef();

        const actions = [
            {
                name: "viewProject",
                icon: props => (<MoreVertIcon/>),
                tooltip: "View Attached Files",
                position: "row",
                onClick: (e, rowData) => {
                    let project = this.state.projects.find(obj => {
                        return obj.id === rowData.id
                    });
                    this.setState({
                        currentProject: project, open: true
                    });
                }
            },
        ];
        const {error} = this.state;
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
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={this.state.title}
                        columns={this.state.columns}
                        data={this.state.projects}
                        actions={actions}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.projects.length),
                            columnsButton: true,
                            emptyRowsWhenPaging: false,
                            sorting: true,
                            actionsColumnIndex: -1,
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
                            headerStyle: {
                                backgroundColor: '#3f51b5',
                                color: '#FFF'
                            }

                        }}
                        detailPanel={[
                            {
                                tooltip: 'Show More',
                                render: rowData => {
                                    return (
                                        <div dir="rtl" style={{textAlignLast: 'right', padding: '10px'}}>
                                            <p><b>תיאור:</b> {rowData.description}</p>
                                            <p><b>משך הפרויקט:</b> {rowData.numOfSemesters} סמסטרים</p>
                                        </div>
                                    )
                                },
                            },
                        ]}
                    />
                    <Dialog
                        fullWidth={true}
                        maxWidth={'md'}
                        open={this.state.open} onClose={this.handleClose}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleClose}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        {this.state.currentProject ?
                            <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project: {' '}
                                {this.state.currentProject.id} </DialogTitle>
                            : ''
                        }

                        <DialogContent>
                            <FilesTab
                                data={this.state.projects}
                                currentProject={this.state.currentProject}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            )
        }
    }
}

export default TableComponent
