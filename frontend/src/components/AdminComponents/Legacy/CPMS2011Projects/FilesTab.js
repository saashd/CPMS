import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import {Button} from "@material-ui/core";
import DescriptionIcon from "@material-ui/icons/Description";
import {downloadFile, retrieveFilesFormCPMS2011} from "../../../Services/mySqlServices";
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider} from "material-ui-pickers";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

class FilesTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentProject: this.props.currentProject,
            isLoaded: false,
            error: null,
            files: null,
            buttonLoading: false
        };
    };


    componentDidMount() {
        let params = {"projectId": this.props.currentProject.id};
        retrieveFilesFormCPMS2011(params)
            .then((response) => {
                this.setState({files: response, isLoaded: true});
            }).catch((error) => {
            this.setState({error: error})
        })
    };

    /**
     * Calls to downloadFile service and passing to it properties of the file to download.
     * @param filePathToDownload
     * @param fileName
     */
    downloadFile = (filePathToDownload, fileName) => {
        this.setState({buttonLoading: true});
        if (!filePathToDownload) {
            this.setState({buttonLoading: false});
            return;
        }
        downloadFile(filePathToDownload, fileName, null).then(result => {
        }).catch(error => {
            this.setState({error: error})
        }).finally(() => {
            this.setState({buttonLoading: false})
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
            return <div style={{textAlign: 'center'}}>
                <CircularProgress/>
            </div>;
        } else {
            return (
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-around'
                    }}>
                    </div>
                    <Grid container spacing={3} justify="center">
                        <Grid
                            container
                            direction="row"
                            spacing={3}
                            alignItems="stretch">
                            {this.state.files.map((file) => (
                                <Grid key={file.name} item xs={4} style={{display: 'flex'}}>
                                    <Card style={{
                                        backgroundColor: '#f5f5f538',
                                        padding: 20,
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        flexDirection: 'column',
                                        overflow:'overlay'
                                    }}>
                                        <h3 style={{
                                            display: 'flex',
                                            justifyContent: 'center'
                                        }}>{file.title}</h3>
                                        <div>
                                            <Button style={{paddingLeft: '5%'}}
                                                    id='file'
                                                    color="primary"
                                                    onClick={() => this.downloadFile(require('path').join('static/uploads/CPMS2011_Projects_Files', file.project_id, file.title, file.name), file.name)}
                                                    disabled={this.state.buttonLoading}>
                                                <DescriptionIcon/> {file.name}&nbsp;
                                                {this.state.buttonLoading && <CircularProgress size={14}/>}
                                            </Button>
                                        </div>
                                    </Card>
                                </Grid>))}
                        </Grid>
                    </Grid>

                </MuiPickersUtilsProvider>
            );
        }
    }
}

export default FilesTab