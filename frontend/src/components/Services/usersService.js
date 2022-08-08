import axios from "axios";

/**
 * Passes to the server side user data object ,to create new user in firebase db
 * @param userData
 * @return error message or created user firebase id.
 */

function addIndustrialAdvisor(userData) {
    delete userData.tableData;
    return axios.post("/createIndustrialAdvisor", JSON.stringify(userData))
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


/**Passes to the server side grade template object for an update in firebase db
 * @return error\success message
 * @param teamId
 * @param gradesTemplate
 */
function editAllStudentsGrades(teamId,gradesTemplate) {
    return axios.post("/updateAllStudentsGrades/" + teamId, JSON.stringify(gradesTemplate))
        .then(response => response.data)
        .then(result => {
            if (result['status'] !== 'error') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}

/**Passes to the server side student's grade template  object for an update in firebase db
 * @return error\success message
 * @param uid
 * @param gradesTemplate
 */
function editSpecificStudentGrades(uid, gradesTemplate) {
    return axios.post("/updateStudentGrades/" + uid, JSON.stringify(gradesTemplate))
        .then(response => response.data)
        .then(result => {
            if (result['status'] !== 'error') {
                return Promise.resolve(result['message']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}

/**Passes to the server side users data object for an update in MySQL db
 * @param userData
 * @return error\success message
 */

function editUser(userData) {
    delete userData.tableData;
    return axios.post("/updateUser/" + userData.firebase_user_id, JSON.stringify(userData))
        .then(response => response.data)
        .then(result => {
            if (result['status'] !== 'error') {
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
 * Passes to the server side users data object for an update in MySQL db
 * @param userAccessData
 * @return error\success message
 */
function editUserAccess(userAccessData) {
    return axios.post("/updateUserAccess/" + userAccessData.firebase_user_id, JSON.stringify({'is_admin': userAccessData.is_admin}))
        .then(response => response.data)
        .then(result => {
            if (result['status'] !== 'error') {
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
 * Passes to the serves side users data object, to remove user from MySQL db
 * @param userData
 * @return error\success message
 */
function removeUser(userData) {
    return axios.post("/deleteUser/" + userData.firebase_user_id, JSON.stringify(userData))
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
 * Receives array of user objects form MySQL db, by selected type and params passed to the function
 * @param type
 * @param params
 * @return error message or data array.
 */
function getUsersByType(type, params = {id: undefined}) {
    return axios.get("/retrieveUser/" + type, {"params": params})
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
 * Receives data about users whose ids were passed.
 * @param ids
 * @return error message or data array.
 */
function getUsersByFireBaseIDs(ids) {
    return axios.post("/readUsers/", JSON.stringify(ids))
        .then(response => response.data)
        .then(result => {
            if (result) {
                return Promise.resolve(result);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });

}

/**
 * Returns notification array corresponding to user MySQL id that passed to the function
 * @param uid
 * @return error message or notification array
 */
function readNotifications(uid) {
    return axios.post("/readNotifications/" + uid)
        .then(response => response.data)
        .then(result => {
            return Promise.resolve(result);
        }).catch(error => {
            return Promise.reject(error);
        })
}

export {
    addIndustrialAdvisor,
    editUser,
    editAllStudentsGrades,
    editSpecificStudentGrades,
    editUserAccess,
    removeUser,
    getUsersByType,
    getUsersByFireBaseIDs,
    readNotifications
};