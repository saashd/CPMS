import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import {getAllEntities} from "../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import ReactApexChart from "react-apexcharts";

export default class ProjectsChart extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoaded: false,
            error: null,
            series: null,
            options: {
                chart: {
                    width: '100%',
                    type: 'pie',
                },
                labels: ["Available", "Active", "On Hold", "Complete"],
                theme: {
                    monochrome: {
                        enabled: true
                    }
                },
                plotOptions: {
                    pie: {
                        dataLabels: {
                            offset: -5
                        }
                    }
                },
                title: {
                    text: "Projects by Status",
                    floating: true,
                    align: 'center',
                     offsetY: -5,
                    style: {
                        color: '#444'
                    }
                },
                dataLabels: {
                    formatter(val, opts) {
                        const name = opts.w.globals.labels[opts.seriesIndex]
                        return [name, val.toFixed(1) + '%']
                    }
                },
                legend: {
                    show: false
                },
            },


        };
    }

    renderData = (projects) => {
        let availableTot = 0;
        let activeTot = 0;
        let onHoldTot = 0;
        let completeTot = 0;
        for (let project of projects) {
            if (project.status === 'Available') {
                availableTot += 1
            }
            if (project.status === 'Active') {
                activeTot += 1
            }
            if (project.status === 'On Hold') {
                onHoldTot += 1
            }
            if (project.status === 'Complete') {
                completeTot += 1
            }

        }
        return [availableTot, activeTot, onHoldTot, completeTot]
    };

    componentDidMount() {
        getAllEntities('projects')
            .then((response) => {
                let renderedProjects = this.renderData(response);
                this.setState({
                    series: renderedProjects,
                    isLoaded: true
                });
            }).catch((error) => {
            this.setState({error: error});
        });
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
                    <ReactApexChart height={300} options={this.state.options} series={this.state.series} type="pie"/>
            );
        }
    }
}