// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import createPrependCode from 'components/r/utils/create-prepend-code';
import Spinner from 'components/spinner';
import Image from 'components/image';
import SessionContext from 'session/context.js';


// MAIN //

/**
* Component for rendering an R plot inside an ISLE lesson.
*
* @property {string} code - R code to generate the plot
* @property {number} width - width of the plot (in px)
* @property {number} height - height of the plot (in px)
* @property {string} fileType - file type of the plot (`png` or `svg`)
* @property {Array} libraries - R libraries that should be loaded automatically when the input `code` is executed
* @property {(string|Array<string>)} prependCode - `string` or an `array` of R code snippets to be prepended to the code stored in `code` when evaluating
* @property {Function} onDone - callback invoked with `err`, `img` and `body` arguments once a plot is created
*/
class RPlot extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			plotURL: null,
			plot: null,
			last: '',
			waiting: false
		};
	}

	componentDidMount() {
		this.getPlot();
	}

	componentDidUpdate() {
		this.getPlot();
	}

	savePlot = ( error, img, body ) => {
		if ( error ) {
			this.props.onDone( error );
		} else {
			this.setState({
				plotURL: img,
				plot: body,
				waiting: false
			}, () => {
				this.props.onDone( null, img, body );
			});
		}
	}

	getPlot() {
		if ( this.props.code !== this.state.last ) {
			this.setState({
				waiting: true,
				last: this.props.code
			});
			const session = this.context;
			const prependCode = createPrependCode( this.props.libraries, this.props.prependCode, session );
			const fullCode = prependCode + this.props.code;
			session.getRPlot( fullCode, this.props.fileType, this.savePlot );
		}
	}

	render() {
		return (
			<div className="rplot" style={{ minHeight: 128, cursor: 'pointer' }}>
				<Spinner running={this.state.waiting} width={256} height={128} />
				{ this.state.waiting ?
					<span /> :
					<Image
						src={this.state.plotURL}
						body={this.state.plot}
						title="R Plot"
						{...this.props}
					/>
				}
			</div>
		);
	}
}


// PROPERTIES //

RPlot.propTypes = {
	code: PropTypes.string,
	width: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.string
	]),
	height: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.string
	]),
	fileType: PropTypes.string,
	libraries: PropTypes.array,
	prependCode: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.array
	]),
	onDone: PropTypes.func
};

RPlot.defaultProps = {
	code: '',
	width: 600,
	height: 350,
	fileType: 'png',
	libraries: [],
	prependCode: '',
	onDone() {}
};

RPlot.contextType = SessionContext;


// EXPORTS //

export default RPlot;
