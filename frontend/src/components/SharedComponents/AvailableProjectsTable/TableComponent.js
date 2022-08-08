import React, {useRef} from 'react';
import MaterialTable from 'material-table';
import Button from "@material-ui/core/Button";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import ProjectDetails from "./ProjectDetails";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import CloseIcon from "@material-ui/icons/Close";
import tableConfig from "../../config";


function TableComponent(props) {
    const tableRef = useRef();
    const [columns] = React.useState(props.columns);
    const [data] = React.useState(props.data);
    const [teamsProjectsRequests, setRequests] = React.useState(props.teamsProjectsRequests);
    const [currentProject, setProject] = React.useState(null);
    const [openDialog, setOpen] = React.useState(false);
    const actions = [
        {
            name: "viewProject",
            icon: props => (<MoreVertIcon/>),
            tooltip: "View More",
            position: "row",
            onClick: (e, rowData) => {
                let project = data.find(obj => {
                    return obj.id === rowData.id
                });
                setProject(project);
                setOpen(true);
            }
        },
    ];
    const handleClose = (teamsProjectsRequests = null) => {
        if (teamsProjectsRequests !== null) {
            for (let request of teamsProjectsRequests) {
                if (('projectId' in request) && !(typeof request.projectId === 'object')) {
                    request.projectId = {id: request.projectId};
                }
            }
            setRequests(teamsProjectsRequests);
        }
        setOpen(false);
    };
    return (
        <div style={{padding: '3%'}}>
            <MaterialTable
                tableRef={tableRef}
                title="Available Projects"
                columns={columns}
                data={data}
                actions={actions}
                localization={{
                    header: {
                        actions: 'View More'
                    },
                }}
                options={{
                    cellStyle: {padding: 0, verticalAlign: 'center', textAlign: 'center', spacing: ' nowrap'},
                    pageSize: tableConfig.initPageSize,
                    pageSizeOptions: tableConfig.calcPageSize(data.length),
                    filtering: true,
                    sorting: true,
                    emptyRowsWhenPaging: false,
                    actionsColumnIndex: -1,
                    headerStyle: {
                        backgroundColor: '#3f51b5',
                        color: '#FFF'
                    },
                    rowStyle: rowData => ({
                        backgroundColor: teamsProjectsRequests[0] ? (teamsProjectsRequests[0].projectId.id === rowData.id ? "#EEEfff" : "#fff") : "#fff"
                    })
                }}
            />

            <Dialog fullWidth={true}
                    maxWidth={'md'}
                    open={openDialog} onClose={() => handleClose(null)}
                    aria-labelledby="form-dialog-title">
                <DialogActions>
                    <Button style={{right: '95%', position: 'sticky'}} onClick={() => handleClose(null)}
                            color="primary">
                        <CloseIcon/>
                    </Button>
                </DialogActions>
                <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Project: {' '}
                    {currentProject ? currentProject.id : ''} </DialogTitle>
                <DialogContent>
                    <ProjectDetails
                        currentProject={currentProject}
                        handleClose={handleClose}
                    />

                </DialogContent>
            </Dialog>
        </div>

    )
}

export default (TableComponent);

