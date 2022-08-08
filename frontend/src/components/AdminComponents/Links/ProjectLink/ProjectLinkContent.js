import React from 'react';
import { editEntity } from '../../../Services/mySqlServices';
import ProjectsForm from '../../../SharedComponents/MyProjects/ProjectDetails/Tabs/ProjectsForm';
import { useSnackbar } from 'notistack';

/**
     * Function that removes unnecessary properties from project.(properties that were added in renderData function),
     * Then updates existing project.
     * @param    {Object} projectObj- existing project object
     * @return   error message or updated projects array.
     */
const handleProjectUpdate = (projectObj, enqueueSnackbar) => {
    let unrenderedProject = { ...projectObj };
    delete unrenderedProject.organizationName;
    delete unrenderedProject.industrialAdvisorName;
    delete unrenderedProject.academicAdvisorName;
    unrenderedProject.industrialAdvisorId = unrenderedProject.industrialAdvisorId ? unrenderedProject.industrialAdvisorId.firebase_user_id : null;
    unrenderedProject.academicAdvisorId = unrenderedProject.academicAdvisorId ? unrenderedProject.academicAdvisorId.firebase_user_id : null;
    unrenderedProject.organizationId = unrenderedProject.organizationId ? unrenderedProject.organizationId.id : null;
    unrenderedProject.teamId = unrenderedProject.teamId ? unrenderedProject.teamId.id : null;
    return editEntity(unrenderedProject, 'projects')
        .then((response) => {
            enqueueSnackbar('Project Updated Successfully', { variant: 'success' });
        }).catch((error) => {
            this.setState({ error: error });
            return Promise.reject(error);
        });
}

export default function ProjectLinkContent(props) {

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    return (
        <ProjectsForm
            onSend={props.handleProjectLinkClose}
            userDetails={null}
            data={null}
            currentEditableProject={props.projectDetails}
            viewMoreFlag={false}
            editFlag={true}
            onUpdate={(project) => handleProjectUpdate(project, enqueueSnackbar)}
            onAdd={null}

        />
    );
}
