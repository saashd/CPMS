import React, { useState, useEffect } from 'react';
import makeStyles from "@material-ui/core/styles/makeStyles";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import { CircularProgress } from '@material-ui/core';
import UserLinkContent from './UserLinkContent';
import { getUsersByFireBaseIDs } from '../../../Services/usersService';


export default function UserLink(props) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        setUser(null);
        let userObj = { ids: [props.userId] };
        if (props.userId) {
            getUsersByFireBaseIDs(userObj).then(result => {
                setUser(result[props.userId]);
            }).catch(error => {
                setUser(null);
            });
        }
    }, [props.userId]);

    return (
        <Dialog fullWidth={true}
            maxWidth={'sm'}
            open={props.userLinkOpen} onClose={props.handleTeamLinkClose}
            aria-labelledby="form-dialog-title">
            <DialogActions>
                <Button style={{ right: '95%', position: 'sticky' }} onClick={props.handleTeamLinkClose} color="primary">
                    <CloseIcon />
                </Button>
            </DialogActions>
            <DialogContent>
                {user ? <UserLinkContent userDetails={user} /> : <div style={{ margin: 'auto', width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading user information &nbsp;&nbsp;<CircularProgress /></div>}
            </DialogContent>
        </Dialog>
    );
}
