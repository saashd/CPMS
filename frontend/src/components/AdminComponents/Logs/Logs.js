import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {connect} from "react-redux";
import MaterialTable from "material-table";
import {withSnackbar} from "notistack";
import ShowMoreText from "react-show-more-text";
import tableConfig from "../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import {getLogs} from "../../Services/mySqlServices";

class Logs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            logs: null

        };
    }

    componentDidMount() {
        getLogs()
            .then((response) => {
                this.setState({
                    logs: response, isLoaded: true
                });
            })
            .catch(error => this.setState({error: error}));


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
            return (
                <div style={{padding: "3%"}}>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={"Logs"}
                        columns={
                            [
                                {
                                    title: 'Date',
                                    field: 'dateCreated',
                                    render: rowData => {
                                        if (rowData.dateCreated) {
                                            return rowData.dateCreated.replace(/GMT/, '')

                                        } else {
                                            return null
                                        }
                                    }
                                },
                                {
                                    title: 'Level',
                                    field: 'logLevel',
                                },
                                {
                                    title: 'Endpoint',
                                    field: 'endpoint',
                                },
                                {
                                    title: 'Status',
                                    field: 'statusCode',
                                }
                            ]
                        }
                        // data={query =>
                        //     new Promise((resolve, reject) => {
                        //         let url = process.env.REACT_APP_DOMAIN_DEV + "/retrieveLogs?"
                        //         url += 'per_page=' + query.pageSize;
                        //         url += '&page=' + (query.page);
                        //         fetch(url, {
                        //             method: 'GET',
                        //             headers: {
                        //                 'Accept': 'application/json',
                        //                 'Content-Type': 'application/json',
                        //                 'Authorization': 'Bearer ' + JSON.parse(this.props.userRed).stsTokenManager.accessToken
                        //             }
                        //         })
                        //             .then(response => response.json())
                        //             .then(result => {
                        //                 resolve({
                        //                     data: result.data,
                        //                     page: query.page,
                        //                     totalCount: result.total,
                        //                 })
                        //             })
                        //     })
                        // }
                        data={this.state.logs}
                        options={{
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: [20, 40, 60],
                            columnsButton: true,
                            emptyRowsWhenPaging: false,
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
                        detailPanel={[
                            {
                                tooltip: 'Show More',
                                render: rowData => {
                                    return (
                                        <div style={{padding: '10px'}}>
                                            <p><b>User Id :</b> {rowData.uid}</p>
                                            <p><b>Request Body :</b> {rowData.requestBody}</p>
                                            <p><b>Request Headers :</b> <ShowMoreText
                                                lines={2}
                                                more="Show more"
                                                less="Show less"
                                                expanded={false}
                                                truncatedEndingComponent={"... "}>
                                                {rowData.requestHeaders}
                                            </ShowMoreText></p>
                                            <p><b>Request Args :</b> {rowData.requestArgs}</p>
                                            <p><b>Response:</b> {rowData.jsonResponse}</p>
                                            <p><b>Error:</b> {rowData.errorMessage}</p>
                                        </div>
                                    )
                                },
                            },
                        ]}
                    />
                </div>
            );
        }
    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user']
    }
};


export default connect(mapStateToProps)(withSnackbar(Logs));
