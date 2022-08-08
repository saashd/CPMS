import React from "react";
import LoginHandler from "../LoginHandler/LoginHandler";
import {BrowserRouter as Router,Route, Switch} from "react-router-dom";
import FillAdvisorDetails from "../FillUserDetails/FillAdvisorDetails";

export default function Routings() {
    return (
        <div>
            <Router>
                <Switch>
                    <Route  path="/" component={LoginHandler}/>
                    <Route path="/FillAdvisorDetails" component={FillAdvisorDetails}/>
                </Switch>
            </Router>
        </div>


    );
}