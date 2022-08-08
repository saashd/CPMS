import React from "react";
import moment from 'moment';
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import './style.css'
import CircularProgress from "@material-ui/core/CircularProgress";
import {getAllFBEntities} from "../../../../../../Services/firebaseServices";
import { getEvaluationPages } from "../../../../../../Services/mySqlServices";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ReactHTMLTableToExcel from 'react-html-table-to-excel';
import Paper from "@material-ui/core/Paper";
import { withSnackbar } from "notistack";

class EvaluationPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentEvaluationTemplate: null,
            evaluationPageTemplates: null,
            teams: null,
            schedule: this.props.schedule,
            isLoaded: false,


        };

    }

    /**
     *Extracts current evaluation page criteria to objects.
     * @return array of creteria object extracted from evaluation template
     */
    renderTemplate = () => {
        let arr = [];
        for (const [key, value] of Object.entries(this.state.currentEvaluationTemplate.template)) {
            if (key === 'title') {
                continue
            }
            let obj = {};
            obj.key = key;
            obj.value = value;
            arr.push(obj);
        }

        return arr
    };

    /**
     * Generates pdf file ready for export
     */
    generatePdf() {
        let myWindow = window.open('', '');
        let divText = document.getElementById("pdfTable").outerHTML;
        myWindow.document.write(divText);
        myWindow.document.close();
        myWindow.document.title = this.props.startTime + " " + this.state.currentEvaluationTemplate.template.title;
        myWindow.focus();
        myWindow.print();
        myWindow.close();
    };

    /**
     * Generates .doc file ready for export
     */
    exportToDoc = () => {
        const context = {
            "currentEvaluationTemplate": this.state.currentEvaluationTemplate,
            "schedule": this.state.schedule,
            "teamIds": this.state.teams.map(team => team ? team.teamId : null),
            "startDate": moment(this.props.startTime).format('YYYY-MM-DD')
        }
        const filename = this.props.startTime + " " + this.state.currentEvaluationTemplate.template.title + ".docx";
        getEvaluationPages(context, filename).then(result => {
        }).catch(error => {
            this.props.enqueueSnackbar('Failed to create EvaluationPages, please check your parameters', { variant: 'error' });
        });
    };


    /**
     * Switches to display of selected evaluation page.
     * @param e
     */
    handleChangeEvaluationPage = (e) => {
        let evalPages = [...this.state.evaluationPageTemplates];
        let selectedPage = evalPages.filter(page => {
            return page.id === e.target.value
        })[0];
        this.setState({currentEvaluationTemplate: selectedPage});
    };

    componentDidMount() {
        getAllFBEntities('evaluationPages')
            .then((evalPages) => {
                evalPages = evalPages.filter(obj => 'template' in obj);
                let teams = this.props.teams;
                for (let team of teams) {
                    if (team && "students" in team) {
                        team.students = team.students.filter(x => x !== null)
                    }
                }
                this.setState({
                    teams: this.props.teams,
                    isLoaded: true,
                    evaluationPageTemplates: evalPages,
                    currentEvaluationTemplate: evalPages[0],
                });
            }).catch((error) => {
            this.setState({error: error});
        });
    }


    render() {
        const {error, isLoaded} = this.state;
        if (error) {
            return (
                <Paper style={{border: 'dashed', borderColor: '#9e9e9e52', margin: '5%', padding: '4%'}}>
                    <Typography display="block" variant="h6" align={'center'} color={"primary"}>
                        Please refresh the page and try again.

                    </Typography>
                    <Typography display="block" variant="h6" align={'center'} color={"primary"}>
                        If you have any questions or encounter issues,
                        please contact support via the "Help" tab.
                    </Typography> </Paper>);
        } else if (!isLoaded) {
            return <div style={{textAlign: 'center', paddingTop: "15%"}}>
                <CircularProgress size="8rem"/>
            </div>
        } else {
            let teams = this.state.teams;
            if (teams.length === 0) {
                return (<Typography variant="h5" align={'center'} color="primary">
                    No team chosen
                </Typography>);
            }
            if (!this.state.currentEvaluationTemplate) {
                return (<Typography variant="h5" align={'center'} color="primary">
                    No Evaluation Pages
                </Typography>);
            }
            return (
                <div>
                    <div style={{display: 'inline-flex', marginLeft: '50vh'}}>
                        <TextField
                            size={'small'}
                            style={{width: '50vh'}}
                            label={'Choose Evaluation Page'}
                            value={this.state.currentEvaluationTemplate.id}
                            onChange={this.handleChangeEvaluationPage}
                            select
                        >
                            {this.state.evaluationPageTemplates.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.title}
                                </MenuItem>
                            ))}
                        </TextField>
                        <ButtonGroup
                            orientation="vertical"
                            color="primary"
                            variant="contained"
                            aria-label="vertical outlined primary button group"
                        >
                            <Button
                                onClick={this.generatePdf.bind(this)}
                            >Print
                            </Button>
                            <Button
                                onClick={this.exportToDoc.bind(this)}
                            >Export .doc
                            </Button>

                            <ReactHTMLTableToExcel
                                id="test-table-xls-button"
                                className={'myBtn'}
                                table="tablexls"
                                filename={this.props.startTime + " " + this.state.currentEvaluationTemplate.template.title}
                                sheet="tablexls"
                                buttonText="Export .xls"/>

                        </ButtonGroup>
                    </div>
                    <Typography variant="h5" align={'center'} color="primary">
                        Preview:
                    </Typography>
                    <div>
                        <div
                            id="pdfTable">
                            <table id={'tablexls'} style={{margin: "auto"}}>
                                <tbody>
                                {teams.filter(team => team !== undefined).map((team) => (
                                    <tr>
                                        <td>
                                            <div key={team.id} style={{pageBreakInside: 'avoid'}}>
                                                <div dir="ltr">
                                                    {/*<img src={Logo} alt="Technion Logo"/>*/}
                                                    <img width="40" height="60"
                                                         src="https://upload.wikimedia.org/wikipedia/he/7/70/Technion_Logo.png"/>
                                                    <p>הטכניון- מכון טכנולוגי לישראל
                                                        <br/>
                                                        הפקולטה להנדסת תעשיה וניהול
                                                    </p>
                                                    <h3>
                                                        {this.props.startTime}
                                                    </h3>
                                                </div>
                                                <div dir="rtl">
                                                    <h2>
                                                        פרויקט גמר במערכות מידע – טופס הערכה
                                                        <br/>
                                                        {this.state.currentEvaluationTemplate.template.title}
                                                    </h2>
                                                    <p style={{margin: 0}}><b>{'מספר צוות: '}</b> {team.id}</p>
                                                    <span><b>{'שמות הסטודנטים: '}  &emsp;</b></span>
                                                    {

                                                        team.students.map((student) => (
                                                            <span
                                                                key={student.id}>{student.engFirstName + " " + student.engLastName} &emsp;</span>
                                                        ))
                                                    }
                                                </div>
                                                {
                                                    this.state.schedule.filter(s => s.teamObject && s.teamObject.id === team.id)
                                                        .map((s) => (
                                                            <div key={s.id} dir="rtl">
                                                                <p>
                                                                    <b>{' ארגון: '}</b> {s.organizationObject ? s.organizationObject.name : ''}
                                                                    <br/>
                                                                    <b>{'מספר פרויקט: '}</b> {s.projectObject.id}
                                                                    <b>{' שם פרויקט: '}</b> {s.projectObject.name ? s.projectObject.name : ''}
                                                                    <br/>
                                                                </p>
                                                            </div>
                                                        ))
                                                }
                                                <ul style={{marginLeft: "15%"}}>
                                                    <table className={"styledTable"}
                                                           style={{
                                                               borderCollapse: "collapse",
                                                               margin: "25px 0",
                                                               fontSize: "0.9em",
                                                               fontFamily: "sans-serif",
                                                               minWidth: "400px",
                                                               boxShadow: "0 0 20px rgba(0, 0, 0, 0.15)",
                                                           }}
                                                    >
                                                        <thead>
                                                        <tr style={{
                                                            backgroundColor: "#3f51b5",
                                                            color: "#ffffff"
                                                        }}>
                                                            <th style={{
                                                                width: '65%',
                                                                padding: "12px 15px"
                                                            }}>הערות
                                                                נוספות
                                                            </th>
                                                            <th style={{padding: "12px 15px"}}>הערכה</th>
                                                            <th style={{padding: "12px 15px"}}>נקודות</th>
                                                            <th style={{padding: "12px 15px"}}>קריטיון</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {this.renderTemplate().map((item) => (
                                                            <tr style={{borderBottom: "1px solid #dddddd"}}
                                                                key={item.key}>
                                                                <td style={{padding: "12px 15px"}}> {'    '} </td>
                                                                <td style={{padding: "12px 15px"}}> {} </td>
                                                                <td style={{padding: "12px 15px"}}> {item.value} </td>
                                                                <td style={{padding: "12px 15px"}}> {item.key} </td>
                                                            </tr>

                                                        ))}
                                                        <tr style={{borderBottom: "1px solid #dddddd"}}>
                                                            <td style={{padding: "12px 15px"}}> {'    '} </td>
                                                            <td style={{padding: "12px 15px"}}> {'    '} </td>
                                                            <td style={{padding: "12px 15px"}}> {'סה"כ'} </td>
                                                            <td style={{padding: "12px 15px"}}> {'    '} </td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </ul>
                                                <p dir="rtl" >הערות:</p>
                                                <div style={{pageBreakBefore:"always"}}></div>
                                            </div >
                                        </td>
                                    </tr>


                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )
        }
    }
}

export default withSnackbar(EvaluationPage)