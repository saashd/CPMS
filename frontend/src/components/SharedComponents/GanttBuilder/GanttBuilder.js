import React from 'react';
import 'date-fns';
import {withSnackbar} from "notistack";
import Chart from "react-google-charts";
import {getAllFBEntities} from "../../Services/firebaseServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import {getEntitiesByIDs, retrieveFiles} from "../../Services/mySqlServices";
import {connect} from "react-redux";
import {getUsersByFireBaseIDs} from "../../Services/usersService";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

const styles = theme => ({
    selectFields: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            display: 'flex',
            flexWrap: 'wrap',
        },
        '&.MuiBox-root': {
            width: '100%'
        },
    },
});

const shallowequal = require("shallowequal");

class UserDetails extends React.Component {
    constructor() {
        super();
        this.state = {
            template: null,
            tasks: [],
            isLoaded: false,
            error: null

        };

    }


    //Checks if user has team and project.
    //If so, retreived submitted files and file template, returns task array.
    componentDidMount() {
        let userRed = JSON.parse(this.props.userRed);
        let obj = {ids: [userRed.uid]};
        getUsersByFireBaseIDs(obj).then(result => {
            if ('teamId' in result[userRed.uid]) {
                const teamId = (result[userRed.uid]).teamId;
                let template = [];
                let tasks = [[
                    {type: 'string', label: 'Task ID'},
                    {type: 'string', label: 'Task Name'},
                    {type: 'date', label: 'Start Date'},
                    {type: 'date', label: 'End Date'},
                    {type: 'number', label: 'Duration'},
                    {type: 'number', label: 'Percent Complete'},
                    {type: 'string', label: 'Dependencies'},
                ]];
                let teamParams = {ids: [teamId]};
                getEntitiesByIDs(teamParams, 'retrieve/teams', true)
                    .then(teamArr => {
                        if (teamArr[0].projectId !== null) {
                            let filesParams = {"projectId": teamArr[0].projectId};
                            retrieveFiles(filesParams)
                                .then((files) => {
                                    let projectFiles = files;
                                    getAllFBEntities('fileTemplates')
                                        .then((templates) => {
                                            let currentFileTemplate = templates.filter(item => item.isCurrent === true)[0];
                                            if ('template' in currentFileTemplate) {
                                                template = Object.values(currentFileTemplate.template);
                                                //filter template to remove tasks whose deadline date expired.
                                                template = template.filter(item => new Date(item.deadline).getTime() >= new Date().getTime());
                                                for (let i = 0; i < template.length; i++) {
                                                    let prevTaskId = null;
                                                    let startDate = null;
                                                    let endDate = new Date(template[i].deadline);
                                                    if (template[i - 1]) {
                                                        if (new Date(template[i - 1].deadline).getTime() < new Date(template[i].deadline).getTime()) {
                                                            prevTaskId = template[i - 1].id;
                                                            startDate = new Date(template[i - 1].deadline);
                                                        }
                                                    }
                                                    let percents = projectFiles.some(obj => obj.fileComponentId === template[i].id) ? 100 : 0;
                                                    tasks.push([
                                                        template[i].id,
                                                        template[i].name,
                                                        startDate,
                                                        endDate,
                                                        null,
                                                        percents,
                                                        prevTaskId,
                                                    ])
                                                }
                                                this.setState({
                                                    tasks: tasks,
                                                    template: template,
                                                    isLoaded: true,
                                                });
                                            } else {
                                                this.setState({isLoaded: true})
                                            }
                                        }).catch((error) => {
                                        this.setState({error: error});
                                    });

                                }).catch((error) => {
                                this.setState({error: error});
                            });
                        } else {
                            this.setState({isLoaded: true})
                        }
                    }).catch((error) => {
                    this.setState({error: error});
                });

            } else {
                this.setState({isLoaded: true})
            }
        }).catch((error) => {
            this.setState({error: error})
        });

    };

    shouldComponentUpdate(nextProps, nextState) {
        return !shallowequal(nextProps, this.props) || !shallowequal(nextState, this.state);
    }


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
        } else if (!this.state.template) {
            return (
                <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '10%'}}>
                    <Typography
                        style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                        No Team\Project Assigned </Typography>
                </Paper>)
        } else {
            return (

                <div style={{padding: '1%'}}>
                    <Chart
                        width={'90vw'}
                        height={'75vh'}
                        chartType="Gantt"
                        loader={<div>Loading Chart</div>}
                        data={this.state.tasks}
                        options={{
                            gantt: {
                                criticalPathEnabled: true,

                            },
                        }}
                        rootProps={{'data-testid': '1'}}
                    />
                </div>
            );
        }
    }

}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
    }
};
export default connect(mapStateToProps)(withSnackbar(UserDetails))

