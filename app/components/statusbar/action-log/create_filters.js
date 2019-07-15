// MODULES //

import React, { Fragment } from 'react';
import objectEntries from '@stdlib/utils/entries';
import removeFactory from './remove_factory.js';


// MAIN //

function createFilters( filter, callback ) {
	let entries = filter ? objectEntries( filter ) : [];
	let newFilters = <Fragment>
		<label>Filters:</label>
		<span style={{ position: 'relative', width: 'auto', fontSize: '12px', fontFamily: 'Open Sans' }}>
			{entries.map( ( arr, idx ) => {
				return ( <span
					style={{ marginLeft: 10, background: 'lightcoral', cursor: 'pointer' }}
					onClick={removeFactory( arr[ 0 ], filter, callback)}
					key={idx}
				>{arr[ 0 ]}: {arr[ 1 ]}</span> );
			})}
		</span>
	</Fragment>;
	return newFilters;
}


// EXPORTS //

export default createFilters;