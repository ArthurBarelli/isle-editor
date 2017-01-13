// MODULES //

import React, { Component, PropTypes } from 'react';


// INPUT //

class Input extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			value: props.defaultValue
		};

		this.handleChange = ( event ) => {
			this.setState({
				value: event.target.value
			});
		};
	}

	render() {
		return (
			<div></div>
		);
	}
}


// DEFAULT PROPERTIES //

Input.defaultProps = {
	defaultValue: 0,
	legend: '',
	onChange: function(){}
};


// PROPERTY TYPES //

Input.propTypes = {
	defaultValue: PropTypes.number,
	legend: PropTypes.string,
	onChange: PropTypes.func
};


// EXPORTS //

export default Input;
