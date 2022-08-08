import React, { useState, useEffect } from 'react';
import makeStyles from "@material-ui/core/styles/makeStyles";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import TeamForm from '../../Courses Management/Teams/TeamForm';
import { editEntity, getEntitiesByIDs } from '../../../Services/mySqlServices';
import { CircularProgress } from '@material-ui/core';
import { useSnackbar } from 'notistack';


const useStyles = makeStyles(() => ({
    root: {
        '&.Mui-selected': {
            background: 'rgba(63,81,181,0.11)',
            color: '#3f51b5',
            '& path': {
                fill: '#3f51b5',
            }
        },
        "&:hover": {
            background: 'rgba(63,81,181,0.11)'
        },
        '&.active, &:hover, &.active:hover': {
            '& path': {
                fill: '#3f51b5',
            }
        }
    },

}
));

/**
     * Function that adds new team of updates existing team, updates array of teams.
     * @param    {Object} teamObj  team object
     * @return   error or success message
     */
const addTeamFromForm = (teamObj, props, setTeam, enqueueSnackbar) => {
    setTeam(null);
    return handleEdit(teamObj).then((response) => {
        init(props, setTeam);
        enqueueSnackbar("Team Updated", { variant: 'success' });
        return Promise.resolve(teamObj);
    }).catch((error) => {
        return Promise.reject(error);
    }).finally(() => props.handleTeamLinkClose());
};

const handleEdit = (teamObj) => {
    return editEntity(teamObj, 'teams')
        .then((response) => {
            return Promise.resolve(response);
        }).catch((error) => {
            this.setState({ error: error });
            return Promise.reject(error);
        });
};

const init = (props, setTeam) => {
    let teamObj = { ids: [props.teamId] };
        getEntitiesByIDs(teamObj, 'retrieve/teams', true).then(result => {
            let team = null;
            if (result[0]) {
                team = {
                    id: result[0].id,
                    projectId: result[0].projectId,
                    comment: result[0].comment,
                    students: result[0].students,
                    creatorId: result[0].creatorId,
                };
            }
            setTeam(team);
        }).catch(error => {
            console.log(error)
        });
}

export default function TeamLink(props) {
    let classes = useStyles();
    const [team, setTeam] = useState(null);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        init(props, setTeam);
    }, [props.teamId]);

    return (
        <Dialog fullWidth={true}
            maxWidth={'sm'}
            open={props.teamLinkOpen} onClose={props.handleTeamLinkClose}
            aria-labelledby="form-dialog-title">
            <DialogActions>
                <Button style={{ right: '95%', position: 'sticky' }} onClick={props.handleTeamLinkClose} color="primary">
                    <CloseIcon />
                </Button>
            </DialogActions>
            <DialogContent>
                {team ? <TeamForm handleAdd={(team) => addTeamFromForm(team, props, setTeam, enqueueSnackbar)}
                    onSend={props.handleTeamLinkClose}
                    teams={null}
                    currentTeam={team}
                    editFlag={true}
                /> : <div style={{ margin: 'auto', width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading team information &nbsp;&nbsp;<CircularProgress /></div>}
            </DialogContent>
        </Dialog>
    );
}
