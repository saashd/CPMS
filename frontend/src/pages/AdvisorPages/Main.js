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
import Announcements from "../../components/SharedComponents/Announcements/Announcements";
import CalendarComponent from "../../components/SharedComponents/Schedule/Calendar/CalendarComponent";
import ProjectsComponent from "../../components/AdvisorComponents/ProjectsComponent";
import Search from "../../components/SharedComponents/Search/Search";
import {connect} from "react-redux";
import Legacy from "../../components/AdminComponents/Legacy/Legacy";


const useStyles = makeStyles((theme) => ({
    root: {
        height: '84vh',
        overflow: "auto",
        justifyContent: "space-between"
    }
}));


function Main(props) {
    const classes = useStyles();
    const theme = createMuiTheme({
        palette: {
            primary: {
                main: '#3f51b5',
            }
        },
    });
    let userRed = JSON.parse(props.userRed);


    return (
        <ThemeProvider
            theme={theme}
        >
            <Paper
                className={classes.root}
            >
                <main>
                    <Switch>
                        <Route exact path={["/Announcements", "/"]} render={() => <Announcements/>}/>
                        <Route path="/UserDetails" render={() => <UserDetails/>}/>
                        <Route path="/Projects" render={() => <Projects/>}/>
                        <Route path="/MyProjects" render={() => <ProjectsComponent/>}/>
                        <Route path="/Syllabus" render={() => <Syllabus/>}/>
                        <Route path="/Staff" render={() => <Staff/>}/>
                        <Route path="/CourseMaterial" render={() => <CourseMaterial/>}/>
                        <Route path="/Help" render={() => <Help/>}/>
                        <Route path="/Schedule" render={() => <CalendarComponent/>}/>
                        {userRed.advisorType !== 'industrial' ? <Route path="/Legacy" render={() => <Legacy/>}/> :
                            <div></div>}
                        {userRed.advisorType !== 'industrial' ? <Route path="/Search" render={() => <Search/>}/> :
                            <div></div>}
                    </Switch>

                </main>
            </Paper>
        </ThemeProvider>

    );
}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};

export default connect(mapStateToProps)(Main)