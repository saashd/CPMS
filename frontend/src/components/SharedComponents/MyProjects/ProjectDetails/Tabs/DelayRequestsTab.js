import React from 'react';
import MaterialTable from "material-table";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../../Services/mySqlServices";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

class DelayRequestsTab extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            approvedRequests: [],
            columns: [
                {
                    title: 'Request Number',
                    field: 'id',
                },
                {
                    title: 'Subject',
                    field: 'subject',

                },
                {
                    title: 'Status',
                    field: 'status',
                    render: rowData => {
                        return rowData.status == null ? "pending" : rowData.status
                    }
                }

            ]

        };


    }

    componentDidMount() {
        getAllEntities('delaysPerProject', {projectId: this.props.currentEditableProject.id})
            .then((response) => {
                this.setState({
                    approvedRequests: response,
                    isLoaded: true
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    };


    render() {
        const tableRef = React.createRef();
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
            return <div style={{textAlign: 'center'}}>
                <CircularProgress/>
            </div>;
        } else {
            return (
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    {this.state.approvedRequests.length === 0 ?
                        <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '5%', padding: '4%'}}>
                            <Typography
                                style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5'}}>
                                No Requests to Display
                            </Typography>
                        </Paper>
                        :
                        <MaterialTable
                            tableRef={tableRef}
                            title={'Delay Requests'}
                            columns={this.state.columns}
                            data={this.state.approvedRequests}
                            options={{
                                emptyRowsWhenPaging: false,
                                search: false,
                                pageSizeOptions: [0],
                                sorting: true,
                                actionsColumnIndex: -1,
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
                                            <div style={{padding: '2%'}}>
                                                <div>
                                                    <h4>Request:&nbsp;
                                                    </h4>
                                                    <div style={{maxWidth: '70%'}}>
                                                        {rowData.body}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4>
                                                        Requested Date:&nbsp;
                                                        <span
                                                            style={{fontWeight: 'normal'}}>{rowData.requestedDate}</span>
                                                    </h4>
                                                </div>
                                                <div>
                                                    <h4>
                                                        Answer:&nbsp;
                                                    </h4>
                                                    <div style={{maxWidth: '70%'}}>
                                                        {rowData.answer}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4>
                                                        Approved Delay Date:&nbsp;
                                                        <span style={{fontWeight: 'normal'}}>
                                         {rowData.answeredDate}

                                    </span>
                                                    </h4>
                                                </div>
                                            </div>
                                        )
                                    },
                                }]}
                        />
                    }
                </div>
            );
        }
    }
}

export default DelayRequestsTab
