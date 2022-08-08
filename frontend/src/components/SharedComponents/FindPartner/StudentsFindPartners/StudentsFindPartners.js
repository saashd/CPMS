import React from 'react';
import TableComponent from "../TableComponent";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../../Services/mySqlServices";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class StudentsFindPartners extends React.Component {
    constructor() {
        super();
        this.state = {
            error: null,
            isLoaded: false,
            currentRequests: [],
            columns: [
                {
                    title: 'Student Name',
                    field: 'student',
                    render: rowData => {
                        return rowData.student.engFirstName + ' ' + rowData.student.engLastName
                    }
                },
                {
                    title: 'Cell Phone',
                    field: 'student',
                    render: rowData => {
                        return rowData.student.cellPhone
                    }

                },
                {
                    title: 'Email',
                    field: 'student',
                    render: rowData => {
                        return rowData.student.email
                    }

                }
            ]

        };


    }

    componentDidMount() {
        getAllEntities('studentsFindPartners')
            .then((response) => {
                this.setState({
                    currentRequests: response,
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
            return (
                <TableComponent data={this.state.currentRequests}
                                columns={this.state.columns}
                                endpoint={'studentsFindPartners'}
                                title='Students Looking For Partner'
                                tooltipAdd='Add Yourself'
                                tooltipRemove='Remove Yourself'
                />
            );
        }
    }
}

export default StudentsFindPartners
