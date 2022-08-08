import axios from "axios";

/**
 * Receives object with user properties and passes to the server side for update
 * @param userData
 * @return error\success message
 */
function editLoggedUser(userData) {
    return axios.post("/updateUser/" + userData.firebase_user_id, JSON.stringify(userData))
        .then(response => response.data)
        .then(result => {
            return Promise.resolve(result);
        })
        .catch(error => {
            return Promise.reject(error);
        });
}

/**
 * Receives user firebase id- uid and array of notification objects to be removed.Passes to server side for removal.
 * @param notifications
 * @param uid
 * @return error message or updated array of notification objects
 */
function removeNotifications(notifications, uid) {
    return axios.post("/removeNotifications/" + uid, JSON.stringify(notifications))
        .then(response => response.data)
        .then(result => {
            return Promise.resolve(result);
        }).catch(error => {
            return Promise.reject(error);
        })
}


export {editLoggedUser, removeNotifications};