// MODULES //

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import { scaleOrdinal, schemeCategory10, select } from 'd3';
import cloud from 'd3-cloud';
import saveAs from 'utils/file-saver';
import min from '@stdlib/math/base/special/min';
import removePunctuation from '@stdlib/string/remove-punctuation';
import tokenize from '@stdlib/nlp/tokenize';
import contains from '@stdlib/assert/contains';
import isString from '@stdlib/assert/is-string';
import lowercase from '@stdlib/string/lowercase';
import objectEntries from '@stdlib/utils/entries';
import isArray from '@stdlib/assert/is-array';
import copy from '@stdlib/utils/copy';
import PINF from '@stdlib/constants/math/float64-pinf';
import NINF from '@stdlib/constants/math/float64-ninf';
import STOPWORDS_EN from '@stdlib/datasets/stopwords-en';
import STOPWORDS_FIN from '@stdlib/datasets/savoy-stopwords-fin';
import STOPWORDS_FR from '@stdlib/datasets/savoy-stopwords-fr';
import STOPWORDS_GER from '@stdlib/datasets/savoy-stopwords-ger';
import STOPWORDS_IT from '@stdlib/datasets/savoy-stopwords-it';
import STOPWORDS_POR from '@stdlib/datasets/savoy-stopwords-por';
import STOPWORDS_SP from '@stdlib/datasets/savoy-stopwords-sp';
import STOPWORDS_SWE from '@stdlib/datasets/savoy-stopwords-swe';
import { svgString2Image, getSVGString } from 'utils/svg';


// VARIABLES //

const fill = scaleOrdinal( schemeCategory10 );


// FUNCTIONS //

const createTooltip = ( str ) => {
	return <Tooltip id="tooltip">{str}</Tooltip>;
};

const generateStopwords = ( language ) => {
	let stopwords;
	switch ( language ) {
		default:
		case 'en':
			stopwords = STOPWORDS_EN();
		break;
		case 'fin':
			stopwords = STOPWORDS_FIN();
		break;
		case 'fr':
			stopwords = STOPWORDS_FR();
		break;
		case 'ger':
			stopwords = STOPWORDS_GER();
		break;
		case 'it':
			stopwords = STOPWORDS_IT();
		break;
		case 'por':
			stopwords = STOPWORDS_POR();
		break;
		case 'sp':
			stopwords = STOPWORDS_SP();
		break;
		case 'swe':
			stopwords = STOPWORDS_SWE();
		break;
	}
	return stopwords;
};

function guessEquality( x, y ) {
	let nobs = min( x.length, 10 );
	for ( let i = 0; i < nobs; i++ ) {
		if ( x[ i ] !== y[ i ] ) {
			return false;
		}
	}
	return true;
}

const createBagOfWords = ({ texts, stopwords, minCount }) => {
	if ( !isArray( texts ) || texts.length === 0 ) {
		return { min: PINF, max: NINF, wordCounts: []};
	}
	let tokens = [];
	for ( let i = 0; i < texts.length; i++ ) {
		let text = texts[ i ];
		if ( isString( text ) ) {
			text = removePunctuation( text );
			let newTokens = tokenize( text );
			tokens = tokens.concat( newTokens );
		}
	}
	for ( let i = 0; i < tokens.length; i++ ) {
		tokens[ i ] = lowercase( tokens[ i ] );
	}
	for ( let i = tokens.length; i > 0; i-- ) {
		if ( tokens[i] && contains( stopwords, lowercase( tokens[i] ) ) ) {
			tokens.splice( i, 1 );
		}
	}
	let bagOfWords = {};
	for ( let i = 0; i < tokens.length; i++ ) {
		if ( bagOfWords[ tokens[ i ] ] ) {
			bagOfWords[ tokens[ i ] ] += 1;
		} else {
			bagOfWords[ tokens[ i ] ] = 1;
		}
	}
	let max = NINF;
	let min = PINF;
	const wordCounts = objectEntries( bagOfWords ).map( arr => {
		if ( arr[ 1 ] > max ) {
			max = arr[ 1 ];
		}
		if ( arr[ 1 ] < min ) {
			min = arr[ 1 ];
		}
		return {
			text: arr[ 0 ],
			value: arr[ 1 ]
		};
	});
	if ( !minCount ) {
		return { min, max, wordCounts };
	}
	const filtered = [];
	for ( let i = 0; i < wordCounts.length; i++ ) {
		if ( wordCounts[ i ].value >= minCount ) {
			filtered.push( wordCounts[ i ] );
		}
	}
	return { min, max, wordCounts: filtered };
};


// MAIN //

class Wrapper extends Component {
	constructor( props ) {
		super( props );

		const stopwords = generateStopwords( props.language );
		if ( !props.precalculated ) {
			const { min, max, wordCounts } = createBagOfWords({
				texts: props.data,
				stopwords,
				minCount: props.minCount
			});
			this.state = {
				wordCounts,
				min,
				max,
				stopwords
			};
		} else {
			this.state = {
				wordCounts: copy( props.data ),
				stopwords
			};
		}
	}

	static getDerivedStateFromProps( nextProps, prevState ) {
		let newState;
		if ( !nextProps.precalculated ) {
			newState = createBagOfWords({
				texts: nextProps.data,
				stopwords: prevState.stopwords,
				minCount: nextProps.minCount
			});
		} else {
			newState = {
				wordCounts: copy( nextProps.data )
			};
		}
		return newState;
	}

	componentDidMount() {
		if ( this.state.wordCounts.length > 0 ) {
			this.addWordCloud();
		}
	}

	shouldComponentUpdate( nextProps ) {
		if (
			nextProps.data.length !== this.props.data.length ||
			!guessEquality( nextProps.data, this.props.data )
		) {
			return true;
		}
		return false;
	}

	componentDidUpdate() {
		if ( this.state.wordCounts.length > 0 ) {
			this.addWordCloud();
		}
	}

	fontSizeMapper = ( word ) => {
		const { min, max } = this.state;
		if ( max === min ) {
			return 50.0;
		}
		return ( word.value - min ) / ( max - min ) * 36.0 + 14.0;
	}

	addWordCloud() {
		const fontSizeMapper = this.props.fontSizeMapper || this.fontSizeMapper;
		select( findDOMNode( this ) )
			.selectAll( 'svg' )
			.remove();
		const layout = cloud()
			.size([ this.props.width, this.props.height ])
			.font( this.props.font )
			.words( this.state.wordCounts )
			.padding( this.props.padding )
			.rotate( this.props.rotate )
			.fontSize( fontSizeMapper )
			.on( 'end', words => {
				this.svg = select( findDOMNode( this ) )
				.append( 'svg' )
					.attr( 'width', layout.size()[0] )
					.attr( 'height', layout.size()[1] )
					.style( 'background', '#ffffff' );
				this.svg.append( 'g' )
					.attr( 'transform', `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})` )
					.selectAll( 'text' )
					.data( words )
					.enter()
					.append( 'text' )
					.style( 'font-size', d => `${d.size}px` )
					.style( 'font-family', this.props.font )
					.style( 'fill', ( d, i ) => fill( i ) )
					.style( 'cursor', 'pointer' )
					.attr( 'text-anchor', 'middle' )
					.attr( 'transform',
						d => `translate(${[d.x, d.y]})rotate(${d.rotate})`
					)
					.text( d => d.text )
					.on( 'click', this.props.onClick );
			});
		layout.start();
	}

	saveToPNG = () => {
		const { width, height } = this.props;
		const svgString = getSVGString( this.svg.node() );
		svgString2Image( svgString, 2.0*width, 2.0*height, 'png', save );

		let name;
		if ( this.props.id ) {
			name = this.props.id+'.png';
		} else {
			name = 'wordcloud.png';
		}
		function save( dataBlob, filesize ) {
			saveAs( dataBlob, name );
		}
	}

	render() {
		return ( <div style={{ width: this.props.width, position: 'relative' }}>
			{ this.state.wordCounts.length > 0 ? <OverlayTrigger placement="left" overlay={createTooltip( 'Save Word Cloud' )}>
				<Button bsSize="xsmall" onClick={this.saveToPNG} style={{
					position: 'absolute',
					right: -12,
					top: -12,
					zIndex: 2
				}}><Glyphicon glyph="floppy-save" /></Button>
			</OverlayTrigger> : null }
		</div> );
	}
}


// DEFAULT PROPERTIES //

Wrapper.defaultProps = {
	data: [],
	font: 'serif',
	fontSizeMapper: null,
	precalculated: false,
	rotate: word => word.value % 360,
	width: 700,
	height: 600,
	language: 'en',
	minCount: null,
	onClick() {},
	padding: 5
};


// PROPERTY TYPES //

Wrapper.propTypes = {
	data: PropTypes.array,
	font: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.func
	]),
	fontSizeMapper: PropTypes.func,
	height: PropTypes.number,
	language: PropTypes.oneOf([
		'en', 'fin', 'fr', 'ger', 'it', 'por', 'sp', 'swe'
	]),
	minCount: PropTypes.number,
	onClick: PropTypes.func,
	padding: PropTypes.number,
	precalculated: PropTypes.bool,
	rotate: PropTypes.func,
	width: PropTypes.number
};


// EXPORTS //

export default Wrapper;
