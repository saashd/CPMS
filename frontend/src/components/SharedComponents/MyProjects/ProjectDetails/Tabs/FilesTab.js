import React from "react";
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import {Button} from "@material-ui/core";
import DescriptionIcon from "@material-ui/icons/Description";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from "@material-ui/core/Tooltip";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import {editFBEntity, getAllFBEntities} from "../../../../Services/firebaseServices";
import {withSnackbar} from "notistack";
import {downloadFile, removeFile, retrieveFiles, updateFile, uploadFile} from "../../../../Services/mySqlServices";
import Card from "@material-ui/core/Card";
import DateFnsUtils from '@date-io/date-fns';
import {connect} from "react-redux";
import {MuiPickersUtilsProvider} from "material-ui-pickers";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import UpdateIcon from '@material-ui/icons/Update';
import DialogTitle from "@material-ui/core/DialogTitle";

class FilesTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currFileTemplate: null,
            currentEditableProject: this.props.currentEditableProject,
            isLoaded: false,
            error: null,
            filesPart1: null,
            filesPart2: null,
            filesPart3: null,
            filesPart4: null,
            files: null,
            updatedFiles: {},
            buttonLoading: false,
            uploadButtonLoading: false,
            componentToChange: null,
            changeDeadline: false
        };
    };

    changefileDeadline = () => {
        let componentToChange = {...this.state.componentToChange};
        let fileTemp = {...this.state.projectsUnrenderedFileTemplate};
        let temp = fileTemp.template;
        for (let idx in temp) {
            if (temp[idx].id === componentToChange.fileComponentId) {
                temp[idx].deadline = componentToChange.fileDeadline;
            }
        }

        editFBEntity(fileTemp, 'filesTemplatePerTeam', {projectId: this.state.currentEditableProject.id})
            .then((response) => {
                this.setState({currFileTemplate: fileTemp, changeDeadline: false});
                this.props.enqueueSnackbar("You Updated Deadline", {variant: 'success'});
                this.fetchAndRenderData();
            }).catch((error) => {
            this.setState({error: error});
        });

    };

    fetchAndRenderData() {
        let promises = [];
        let currFileTemplate = {};
        let projectFiles = [];
        let params = {"projectId": this.state.currentEditableProject.id};

        promises.push(getAllFBEntities('filesTemplatePerTeam', params)
            .then((response) => {
                currFileTemplate = {...response};
                this.setState({projectsUnrenderedFileTemplate: response})

            }));
        promises.push(
            retrieveFiles(params)
                .then((response) => {
                    projectFiles = response;
                    this.setState({files: projectFiles});
                })
        );
        Promise.all(promises).then(() => {
            promises = [];
            let fileTemplate = {...currFileTemplate};
            fileTemplate.template = fileTemplate.template ? Object.values(fileTemplate.template) : [];
            let filesPart1 = [];
            let filesPart2 = [];
            let filesPart3 = [];
            let filesPart4 = [];
            for (let fileComponent of fileTemplate.template) {
                if (fileComponent.stage === '1') {
                    filesPart1.push(
                        {
                            fileComponentId: fileComponent.id,
                            fileComponenName: fileComponent.name,
                            fileDeadline: fileComponent.deadline
                        }
                    )
                } else if (fileComponent.stage === '2') {
                    filesPart2.push(
                        {
                            fileComponentId: fileComponent.id,
                            fileComponenName: fileComponent.name,
                            fileDeadline: fileComponent.deadline
                        }
                    )
                } else if (fileComponent.stage === '3') {
                    filesPart3.push(
                        {
                            fileComponentId: fileComponent.id,
                            fileComponenName: fileComponent.name,
                            fileDeadline: fileComponent.deadline
                        }
                    )
                } else if (fileComponent.stage === '4') {
                    filesPart4.push(
                        {
                            fileComponentId: fileComponent.id,
                            fileComponenName: fileComponent.name,
                            fileDeadline: fileComponent.deadline
                        }
                    )
                }
            }
            fileTemplate.template.map(o => o.fileComponentId = null);
            Promise.all(promises).then(() => {
                let fileTemplate = {...currFileTemplate};
                fileTemplate.template = fileTemplate.template ? Object.values(fileTemplate.template) : [];

                this.setState({
                    currFileTemplate: fileTemplate,
                    isLoaded: true,
                    filesPart1: filesPart1,
                    filesPart2: filesPart2,
                    filesPart3: filesPart3,
                    filesPart4: filesPart4
                })
            }).catch((error) => {
                this.setState({error: error})
            });
        }).catch((error) => {
            this.setState({error: error})
        })
    }

    componentDidMount() {
        this.fetchAndRenderData()
    };

    setFile = (event, fileComponentId) => {
        let file = event.target.files[0];
        let files = {...this.state.updatedFiles};
        files[fileComponentId] = file;
        this.setState({updatedFiles: files});
        this.forceUpdate()
    };

    /**
     * Calls to uploadFile or update File function (depending on if file already exists in db).
     * Passes to function properties of a file.
     * @param fileComponentId
     * @param fileDeadline
     */
    upload = (fileComponentId, fileDeadline) => {
        this.setState({uploadButtonLoading: true});
        fileDeadline = new Date(fileDeadline).toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        let submissionDate = new Date().toLocaleString("en-CA", {hour12: false}).replace(/,/, '');
        if (new Date(fileDeadline).getTime() < new Date(submissionDate).getTime() && !(JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed)) {
            alert('You are trying to submit after the deadline.');
            this.setState({uploadButtonLoading: false});
            return;
        }
        let files = {...this.state.updatedFiles};
        let file = files[fileComponentId];
        if (!file) {
            this.setState({uploadButtonLoading: false});
            return;
        }
        let formData = new FormData();
        let result = this.state.files.filter(obj => {
            // this.setState({ buttonLoading: false });
            return (obj.fileComponentId === fileComponentId && obj.projectId === this.state.currentEditableProject.id)
        })[0];
        if (result) {
            formData.append("file", file, file.name);
            formData.append("projectId", this.state.currentEditableProject.id);
            formData.append("id", result['id']);
            formData.append("deadline", fileDeadline);
            formData.append("submissionDate", submissionDate);
            updateFile(formData).then(result => {
                retrieveFiles({"projectId": this.state.currentEditableProject.id}).then((response) => {
                    this.setState({files: response});
                    this.props.enqueueSnackbar('File Uploaded Successfully', {variant: 'success'});
                }).catch((error) => {
                    this.setState({error: error})
                }).finally(() => {
                    this.setState({uploadButtonLoading: false})
                });
            }).catch(error => {
                this.setState({error: error})
            });
        } else {
            formData.append("file", file, file.name);
            formData.append("projectId", this.state.currentEditableProject.id);
            formData.append("fileComponentId", fileComponentId);
            formData.append("deadline", fileDeadline);
            formData.append("submissionDate", submissionDate);
            uploadFile(formData).then(result => {
                retrieveFiles({"projectId": this.state.currentEditableProject.id}).then((response) => {
                    this.setState({files: response});
                    this.props.enqueueSnackbar('File Uploaded Successfully', {variant: 'success'});
                }).catch((error) => {
                    this.setState({error: error})
                }).finally(() => {
                    this.setState({uploadButtonLoading: false})
                });
            }).catch(error => {
                this.setState({error: error})
            });
        }

    };

    /**
     * Calles to removeFile and passes to it properties of file to remove.
     * @param fileComponentId
     */
    deleteFile = (fileComponentId) => {
        let formData = new FormData();
        formData.append("projectId", this.state.currentEditableProject.id);
        formData.append("fileComponentId", fileComponentId);
        removeFile(formData).then(result => {
            let files = [...this.state.files];
            let i = files.findIndex(obj => obj.fileComponentId === fileComponentId);
            files.splice(i, 1);
            this.setState({files: files});
            this.props.enqueueSnackbar('File Deleted Successfully', {variant: 'success'});
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
        downloadFile(filePathToDownload, fileName, this.state.currentEditableProject.id).then(result => {
        }).catch(error => {
            this.setState({error: error})
        }).finally(() => {
            this.setState({buttonLoading: false})
        });

    };


    /**
     * Checks if file object exists in files array.If exists, returns array that contains file name and path to it.
     * @param fileComponentId
     * @param deleteOption if user has permission
     * @return {[*, string]|[null, string]}
     */
    checkIfFileExists = (fileComponentId, deleteOption) => {
        let file = this.state.files.filter(obj => {
            return obj.fileComponentId === fileComponentId
        })[0];
        if (file) {
            let buffer = [];
            buffer.push(<Button style={{paddingLeft: '5%'}}
                                id='file'
                                color="primary"
                                onClick={() => this.downloadFile(file.url, file.name)}
                                disabled={this.state.buttonLoading}>
                <DescriptionIcon/> {file.name}&nbsp;
                {this.state.buttonLoading && <CircularProgress size={14}/>}
            </Button>);
            if (deleteOption) {
                buffer.push(<Tooltip title="Delete">
                    <IconButton aria-label="delete" color={"secondary"}
                                onClick={() => this.deleteFile(fileComponentId)}>
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>);
            }
            return buffer;
        } else {
            return null;
        }
    };

    render() {
        const stagesArr = [this.state.filesPart1, this.state.filesPart2, this.state.filesPart3, this.state.filesPart4]
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
                <div>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-around'
                        }}>
                        </div>
                        <Grid container spacing={3} justify="center">
                            {stagesArr.filter(e => e.length !== 0).map((filesArr) => (
                                <Grid key={stagesArr.findIndex(element => element === filesArr)} container
                                      direction="row">
                                    <Typography style={{textAlign: 'center', padding: 10}} variant="h6" component="h2">
                                        Project Files Part {stagesArr.findIndex(element => element === filesArr) + 1}
                                    </Typography>
                                    <Grid
                                        container
                                        direction="row"
                                        spacing={3}
                                        alignItems="stretch">
                                        {filesArr.map((option) => (
                                            <Grid key={option.fileComponentId} item xs={4} style={{display: 'flex'}}>
                                                <Card style={{
                                                    backgroundColor: '#f5f5f538',
                                                    padding: 20,
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    flexDirection: 'column'
                                                }}>
                                                    <h3 style={{
                                                        display: 'flex',
                                                        justifyContent: 'center'
                                                    }}>{option.fileComponenName}</h3>
                                                    {JSON.parse(this.props.adminViewRed) ?
                                                        <div style={{display: 'flex'}}>
                                                            <p style={{
                                                                alignSelf: 'flex-start', marginRight: "5%"
                                                            }}>{option.fileDeadline ? 'Submission till: ' + new Date(option.fileDeadline).toLocaleString('en-GB', {timeZone: 'Asia/Jerusalem'}) : ''}</p>


                                                            <Button style={{
                                                                alignSelf: 'flex-end',
                                                                width: 'fitContent',
                                                                marginBottom: "2%",
                                                                marginLeft: "5%"
                                                            }}
                                                                    size="small"
                                                                    onClick={() => this.setState({
                                                                        changeDeadline: true,
                                                                        componentToChange: option
                                                                    })}>
                                                                <UpdateIcon fontSize="small"/> Change
                                                                Deadline
                                                            </Button>

                                                        </div>
                                                        :
                                                        <p style={{
                                                            alignSelf: 'center'
                                                        }}>{option.fileDeadline ? 'Submission till: ' + new Date(option.fileDeadline).toLocaleString('en-GB', {timeZone: 'Asia/Jerusalem'}) : ''}</p>
                                                    }


                                                    {JSON.parse(this.props.userRed).user_type !== 'advisor' || (JSON.parse(this.props.userRed).user_type === 'advisor' && JSON.parse(this.props.adminViewRed)) ?
                                                        <div>
                                                            <div>
                                                                <input type="file" name="file" id="file"
                                                                       onChange={(e) => this.setFile(e, option.fileComponentId)}/>

                                                                <Tooltip title="Upload">
                                                                    <IconButton
                                                                        aria-label="upload" color={"primary"}
                                                                        onClick={() => this.upload(option.fileComponentId, option.fileDeadline)}
                                                                        disabled={this.state.uploadButtonLoading}>
                                                                        <CloudUploadIcon fontSize="small"
                                                                                         onClick={() => this.setState({uploadButtonLoading: true})}/>&nbsp;
                                                                        {this.state.uploadButtonLoading &&
                                                                        <CircularProgress size={14}/>}
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </div>
                                                            <div> {this.checkIfFileExists(option.fileComponentId, true)} </div>
                                                        </div> :
                                                        <div>{this.checkIfFileExists(option.fileComponentId, false)}</div>
                                                    }

                                                </Card>
                                            </Grid>))}
                                    </Grid>
                                </Grid>
                            ))}
                        </Grid>
                    </MuiPickersUtilsProvider>
                    <Dialog
                        maxWidth={'xs'}
                        open={this.state.changeDeadline} onClose={() => {
                        this.setState({changeDeadline: false})
                    }}
                        aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={() => {
                                this.setState({changeDeadline: false})
                            }}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogTitle>
                            <Typography style={{textAlign: 'center'}} variant="h6"
                                        component="h3">{this.state.componentToChange ? this.state.componentToChange.fileComponenName : ''}</Typography>
                        </DialogTitle>
                        <DialogContent>
                            <div style={{textAlign: 'center', display: 'grid'}}>
                                <TextField
                                    onChange={
                                        (e, value) => {
                                            let componentToChange = {...this.state.componentToChange};
                                            componentToChange.fileDeadline = e.target.value.replace('T', ' ') + ":00";
                                            this.setState({componentToChange: componentToChange})

                                        }}
                                    id="deadline"
                                    label={"Submission till:"}
                                    name="deadline"
                                    type="datetime-local"
                                    value={this.state.componentToChange ? this.state.componentToChange.fileDeadline.replace(' ', 'T') : ''}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                                <div style={{paddingTop: "10%"}}>
                                    <Button variant="contained" color="primary"
                                            onClick={this.changefileDeadline}>Update</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

            );
        }
    }
}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};
export default connect(mapStateToProps)(withSnackbar(FilesTab))