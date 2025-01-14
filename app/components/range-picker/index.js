// MODULES //

import React, { Component } from 'react';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import moment from 'moment';
import PropTypes from 'prop-types';
import DateRangePicker from 'react-dates/esm/components/DateRangePicker';
import './_datepicker.css';


// MAIN //

/**
* Data range picker.
*
* @property {string} size - button size
* @property {Object} style - CSS inline styles
* @property {Function} onChange - callback invoked when the data selection is changed; calledwith the current period (object with `from` and `to` properties)
*/
class RangePicker extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			period: {
				from: moment( 0 ).subtract( 60, 'minutes' ),
				to: moment()
			},
			active: 5
		};
	}

	timeClickFactory = ( type ) => {
		let ret;
		switch ( type ) {
		case 'last_hour':
			ret = () => {
				const from = moment().subtract( 60, 'minutes' );
				const to = moment();
				this.updatePeriod( from, to, 0 );
			};
			return ret;
		default:
		case 'last_day':
			ret = () => {
				const from = moment().
					subtract( 1, 'minutes' ).
					startOf( 'day' );
				const to = moment().endOf( 'day' );
				this.updatePeriod( from, to, 1 );
			};
			return ret;
		case 'last_week':
			ret = () => {
				const from = moment().
					subtract( 7, 'days' ).
					startOf( 'day' );
				const to = moment().endOf( 'day' );
				this.updatePeriod( from, to, 2 );
			};
			return ret;
		case 'last_month':
			ret = () => {
				const from = moment().
					subtract( 30, 'days' ).
					startOf( 'day' );
				const to = moment().endOf( 'day' );
				this.updatePeriod( from, to, 3 );
			};
			return ret;
		case 'last_year':
			ret = () => {
				const from = moment().
					subtract( 365, 'days' ).
					startOf( 'day' );
				const to = moment().endOf( 'day' );
				this.updatePeriod( from, to, 4 );
			};
			return ret;
		case 'all_time':
			ret = () => {
				const from = moment( 0 ).startOf( 'day' );
				const to = moment().endOf( 'day' );
				this.updatePeriod( from, to, 5 );
			};
			return ret;
		}
	}

	updatePeriod = ( from, to, active ) => {
		this.setState({
			period: { from, to },
			active: active
		}, () => {
			this.props.onChange( this.state.period );
		});
	}

	render() {
		const activeStyle = {
			background: 'slategray',
			color: 'white',
			textShadow: 'none'
		};
		return (
			<ButtonToolbar style={{ marginBottom: '10px', ...this.props.style }} >
				<ButtonGroup size={this.props.size}>
					<Button
						variant="light"
						className="date-selection"
						id="last_hour"
						onClick={this.timeClickFactory( 'last_hour' )}
						style={this.state.active === 0 ? activeStyle : {}}
					>Last Hour</Button>
					<Button
						variant="light"
						className="date-selection"
						id="last_day"
						onClick={this.timeClickFactory( 'last_day' )}
						style={this.state.active === 1 ? activeStyle : {}}
					>Day</Button>
					<Button
						variant="light"
						className="date-selection"
						id="last_week"
						onClick={this.timeClickFactory( 'last_week' )}
						style={this.state.active === 2 ? activeStyle : {}}
					>Week</Button>
					<Button
						variant="light"
						className="date-selection"
						id="last_month"
						onClick={this.timeClickFactory( 'last_month' )}
						style={this.state.active === 3 ? activeStyle : {}}
					>Month</Button>
					<Button
						variant="light"
						className="date-selection"
						id="last_year"
						onClick={this.timeClickFactory( 'last_year' )}
						style={this.state.active === 4 ? activeStyle : {}}
					>Year</Button>
					<Button
						variant="light"
						className="date-selection"
						id="all_time"
						onClick={this.timeClickFactory( 'all_time' )}
						style={this.state.active === 5 ? activeStyle : {}}
					>All</Button>
				</ButtonGroup>
				<DateRangePicker
					startDate={this.state.period.from}
					endDate={this.state.period.to}
					onDatesChange={({ startDate, endDate }) => {
						const newPeriod = {
							from: startDate,
							to: endDate
						};
						this.setState({
							period: newPeriod
						});
					}}
					focusedInput={this.state.focusedInput}
					onFocusChange={focusedInput => this.setState({ focusedInput })}
					isOutsideRange={() => false}
				/>
			</ButtonToolbar>
		);
	}
}


// PROPERTIES //

RangePicker.propTypes = {
	size: PropTypes.oneOf(
		[
			'small',
			'sm',
			'large',
			'lg'
		]
	),
	onChange: PropTypes.func,
	style: PropTypes.object
};

RangePicker.defaultProps = {
	size: 'small',
	onChange() {},
	style: {}
};


// EXPORTS //

export default RangePicker;
