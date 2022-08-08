import React from "react";
import Paper from '@material-ui/core/Paper';
import {makeStyles, createMuiTheme, ThemeProvider} from '@material-ui/core/styles';
import Projects from "../../components/SharedComponents/AvailableProjectsTable/Projects";
import CoursesManagement from "../../components/AdminComponents/Courses Management/CoursesManagement";
import {Switch, Route} from "react-router-dom";
import SendEmail from "../../components/AdminComponents/SendEmail/SendEmail";
import Syllabus from "../../components/SharedComponents/Syllabus/Syllabus";
import Staff from "../../components/SharedComponents/Staff/Staff";
import Help from "../../components/SharedComponents/Help/Help";
import CourseMaterial from "../../components/SharedComponents/CourseMaterial/CourseMaterial"
import UserDetails from "../../components/SharedComponents/UserDetails/UserDetails";
import Preferences from "../../components/AdminComponents/Preferences/Preferences"
import Dashboard from "../../components/SharedComponents/Dashboard/Dashboard";
import CalendarComponent from "../../components/SharedComponents/Schedule/Calendar/CalendarComponent";
import Announcements from "../../components/SharedComponents/Announcements/Announcements";
import Legacy from "../../components/AdminComponents/Legacy/Legacy";
import Logs from "../../components/AdminComponents/Logs/Logs";
import Search from "../../components/SharedComponents/Search/Search";
import Services from "../../components/AdminComponents/Services/Services";

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
            <Paper className={classes.root}>
                <main>
                    <Switch>
                        <Route exact path={["/Dashboard", "/"]} render={() => <Dashboard/>}/>
                        <Route path="/Announcements" render={() => <Announcements/>}/>
                        <Route path="/UserDetails" render={() => <UserDetails/>}/>
                        <Route path="/Projects" render={() => <Projects/>}/>
                        <Route path="/CoursesManagement" render={() => <CoursesManagement/>}/>
                        <Route path="/Schedule" render={() => <CalendarComponent/>}/>
                        <Route path="/SendEmail" render={() => <SendEmail/>}/>
                        <Route path="/Syllabus" render={() => <Syllabus/>}/>
                        <Route path="/Staff" render={() => <Staff/>}/>
                        <Route path="/CourseMaterial" render={() => <CourseMaterial/>}/>
                        <Route path="/Help" render={() => <Help/>}/>
                        <Route path="/Preferences" render={() => <Preferences/>}/>
                        <Route path="/Legacy" render={() => <Legacy/>}/>
                        <Route path="/Logs" render={() => <Logs/>}/>
                        <Route path="/Search" render={() => <Search/>}/>
                        <Route path="/Services" render={() => <Services/>}/>

                    </Switch>
                </main>
            </Paper>
        </ThemeProvider>

    );
}