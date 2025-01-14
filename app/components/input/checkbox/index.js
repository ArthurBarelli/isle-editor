// MODULES //

import React from 'react';
import PropTypes from 'prop-types';
import isEmptyObject from '@stdlib/assert/is-empty-object';
import Input from 'components/input/base';
import SessionContext from 'session/context.js';
import './checkbox.css';


// MAIN //

/**
* A checkbox input component. Can be used as part of an ISLE dashboard or standalone. In the latter case, you want to handle changes via the `onChange` attribute or bind the value to a global variable via the `bind` attribute.
*
* @property {string} bind - name of global variable for the checkbox value to be assigned to
* @property {boolean} defaultValue - A boolean value indicating the default value of the checkbox
* @property {boolean} disabled - indicates whether the input is active or not
* @property {boolean} inline - indicates whether the checkbox is displayed inline
* @property {string} legend - text displayed next to the checkbox
* @property {Object} style - CSS inline styles
* @property {Function} onChange - callback function to be invoked when checkbox is clicked. The function is called with the current checkbox value
*/
class CheckboxInput extends Input {
	constructor( props, context ) {
		super( props );

		const session = context;
		this.state = {
			value: props.bind && session.state ?
				session.state[ props.bind ]:
				props.defaultValue,
			bind: props.bind,
			defaultValue: props.defaultValue
		};

		/**
		* Event handler invoked once the checkbox is clicked by the user. Changes the
		* `isChecked` property and then invokes the user-supplied `onChange` callback function.
		*/
		this.handleChange = () => {
			this.setState({
				value: !this.state.value
			}, () => {
				this.props.onChange( this.state.value );
				if ( this.props.bind ) {
					global.lesson.setState({
						[ this.props.bind ]: this.state.value
					});
				}
			});
		};
	}

	static getDerivedStateFromProps( nextProps, prevState ) {
		let newState = {};
		if ( nextProps.defaultValue !== prevState.defaultValue ) {
			newState.value = nextProps.defaultValue;
			newState.defaultValue = nextProps.defaultValue;
		}
		else if ( nextProps.bind !== prevState.bind ) {
			newState.value = global.lesson.state[ nextProps.bind ];
			newState.bind = nextProps.bind;
		}
		if ( !isEmptyObject( newState ) ) {
			return newState;
		}
		return null;
	}

	componentDidUpdate() {
		if ( this.props.bind ) {
			let globalVal = global.lesson.state[ this.props.bind ];
			if ( globalVal !== this.state.value ) {
				this.setState({
					value: globalVal
				});
			}
		}
	}

	render() {
		const input = <input
			className="checkbox-input"
			type="checkbox"
			checked={this.state.value}
			value="checkbox"
			onChange={this.handleChange}
			disabled={this.props.disabled}
		></input>;
		if ( this.props.inline === true ) {
			return (
				<span style={{ marginLeft: '8px', ...this.props.style }}>
					{input}
					<span
						role="button" tabIndex={0}
						className="checkbox-legend"
						style={{
							color: this.props.disabled ? 'darkgray' : null
						}}
						onClick={this.handleChange} onKeyPress={this.handleChange}
					>{this.props.legend}</span>
				</span>
			);
		}
		return (
			<div className={`input checkbox-input-div ${this.props.className}`} style={this.props.style}>
				{input}
				<span
					role="button" tabIndex={0}
					className="checkbox-legend"
					style={{
						color: this.props.disabled ? 'darkgray' : null
					}}
					onClick={this.handleChange} onKeyPress={this.handleChange}
				>{this.props.legend}</span>
			</div>
		);
	}
}


// PROPERTIES //

CheckboxInput.defaultProps = {
	bind: '',
	onChange() {},
	defaultValue: false,
	disabled: false,
	inline: false,
	legend: '',
	style: {}
};

CheckboxInput.propTypes = {
	bind: PropTypes.string,
	defaultValue: PropTypes.bool,
	disabled: PropTypes.bool,
	inline: PropTypes.bool,
	onChange: PropTypes.func,
	legend: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.node
	]),
	style: PropTypes.object
};

CheckboxInput.contextType = SessionContext;


// EXPORTS //

export default CheckboxInput;
