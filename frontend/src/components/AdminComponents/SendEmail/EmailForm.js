import React from "react";
import {convertToRaw, EditorState} from 'draft-js';
import {Editor} from 'react-draft-wysiwyg';
import {Button,} from "@material-ui/core";
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import "./styles.css"
import InputAdornment from "@material-ui/core/InputAdornment";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from '@material-ui/icons/Delete';
import DialogActions from "@material-ui/core/DialogActions";
import Chip from "@material-ui/core/Chip";
import axios from "axios";
import {getUsersByType} from "../../Services/usersService";
import Autocomplete from "@material-ui/lab/Autocomplete";
import {withStyles} from "@material-ui/core/styles";
import {withSnackbar} from "notistack";
import {getAllEntities} from "../../Services/mySqlServices";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
    options: {
        fontSize: 15,
        '& > span': {
            marginRight: 10,
            fontSize: 18,
        }
    },
});


class EmailForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            allUsers: [],
            isFetched: false,
            handleClose: this.props.handleClose,
            recipients: [],
            subject: '',
            editorState: EditorState.createEmpty(),
            selectedFiles: [],
            chipData: null,
            isLoaded: false,
            error: null
        };
    }

    /**
     * Updates email subject on change
     * @param e
     */
    handleChangeSubject = (e) => {
        this.setState({subject: e.target.value});
        this.forceUpdate();
    };

    /**
     * Updates recipients list on change
     * @param e
     * @param value
     */
    handleChangeRecipients = (e, value) => {
        let recipients = value.map(function (el) {
            return el.email || el;
        });
        let uniqueRecipients = [...new Set(recipients)];
        this.setState({recipients: uniqueRecipients});
        this.forceUpdate();
    };

    /**
     * Sends email with all the attachments.
     * @param e
     * @return error or success message
     */
    handleSendEmail = (e) => {
        e.preventDefault();
        let html = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
        let formData = new FormData();
        if (this.state.selectedFiles.length !== 0) {
            for (let file of this.state.selectedFiles) {
                formData.append(file.name, file, file.name);
            }
        }
        formData.append("receivers", this.state.recipients);
        formData.append("subject", this.state.subject);
        formData.append("message", html);
        return axios.post('/sendEmail', formData)
            .then(response => response.data)
            .then(result => {
                if (result['status'] === 'success') {
                    this.props.enqueueSnackbar('Email Sent Successfully', {variant: 'success'});
                    this.state.handleClose();
                    return Promise.resolve(result['message']);
                } else {
                    this.props.enqueueSnackbar('Error Occured While Sending Email', {variant: 'error'});
                    return Promise.reject(result['message']);
                }

            })
            .catch(error => {
                return Promise.reject(error);
            });


    };

    /**
     * Updates attachmnets list.
     * @param event
     */
    onFileChange = event => {
        const files = event.target.files;
        let selectedFiles = [...this.state.selectedFiles];
        for (let i = 0; i < files.length; i++) {
            if (!selectedFiles.some(file => file.name.includes(files[i].name))) {
                selectedFiles.push(files[i])
            }
        }
        this.setState({selectedFiles: selectedFiles});
    };

    /**
     * Updates attachmnets list if some file was removed by user.
     * @param file
     */
    onFileRemove = (file) => {
        let files = [...this.state.selectedFiles];
        files = files.filter(function (obj) {
            return obj.name !== file.name;
        });
        this.setState({selectedFiles: files})


    };

    /**
     * Computes and return size of a file in mB of kB.
     * @param number - file size
     * @return {string}
     */
    returnFileSize(number) {
        if (number < 1024) {
            return number + 'bytes';
        } else if (number >= 1024 && number < 1048576) {
            return (number / 1024).toFixed(1) + 'KB';
        } else if (number >= 1048576) {
            return (number / 1048576).toFixed(1) + 'MB';
        }
    }

    /**
     *  File content to be displayed after file upload is complete
     * @return {*}
     */
    fileData = () => {
        let files = this.state.selectedFiles;
        return (
            <div>
                {files.map((file) => (
                    <Grid container>
                        <Grid item xs={8}>
                            <p style={{
                                overflowX: 'auto',
                                color: '#3f51b5',
                                fontWeight: 'bold'
                            }}>{file.name} [{this.returnFileSize(file.size)}]</p>
                        </Grid>
                        <Grid item xs={4}>
                            <IconButton
                                onClick={() => this.onFileRemove(file)}>
                                <DeleteIcon fontSize={'small'}/>
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}
            </div>

        );
    };

    onEditorStateChange = editorState => {
        this.setState({editorState: editorState});
    };

    /**
     * Extract email property from array of user objects.
     * @param usersArray
     * @return recipients
     */
    getUsersEmails = (usersArray) => {
        let recipients = [];
        for (let user of usersArray) {
            if (user.email) {
                recipients.push(user.email)
            }
        }
        return recipients;
    };

    /**
     * Return array of emails, of recipinets selected by type\course
     * @param type
     * @param courseId
     * @return recipients
     */
    fetchRecipients = (type, courseId = null) => {
        let allUsers = [...this.state.allUsers];
        let recipients = [];
        let promises = [];
        if (type === 'student') {
            promises.push(getAllEntities('semesters')
                .then((semesters) => {
                    let currentSemesterId = semesters.filter(s => s.isCurrent)[0].id;
                    recipients = allUsers.filter(u => {
                        if (parseInt(u.courseId) === parseInt(courseId) && parseInt(u.semesterId) === parseInt(currentSemesterId) && u.user_type === type) {
                            return u
                        }
                        return null
                    });
                }));
        } else {
            promises.push(
                getUsersByType(type)
                    .then((response) => {
                        recipients = response;
                    })
            );
        }
        return Promise.all(promises).then(() => {
            recipients = this.getUsersEmails(recipients);
            return Promise.resolve(recipients)
        }).catch((error) => {
            this.setState({error: error})
        })

    };

    /**
     * Uppends emails from selected chip to already chosen recipinets array
     * @param chipDetails
     * @param recipients
     */
    setRecipients = (chipDetails, recipients) => {
        let existingRecipients = [...this.state.recipients];
        if (!chipDetails.clicked) {
            existingRecipients = existingRecipients.concat(recipients);
            let uniqueRecipients = [...new Set(existingRecipients)];
            this.setState({recipients: uniqueRecipients});
        } else if (chipDetails.clicked) {
            existingRecipients = existingRecipients.filter((el) => !recipients.includes(el));
            let uniqueRecipients = [...new Set(existingRecipients)];
            this.setState({recipients: uniqueRecipients});
        }
        let chips = [...this.state.chipData];
        let chip = chips.filter((chip) => chip.key === chipDetails.key)[0];
        chip.clicked = !chipDetails.clicked;
        this.setState({chipData: chips})
    };

    /**
     * calls to setRecipients() depending on selected chip.
     * @param chipDetails
     */
    handleAddGroupToRecipients = (chipDetails) => () => {
        if (chipDetails.label === 'All Admins') {
            this.fetchRecipients('admin').then(x => {
                this.setRecipients(chipDetails, x)
            })
        } else if (chipDetails.label === 'All Advisors') {
            this.fetchRecipients('advisor').then(x => {
                this.setRecipients(chipDetails, x)
            })

        } else if (chipDetails.label === "Current Semester's Academic Advisors") {
            this.fetchRecipients('currAcademicAdvisor').then(x => {
                this.setRecipients(chipDetails, x)
            })

        } else if (chipDetails.label === "Current Semester's Industrial Advisors") {
            this.fetchRecipients('currIndustrialAdvisor').then(x => {
                this.setRecipients(chipDetails, x)
            })

        } else {
            this.fetchRecipients('student', chipDetails.label).then(x => {
                this.setRecipients(chipDetails, x)
            })
        }
    };

    componentDidMount() {
        return getUsersByType('users')
            .then((users) => {
                getAllEntities('courses')
                    .then((courses) => {
                        let chipData = [{key: 0, label: 'All Admins', clicked: false},
                            {key: 1, label: 'All Advisors', clicked: false},
                            {key: 3, label: "Current Semester's Academic Advisors", clicked: false},
                            {key: 4, label: "Current Semester's Industrial Advisors", clicked: false}];
                        let key = 5;
                        for (let course of courses) {
                            chipData.push({key: key, label: course.id, clisked: false});
                            key += 1;
                        }
                        this.setState({chipData: chipData, allUsers: users, isLoaded: true})
                    }).catch((error) => {
                    this.setState({error: error});
                });
            }).catch((error) => {
                this.setState({error: error});
            });
    }


    render() {
        const {classes} = this.props;
        const {editorState} = this.state;
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
                <div style={{height: '65vh'}}>
                    <Autocomplete
                        onChange={this.handleChangeRecipients}
                        style={{width: 'full', marginBottom: '3%'}}
                        options={this.state.allUsers.filter(user => user.email)}
                        classes={{option: classes.option}}
                        autoHighlight
                        freeSolo
                        multiple
                        value={this.state.recipients}
                        getOptionLabel={option => option.email || option}
                        renderOption={option => (
                            <React.Fragment>
                                <p style={{fontWeight: 'bold'}}>{option.engFirstName} {option.engLastName}</p>
                                &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                                <p> {option.email}</p>

                            </React.Fragment>)}
                        renderInput={params => (
                            <TextField
                                {...params}
                                label="Recipients:"
                                fullWidth
                                inputProps={{
                                    ...params.inputProps,
                                    autoComplete: 'disabled', // disable autocomplete and autofill
                                }}/>)}/>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            listStyle: 'none',
                            width: 'fit-content',
                        }}>
                        {this.state.chipData.map((data) => {
                            return (
                                <li key={data.key}>
                                    <Chip
                                        style={{
                                            background: data.clicked ? 'green' : '',
                                            color: data.clicked ? 'white' : '', marginRight: "5px"
                                        }}
                                        label={data.label}
                                        onClick={this.handleAddGroupToRecipients(data)}
                                    />
                                </li>
                            );
                        })}
                    </div>
                    <TextField
                        id="subject"
                        margin="normal" fullWidth
                        onChange={this.handleChangeSubject}
                        value={this.state.subject}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">Subject:</InputAdornment>,
                        }}/>
                    <Paper>
                        <Editor
                            editorStyle={{
                                minHeight: '20vh', maxHeight: '20vh',
                            }}
                            editorState={editorState}
                            onEditorStateChange={this.onEditorStateChange}
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                            toolbar={{
                                inline: {inDropdown: true},
                                list: {inDropdown: true},
                                textAlign: {inDropdown: true},
                                link: {inDropdown: true},
                                history: {inDropdown: true},
                                inputAccept: 'application/pdf,text/plain,application/vnd.openxmlformatsofficedocument.wordprocessingml.document,application/msword,application/vnd.ms-excel'
                            }}/>
                    </Paper>
                    <br/>
                    <Grid container spacing={0} style={{display: "block"}}>
                        <Grid item xs={12} md={2}>
                            <label htmlFor="files" className={'myBtn'}>Choose Files
                            </label>
                            <input multiple id="files" style={{visibility: 'hidden'}} type="file"
                                   onChange={this.onFileChange}/>
                        </Grid>
                    </Grid>
                    <DialogActions style={{display: "block"}}>
                        <Grid container spacing={3}>
                            <Grid item xs={10}>
                                {this.fileData()}
                            </Grid>
                            <Grid item xs={2} style={{textAlign: "right"}}>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    size={'large'}
                                    onClick={this.handleSendEmail}>
                                    Send
                                </Button>
                            </Grid>
                        </Grid>


                    </DialogActions>
                </div>

            );
        }
    }
}

export default withStyles(styles, {withTheme: true})(withSnackbar(EmailForm));