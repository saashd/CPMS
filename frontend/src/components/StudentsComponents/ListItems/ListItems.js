import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AccountBox from '@material-ui/icons/AccountBox';
import ViewList from '@material-ui/icons/ViewList';
import { Link } from "react-router-dom";
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import SchoolIcon from '@material-ui/icons/School';
import makeStyles from "@material-ui/core/styles/makeStyles";
import List from "@material-ui/core/List";
import PeopleIcon from '@material-ui/icons/PeopleAlt';
import SearchIcon from '@material-ui/icons/Search';
import EventNoteIcon from "@material-ui/icons/EventNote";
import AssignmentIcon from "@material-ui/icons/Assignment";
import ContactMailIcon from "@material-ui/icons/ContactMail";
import AnnouncementIcon from '@material-ui/icons/Announcement';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import TimelineIcon from '@material-ui/icons/Timeline';
import { Tooltip } from '@material-ui/core';

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
        <div style={{ paddingLeft: 5 }}>
            <List>
                {(window.innerWidth < 1100) ?
                    <div>
                        {[{ index: 0, icon: <AssignmentIcon />, linkTo: "/Syllabus", title: "Syllabus" },
                        { index: 1, icon: <ContactMailIcon />, linkTo: "/Staff", title: "Staff" },
                        { index: 2, icon: <BookmarksIcon />, linkTo: "/CourseMaterial", title: "Course Material" }].map((item, index) => (
                            !props.drawerOpen ?
                                <Tooltip key={item.index} title={item.title} aria-label={item.title} placement="right" arrow>
                                    <ListItem key={item.index}
                                        selected={selectedIndex === item.index}
                                        onClick={(event) => handleListItemClick(event, item.index)}
                                        className={classes.root} button component={Link} to={item.linkTo}>
                                        <ListItemIcon>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.title} />
                                    </ListItem>
                                </Tooltip> :
                                <ListItem key={item.index}
                                    selected={selectedIndex === item.index}
                                    onClick={(event) => handleListItemClick(event, item.index)}
                                    className={classes.root} button component={Link} to={item.linkTo}>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.title} />
                                </ListItem>
                        ))}
                    </div> : ''
                }
                {[{ index: 3, icon: <AnnouncementIcon />, linkTo: "/", title: "Announcements" },
                { index: 4, icon: <AccountBox />, linkTo: "/UserDetails", title: "My Details" },
                { index: 6, icon: <ViewList />, linkTo: "/Projects", title: "Available Projects" },
                { index: 7, icon: <PeopleIcon />, linkTo: "/MyTeam", title: "My Team" },
                { index: 8, icon: <SchoolIcon />, linkTo: "/MyProject", title: "My Project" },
                { index: 5, icon: <TimelineIcon />, linkTo: "/GanttBuilder", title: "Gantt Chart" },
                { index: 9, icon: <SearchIcon />, linkTo: "/FindPartner", title: "Find Partner" },
                { index: 10, icon: <EventNoteIcon />, linkTo: "/Schedule", title: "Schedule" },
                { index: 11, icon: <LiveHelpIcon />, linkTo: "/Help", title: "Help" },
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
                                <ListItemText primary={item.title} />
                            </ListItem>
                        </Tooltip> :
                        <ListItem key={item.index}
                            selected={selectedIndex === item.index}
                            onClick={(event) => handleListItemClick(event, item.index)}
                            className={classes.root} button component={Link} to={item.linkTo}>
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.title} />
                        </ListItem>
                ))}
            </List>
        </div>
    );
}
