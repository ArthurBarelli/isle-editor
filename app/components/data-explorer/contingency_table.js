// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import CheckboxInput from 'components/input/checkbox';
import SelectInput from 'components/input/select';
import NumberInput from 'components/input/number';
import objectKeys from '@stdlib/utils/keys';
import countBy from '@stdlib/utils/count-by';
import identity from '@stdlib/utils/identity-function';
import isObject from '@stdlib/assert/is-object';
import hasOwnProp from '@stdlib/assert/has-own-property';
import { DATA_EXPLORER_CONTINGENCY_TABLE } from 'constants/actions.js';
import QuestionButton from './question_button.js';


// VARIABLES //

const DESCRIPTION = 'A contigency table displays either the raw absolute or relative frequencies of two categorical variable\'s values alongside their row and column totals.';


// FUNCTIONS //

const createContingencyTable = ( data, rowVar, colVar, relativeFreqs, nDecimalPlaces ) => {
	const freqs = {};
	const rowValues = data[ rowVar ];
	const colValues = data[ colVar ];
	const nobs = rowValues.length;
	const rowFreqs = countBy( rowValues, identity );
	const colFreqs = countBy( colValues, identity );

	const rowKeys = rowVar.categories || objectKeys( rowFreqs );
	const colKeys = colVar.categories || objectKeys( colFreqs );
	for ( let i = 0; i < rowKeys.length; i++ ) {
		for ( let l = 0; l < colKeys.length; l++ ) {
			let key1 = rowKeys[ i ];
			let key2 = colKeys[ l ];
			let size = 0;
			for ( let n = 0; n < nobs; n++ ) {
				if (
					String( rowValues[ n ] ) === key1 &&
					String( colValues[ n ] ) === key2
				) {
					size += 1;
				}
			}
			freqs[ key1 + '-' + key2 ] = !relativeFreqs ? size : size / nobs;
		}
	}
	let columnTotals = [];
	for ( let key in colFreqs ) {
		if ( hasOwnProp( colFreqs, key ) ) {
			let colfreq = colFreqs[ key ];
			if ( relativeFreqs ) {
				colfreq /= nobs;
				colfreq = colfreq.toFixed( nDecimalPlaces );
			}
			columnTotals.push( <td>{colfreq}</td> );
		}
	}
	let table = <Table bordered size="sm">
		<tbody >
			<tr>
				<th>{rowVar} \ {colVar}</th>
				{colKeys.map( (e, i) => <th key={i}>{e}</th> )}
				<th>Row Totals</th>
			</tr>
			{rowKeys.map( ( r, i ) => ( <tr key={i} >
				<th>{r}</th>
				{colKeys.map( ( c, j ) => {
					let freq = freqs[ r + '-' + c ];
					if ( relativeFreqs ) {
						freq = freq.toFixed( nDecimalPlaces );
					}
					return <td key={`${i}:${j}`}>{freq}</td>;
				})}
				<td>{ !relativeFreqs ?
					rowFreqs[ r ] :
					( rowFreqs[ r ]/nobs ).toFixed( nDecimalPlaces )
				}</td>
			</tr> ) )}
			<tr>
				<th>Column Totals</th>
				{columnTotals}
				<th>{ !relativeFreqs ? nobs : ( 1.0 ).toFixed( nDecimalPlaces ) }</th>
			</tr>
		</tbody>
	</Table>;
	return table;
};

const createGroupedContingencyTable = ( data, rowVar, colVar, group, relativeFreqs, nDecimalPlaces ) => {
	const groupedData = {};
	for ( let i = 0; i < data[ group ].length; i++ ) {
		const v = data[ group ][ i ];
		if ( !isObject( groupedData[ v ]) ) {
			groupedData[ v ] = {
				[ rowVar ]: [],
				[ colVar ]: []
			};
		}
		groupedData[ v ][ rowVar ].push( data[ rowVar ][ i ]);
		groupedData[ v ][ colVar ].push( data[ colVar ][ i ]);
	}
	let table = [];
	const keys = group.categories || objectKeys( groupedData );
	for ( let i = 0; i < keys.length; i++ ) {
		const key = keys[ i ];
		table.push( createContingencyTable( groupedData[ key ], rowVar, colVar, relativeFreqs, nDecimalPlaces ) );
	}

	const output = {
		variable: `${rowVar} by ${colVar}`,
		type: 'Contingency Table',
		value: <div style={{ overflowX: 'auto', width: '100%' }}>
			<label>{`Grouped by ${group}:`}</label>
			{table.map( ( x, i ) => {
				return ( <div key={i}>
					<label>{`${keys[ i ]}`}: </label>
					{x}
				</div> );
			})}
		</div>
	};
	return output;
};


// MAIN //

class ContingencyTable extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			relativeFreqs: false,
			rowVar: props.defaultRowVar || props.variables[ 0 ],
			colVar: props.defaultColVar || props.variables[ 1 ],
			group: null, // eslint-disable-line react/no-unused-state
			nDecimalPlaces: 3
		};
	}

	generateContingencyTable() {
		let output;
		const { rowVar, colVar, group, relativeFreqs, nDecimalPlaces } = this.state;
		if ( !rowVar || !colVar ) {
			return this.props.session.addNotification({
				title: 'Select Variables',
				message: 'You need to select a row and column variable for the contingency table',
				level: 'warning',
				position: 'tr'
			});
		}
		if ( !group ) {
			let table = createContingencyTable( this.props.data, rowVar, colVar, relativeFreqs, nDecimalPlaces );
			output = {
				variable: `${rowVar} by ${colVar}`,
				type: 'Contingency Table',
				value: table
			};
		} else {
			output = createGroupedContingencyTable( this.props.data, rowVar, colVar, group, relativeFreqs, nDecimalPlaces );
		}
		this.props.logAction( DATA_EXPLORER_CONTINGENCY_TABLE, {
			rowVar, colVar, group, relativeFreqs
		});
		this.props.onCreated( output );
	}

	render() {
		const { variables, defaultRowVar, defaultColVar, groupingVariables } = this.props;
		return (
			<Card>
				<Card.Header as="h4">
					Contingency Table
					<QuestionButton title="Contingency Table" content={DESCRIPTION} />
				</Card.Header>
				<Card.Body>
					<SelectInput
						legend="Row Variable:"
						defaultValue={defaultRowVar || variables[ 0 ]}
						options={variables}
						onChange={( value )=>{
							this.setState({
								rowVar: value
							});
						}}
					/>
					<SelectInput
						legend="Column Variable:"
						defaultValue={defaultColVar || variables[ 1 ]}
						options={variables}
						onChange={( value )=>{
							this.setState({
								colVar: value
							});
						}}
					/>
					<SelectInput
						legend="Group By:"
						options={groupingVariables}
						clearable={true}
						menuPlacement="top"
						onChange={( value )=>{
							this.setState({
								group: value // eslint-disable-line react/no-unused-state
							});
						}}
					/>
					<CheckboxInput
						legend="Relative Frequency"
						defaultValue={false}
						onChange={() => {
							this.setState({
								relativeFreqs: !this.state.relativeFreqs
							});
						}}
					/>
					{ this.state.relativeFreqs ? <p>Report relative frequencies to
						<NumberInput
							inline
							width={50}
							max={16}
							min={0}
							defaultValue={this.state.nDecimalPlaces}
							onChange={( value ) => {
								this.setState({
									nDecimalPlaces: value
								});
							}}
						/>
						decimal place(s).
					</p> : null }
					<Button variant="primary" block onClick={this.generateContingencyTable.bind( this )}>Generate</Button>
				</Card.Body>
			</Card>
		);
	}
}


// DEFAULT PROPERTIES //

ContingencyTable.defaultProps = {
	defaultRowVar: null,
	defaultColVar: null,
	groupingVariables: null,
	logAction() {},
	session: {}
};


// PROPERTIES //

ContingencyTable.propTypes = {
	data: PropTypes.object.isRequired,
	defaultColVar: PropTypes.string,
	defaultRowVar: PropTypes.string,
	groupingVariables: PropTypes.array,
	logAction: PropTypes.func,
	onCreated: PropTypes.func.isRequired,
	session: PropTypes.object,
	variables: PropTypes.array.isRequired
};


// EXPORTS //

export default ContingencyTable;
