import React, {Component} from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import Form from '@rjsf/material-ui';
import {createMuiTheme, MuiThemeProvider,} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";


const schema =
    {
        "title": "A customizable evaluation form",
        "description": "Please select criteria and score accordingly",
        "type": "object",
        "additionalProperties": {
            "type": "number"
        },
        "ui:options": {
            "label": false
        },
        "properties": {
            "title": {
                "type": "string",
                "title": "Evaluation Page Title"
            },
        }
    };

class EvaluationPageTemplate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: this.props.tab,
            title: this.props.title,
            template: this.props.template,
            onSubmit: this.props.onSubmit
        };
    }

    /**
     * Function that updated tabs title and template properties and call to onSubmit func, to create new tab.
     * @param    {Object} formData- evaluation page template
     */
    onSubmit = ({formData}, e) => {
        e.preventDefault();
        let updateTab = {...this.state.tab};
        updateTab.title = this.state.title;
        updateTab.template = formData;
        this.state.onSubmit(updateTab);
        this.setState({template: formData});
    };


    /**
     * Function that updated template
     * @param    {Object} formData- evaluation page template
     */
    onChange = ({formData}) => {
        this.setState({template: formData});
    };

    /**
     * Function that checks if string contains hebrew simbols.
     * @param    {String} str-string
     * @return {Boolean}
     */
    containsHeb(str) {
        if (!str) {
            return false
        }
        return (/[\u0590-\u05FF]/).test(str);
    }

    render() {
        return (
            <MuiThemeProvider theme={createMuiTheme({
                overrides: {
                    MuiInputBase: {
                        input: {
                            textAlign: this.state.template ? (this.containsHeb(this.state.template.title) ? 'end' : 'start') : 'center'
                        }
                    },
                    MuiFormLabel: {
                        root: {
                            paddingLeft: '50%',
                        }
                    }
                }
            })}>
                <Grid container>
                    <Grid item xs={12}>
                        <Paper elevation={3}
                               style={{
                                   padding: "5%",
                               }}>
                            <div className="container">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <Form
                                            schema={schema}
                                            formData={this.state.template}
                                            onSubmit={this.onSubmit}
                                            onChange={this.onChange}/>
                                    </div>
                                </div>
                            </div>
                        </Paper>
                    </Grid>
                </Grid>
            </MuiThemeProvider>
        );
    }
}

export default EvaluationPageTemplate;
