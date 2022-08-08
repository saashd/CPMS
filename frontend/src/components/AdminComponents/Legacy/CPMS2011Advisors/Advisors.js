import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../Services/mySqlServices";
import MaterialTable from "material-table";
import {withSnackbar} from "notistack";
import tableConfig from "../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class Advisors extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            organizationsLookup: null,
            error: null,
            isLoaded: false,
            advisors: null

        };
    }

    componentDidMount() {
        getAllEntities('personel_cpms2011')
            .then((response) => {
                this.setState({
                    advisors: response, isLoaded: true
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
                <div style={{textAlign: 'center'}}>
                    <CircularProgress/>
                </div>);
        } else {
            const tableRef = React.createRef();
            return (
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={"List Of Advisors from CPMS2011 System"}
                        columns={
                            [
                                {
                                    title: 'ID',
                                    field: 'id',
                                },
                                {
                                    title: 'Prefix',
                                    field: 'prefix',
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
                                },
                                {
                                    title: 'Type',
                                    field: 'advisorType',
                                }
                            ]
                        }
                        data={this.state.advisors}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.advisors.length),
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
                    />
                </div>
            );
        }
    }
}


export default withSnackbar(Advisors);
