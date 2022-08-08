import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import ReactApexChart from "react-apexcharts";
import {getUsersByType} from "../../Services/usersService";

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
                colors: ['#b2dfdb','#80cbc4','#4db6ac','#26a69a'],
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
                        ['Students'],
                        ['Academic', 'Advisors'],
                        ['Industrial', 'Advisors'],
                        ['Both types']],
                    labels: {
                        style: {
                            colors: ['black'],
                            fontSize: '12px'
                        }
                    }
                },
                title: {
                    text: 'Registered Users',
                    floating: true,
                    align: 'center',
                    style: {
                        color: '#444'
                    }
                }
            },


        };
    }

    componentDidMount() {
        let allStudents = [];
        let industrialAdvisrors = [];
        let academicAdvisrors = [];
        let advisorOfBothTypes = [];
        let promises = [];
        promises.push(
            getUsersByType('student')
                .then((students) => {
                    allStudents = students.length;
                }));
        promises.push(
            getUsersByType('academic')
                .then((advisors) => {
                    academicAdvisrors = advisors.length;
                })
        );
        promises.push(
            getUsersByType('industrial')
                .then((advisors) => {
                    industrialAdvisrors = advisors.length;
                })
        );
        promises.push(
            getUsersByType('both')
                .then((advisors) => {
                    advisorOfBothTypes = advisors.length;
                })
        );
        Promise.all(promises).then(() => {
            let series = [{
                data: [allStudents, academicAdvisrors, industrialAdvisrors,advisorOfBothTypes]
            }];
            this.setState({
                series: series,
                isLoaded: true
            });

        }).catch(error => this.setState({error: error}));

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