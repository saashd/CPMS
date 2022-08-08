import * as React from 'react';
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import {MenuIcon, SearchIcon} from "@material-ui/data-grid";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import {withStyles} from "@material-ui/core/styles";
import Popover from "@material-ui/core/Popover";
import AllProjects from '../../AdminComponents/Courses Management/Projects/AllProjects/allProjects';
import Students from '../../AdminComponents/Courses Management/Users/Students/Students'
import Personnel from '../../AdminComponents/Courses Management/Users/Personnel/Personnel'
import Teams from '../../AdminComponents/Courses Management/Teams/Teams';
import {search} from '../../Services/mySqlServices';
import {Grid} from '@material-ui/core';
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";


const styles = (theme) => ({
    // drawerPaper: {
    //     // height: '100vh',
    //     // width: drawerWidth,
    //     paddingTop: appBarHeight,
    //     position: 'relative',
    //     whiteSpace: 'nowrap',
    //     transition: theme.transitions.create('width', {
    //         easing: theme.transitions.easing.sharp,
    //         duration: theme.transitions.duration.enteringScreen,
    //     }),
    // },
    // drawerPaperClose: {
    //     overflowX: 'hidden',
    //     transition: theme.transitions.create('width', {
    //         easing: theme.transitions.easing.sharp,
    //         duration: theme.transitions.duration.leavingScreen,
    //     }),
    //     width: theme.spacing(7),
    //     [theme.breakpoints.up('sm')]: {
    //         width: theme.spacing(9),
    //     },
    // },
    // appBarSpacer: theme.mixins.toolbar,
    // content: {
    //     flexGrow: 1,
    //     width: '95%',
    // },
    // contentShift: {
    //     width: `calc(100% - ${drawerWidth}px)`,
    // },
    // container: {
    //     paddingTop: theme.spacing(1),
    //     paddingBottom: theme.spacing(0),
    //
    //
    // },
    // paper: {
    //     padding: theme.spacing(2),
    //     display: 'flex',
    //     overflow: 'auto',
    //     flexDirection: 'column',
    //
    //
    // },
    // grow: {
    //     flexGrow: 1,
    // },
});


class Search extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // open: false,
            searchStudents: true,
            searchProjects: true,
            searchTeams: true,
            searchTerm: '',
            searchProjectsArray: [],
            searchTeamsArray: [],
            searchStudentsArray: [],
            searchAdvisorsArray: [],
            anchorEl: null,
            showTables: false
        };


    }

    searchTermChange = (event) => {
        this.setState({searchTerm: event.target.value})
    };

    handleSearch = (e) => {
        this.setState({ showTables: false });
        e.preventDefault();
        let entities = ''
        if (this.state.searchStudents) {
            entities += 'users'
        }
        if (this.state.searchTeams) {
            if (entities.length > 0) {
                entities += ','
            }
            entities += 'teams'
        }
        if (this.state.searchProjects) {
            if (entities.length > 0) {
                entities += ','
            }
            entities += 'projects'
        }
        let searchParams = {search_term: this.state.searchTerm, entities: entities}
        search(searchParams).then((response) => {
            this.setState({
                searchProjectsArray: response['projects'],
                searchStudentsArray: response['users']['students'],
                searchAdvisorsArray: response['users']['advisors'],
                searchTeamsArray: response['teams']
            });
            this.setState({ showTables: true });
        }).catch((error) => {
            this.setState({error: error});
        });
    };

    keyPress = (e) => {
        if (e.keyCode === 13) {// Enter pressed on search inputBase
            this.handleSearch(e);
        }
    }


    render() {
        const handleDrawerClose = () => {
            this.setState({anchorEl: null})
        };

        const handleDrawerOpen = (event) => {
            this.setState({anchorEl: event.currentTarget})
        };
        const open = Boolean(this.state.anchorEl);

        return (<>
                <Grid
                    container
                    spacing={0}
                    direction="column"
                    alignItems="center"
                    justify="center">
                    <CssBaseline/>
                    <Typography variant={'h6'} color={'primary'} style={{margin:'2%'}}>
                        Here you will find details about registered users, teams and projects.
                        <br/> </Typography>
                    <Paper
                        component="form"
                        style={{
                            textAlign: "center",
                            margin: "1%"
                        }}>
                        <Tooltip title="Choose Table">
                        <IconButton
                            style={{marginLeft:'0'}}
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            edge="start">
                            <MenuIcon/>
                        </IconButton>
                        </Tooltip>
                        <InputBase
                            sx={{ml: 1, flex: 1}}
                            placeholder="Search"
                            inputProps={{'aria-label': 'search'}}
                            style={{
                                width: "500px"
                            }}
                            value={this.state.searchTerm}
                            onChange={this.searchTermChange}
                            onKeyDown={this.keyPress}
                        />
                        <IconButton type="submit" onClick={this.handleSearch}
                                    aria-label="search">
                            <SearchIcon/>
                        </IconButton>
                    </Paper>
                    <Popover
                        anchorEl={this.state.anchorEl}
                        onClose={handleDrawerClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        open={open}>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={this.state.searchStudents}
                                                                 onChange={() => {
                                                                     this.setState({searchStudents: !this.state.searchStudents});
                                                                 }}/>} label="Users"/>
                            <FormControlLabel control={<Checkbox checked={this.state.searchProjects} onChange={() => {
                                this.setState({searchProjects: !this.state.searchProjects});
                            }}/>} label="Projects"/>
                            <FormControlLabel control={<Checkbox checked={this.state.searchTeams} onChange={() => {
                                this.setState({searchTeams: !this.state.searchTeams});
                            }}/>} label="Teams"/>
                        </FormGroup>
                    </Popover>
                </Grid>
                {this.state.searchStudentsArray.length > 0  && this.state.showTables?
                    <Students type={"search"} searchUsers={this.state.searchStudentsArray}/> : null}
                <br></br>
                {this.state.searchAdvisorsArray.length > 0 && this.state.showTables ?
                    <Personnel type={"search"} searchUsers={this.state.searchAdvisorsArray}/> : null}
                <br></br>
                {this.state.searchTeamsArray.length > 0 && this.state.showTables ?
                    <Teams type={"search"} searchTeams={this.state.searchTeamsArray}/> : null}
                <br></br>
                {this.state.searchProjectsArray.length > 0 && this.state.showTables ?
                    <AllProjects type={"search"} searchProjects={this.state.searchProjectsArray}/> : null}
            </>
        );
    }
}

export default withStyles(styles, {withTheme: true})(Search);
