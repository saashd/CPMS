import axios from "axios";

/**
 *   Receives endpoint and entity object from user and passes to the selected endpoint entity data,to create new entity
 *   in firebase db
 * @param entityData
 * @param endpoint
 * @return error message or created entity id.
 */
function addFBEntity(entityData, endpoint) {
    delete entityData.tableData;
    return axios.post("/createFB/" + endpoint, JSON.stringify(entityData))
        .then(response => response.data)
        .then(result => {
            if (result['status'] === 'success') {
                return Promise.resolve(result['newEntityId']);
            } else {
                return Promise.reject(result['message']);
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
}

/**
 *   Receives endpoint, entity object, and params from user and passes to the selected endpoint entity data with params,
 *   to update entity's properties in firebase db
 * @param entity
 * @param endpoint
 * @param params
 * @return error\success message
 */
function editFBEntity(entity, endpoint, params = {ids: undefined}) {
    delete entity.tableData;
    return axios.post("/updateFB/" + endpoint, JSON.stringify(entity), {"params": params})
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
 * Receives  endpoint, entity object from user and passes to the selected endpoint entity data,
 *   to remove entity from firebase db
 * @param entityData
 * @param endpoint
 * @return error\success message
 */
function removeFBEntity(entityData, endpoint) {
    return axios.post("/deleteFB/" + endpoint + "/" + entityData.id, JSON.stringify(entityData))
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
 * Receives data from the passed endpoint connected to firebase db.
 * @param endpoint
 * @param params
 * @return error message or data array.
 */
function getAllFBEntities(endpoint, params={id:undefined}) {
    return axios.get("/retrieveFB/" + endpoint,{"params": params})
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


export {addFBEntity, editFBEntity, removeFBEntity, getAllFBEntities};