import React, {Component} from "react";
import {Button, DialogTitle} from "@material-ui/core";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import {createMuiTheme, MuiThemeProvider, withStyles,} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import DialogActions from "@material-ui/core/DialogActions";
import CloseIcon from "@material-ui/icons/Close";
import DescriptionIcon from "@material-ui/icons/Description";
import EmailIcon from "@material-ui/icons/Email";
import ItemForm from "./itemForm";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";
import {connect} from "react-redux";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
    addEntity,
    downloadFile,
    editEntity,
    getAllEntities,
    removeEntity,
    removeFile,
    updateFile,
    uploadFile
} from "../../Services/mySqlServices";
import {withSnackbar} from "notistack";

const theme = createMuiTheme({
    overrides: {
        MuiInputBase: {
            input: {
                textAlign: "center",
            }
        }
    }
});


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


class Items extends Component {
    constructor(props) {
        super(props);
        this.state = {
            createNewItem: false,
            editItem: false,
            itemToEdit: {},
            itemsList: [],
            coursesIdArray: [],
            schema: null,
            isLoaded: false,
            deleteConfirmationOpen: false,
            buttonLoading: false
        };
    }

    /**
     * Updates item course property to string, for future display in component.
     * @param item
     */
    handleEditItem = (item) => {
        this.setState({itemToEdit: item, editItem: true})

    };


    handleAddItem = () => {
        this.setState({createNewItem: true})
    };

    /**
     * Calles to removeEntity function to remove passed item object.
     * @param itemtoDelete
     */
    handleRemoveItem = () => {
        let message = this.state.messageToRemove;
        this.setState({deleteConfirmationOpen: false, messageToRemove: null});
        removeEntity(message, 'genericItems').then((response) => {
            let items = [...this.state.itemsList];
            items = items.filter(function (item) {
                return item.id !== message.id
            });
            this.setState({itemsList: items});
            this.props.enqueueSnackbar('Item Removed Successfully', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error});
        });

    };

    handleCloseDisplay = () => {
        this.setState({itemToEdit: {}, editItem: false, createNewItem: false})
    };

    /**
     * Updates existing item object and uploads file which will be connected to the item.
     * @param item
     * @param fileToUpload
     */
    updateItem = (item, fileToUpload) => {
        let updateItem = {
            id: item.id,
            header: item.template.header,
            body: item.template.body,
            fileId: item.fileId ? item.fileId.id : null,
            type: item.type,
            courses: item.template.course,
            date: new Date().toLocaleString("en-CA", {hourCycle: 'h23'}).replace(/,/, ''),
        };
        let promises = [];
        promises.push(
            editEntity(updateItem, 'genericItems')
                .then((response) => {
                    updateItem = {
                        body: item.template.body,
                        courseId: item.template.course,
                        date: new Date().toLocaleString("en-CA", {hourCycle: 'h23'}).replace(/,/, ''),
                        fileId: item.fileId,
                        header: item.template.header,
                        id: item.id,
                        template: item.template,
                        type: item.type
                    }
                    ;
                    let itemId = item.id;
                    let items = [...this.state.itemsList];
                    let index = items.findIndex(p => p.id === itemId);
                    items[index] = updateItem;
                    this.setState({itemsList: items});
                    this.handleCloseDisplay();
                })
        );
        Promise.all(promises).then(() => {
            this.uploadNewFile(fileToUpload, updateItem);

        })
            .catch((error) => {
                this.setState({error: error});
            })
    };

    /**
     * Creates new item and uploads file, which will be connected to the item.
     * @param itemTemplate
     * @param fileToUpload
     */
    addItem = (itemTemplate, fileToUpload) => {
        let itemToAdd = {
            header: itemTemplate.header,
            body: itemTemplate.body,
            fileId: itemTemplate.file,
            type: this.props.item_type,
            date: new Date().toLocaleString("en-CA", {hourCycle: 'h23'}).replace(/,/, ''),
            courses: itemTemplate.course,
        };
        let promises = [];
        let item = null;
        promises.push(
            addEntity(itemToAdd, 'genericItems')
                .then((response) => {
                    item = {
                        id: response,
                        date: itemToAdd.date,
                        type: itemToAdd.type,
                        courseId: itemTemplate.course,
                        template: itemTemplate
                    };
                    itemToAdd.id = response;
                    let items = [...this.state.itemsList];
                    items.unshift(item);
                    this.setState({itemsList: items});
                    this.handleCloseDisplay();
                }));
        Promise.all(promises).then(() => {
            this.uploadNewFile(fileToUpload, item);

        }).catch((error) => {
            this.setState({error: error});
        });

    };

    /**
     * Calls to uploadFile function and passing to it properties of new file and item.
     * @param fileToUpload
     * @param itemToEdit
     */
    uploadNewFile = (fileToUpload, itemToEdit) => {

        let formData = new FormData();
        let existingFile = itemToEdit.fileId;
        if (!fileToUpload) {
            this.props.enqueueSnackbar('Success', {variant: 'success'});
            return;
        }
        let item = {...itemToEdit};
        let itemList = [...this.state.itemsList];
        if (existingFile) {
            formData.append("file", fileToUpload, fileToUpload.name);
            formData.append("id", existingFile.id);
            updateFile(formData).then(result => {
                item.fileId = result;
                let i = itemList.findIndex(obj => obj.id === item.id);
                if (itemList[i]) {
                    itemList[i] = item
                }
                this.setState({itemToEdit: item, itemsList: itemList});
                this.props.enqueueSnackbar('Success', {variant: 'success'});
            }).catch(error => {
                this.setState({error: error})
            });
        } else {
            formData.append("file", fileToUpload, fileToUpload.name);
            formData.append("itemId", itemToEdit.id);
            uploadFile(formData).then(result => {
                item.fileId = result;
                let i = itemList.findIndex(obj => obj.id === item.id);
                if (itemList[i]) {
                    itemList[i] = item
                }
                this.setState({itemToEdit: {}, itemsList: itemList});
                this.props.enqueueSnackbar('Success', {variant: 'success'});

            }).catch(error => {
                this.setState({error: error})
            });
        }
        return item;

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

    /**
     * Calles to removeFile and passing to it properties of file to remove.
     * @return {{}}
     */
    deleteFile = () => {
        let item = {...this.state.itemToEdit};
        let itemList = [...this.state.itemsList];
        let formData = new FormData();
        formData.append("itemId", item.id);
        removeFile(formData).then(result => {
            item.fileId = null;
            let i = itemList.findIndex(obj => obj.id === item.id);
            if (itemList[i]) {
                itemList[i] = item
            }
            this.setState({itemToEdit: item, itemsList: itemList});
            this.props.enqueueSnackbar('File Deleted Successfully', {variant: 'success'});
        }).catch((error) => {
            this.setState({error: error})
        });
        return item;
    };

    /**
     * Appends to each items object additional parsed fields to match future display
     * @param items
     * @return items- sorted array of item objects by time.
     */
    parseData(items) {
        for (let item of items) {
            item.date = new Date(item.date);
            item.courseId = item.courseId;
            item.template = {
                "header": item.header,
                "course": item.courseId,
                "body": item.body
            };
            if (item.type === 'staff') {
                const re = /([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
                const result = re[Symbol.matchAll](item.body);
                item.template.staffEmail = Array.from(result, x => x[0]);
            }
        }
        return items.sort(function (a, b) {
            return b.date.getTime() - a.date.getTime()
        })
    };

    componentDidMount() {
        getAllEntities('courses')
            .then((response) => {
                let idArray = response.map(function (obj) {
                    return obj.id === -1 ? 'all courses' : obj.id.toString();
                });
                let items = this.parseData(this.props.items);
                this.setState({
                    coursesIdArray: idArray,
                    isLoaded: true,
                    itemsList: items,
                    uiSchema: {
                        'course': {
                            "ui:widget": "checkboxes", "ui:options": {
                                inline: true
                            }
                        },

                    },
                    schema: {
                        "type": "object",
                        "required": [
                            "header",
                            "body",
                            "course"
                        ],
                        "properties": {
                            "header": {
                                "type": "string",
                                "title": "Header",
                            },
                            "course": {
                                "type": "array",
                                "title": "Course",
                                "items": {
                                    "type": "string",
                                    "enum": idArray
                                },
                                "uniqueItems": true
                            },
                            "body": {
                                "type": "string",
                                "format": 'textarea',
                                "title": "Body",
                            }
                        }
                    }
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    }

    /**
     * Check if passed string contains hebrew chars.
     * @param str
     * @return {boolean}
     */
    containsHeb(str) {
        return (/[\u0590-\u05FF]/).test(str);
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
        } else {
            return (
                <div style={{

                    overflowX: 'hidden'
                }}>
                    {JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed ?
                        <div style={{textAlign: "center", padding: '1%'}}>
                            <Button variant="contained" color="primary" onClick={this.handleAddItem}>
                                New Item
                            </Button>
                        </div> : ''
                    }
                    {this.state.itemsList.length === 0 ?
                        <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '10%'}}>
                            <Typography
                                style={{fontSize: "x-large", textAlign: "center", color: '#3f51b5', padding: '5%'}}>
                                No content to display </Typography>
                        </Paper>
                        : <div>

                            {this.state.itemsList.map(message => <MuiThemeProvider key={message.id} theme={theme}>
                                <Paper style={{
                                    margin: '5vh',
                                    borderRadius: '1vw',
                                    overflow: 'auto'
                                }}>
                                    <Typography
                                        component={'div'}
                                        style={{
                                            background: '#3f51b5',
                                            color: '#fff',
                                            borderTopLeftRadius: '1vw',
                                            borderTopRightRadius: '1vw',
                                            textAlign: 'center',
                                            paddingLeft: '1vw',
                                            paddingRight: '1vw'
                                        }}>
                                        <Grid container>
                                            <Grid item xs={12} md={4}>
                                                {JSON.parse(this.props.userRed).is_admin && this.props.adminViewRed ?
                                                    <p style={{textAlign: 'start'}}>
                                                        <Link
                                                            style={{
                                                                color: "#fff",
                                                                cursor: "pointer",
                                                                textDecoration: "none",
                                                            }}
                                                            onClick={() => this.handleEditItem(message)}>
                                                            Edit Item
                                                        </Link>
                                                        &nbsp;&nbsp;
                                                        <Link
                                                            style={{
                                                                color: "#fff",
                                                                cursor: "pointer",
                                                                textDecoration: "none",
                                                            }}
                                                            onClick={() => this.setState({
                                                                deleteConfirmationOpen: true,
                                                                messageToRemove: message
                                                            })}>
                                                            Remove Item
                                                        </Link>
                                                        <Dialog
                                                            onClose={() => this.setState({deleteConfirmationOpen: false})}
                                                            open={this.state.deleteConfirmationOpen}
                                                            aria-labelledby="delete-item-confirmation">
                                                            <DialogTitle
                                                                id="delete-item-confirmation">{"Delete This Item?"}</DialogTitle>
                                                            <DialogActions>
                                                                <Button autoFocus
                                                                        onClick={() => this.setState({
                                                                            deleteConfirmationOpen: false,
                                                                            messageToRemove: null
                                                                        })}
                                                                        color="primary">
                                                                    No
                                                                </Button>
                                                                <Button onClick={() => this.handleRemoveItem()}
                                                                        color="primary" autoFocus>
                                                                    Yes
                                                                </Button>
                                                            </DialogActions>
                                                        </Dialog>
                                                    </p> : ''
                                                }

                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <p style={{
                                                    textAlign: 'center',
                                                    fontWeight: "bold"
                                                }}>{message.template.header}</p>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <p style={{textAlign: 'end'}}>{new Date(message.date).toLocaleString("en-CA", {hour12: false})}</p>
                                                <p style={{textAlign: 'end'}}> {"Course: " + message.courseId}</p>
                                            </Grid>
                                        </Grid>
                                    </Typography>
                                    <Typography variant="subtitle1" component="h2"
                                                style={{
                                                    whiteSpace: 'pre-line',
                                                    textAlign: this.containsHeb(message.template.body) ? 'end' : 'start',
                                                    overflow: 'auto',
                                                    paddingTop: '1vw',
                                                    paddingLeft: '1vw',
                                                    paddingRight: '1vw',
                                                    maxHeight: '20vh'
                                                }}>
                                        {message.template.body}
                                        {message.template.staffEmail ?
                                            <Button style={{paddingLeft: '1%'}}
                                                    id='email'
                                                    color="primary"
                                                    onClick={() => window.open('mailto:' + message.template.staffEmail)}>
                                                <EmailIcon/>
                                            </Button> : ''}
                                    </Typography>
                                    {message.fileId ?
                                        <Button style={{paddingLeft: '1%'}}
                                                id='file'
                                                color="primary"
                                                onClick={() => this.downloadFile(message.fileId.url, message.fileId.name)}
                                                disabled={this.state.buttonLoading}>
                                            <DescriptionIcon/> {message.fileId.name}&nbsp;
                                            {this.state.buttonLoading && <CircularProgress size={14}/>}
                                        </Button> : ''}
                                </Paper>
                            </MuiThemeProvider>)}</div>}
                    <Dialog fullWidth={true}
                            maxWidth={'sm'}
                            open={this.state.editItem || this.state.createNewItem} onClose={this.handleCloseDisplay}
                            aria-labelledby="form-dialog-title">
                        <DialogActions>
                            <Button style={{right: '95%', position: 'sticky'}} onClick={this.handleCloseDisplay}
                                    color="primary">
                                <CloseIcon/>
                            </Button>
                        </DialogActions>
                        <DialogContent>
                            <ItemForm
                                schema={this.state.schema}
                                uiSchema={this.state.uiSchema}
                                itemToEdit={this.state.itemToEdit}
                                template={this.state.itemToEdit.template}
                                editItem={this.state.editItem}
                                // uploadFile={this.uploadFile}
                                downloadFile={this.downloadFile}
                                deleteFile={this.deleteFile}
                                onSubmit={this.state.editItem ? this.updateItem : this.addItem}/>
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

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(withSnackbar(Items)));
