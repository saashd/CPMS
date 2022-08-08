import React from 'react';
import TableComponent from "./TableComponent";



class GradeReport extends React.Component {
    constructor() {
        super();
        this.state = {
        };

    }


    render() {

        return (
            <TableComponent reports={this.state.renderedProjects}
                            title={<div><h2>{'Grade Report'}</h2><p> Table displays students Final Grades for each project stage.
                                <br /> <b>Note:</b> if grade template has no <b>Final Grade</b> per stage,then it won't appear here.</p></div>}
            />
        );
    }

}

export default GradeReport;
