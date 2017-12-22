// MODULES //

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ExportPage from 'components/export-page';
import { convertMarkdown, toggleScrolling } from 'actions';


// MAIN //

class Export extends Component {
	render() {
		return (
			<ExportPage
				content={this.props.markdown}
				filePath={this.props.filePath}
				fileName={this.props.fileName}
			/>
		);
	}
}

// TYPES //

Export.propTypes = {
	fileName: PropTypes.string.isRequired,
	filePath: PropTypes.string.isRequired,
	markdown: PropTypes.string.isRequired
};


// EXPORTS //

export default connect( mapStateToProps, {
	convertMarkdown,
	toggleScrolling
})( Export );

function mapStateToProps({ markdown }) {
	return markdown;
}
