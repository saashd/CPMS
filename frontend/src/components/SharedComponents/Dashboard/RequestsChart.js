import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../Services/mySqlServices";
import Typography from "@material-ui/core/Typography";
import ReactApexChart from "react-apexcharts";

export default class RequestsChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoaded: false,
            error: null,
            series: null,
            options: {
                chart: {
                    height: 350,
                    type: 'bar',
                    events: {
                        click: function (chart, w, e) {
                        }
                    }
                },
                colors: ['#c5cae9','#9fa8da', '#7986cb','#5c6bc0'],
                plotOptions: {
                    bar: {
                        columnWidth: '45%',
                        distributed: true,
                    }
                },
                dataLabels: {
                    enabled: false
                },
                legend: {
                    show: false
                },
                xaxis: {
                    categories: [
                        ['Delay', 'Requests'],
                        ['Projects', 'Proposals'],
                        ['Team-Project', 'Requests']],
                    labels: {
                        style: {
                            colors: ['black'],
                            fontSize: '12px'
                        }
                    }
                },
                title: {
                    text: 'Unanswered requests',
                    floating: true,
                    align: 'center',
                    style: {
                        color: '#444'
                    }
                }
        },


    };
}

componentDidMount()
{
    let delayRequests = 0;
    let projectProposals = 0;
    let teamsProjectsRequests = 0;
    let promises = [];
    promises.push(
        getAllEntities('delayRequests')
            .then((response) => {
                response = response.filter(obj => {
                    return obj.status === null
                });
                delayRequests = response.length;
            }));
    promises.push(
        getAllEntities('projectProposals')
            .then((response) => {
                projectProposals = response.length;
            }));
    promises.push(
        getAllEntities('teamsProjectsRequests')
            .then((response) => {
                response = response.filter(obj => {
                    return obj.adminStatus === null
                });
                teamsProjectsRequests = response.length;
            }));
    Promise.all(promises).then(() => {
        let series = [{
            data: [delayRequests, projectProposals, teamsProjectsRequests]
        }];
        this.setState({
            series: series,
            isLoaded: true
        });
    }).catch(error => this.setState({error: error}));

}

render()
{
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
            <div id="chart">
                <ReactApexChart height={300} options={this.state.options} series={this.state.series} type="bar"/>
            </div>

        );
    }
}
}
