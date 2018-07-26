// MODULES //

import React from 'react';
import PropTypes from 'prop-types';
import isEmptyObject from '@stdlib/assert/is-empty-object';
import Input from 'components/input/base';


// MAIN //

class CheckboxInput extends Input {
	constructor( props, context ) {
		super( props );

		const { session } = context;
		this.state = {
			value: props.bind && session.state ?
				session.state[ props.bind ]:
				props.defaultValue
		};

		/**
		* Event handler invoked once the checkbox is clicked by the user. Changes the
		* `isChecked` property and then invokes the user-supplied `onChange` callback function.
		*/
		this.handleChange = ( event ) => {
			this.setState({
				value: event.target.checked
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

	componentWillReceiveProps( nextProps ) {
		let newState = {};
		if ( nextProps.defaultValue !== this.props.defaultValue ) {
			newState.value = nextProps.defaultValue;
		}
		else if ( nextProps.bind !== this.props.bind ) {
			newState.value = global.lesson.state[ nextProps.bind ];
		}
		if ( !isEmptyObject( newState ) ) {
			this.setState( newState );
		}
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
			type="checkbox"
			checked={this.state.value}
			value="checkbox"
			onChange={this.handleChange}
			disabled={this.props.disabled}
			style={{
				verticalAlign: 'bottom',
				width: '24px',
				height: '24px'
			}}
		></input>;
		if ( this.props.inline === true ) {
			return (
				<span style={{ marginLeft: '8px', ...this.props.style }}>
					{input}
					<span
						style={{
							marginLeft: '12px'
						}}
					>{this.props.legend}</span>
				</span>
			);
		}
		return (
			<div style={{
				marginTop: '8px',
				marginLeft: '8px',
				marginBottom: '8px',
				...this.props.style
			}}>
				{input}
				<span
					style={{
						marginLeft: '12px'
					}}
				>{this.props.legend}</span>
			</div>
		);
	}
}


// TYPES //

CheckboxInput.description = 'A checkbox input component. Usually, this component will be used as part of an ISLE dashboard, but it can also be used standalone. In this case, you want to handle changes via the `onChange` attribute. ';

CheckboxInput.propDescriptions = {
	bind: 'A string indicating the variable for the boolean to be assigned',
	onChange: 'A function to be called when a checkbox is clicked. The function takes an argument value and should change whether value is true or false',
	defaultValue: 'A boolean value indicating the default value of the checkbox',
	disabled: 'A boolean indicating whether the input is active or not',
	inline: 'Indicates whether the checkbox is displayed inline',
	legend: 'A string indicating the text displayed next to the checkbox'
};

CheckboxInput.defaultProps = {
	bind: '',
	onChange() {},
	defaultValue: false,
	disabled: false,
	inline: false,
	legend: 'Checkbox'
};


// PROPERTY TYPES //

CheckboxInput.propTypes = {
	bind: PropTypes.string,
	defaultValue: PropTypes.bool,
	disabled: PropTypes.bool,
	inline: PropTypes.bool,
	onChange: PropTypes.func,
	legend: PropTypes.string
};


// CONTEXT TYPES //

CheckboxInput.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default CheckboxInput;
