import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import EmailForm from "./EmailForm";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import "./styles.css"



class sendEmail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.open,
            handleClose: this.props.handleClose,
            firsTimeOpened: true
        }
    };

    render() {
        const handleClose = () => {
            this.state.handleClose();
            this.setState({open: false});
        };
        return (
            <div >
                <Dialog
                    maxWidth={'md'}
                    fullWidth
                    open={this.state.open} onClose={handleClose} aria-labelledby="form-dialog-title">
                    <div style={{background: '#3f51b5'}}>
                        <DialogActions>
                            <IconButton
                                style={{
                                    position: 'absolute',
                                    left: 25,
                                    top: 2,
                                    color: 'white'
                                }}
                                onClick={handleClose}>
                                <CloseIcon/>
                            </IconButton>
                        </DialogActions>
                        <DialogTitle style={{color: 'white', textAlign: "center"}}> New
                            Message</DialogTitle>
                    </div>
                    <DialogContent>
                        <EmailForm handleClose={handleClose}/>
                    </DialogContent>
                    <DialogActions>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}


export default (sendEmail);
