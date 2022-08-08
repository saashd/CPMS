import React, {Component} from "react";
import {Button} from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";

class Yes_No_Dialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            yesButtonText: this.props.yesButtonText,
            yesButtonFunction: this.props.yesButtonFunction,
            closeModal:this.props.closeModal,
            modalText: this.props.modalText,
            isOpen:this.props.isOpen,
        };
    }

    handleClose=()=>{
        this.setState({isOpen:false});
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

export default (Yes_No_Dialog);
