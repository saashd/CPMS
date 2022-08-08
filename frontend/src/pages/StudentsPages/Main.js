import React from "react";
import Paper from '@material-ui/core/Paper';
import {makeStyles, createMuiTheme, ThemeProvider} from '@material-ui/core/styles';
import Projects from "../../components/SharedComponents/AvailableProjectsTable/Projects";
import {Switch, Route} from "react-router-dom";
import Syllabus from "../../components/SharedComponents/Syllabus/Syllabus";
import Staff from "../../components/SharedComponents/Staff/Staff";
import Help from "../../components/SharedComponents/Help/Help";
import CourseMaterial from "../../components/SharedComponents/CourseMaterial/CourseMaterial"
import UserDetails from "../../components/SharedComponents/UserDetails/UserDetails";
import GanttBuilder from "../../components/SharedComponents/GanttBuilder/GanttBuilder";
import MyProjects from "../../components/SharedComponents/MyProjects/MyProjects";
import Announcements from "../../components/SharedComponents/Announcements/Announcements";
import FindPartner from "../../components/SharedComponents/FindPartner/FindPartner";
import MyTeam from "../../components/StudentsComponents/MyTeam/MyTeam";
import CalendarComponent from "../../components/SharedComponents/Schedule/Calendar/CalendarComponent";


const useStyles = makeStyles((theme) => ({
    root: {
        height: '84vh',
        overflow: "auto",
        justifyContent: "space-between"
    }
}));


export default function Main() {
    const classes = useStyles();

    const theme = createMuiTheme({
        palette: {
            primary: {
                main: '#3f51b5',
            }
        },
    });

    return (
        <ThemeProvider
            theme={theme}
        >
            <Paper
                className={classes.root}
            >
                <main>
                    <Switch>
                        <Route exact path={["/Announcements","/"]} render={() => <Announcements/>}/>
                        <Route path="/UserDetails" render={() => <UserDetails/>}/>
                        <Route path="/GanttBuilder" render={() => <GanttBuilder />} />
                        <Route path="/MyTeam" render={() => <MyTeam/>}/>
                        <Route path="/MyProject" render={() => <MyProjects/>}/>
                        <Route path="/Projects" render={() => <Projects/>}/>
                        <Route path="/FindPartner" render={() => <FindPartner/>}/>
                        <Route path="/Syllabus" render={() => <Syllabus/>}/>
                        <Route path="/Staff" render={() => <Staff/>}/>
                        <Route path="/CourseMaterial" render={() => <CourseMaterial/>}/>
                        <Route path="/Help" render={() => <Help/>}/>
                        <Route path="/Schedule" render={() => <CalendarComponent/>}/>
                    </Switch>
                </main>
            </Paper>
        </ThemeProvider>

    );
}