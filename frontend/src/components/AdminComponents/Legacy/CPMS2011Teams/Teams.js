import React from 'react';
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../Services/mySqlServices";
import MaterialTable from "material-table";
import tableConfig from "../../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class Teams extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            teams: null,
            columns: [
                {
                    title: 'Team ID',
                    field: 'id',
                },
                {
                    title: "Team's Students",
                    field: 'students',

                },
            ]

        };

    }

    componentDidMount() {
        getAllEntities('teams_cpms2011')
            .then((response) => {
                this.setState({
                    teams: response,
                    isLoaded: true,
                });

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
            return (
                <div>
                    <div
                        dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                    <MaterialTable
                        tableRef={tableRef}
                        title={'Teams from CPMS2011 System'}
                        columns={this.state.columns}
                        data={this.state.teams}
                        options={{
                            cellStyle: tableConfig.cellStyle,
                            pageSize: tableConfig.initPageSize,
                            pageSizeOptions: tableConfig.calcPageSize(this.state.teams.length),
                            emptyRowsWhenPaging: false,
                            sorting: true,
                            filtering: true,
                            exportButton: {csv: true},
                            exportAllData: true,
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

export default Teams;
