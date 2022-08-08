import React, {Component} from "react";
import {Button} from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from "@material-ui/core/TextField";
import DialogContent from "@material-ui/core/DialogContent";

class RequestDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            yesButtonText: this.props.yesButtonText,
            yesButtonFunction: this.props.yesButtonFunction,
            closeModal: this.props.closeModal,
            modalText: this.props.modalText,
            isOpen: this.props.isOpen,
            handleAddMessage: this.props.handleAddMessage,

        };
    }

    handleChangeMessage = (e) => {
        let message=e.target.value;
        this.setState({messageForTeams: message});
        this.state.handleAddMessage(message)
    };

    handleClose = () => {
        this.setState({isOpen: false});
        this.state.closeModal();
    };

    render() {
        return (
            <div>
                <Dialog
                    fullWidth
                    maxWidth={'xs'}
                    open={this.state.isOpen} onClose={this.handleClose}
                    aria-labelledby="form-dialog-title">
                    <DialogTitle>
                        {this.state.modalText}
                    </DialogTitle>
                    <DialogContent>
                        <TextField InputLabelProps={{
                            shrink: true,
                        }}
                                   fullWidth
                                   id="description"
                                   name="description"
                                   label="Please add a message if necessary:"
                                   placeholder="Please add a message if necessary:"
                                   multiline
                                   onChange={this.handleChangeMessage}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            autoFocus
                            onClick={this.handleClose}
                            color="primary">
                            No
                        </Button>
                        <Button
                            autoFocus
                            onClick={this.state.yesButtonFunction}
                            color="primary">
                            {this.state.yesButtonText}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>

        );
    }
}

export default (RequestDialog);
