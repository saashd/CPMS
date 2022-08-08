import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AccountBox from '@material-ui/icons/AccountBox';
import ViewList from '@material-ui/icons/ViewList';
import WorkIcon from '@material-ui/icons/Work';
import EventNoteIcon from '@material-ui/icons/EventNote';
import {Link} from "react-router-dom";
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import makeStyles from "@material-ui/core/styles/makeStyles";
import List from "@material-ui/core/List";
import ContactMailIcon from '@material-ui/icons/ContactMail';
import AssignmentIcon from '@material-ui/icons/Assignment';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import DashboardIcon from '@material-ui/icons/Dashboard';
import SettingsIcon from "@material-ui/icons/Settings";
import ArchiveIcon from '@material-ui/icons/Archive';
import HistoryIcon from '@material-ui/icons/History';
import SearchIcon from '@material-ui/icons/Search';
import SettingsApplicationsIcon from '@material-ui/icons/SettingsApplications';

import {Tooltip} from '@material-ui/core';

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

export default function MainListItems(props) {
    let classes = useStyles();
    const [selectedIndex, setSelectedIndex] = React.useState();
    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
    };
    return (
        <div style={{paddingLeft: 5}}>
            <List>
                {(window.innerWidth < 1100) ?
                    <div>
                        {[{index: 0, icon: <AssignmentIcon/>, linkTo: "/Syllabus", title: "Syllabus"},
                            {index: 1, icon: <ContactMailIcon/>, linkTo: "/Staff", title: "Staff"},
                            {index: 2, icon: <BookmarksIcon/>, linkTo: "/CourseMaterial", title: "Course Material"},
                            {
                                index: 3,
                                icon: <SettingsIcon/>,
                                linkTo: "/Preferences",
                                title: "Preferences"
                            }].map((item, index) => (
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
                {[{index: 4, icon: <DashboardIcon/>, linkTo: "/", title: "Dashboard"},
                    {index: 5, icon: <AnnouncementIcon/>, linkTo: "/Announcements", title: "Announcements"},
                    {index: 6, icon: <AccountBox/>, linkTo: "/UserDetails", title: "My Details"},
                    {index: 7, icon: <ViewList/>, linkTo: "/Projects", title: "Available Projects"},
                    {index: 8, icon: <WorkIcon/>, linkTo: "/CoursesManagement", title: "Courses Management"},
                    {index: 9, icon: <EventNoteIcon/>, linkTo: "/Schedule", title: "Schedule"},
                    {index: 11, icon: <ArchiveIcon/>, linkTo: "/Legacy", title: "Archive"},
                    {index: 12, icon: <HistoryIcon/>, linkTo: "/Logs", title: "Logs"},
                    {index: 10, icon: <LiveHelpIcon/>, linkTo: "/Help", title: "Help"},
                    {index: 13, icon: <SearchIcon/>, linkTo: "/Search", title: "Search"},
                    {index: 14, icon: <SettingsApplicationsIcon/>, linkTo: "/Services", title: "Services"}

                ].map((item, index) => (
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
