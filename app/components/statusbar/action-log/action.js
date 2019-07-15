// MODULES //

import React from 'react';
import ListGroupItem from 'react-bootstrap/ListGroupItem';
import PropTypes from 'prop-types';
import { isPrimitive as isBoolean } from '@stdlib/assert/is-boolean';


// MAIN //

const Action = ( props ) => {
	let value = props.value;
	if ( isBoolean( value ) ) {
		value = value ? 'true' : 'false';
	}
	return (
		<ListGroupItem style={{ background: props.backgroundColor, color: props.color, fontSize: 15, fontFamily: 'Open Sans', padding: '2px 1px 2px 1px', lineHeight: 1 }}>
			<div className="actionNote">
				<label>Time:&nbsp;</label>
				{ new Date( props.absoluteTime ).toLocaleTimeString() }|
				<label>User:&nbsp;</label><span className="clickable" onClick={props.clickFactory( 'email', props.email )} >{ props.email }</span>
			</div>
			<div className="actionNote">
				<label>ID:&nbsp;</label><span className="clickable" onClick={props.clickFactory( 'id', props.id )} >{ props.id }</span> |
				<label>Type:&nbsp;</label><span className="clickable" onClick={props.clickFactory( 'type', props.type )} >{ props.type }</span>
			</div>
			<div className="actionNote">
				<label>Value:&nbsp;</label>
				<span style={{ 'userSelect': 'text' }} >
					{value}
				</span>
			</div>
		</ListGroupItem>
	);
};


// TYPES //

Action.propTypes = {
	absoluteTime: PropTypes.number.isRequired,
	backgroundColor: PropTypes.string.isRequired,
	color: PropTypes.string.isRequired,
	clickFactory: PropTypes.func.isRequired,
	email: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	value: PropTypes.oneOfType([
		PropTypes.object,
		PropTypes.string
	]).isRequired
};


// EXPORTS //

export default Action;