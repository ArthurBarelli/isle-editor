// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';


// MAIN //

class Provider extends Component {
	getChildContext() {
		return {
			session: this.props.session,
			currentRole: this.props.currentRole
		};
	}

	render() {
		return this.props.children;
	}
}


// TYPES //

Provider.childContextTypes = {
	session: PropTypes.object,
	currentRole: PropTypes.string
};

Provider.propTypes = {
	currentRole: PropTypes.string.isRequired,
	session: PropTypes.object.isRequired
};


// EXPORTS //

export default Provider;
