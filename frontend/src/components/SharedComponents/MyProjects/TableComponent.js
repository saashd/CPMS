import React from 'react';
import MaterialTable from 'material-table';
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DialogTitle from "@material-ui/core/DialogTitle";
import ProjectDetails from "./ProjectDetails/ProjectDetails"


export default class TableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.forceUpdateHandler = this.forceUpdateHandler.bind(this);
        this.state = {
            open: false,
            columns: this.props.columns,
            data: this.props.data,
            title: this.props.title,
            editFlag: false,
            viewMoreFlag: false,
            currentEditableProjectID: '',
            currentEditableProject: '',


        };

    }

    forceUpdateHandler() {
        this.forceUpdate();
    };

    componentDidMount(): void {
    }


    render() {
        const tableRef = React.createRef();
        const handleClose = () => {
            this.setState({open: false, editFlag: false, viewMoreFlag: false});
        };

        const actions = [
            {
                name: "viewProject",
                icon: props => (<MoreVertIcon/>),
                tooltip: "View More",
                position: "row",
                onClick: (e, rowData) => {
                    let project = this.state.data.find(obj => {
                        return obj.id === rowData.id
                    });
                    this.setState({
                        currentEditableProjectID: rowData.id,
                        currentEditableProject: project, viewMoreFlag: true, editFlag: false
                    });
                }
            },
        ];

        return (
            <div style={{padding: '2%'}}>
                <div
                    dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                <MaterialTable id={Math.floor(Math.random() * 11)}
                               tableRef={tableRef}
                               title={this.state.title}
                               columns={this.state.columns}
                               data={this.state.data}
                               actions={actions}
                               localization={{
                                   header: {
                                       actions: 'View More'
                                   },
                               }}
                               options={{
                                   paging: false,
                                   sorting: true,
                                   actionsColumnIndex: -1,
                                   headerStyle: {
                                       backgroundColor: '#3f51b5',
                                       color: '#FFF'
                                   }

                               }}
                />
                <Dialog fullWidth={true}
                        maxWidth={'xl'}
                        open={this.state.viewMoreFlag} onClose={handleClose}
                        aria-labelledby="form-dialog-title">
                    <DialogActions>
                        <Button style={{right: '95%', position: 'sticky'}} onClick={handleClose} color="primary">
                            <CloseIcon/>
                        </Button>
                    </DialogActions>
                    <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project: {' '}
                        {this.state.currentEditableProjectID} </DialogTitle>
                    <DialogContent>
                        <ProjectDetails
                            userDetails={this.props.userDetails}
                            onUpdate={() => void 0}
                            onAdd={() => void 0}
                            onSend={handleClose}
                            data={this.state.data}
                            currentEditableProject={this.state.currentEditableProject}
                            editFlag={this.state.editFlag}
                            viewMoreFlag={this.state.viewMoreFlag}
                        />

                    </DialogContent>
                </Dialog>
            </div>
        )
    }
}
