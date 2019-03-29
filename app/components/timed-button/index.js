// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import max from '@stdlib/math/base/special/max';
import './timed-button.css';

// MAIN //

/**
* A component displaying an image in the style of a polaroid.
*
* @property {number} duration - the time it takes until the button gets reactivated, default 3000 ms
* @property {function} onClick - the click function
* @property {function} title - the button title
*/
class TimedButton extends Component {
	constructor( props ) {
		super( props );

		this.id = 'ButtonIdentifier' + parseInt( Math.random() *1000, 10);

		this.state = {
			timeLeft: props.duration,
			waiting: !props.disabled,
			width: 100
		};
	}

	componentDidMount() {
		if (this.state.waiting === false) {
			this.start();
		}
	}

	componentWillUnmount() {
		clearInterval(this.countdown);
	}


	refDimensions = (element) => {
		if (element) {
			console.log('Anzeige der Dimension');
			let x = element.getBoundingClientRect();
			let width = x.width;

			this.setState({
				width: width
			});
		}
	}


	start() {
		this.setState({
			waiting: false
		});

		this.countdown = setInterval( () => {
			// Decrement the time by 1:
			this.setState({
				timeLeft: max( 0, this.state.timeLeft - 1 )
			});

			if (this.state.timeLeft === 0) {
				clearInterval(this.countdown);
				this.setState({
					waiting: true,
					timeLeft: this.props.duration
				});
			}
		}, 1000 );
	}

	trigger = () => {
		this.props.onClick();
		this.setState({
			waiting: true
		});
		this.start();
	}


	render() {
		const disabled = !this.state.waiting;

		const style = {
			marginLeft: 3,
			width: this.state.width
		};

		const percentage = (1 - (this.state.timeLeft / this.props.duration)) * this.state.width;
		const barStyle = {
			width: percentage
		};

		return (
			<div>
				<div style={style} className="timed-button-remaining">
					<div style={barStyle} className="timed-button-bar"></div>
				</div>
				<div id={this.id} className="timed-button-container">
					<Button ref={this.refDimensions} disabled={disabled} onClick={this.trigger} variant={this.props.variant} className="input-button-full">
						{this.props.title}
					</Button>
				</div>
			</div>
		);
	}
}


// PROPERTIES //

TimedButton.propTypes = {
	duration: PropTypes.number,
	disabled: PropTypes.bool,
	onClick: PropTypes.func,
	title: PropTypes.string,
	variant: PropTypes.string
};

TimedButton.defaultProps = {
	disabled: false,
	duration: 3000,
	onClick() {},
	title: 'Button',
	variant: 'info'
};


// EXPORTS //

export default TimedButton;