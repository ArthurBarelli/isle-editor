// MODULES //

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import Checkbox from 'components/input/checkbox';


// MAIN //

class Search extends Component {
	constructor() {
		super();

		this.state = {
			search: ''
		};
	}

	handleSearch = ( event ) => {
		this.setState({
			search: event.target.value
		});
	}

	handleKeyPress = ( event ) => {
		if ( event.charCode === 13 ) {
			this.handleSubmit( event );
		}
	}

	handleSubmit = ( event ) => {
		// Need to get it back to the parent
		this.props.onClick( this.state.search );
	}

	handleReset = () => {
		this.props.onClick( '' );
	}

	render() {
		return (
			<Fragment>
				<FormGroup style={{ width: window.innerWidth * 0.3, padding: '0px', marginBottom: '0px' }} >
					<InputGroup size="small" >
						<FormControl
							type="text"
							placeholder="Enter text..."
							onChange={this.handleSearch}
							onKeyPress={this.handleKeyPress}
						/>
						<Button
							onClick={this.handleSubmit}
						>
							Search
						</Button>
					</InputGroup>
				</FormGroup>
				<FormGroup style={{ float: 'left', margin: '4px' }} >
					<Checkbox size="small" inline onChange={this.props.onExact} legend="Whole Word" style={{ fontSize: '0.9rem' }} />
					<Checkbox size="small" inline legend="Case-sensitive" style={{ fontSize: '0.9rem' }} />
				</FormGroup>
				<Button style={{ float: 'left' }} size="small" onClick={this.handleReset} >
					Reset Search
				</Button>
			</Fragment>
		);
	}
}


// PROPERTIES //

Search.propTypes = {
	onClick: PropTypes.func,
	onExact: PropTypes.func
};

Search.defaultProps = {
	onClick() {},
	onExact() {}
};


// EXPORTS //

export default Search;
