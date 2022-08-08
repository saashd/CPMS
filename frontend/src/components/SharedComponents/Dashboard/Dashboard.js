import {
    Box,
    Container,
    Grid
} from '@material-ui/core';
import React from "react";
import Paper from "@material-ui/core/Paper";
import ProjectsChart from "./ProjectsChart";
import UpcomingEvents from "./UpcomingEvents";
import UsersChart from "./UsersChart";
import RequestsChart from "./RequestsChart";


function Dashboard() {
    return (
        <Box
            sx={{
                backgroundColor: 'background.default',
                minHeight: '100%',
                py: 3
            }}
        >
            <Container maxWidth={false} style={{paddingTop: '1%',}}>
                <Grid
                    container
                    spacing={3}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Grid
                        container item
                        style={{paddingLeft: '4%'}}
                        spacing={3}
                        lg={6}
                        md={12}
                        xs={12}>
                        <Grid item
                              xs={12}>
                            <Paper style={{height: 300}}>
                                <UpcomingEvents/>
                            </Paper>
                        </Grid>
                        <Grid
                            item
                            lg={12}
                            md={12}
                            xs={12}

                        >
                            <Paper>
                                <RequestsChart style={{height: 300}}/>
                            </Paper>
                        </Grid>
                    </Grid>
                    <Grid container item
                          style={{paddingLeft: '1%',}}
                          lg={6}
                          md={12}
                          xs={12}
                          spacing={3}
                    >
                        <Grid
                            item
                            lg={12}
                            md={12}
                            xs={12}
                        >
                            <Paper>
                                <ProjectsChart style={{height: 300}}/>
                            </Paper>
                        </Grid>
                        <Grid
                            item
                            lg={12}
                            md={12}
                            xs={12}
                        >
                            <Paper>
                                <UsersChart style={{height: 300}}/>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
};

export default Dashboard;
