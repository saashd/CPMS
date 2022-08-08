import React, { useState, useEffect } from 'react';
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import { CircularProgress } from '@material-ui/core';
import { getEntitiesByIDs } from '../../../Services/mySqlServices';
import ProjectLinkContent from './ProjectLinkContent';

export default function ProjectLink(props) {
    const [project, setProject] = useState(null);

    useEffect(() => {
        setProject(null);
        let projectObj = { ids: [props.projectId] };
        if (props.projectId) {
            getEntitiesByIDs(projectObj, 'retrieve/projects', true).then(result => {
                setProject(result[0]);
            }).catch(error => {
                setProject(null);
            });
        }
    }, [props.projectId]);

    return (
        <Dialog fullWidth={true}
            maxWidth={'lg'}
            open={props.projectLinkOpen} onClose={props.handleProjectLinkClose}
            aria-labelledby="form-dialog-title">
            <DialogActions>
                <Button style={{ right: '95%', position: 'sticky' }} onClick={props.handleProjectLinkClose} color="primary">
                    <CloseIcon />
                </Button>
            </DialogActions>
            <DialogContent>
                {project ? <ProjectLinkContent handleProjectLinkClose={props.handleProjectLinkClose} projectDetails={project} /> : <div style={{ margin: 'auto', width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading project information &nbsp;&nbsp;<CircularProgress /></div>}
            </DialogContent>
        </Dialog>
    );
}
