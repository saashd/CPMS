import React, {useEffect, useRef} from 'react';
import MaterialTable from 'material-table';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import PersonAddDisabledIcon from '@material-ui/icons/PersonAddDisabled';
import {connect} from "react-redux";
import {addEntity, removeEntity} from "../../Services/mySqlServices";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import DeleteIcon from '@material-ui/icons/Delete';
import CircularProgress from "@material-ui/core/CircularProgress";
import tableConfig from "../../config";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";


function TableComponent(props) {
    const {useState} = React;
    const tableRef = useRef();
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [enpoint] = useState(props.endpoint);
    const [columns] = useState(props.columns);
    const [data, setData] = useState(props.data);
    const [myRequest, setRequest] = useState({student: JSON.parse(props.userRed).uid});
    const [userDetails, setDetails] = useState(null);
    useEffect(() => {
        if (userDetails === null) {
            let obj = {ids: [JSON.parse(props.userRed).uid]};
            getUsersByFireBaseIDs(obj).then(result => {
                setDetails(result[JSON.parse(props.userRed).uid]);
                setIsLoaded(true);
            }).catch(error => setError(error))
        }
    }, [userDetails, props.userRed]);

    /**
     * Create new request according to request object and endpoint passed to the TableComponent component
     * @return error message or created entity id
     */
    const handleAdd = () => {
        return addEntity(myRequest, enpoint)
            .then((response) => {
                setRequest({id: response, student: JSON.parse(props.userRed).uid});
                let requests = [...data];
                requests.push({id: response, student: userDetails});
                setData(requests);
                return Promise.resolve(response);

            }).catch((error) => {
                setError(error);
                return Promise.reject(error);
            });
    };


    /**
     * removes request from the requests array.
     */
    const handleRemove = () => {
        let requests = [...data];
        let i = requests.findIndex(obj => obj.student.firebase_user_id === myRequest.student);
        removeEntity(requests[i], enpoint).then((response) => {
            requests.splice(i, 1);
            setData(requests);

        }).catch((error) => {
            setError(error);
        });
    };


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
        const studentActions = [{
            name: "RemoveYourself",
            icon: props => (
                <PersonAddDisabledIcon
                    style={{fontSize: 40, color: '#e91e63'}}
                />),
            tooltip: props.tooltipRemove,
            position: "toolbar",
            onClick: (handleRemove),
            hidden: (!data.some(e => e.student.firebase_user_id === myRequest.student) || props.adminViewRed)
        },
            {
                name: "AddYourself",
                icon: props => (
                    <PersonAddIcon
                        style={{fontSize: 40, color: '#4caf50'}}
                    />),
                tooltip: props.tooltipAdd,
                position: "toolbar",
                onClick: (handleAdd),
                hidden: (data.some(e => e.student.firebase_user_id === myRequest.student) || !userDetails.teamId || props.adminViewRed)
            }
        ];
        const adminActions = [
            {
                name: 'rejectRequest',
                icon: () => (<DeleteIcon style={{color: '#e91e63'}}/>),
                tooltip: 'Remove Request',
                position: "row",
                onClick:
                    (event, rowData) =>
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                removeEntity(rowData, enpoint).then((response) => {
                                    let requests = [...data];
                                    let i = requests.findIndex(obj => obj.id === rowData.id);
                                    requests.splice(i, 1);
                                    setData(requests);
                                }).catch((error) => {
                                    setError(error)
                                });
                                resolve();
                            }, 1000);
                        }),
                hidden: !(userDetails.user_type === 'admin' || props.adminViewRed)
            },
        ];

        return (
            <div>
                <div
                    dangerouslySetInnerHTML={{__html: "<style>.MuiTableRow-root:hover{ background: #f5f5f5 !important }"}}></div>
                <MaterialTable
                    tableRef={tableRef}
                    title={<div style={{display: 'flex', textAlign: 'center'}}><h2>{props.title} <br/>
                        <span
                            style={{
                                color: '#e91e63',
                                whiteSpace: 'pre-line',
                                display: (!props.adminViewRed && !userDetails.teamId) && (enpoint === 'teamsFindPartners' || enpoint === 'studentsFindPartners') ? 'inline' : 'none'
                            }}> You have no teams to place request</span></h2></div>}
                    columns={columns}
                    actions={props.adminViewRed ? adminActions : studentActions}
                    data={data}
                    options={{
                        cellStyle: tableConfig.cellStyle,
                        pageSize: tableConfig.initPageSize,
                        pageSizeOptions: tableConfig.calcPageSize(data.length),
                        paging: false,
                        actionsColumnIndex: -1,
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

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};
export default connect(mapStateToProps)(TableComponent);
