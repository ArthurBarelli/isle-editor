// MODULES //

import { createElement, Fragment } from 'react';
import logger from 'debug';
import isArray from '@stdlib/assert/is-array';
import isPlainObject from '@stdlib/assert/is-plain-object';
import copy from '@stdlib/utils/copy';
import TeX from 'components/tex';
import FreeTextQuestion from 'components/free-text-question';
import MultipleChoiceQuestion from 'components/multiple-choice-question';
import MultipleChoiceMatrix from 'components/multiple-choice-matrix';
import MatchListQuestion from 'components/match-list-question';
import NumberQuestion from 'components/number-question';
import OrderQuestion from 'components/order-question';
import RangeQuestion from 'components/range-question';
import SelectQuestion from 'components/select-question';


// VARIABLES //

const debug = logger( 'isle:convert-json' );


// MAIN //

/**
* Transforms a JSON configuration object to a React component and its children.
*
* ## Notes
*
* -   Only a subset of isle React component are supported.
*
* @param {Object} config - JSON configuration
* @returns {Node} created component
*/
function convertJSONtoJSX( config ) {
	debug( `Convert JSON ${config.component} object to React element...` );
	let children = copy( config.children );
	if ( isArray( children ) ) {
		for ( let i = 0; i < children.length; i++ ) {
			const child = children[ i ];
			if ( isPlainObject( child ) ) {
				children[ i ] = convertJSONtoJSX( child );
			}
		}
	} else if ( isPlainObject( children ) ) {
		children = convertJSONtoJSX( children );
	}
	let component = config.component;
	switch ( component ) {
		case 'Fragment':
			component = Fragment;
		break;
		case 'TeX':
			component = TeX;
		break;
		case 'FreeTextQuestion':
			component = FreeTextQuestion;
		break;
		case 'MultipleChoiceMatrix':
			component = MultipleChoiceMatrix;
		break;
		case 'MultipleChoiceQuestion':
			component = MultipleChoiceQuestion;
		break;
		case 'MatchListQuestion':
			component = MatchListQuestion;
		break;
		case 'NumberQuestion':
			component = NumberQuestion;
		break;
		case 'OrderQuestion':
			component = OrderQuestion;
		break;
		case 'RangeQuestion':
			component = RangeQuestion;
		break;
		case 'SelectQuestion':
			component = SelectQuestion;
		break;
		default:
			component = config.component;
		break;
	}
	const props = config.props || {};
	return createElement( component, props, children );
}


// EXPORTS //

export default convertJSONtoJSX;
