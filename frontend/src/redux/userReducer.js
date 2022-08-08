import {combineReducers} from 'redux';

export const userReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET':
            return action.payload;
        case 'DELETE':
            return {};
        default:
            return state;
    }
};

export const adminViewReducer = (state = false, action) => {
    switch (action.type) {
        case 'SET_VIEW':
            return action.payload;
        case 'DELETE_VIEW':
            return false;
        default:
            return state;
    }
};

export const settingsReducer = (state = false, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return action.payload;
        case 'DELETE_LOADING':
            return false;
        default:
            return state;
    }
};

export const reducers = combineReducers({
    user: userReducer,
    adminView: adminViewReducer,
    settings: settingsReducer
})