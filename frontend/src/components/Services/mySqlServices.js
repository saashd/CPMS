import axios from "axios";

/**
 *  Receives endpoint and entity object from user and passes entity data to the selected endpoint ,to create new entity
 *   in mySQL db
 * @param entityData
 * @param endpoint
 * @return error message,created entity id or created entity object (depents on enpoint)
 */
function addEntity(entityData, endpoint) {
    delete entityData.tableData;
    return axios.post("/create/" + endpoint, JSON.stringify(entityData))
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                if (endpoint === 'projects') {
                    return Promise.resolve(result['newEntity']);
                } else {
                    return Promise.resolve(result['newEntityId']);
                }
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}


/**
 *   Receives endpoint, entity object from user and passes entity object to the selected endpoint ,
 *   to update entity's properties in mySQL db
 * @param entity
 * @param endpoint
 * @return error\success message or created entity object (depents on enpoint)
 */
function editEntity(entity, endpoint) {
    delete entity.tableData;
    return axios.post("/update/" + endpoint + "/" + entity.id, JSON.stringify(entity))
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                if (endpoint === 'projects') {
                    return Promise.resolve(result['updatedEntity']);
                } else {
                    return Promise.resolve(result['message']);
                }
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });

}

/**
 * Receives  endpoint, entity object from user and passes entity data to the selected endpoint ,
 *   to remove entity from mySQL db
 * @param entityData
 * @param endpoint
 * @return error\success message
 */
function removeEntity(entityData, endpoint) {
    return axios.post("/delete/" + endpoint + "/" + entityData.id, JSON.stringify(entityData))
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}


/**
 * Receives data from the passed endpoint connected to mySQL db.
 * @param endpoint
 * @param params
 * @return error message or data array.
 */
function getAllEntities(endpoint, params = {id: undefined}) {
    return axios.get("/retrieve/" + endpoint, {"params": params})
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}


/**
 * Receives  endpoint, entity object from user and passes entity data to the selected endpoint ,
 *   to approve or reject entity.
 * @param entityData
 * @param endpoint
 * @return error\success message
 */
function approveOrRejectEntity(entityData, endpoint, params = {id: undefined}) {
    delete entityData.tableData;
    return axios.post(endpoint + "/" + entityData.id, JSON.stringify(entityData), {"params": params})
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });

}

/**
 * Receives data about passed entities whose ids were passed via param parameter, from the passed endpoint connected to mySQL db.
 * @param ids
 * @param endpoint
 * @param param
 * @return error message or data array.
 */
function getEntitiesByIDs(ids, endpoint, param) {
    return axios.post("/" + endpoint, JSON.stringify(ids), {"params": {"is_read": param}})
        .then(response => response.data)
        .then(result => {
            if (result) {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });

}

/**
 * Returns files from mySQL db according to provided params.
 * @param params
 * @return error message or files array.
 */
function retrieveFiles(params) {
    return axios.post("/getFiles", JSON.stringify(null), {"params": params})
        .then(response => response.data)
        .then(result => {
            return Promise.resolve(result);

        }).catch((error) => {
            return Promise.resolve(error);
        });
}

/**
 * Downloads a file from the server according to the provided path.
 * @param filePath
 * @param fileName
 * @param projectId
 * @return error message or a file.
 */
function downloadFile(filePath, fileName, projectId) {
    return axios.post("/downloadFile", {filePath: filePath, projectId: projectId}, {responseType: "blob"})
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); //or any other extension
            document.body.appendChild(link);
            link.click();
        })
        .then(result => {
            return Promise.resolve(result);

        }).catch((error) => {
            return Promise.resolve(error);
        });
}

/**
 * Get evaluation pages docx created in server with context data
 * @param context
 * @return error message or a file.
 */
function getEvaluationPages(context, fileName) {
    return axios.post("/getEvaluationPages", context, { responseType: "blob" })
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); //or any other extension
            document.body.appendChild(link);
            link.click();
        })
        .then(result => {
            return Promise.resolve(result);

        }).catch((error) => {
            throw new Error(error);
        });
}

/**
 * Get evaluation pages docx created in server with context data
 * @param context
 * @return error message or a file.
 */
function getSecretariatReport(context, fileName) {
    return axios.post("/getSecretariatReport", context, { responseType: "blob" })
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); //or any other extension
            document.body.appendChild(link);
            link.click();
        })
        .then(result => {
            return Promise.resolve(result);

        }).catch((error) => {
            throw new Error(error);
        });
}

/**
 * Returns files from the old CPMS2011 system according to provided params.
 * @param params
 * @return error message or files array.
 */
function retrieveFilesFormCPMS2011(params) {
    return axios.post("/getFilesCPMS2011", JSON.stringify(null), {"params": params})
        .then(response => response.data)
        .then(result => {
            return Promise.resolve(result);

        }).catch((error) => {
            return Promise.resolve(error);
        });
}

/**
 * Uploads file to mySQL db according to formData properties.
 * @param formData
 * @return error\success message
 */
function uploadFile(formData) {
    return axios({
        method: "post",
        url: "/uploadFile",
        data: formData,
        headers: {"Content-Type": "multipart/form-data"},
    }).then(response => response.data)
        .then(result => {
            return Promise.resolve(result["message"]);

        }).catch((error) => {
            return Promise.resolve(error);
        });
}


/**
 * Updates existing file according to provided properties in formData
 * @param formData
 * @return error\success message
 */
function updateFile(formData) {
    return axios({
        method: "post",
        url: "/updateUploadedFile",
        data: formData
    }).then(response => response.data)
        .then(result => {
            return Promise.resolve(result["message"]);

        }).catch((error) => {
            return Promise.resolve(error);
        });

}


/**
 * Removes file from mySQL according to passes parameters.
 * @param formData
 * @return  error\success message
 */
function removeFile(formData) {
    return axios({
        method: "post",
        url: "/deleteFile",
        data: formData,
        headers: {"Content-Type": "multipart/form-data"},
    }).then(response => response.data)
        .then(result => {
            return Promise.resolve(result);
        }).catch((error) => {
            return Promise.resolve(error);
        });
}


/**
 * Receives logs array from sqlite db.
 * @return error message or data array.
 */
function getLogs() {
    return axios.get("/retrieveLogs",)
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}

/**
 *   Receives team object passes object to the endpoint ,
 *   to predict team's grade
 * @param team
 * @return error\success message or predicted grade (depents on enpoint)
 */
function predictGrade(team) {
    return axios.post("/predictGrade/" + team.id, JSON.stringify(team))
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });

}

/**
 * Search data from by passed search term and desired tables.
 * @param params
 * @return error message or data array.
 */
function search(params = {id: undefined}) {
    return axios.get("/search", {"params": params})
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}


function updateCourseAndSemester() {
    return axios.post("/updateCourseAndSemesterManually").then(response => response.data).then(result => {
        if (result['status'] === 'success') {
            return Promise.resolve(result['status']);
        } else {
            return Promise.reject(result['status']);
        }
    })
        .catch(error => {
            return Promise.reject(error);
        });
}

function trainGradeModel() {
    return axios.post("/trainGradeModelManually").then(response => response.data).then(result => {
        if (result['status'] === 'success') {
            return Promise.resolve(result['status']);
        } else {
            return Promise.reject(result['status']);
        }
    })
        .catch(error => {
            return Promise.reject(error);
        });
}

function update_logTable() {
    return axios.post("/clearLogTableManually").then(response => response.data).then(result => {
        if (result['status'] === 'success') {
            return Promise.resolve(result['status']);
        } else {
            return Promise.reject(result['status']);
        }
    })
        .catch(error => {
            return Promise.reject(error);
        });
}

function updateProjectsStatus() {
    return axios.post("/updateProjectsStatusManually").then(response => response.data).then(result => {
        if (result['status'] === 'success') {
            return Promise.resolve(result['status']);
        } else {
            return Promise.reject(result['status']);
        }
    })
        .catch(error => {
            return Promise.reject(error);
        });
}

function updateStatusOfCompletedProjects() {
    return axios.post("/updateStatusOfCompletedProjectsManually")
        .then(response => response.data).then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['status']);
            } else {
                return Promise.reject(result['status']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });

}

export {
    updateCourseAndSemester,
    trainGradeModel,
    update_logTable,
    updateProjectsStatus,
    updateStatusOfCompletedProjects,
    addEntity,
    editEntity,
    removeEntity,
    getAllEntities,
    approveOrRejectEntity,
    getEntitiesByIDs,
    retrieveFiles,
    retrieveFilesFormCPMS2011,
    uploadFile,
    downloadFile,
    updateFile,
    removeFile,
    getLogs,
    predictGrade,
    search,
    getEvaluationPages,
    getSecretariatReport
};