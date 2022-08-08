import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AccountBox from '@material-ui/icons/AccountBox';
import ViewList from '@material-ui/icons/ViewList';
import EventNoteIcon from '@material-ui/icons/EventNote';
import {Link} from "react-router-dom";
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import SchoolIcon from '@material-ui/icons/School';
import makeStyles from "@material-ui/core/styles/makeStyles";
import List from "@material-ui/core/List";
import AssignmentIcon from "@material-ui/icons/Assignment";
import ContactMailIcon from "@material-ui/icons/ContactMail";
import AnnouncementIcon from '@material-ui/icons/Announcement';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import {Tooltip} from '@material-ui/core';
import SearchIcon from "@material-ui/icons/Search";
import {connect} from "react-redux";
import ArchiveIcon from '@material-ui/icons/Archive';

const useStyles = makeStyles(() => ({
        root: {
            '&.Mui-selected': {
                background: 'rgba(63,81,181,0.11)',
                color: '#3f51b5',
                '& path': {
                    fill: '#3f51b5',
                }
            },
            "&:hover": {
                background: 'rgba(63,81,181,0.11)'
            },
            '&.active, &:hover, &.active:hover': {
                '& path': {
                    fill: '#3f51b5',
                }
            }
        },

    }
));

function MainListItems(props) {
    let classes = useStyles();
    const [selectedIndex, setSelectedIndex] = React.useState();
    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
    };
    let list = [{index: 3, icon: <AnnouncementIcon/>, linkTo: "/", title: "Announcements"},
        {index: 4, icon: <AccountBox/>, linkTo: "/UserDetails", title: "My Details"},
        {index: 5, icon: <ViewList/>, linkTo: "/Projects", title: "Available Projects"},
        {index: 6, icon: <SchoolIcon/>, linkTo: "/MyProjects", title: "MyProjects"},
        {index: 7, icon: <EventNoteIcon/>, linkTo: "/Schedule", title: "Schedule"},
        {index: 8, icon: <LiveHelpIcon/>, linkTo: "/Help", title: "Help"},

    ];
    let userRed = JSON.parse(props.userRed);

    if (userRed.advisorType !== 'industrial') {
        list.push({
                index: 9,
                icon: <SearchIcon/>,
                linkTo:  "/Search" ,
                title:  "Search"
            },
            {
                index: 10,
                icon: <ArchiveIcon/>,
                linkTo:  "/Legacy" ,
                title:  "Archive"
            },
        )
    }
    return (
        <div style={{paddingLeft: 5}}>
            <List>
                {(window.innerWidth < 1100) ?
                    <div>
                        {[{index: 0, icon: <AssignmentIcon/>, linkTo: "/Syllabus", title: "Syllabus"},
                            {index: 1, icon: <ContactMailIcon/>, linkTo: "/Staff", title: "Staff"},
                            {index: 2, icon: <BookmarksIcon/>, linkTo: "/CourseMaterial", title: "Course Material"}
                            ].map((item, index) => (
                            !props.drawerOpen ?
                                <Tooltip key={item.index} title={item.title} aria-label={item.title} placement="right"
                                         arrow>
                                    <ListItem key={item.index}
                                              selected={selectedIndex === item.index}
                                              onClick={(event) => handleListItemClick(event, item.index)}
                                              className={classes.root} button component={Link} to={item.linkTo}>
                                        <ListItemIcon>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.title}/>
                                    </ListItem>
                                </Tooltip> :
                                <ListItem key={item.index}
                                          selected={selectedIndex === item.index}
                                          onClick={(event) => handleListItemClick(event, item.index)}
                                          className={classes.root} button component={Link} to={item.linkTo}>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.title}/>
                                </ListItem>
                        ))}
                    </div> : ''
                }
                {list.map((item, index) => (
                    !props.drawerOpen ?
                        <Tooltip key={item.index} title={item.title} aria-label={item.title} placement="right" arrow>
                            <ListItem key={item.index}
                                      selected={selectedIndex === item.index}
                                      onClick={(event) => handleListItemClick(event, item.index)}
                                      className={classes.root} button component={Link} to={item.linkTo}>
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.title}/>
                            </ListItem>
                        </Tooltip> :
                        <ListItem key={item.index}
                                  selected={selectedIndex === item.index}
                                  onClick={(event) => handleListItemClick(event, item.index)}
                                  className={classes.root} button component={Link} to={item.linkTo}>
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.title}/>
                        </ListItem>
                ))}
            </List>
        </div>
    );
}

const mapStateToProps = state => {
    return {
        userRed: state['user'],
        adminViewRed: state['adminView']
    }
};

export default connect(mapStateToProps)(MainListItems)