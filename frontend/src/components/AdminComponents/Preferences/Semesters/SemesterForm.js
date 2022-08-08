import React, {Component} from "react";
import "react-dates/initialize";
import {DateRangePicker} from "react-dates";
import "react-dates/lib/css/_datepicker.css";
import TextField from "@material-ui/core/TextField";
import RefreshIcon from '@material-ui/icons/Refresh';
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

class SemesterForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            checkIfDateAvailable: this.props.checkIfDateAvailable,
            id: this.props.id,
            title: this.props.title,
            start: this.props.start,
            end: this.props.end,
            focusedInput: this.props.focusedInput,
            updateSemester: this.props.updateSemester,
            toUpdate: false,
            isCurrent: this.props.isCurrent,
        };
    }

    render() {
        /**
         * updates selectes semester's properties.
         * @param e
         */
        const update = (e) => {
            e.preventDefault();
            let data = {
                id: this.state.id,
                title: this.state.title,
                startDate: this.state.start,
                endDate: this.state.end,
                isCurrent: this.state.isCurrent,
                focusedInput: this.state.focusedInput
            };
            this.state.updateSemester(data);
            this.setState({toUpdate: false})
        };

        /**
         *changes semesters start and end dates
         * @param startDate
         * @param endDate
         */
        const handleDatesChange = ({startDate, endDate}) => {
            this.state.checkIfDateAvailable(startDate, endDate, this.state.id);
            this.setState({toUpdate: true});
            this.setState({start: startDate, end: endDate});
            this.forceUpdate();

        };
        /**
         *changes semester name
         * @param e
         */
        const changeName = (e) => {
            this.setState({toUpdate: true});
            this.setState({title: e.target.value});
            this.forceUpdate();
        };

        return (
            <div style={{textAlign: 'center'}}>
                    <form id={'semester'} onSubmit={update}>
                            <h2>Semester Name</h2>
                            <TextField variant="outlined" name="title" onChange={changeName}
                                       value={this.state.title}
                                       id="title" required/>
                            <h2>Start Date &#129042; End Date</h2>
                            <DateRangePicker
                                required={true}
                                daySize={25}
                                isOutsideRange={() => false}
                                startDate={this.state.start}
                                startDateId="tata-start-date"
                                endDate={this.state.end}
                                endDateId="tata-end-date"
                                onDatesChange={handleDatesChange}
                                focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
                                onFocusChange={focusedInput => this.setState({focusedInput})} // PropTypes.func.isRequired,
                            />
                    </form>
                    <Button
                        form={'semester'}
                        type={'submit'}
                        style={{
                            marginRight: '95%',
                            display: this.state.toUpdate ? "inline" : "none",
                        }}
                        color="primary">
                        <RefreshIcon/> Update
                    </Button>
                {this.state.isCurrent ?
                    <Typography
                        variant="h6" align={'center'} color={"primary"}>
                        This is the current semester
                    </Typography> : ''
                }
            </div>
        );
    }
}

export default SemesterForm;
