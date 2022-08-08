import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import Form from '@rjsf/material-ui';
import {
    createMuiTheme,
    MuiThemeProvider,
} from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "@material-ui/core/IconButton";
import DescriptionIcon from "@material-ui/icons/Description";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
    downloadFile
} from "../../Services/mySqlServices";

const theme = createMuiTheme({
    overrides: {
        MuiInputBase: {
            input: {
                textAlign: "center",
            }
        }
    }
});


class ItemForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itemToEdit: this.props.itemToEdit,
            template: this.props.template,
            onSubmit: this.props.onSubmit,
            editItem: this.props.editItem,
            schema: this.props.schema,
            uiSchema: this.props.uiSchema,
            fileToUpload: null,
            buttonLoading: false
        };
    }

    onSubmit = ({formData}, e) => {
        e.preventDefault();
        this.setState({template: formData});
        if (this.state.editItem) {
            let item = {...this.state.itemToEdit};
            item.template = formData;
            this.state.onSubmit(item, this.state.fileToUpload)
        } else {
            this.state.onSubmit(formData, this.state.fileToUpload)
        }
    };

    onChange = ({formData}) => {
        this.setState({template: formData});
    };


    setFile = (event) => {
        let file = event.target.files[0];
        this.setState({fileToUpload: file});
        this.forceUpdate()
    };

    /**
     * Calls to downloadFile service and passing to it properties of the file to download.
     * @param filePathToDownload
     * @param fileName
     */
    downloadFile = (filePathToDownload, fileName) => {
        this.setState({ buttonLoading: true });
        if (!filePathToDownload) {
            this.setState({ buttonLoading: false });
            return;
        }
        downloadFile(filePathToDownload, fileName, null).then(result => { }).catch(error => {
            this.setState({ error: error })
        }).finally(() => { this.setState({ buttonLoading: false }) });

    };


    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <div className="container">
                    <div className="row">
                        <div className="col-md-6">
                            <Form
                                schema={this.state.schema}
                                uiSchema={this.state.uiSchema}
                                formData={this.state.template}
                                onSubmit={this.onSubmit}
                                onChange={this.onChange}
                                downloadFile={this.downloadFile}
                            >
                                <div>
                                    <div style={{
                                        display: 'block',
                                        justifyContent: 'center'
                                    }}
                                    >
                                        <input type="file" name="file" id="file"
                                               onChange={(e) => this.setFile(e)}/>
                                    </div>
                                    {this.state.itemToEdit.fileId ?
                                        <div>
                                            <Button style={{ paddingLeft: '1%' }}
                                                id='file'
                                                color="primary"
                                                onClick={() => this.downloadFile(this.state.itemToEdit.fileId.url, this.state.itemToEdit.fileId.name)}
                                                disabled={this.state.buttonLoading}>
                                                <DescriptionIcon /> {this.state.itemToEdit.fileId.name}&nbsp;
                                                {this.state.buttonLoading && <CircularProgress size={14} />}
                                            </Button>
                                            <Tooltip title="Delete">
                                                <IconButton aria-label="delete" color={"secondary"}
                                                            onClick={() => {
                                                                let item = this.props.deleteFile();
                                                                this.setState({itemToEdit: item})
                                                            }}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </div> : ''}
                                </div>
                                <div style={{paddingTop: '3%', marginLeft: '80%'}}>
                                    <Button variant="contained"
                                            color="primary" type="submit">Submit</Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default ItemForm;

