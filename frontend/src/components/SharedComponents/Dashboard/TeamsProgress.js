import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllEntities} from "../../Services/mySqlServices";
import {ArgumentAxis, BarSeries, Chart, Legend, Title, ValueAxis} from '@devexpress/dx-react-chart-material-ui';
import {Animation, ValueScale} from '@devexpress/dx-react-chart';
import makeStyles from "@material-ui/core/styles/makeStyles";
import {scaleLinear} from "@devexpress/dx-chart-core";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles({
    root: {
        width: "100%",
        textAlign: "center"
    }
});

const XLabel = () => {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <h4>Teams</h4>
        </div>
    );
};
const YLable = () => {
    return (
        <div>
            <h4># Files</h4>
        </div>
    );
};

export default class TeamsProgress extends React.PureComponent {
    constructor(props) {
        super(props);
        this.scale = scaleLinear();
        this.scale.ticks = () => [...Array(1000).keys()];
        this.state = {
            data: null,
            isLoaded: false,
            error: null
        };
    }

    componentDidMount() {
        let teams = [];
        let promises = [];
        promises.push(
            getAllEntities('teamsFiles',).then((result) => {
                teams = result;
            }));
        Promise.all(promises).then(() => {
            let data = [];
            for (let t of teams) {
                data.push({team: t.id, count: t.files ? t.files.length : 0})
            }
            let result = data.reduce(function (r, a) {
                r[a.count] = r[a.count] || [];
                let key = a.count.toString();
                r[key].push(a);
                return r;
            }, Object.create(null));

            data = [];
            for (let key in result) {
                data.push({numOfFiles: key, teams: result[key].length})
            }
            data = data.sort((a, b) => (parseInt(a.numOfFiles) > parseInt(b.numOfFiles)) ? 1 : -1)
            this.setState({
                data: data,
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
                <Paper>
                    <Chart
                        rotated={true}
                        height={300}
                        data={this.state.data}
                    >
                        <ArgumentAxis/>
                        <ValueScale factory={() => this.scale}/>
                        <ValueAxis max={7}/>
                        <BarSeries
                            valueField="teams"
                            argumentField="numOfFiles"
                            color={'#f95d6a'}
                        />
                        <Title
                            text="Files submission in current semester"
                        />
                        <Animation/>
                        <Legend position="bottom" rootComponent={XLabel}/>
                        <Legend position="left" rootComponent={YLable}/>
                    </Chart>
                </Paper>
            );
        }
    }
}
