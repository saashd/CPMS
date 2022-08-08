import React from "react";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import './style.css'
import CircularProgress from "@material-ui/core/CircularProgress";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ReactHTMLTableToExcel from "react-html-table-to-excel";

class ExportPresentation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            event: null,
            schedule: null,
            isLoaded: false,
            error: null


        };

    }


    /**
     * Generates pdf file ready for export
     */
    generatePdf() {
        let myWindow = window.open('', '');
        let divText = document.getElementById("pdfTable").outerHTML;
        myWindow.document.write(divText);
        myWindow.document.close();
        myWindow.document.title = "Presentation_Scheduled_To_" + this.state.event.start.toDateString();
        myWindow.focus();
        myWindow.print();
        myWindow.close();
    };

    /**
     * Generates .doc file ready for export
     */
    exportToDoc = () => {
        let html = document.getElementById('pdfTable').innerHTML;
        let blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });
        // Specify link url
        let url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
        // Specify file name

        let filename = "Presentation_Scheduled_To_" + this.state.event.start.toDateString()  + ".doc";
        // Create download link element
        let downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);
        if (navigator.msSaveOrOpenBlob) {
            navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            // Create a link to the file
            downloadLink.href = url;

            // Setting the file name
            downloadLink.download = filename;

            //triggering the function
            downloadLink.click();
        }
        document.body.removeChild(downloadLink);
    };


    componentDidMount() {
        if (this.props.event && this.props.schedule) {
            let schedule = this.props.schedule;
            for (let item of schedule) {
                if ("teamObject" in item && "students" in item.teamObject) {
                    item.teamObject.students = item.teamObject.students.filter(x => x !== null)
                }
            }
            this.setState({
                event: this.props.event,
                schedule: this.props.schedule,
                isLoaded: true
            })
        }
    }

    render() {
        let event = this.state.event;
        let schedule = this.state.schedule;
        const {isLoaded} = this.state;
        if (!isLoaded) {
            return <div style={{textAlign: 'center', paddingTop: "15%"}}>
                <CircularProgress size="8rem"/>
            </div>
        } else {
            return (
                <div>
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
                            // className="download-table-xls-button btn btn-success mb-3"
                            table="tablexls"
                            filename={"Presentation_Scheduled_To_" + event.start.toDateString()}
                            sheet="tablexls"
                            buttonText="Export .xls"/>
                    </ButtonGroup>
                    <Typography variant="h5" align={'center'} color="primary">
                        Preview:
                    </Typography>
                    <div>
                        <div id="pdfTable">
                            <table id={'tablexls'}>
                                <tbody>
                                <tr>
                                    <td>
                                        <b>{'Course: '}</b> {event.courseId}
                                        <br/>
                                        <b>{'Title: '}</b> {event.title ? event.title : ''}
                                        <br/>
                                        <b>{'Location: '}</b> {event.location ? event.location : ''}
                                        <br/>
                                        <b>{'Presentation Start: '}</b> {event.start ? event.start.toDateString() : ''}
                                        <br/>
                                        <b>{'Presentation End:'}</b> {event.end ? event.end.toDateString() : ''}
                                        <br/>
                                        <b>{'Description:'}</b> {event.description ? event.description : ''}
                                    </td>
                                </tr>
                                <tr>
                                    <td>

                                        <ul>
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
                                                <tr style={{backgroundColor: "#3f51b5", color: "#ffffff"}}>
                                                    <th style={{padding: "12px 15px"}}>Time</th>
                                                    <th style={{padding: "12px 15px"}}>Duration</th>
                                                    <th style={{padding: "12px 15px"}}>Team ID</th>
                                                    <th style={{padding: "12px 15px"}}>Project Id</th>
                                                    <th style={{padding: "12px 15px"}}>Project Name</th>
                                                    <th style={{padding: "12px 15px"}}>Organization</th>
                                                    <th style={{padding: "12px 15px"}}>Students</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {schedule.map((item) => (
                                                    <tr style={{borderBottom: "1px solid #dddddd"}} key={item.id}>
                                                        <td style={{padding: "12px 15px"}}> {item.time} </td>
                                                        <td style={{padding: "12px 15px"}}> {item.duration} </td>
                                                        <td style={{padding: "12px 15px"}}> {item.teamObject ? item.teamObject.id : ''} </td>
                                                        <td style={{padding: "12px 15px"}}> {item.projectObject ? item.projectObject.id : ''} </td>
                                                        <td style={{padding: "12px 15px"}}> {item.projectObject ? item.projectObject.name : '━━━━━Break━━━━━'} </td>
                                                        <td style={{padding: "12px 15px"}}> {item.organizationObject ? item.organizationObject.name : ''} </td>
                                                        <td style={{padding: "12px 15px"}}> {item.teamObject ? item.teamObject.students.map(o => o.engFirstName + ' ' + o.engLastName).join(', ') : ''} </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </ul>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default (ExportPresentation)