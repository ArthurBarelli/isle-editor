// MODULES //

import React, { Component, Fragment } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';
import InputRange from 'react-input-range';
import unique from 'uniq';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Overlay from 'react-bootstrap/Overlay';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'components/overlay-trigger';
import markdownit from 'markdown-it';
import hasOwnProp from '@stdlib/assert/has-own-property';
import contains from '@stdlib/assert/contains';
import lowercase from '@stdlib/string/lowercase';
import floor from '@stdlib/math/base/special/floor';
import ceil from '@stdlib/math/base/special/ceil';
import round from '@stdlib/math/base/special/round';
import isNumberArray from '@stdlib/assert/is-number-array';
import isEmptyArray from '@stdlib/assert/is-empty-array';
import isEmptyObject from '@stdlib/assert/is-empty-object';
import isObject from '@stdlib/assert/is-object';
import isArray from '@stdlib/assert/is-array';
import isNull from '@stdlib/assert/is-null';
import objectKeys from '@stdlib/utils/keys';
import min from 'utils/statistic/min';
import max from 'utils/statistic/max';
import generateUID from 'utils/uid';
import SessionContext from 'session/context.js';
import { TABLE_SORT, TABLE_FILTER, TABLE_RESET } from 'constants/actions.js';
import SelectInput from 'components/input/select';
import TutorialButton from './tutorial-button/index.js';
import 'react-table/react-table.css';
import './input_range.css';
import './react_table_height.css';
import './data_table.css';


// VARIABLES //

const md = markdownit({
	html: true,
	xhtmlOut: true,
	breaks: true,
	typographer: false
});
const uid = generateUID( 'data-table' );


// FUNCTIONS //

function createRows( data ) {
	if ( isEmptyObject( data ) ) {
		return [];
	}
	const keys = objectKeys( data );
	const nRows = data[ keys[ 0 ] ].length;
	const rows = new Array( nRows );
	for ( let i = 0; i < nRows; i++ ) {
		rows[ i ] = {};
		for ( let j = 0; j < keys.length; j++ ) {
			let key = keys[ j ];
			rows[ i ][ key ] = data[ key ][ i ];
		}
	}
	return rows;
}

const CustomIndicator = () => {
	return <div />;
};


// MAIN //

/**
* A component rendering data in a tabular display. Built on top of [react-table](https://react-table.js.org/).
*
* @property {(Object|Array)} data - A data object or array to be viewed. If it is an object, the keys correspond to column values while an array will expect an array of objects with a named field corresponding to each column
* @property {Object} dataInfo - object with `info` string array describing the data set, the `name` of the dataset, an `object` of `variables` with keys corresponding to variable names and values to variable descriptions, an a `showOnStartup` boolean controlling whether to display the info modal on startup
* @property {boolean} deletable - controls whether columns for which no `info` exist have a button which when clicked calls the `onColumnDelete` callback function
* @property {boolean} showRemove - indicates whether to display checkboxes for rows to be removed
* @property {Object} style - An object allowing for custom css styling. Defaults to an empty object
* @property {Function} onClickRemove - A function specifying an action to take for rows removed from the data (defaults to an empty function)
* @property {Function} onColumnDelete - function invoked with the name of a column when the respective delete button for a column is clicked
*/
class DataTable extends Component {
	constructor( props ) {
		super( props );

		props.dataInfo.info = props.dataInfo.info || [];
		props.dataInfo.name = props.dataInfo.name || '';
		props.dataInfo.variables = props.dataInfo.variables || null;
		props.dataInfo.showOnStartup = props.dataInfo.showOnStartup || null;

		this.id = props.id || uid( props );
		this.state = this.generateInitialState( props );
	}

	componentDidMount() {
		const thead = findDOMNode( this.table ).getElementsByClassName( 'rt-thead' )[ 0 ];
		const theadControls = findDOMNode( this.table ).getElementsByClassName( 'rt-thead' )[ 1 ];
		const tbody = findDOMNode( this.table ).getElementsByClassName( 'rt-tbody' )[0];

		tbody.addEventListener( 'scroll', () => {
			thead.scrollLeft = tbody.scrollLeft;
			theadControls.scrollLeft = tbody.scrollLeft;
		});
	}

	componentDidUpdate( prevProps ) {
		let newState = {};
		if ( this.props.data !== prevProps.data ) {
			newState = this.generateInitialState( this.props );
		}
		if ( this.props.filters && this.props.filters !== prevProps.filters ) {
			newState.filtered = this.props.filters;
		}
		if ( !isEmptyObject( newState ) ) {
			this.setState( newState, () => {
				this.setState({
					selectedRows: this.table.getResolvedState().sortedData.length
				});
			});
		}
	}

	generateInitialState( props ) {
		let rows;
		let keys;
		let isArr = isArray( props.data );
		if ( !isArr && !isObject( props.data ) ) {
			return {};
		}
		if ( isArr ) {
			// Case: `data` is already an array of observations
			rows = props.data;
			keys = objectKeys( rows[ 0 ] );
		} else {
			// Case: `data` is an object with keys for the various variables
			rows = createRows( props.data );
			keys = objectKeys( props.data );
		}
		for ( let i = 0; i < rows.length; i++ ) {
			if ( props.showRemove && !rows[ i ][ 'remove' ]) {
				rows[ i ][ 'remove' ] = false;
			}
			rows[ i ][ 'id' ] = i + 1;
		}
		const newState = {
			values: {},
			selectedRows: rows.length
		};
		const columns = keys.map( ( key, idx ) => {
			let header = key;
			if ( this.props.dataInfo.variables && this.props.dataInfo.variables[ key ]) {
				header = <span
					onMouseOver={() => {
						this.setState({
							showTooltip: true,
							tooltip: this.props.dataInfo.variables[ key ]
						});
					}}
					onMouseOut={() => {
						this.setState({
							showTooltip: false,
							tooltip: null
						});
					}}
				>{key}</span>;
			} else if ( this.props.deletable ) {
				header = <div>
					{key}
					<OverlayTrigger placement="left" overlay={<Tooltip>Remove variable</Tooltip>} >
						<div className="fa fa-times delete-button" onClick={( evt ) => {
							evt.stopPropagation();
							this.props.onColumnDelete( key );
						}} />
					</OverlayTrigger>
				</div>;
			}
			const out = {
				Header: header,
				id: key,
				accessor: ( d ) => d[ key ]
			};
			let vals;
			if ( !isArr ) {
				vals = props.data[ key ].slice();
			} else {
				vals = new Array( rows.length );
				for ( let i = 0; i < rows.length; i++ ) {
					vals[ i ] = props.data[ i ][ key ];
				}
			}
			vals = vals.filter( x => !isNull( x ) && x !== '' );
			let uniqueValues = unique( vals );
			if ( isNumberArray( vals ) && uniqueValues.length > 2 ) {
				out[ 'filterMethod' ] = this.filterMethodNumbers;
				out[ 'Filter' ] = ({ filter, onChange }) => {
					const defaultVal = {
						max: ceil( max( uniqueValues ) ),
						min: floor( min( uniqueValues ) )
					};
					return (
						<div style={{
							paddingLeft: '4px',
							paddingRight: '4px',
							paddingTop: '8px',
							paddingBottom: '4px'
						}}>
							<InputRange
								allowSameValues
								maxValue={ceil( max( uniqueValues ) )}
								minValue={floor( min( uniqueValues ) )}
								value={filter ? filter.value : defaultVal}
								onChange={( newValue ) => {
									onChange( newValue );
								}}
								formatLabel={( val ) => {
									return round( val );
								}}
							/>
						</div>
					);
				};
			} else if ( uniqueValues.length <= 8 ) {
				// Cast values to strings for select component to work:
				uniqueValues = uniqueValues.map( x => String( x ) );
				out[ 'filterMethod' ] = this.filterMethodCategories;
				out[ 'Filter' ] = ({ filter, onChange }) => {
					return (
						<SelectInput
							onChange={onChange}
							style={{ width: '100%' }}
							value={filter ? filter.value : null}
							searchable={false}
							options={uniqueValues}
							menuPlacement="auto"
							multi
							placeholder="Show all"
							components={{
								IndicatorsContainer: CustomIndicator
							}}
							menuPortalTarget={document.body}
							styles={{
								menuPortal: base => ({ ...base, zIndex: 9999 })
							}}
						/>
					);
				};
			} else {
				out[ 'filterMethod' ] = ( filter, row ) => {
					if ( isArray( filter.value ) ) {
						return contains( filter.value, row[ filter.id ] );
					}
					// Check whether string contains search phrase:
					return contains( lowercase( row[ filter.id ] ), lowercase( filter.value ) );
				};
			}
			return out;
		});
		columns.unshift({
			Header: 'id',
			accessor: 'id',
			filterable: false
		});
		if ( props.showRemove ) {
			columns.push({
				Header: 'Remove',
				accessor: 'remove',
				Cell: this.renderCheckboxRemovable,
				filterable: false
			});
		}
		newState.showInfo = props.dataInfo.showOnStartup;
		newState.rows = rows;
		newState.columns = columns;
		newState.filtered = props.filters;
		newState.showTooltip = false;
		return newState;
	}

	filterMethodCategories = ( filter, row, column ) => {
		if ( !filter.value || isEmptyArray( filter.value ) ) {
			return true;
		}
		const id = filter.pivotId || filter.id;
		if ( row[ id ] === void 0 ) {
			return true;
		}
		if ( isArray( filter.value ) ) {
			return contains( filter.value, String( row[ id ] ) );
		}
		return String( row[ id ] ) === filter.value;
	}

	filterMethodStrings = ( filter, row, column ) => {
		const id = filter.pivotId || filter.id;
		if ( row[ id ] === void 0 ) {
			return true;
		}
		return String( row[ id ] ).startsWith( filter.value );
	}

	filterMethodNumbers = ( filter, row ) => {
		const val = row[ filter.id ];
		return val >= filter.value.min && val <= filter.value.max;
	}

	renderCheckboxRemovable = ( cellInfo ) => {
		return (
			<input
				id="checkBox" type="checkbox"
				onClick={e => {
					const rows = [ ...this.state.rows ];
					rows[ cellInfo.index ][ cellInfo.column.id ] = e.target.checked;
					this.setState({ rows });
					this.props.onClickRemove( rows );
				}}
			/>
		);
	}

	handleFilterChange = ( filtered, column ) => {
		const selectedRows = this.table.getResolvedState().sortedData.length;
		const session = this.context;
		session.log({
			id: this.id,
			type: TABLE_FILTER,
			value: column.id
		});
		this.setState({
			selectedRows,
			filtered
		}, () => {
			this.props.onFilteredChange( this.state.filtered );
		});
	}

	handleSortedChange = ( sorted, column ) => {
		const selectedRows = this.table.getResolvedState().sortedData.length;
		const session = this.context;
		session.log({
			id: this.id,
			type: TABLE_SORT,
			value: column.id
		});
		this.setState({
			selectedRows,
			sorted
		});
	}

	showDescriptions = () => {
		this.setState({
			showVarModal: true
		});
	}

	reset = () => {
		const session = this.context;
		session.log({
			id: this.id,
			type: TABLE_RESET,
			value: ''
		});
		this.setState({
			filtered: [],
			sorted: []
		}, () => {
			this.props.onFilteredChange( this.state.filtered );
			this.setState({
				selectedRows: this.table.getResolvedState().sortedData.length
			});
		});
	}

	createDescriptions = ( descriptions ) => {
		var strTable;
		var varName;
		var finalStr;

		strTable = [];
		for ( varName in descriptions ) {
			if ( hasOwnProp( descriptions, varName ) ) {
				strTable.push( <tr key={varName} >
					<td>{varName}</td><td>{descriptions[varName]}</td>
				</tr>);
			}
		}
		finalStr = <table className="table-bordered table-condensed" >
			<thead>
				<tr><th>Name</th><th>Description</th></tr>
			</thead>
			<tbody>
			{strTable}
			</tbody>
		</table>;
		return finalStr;
	}

	showInfo = () => {
		this.setState({ showInfo: true });
	}

	render() {
		const { selectedRows, rows } = this.state;
		let modal = null;
		if ( this.state.showVarModal ) {
			modal = <Modal
				dialogClassName="modal-50w"
				show={this.state.showVarModal}
				onHide={()=>{
					this.setState({ showVarModal: false });
				}}>
				<Modal.Header closeButton>
					<Modal.Title>
						Variables
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{this.createDescriptions(this.props.dataInfo.variables)}
				</Modal.Body>
			</Modal>;
		} else if ( this.state.showInfo ) {
			modal = <Modal
				show={this.state.showInfo}
				dialogClassName="modal-50w"
				onHide={()=>{
					this.setState({
						showInfo: false
					});
				}}>
				<Modal.Header closeButton>
					<Modal.Title>
						{this.props.dataInfo.name} Description
					</Modal.Title>
				</Modal.Header>
				<Modal.Body dangerouslySetInnerHTML={{ // eslint-disable-line react/no-danger
					__html: md.render( this.props.dataInfo.info.join( '\n' ) )
				}}>
				</Modal.Body>
			</Modal>;
		}
		return (
			<Fragment>
				<div className="data-table-wrapper" style={this.props.style} >
					{ this.props.dataInfo.info.length > 0 ?
					<div className='data_button_wrapper'>
						<OverlayTrigger placement="bottom" overlay={<Tooltip>Open dataset description</Tooltip>} >
							<Button
								variant="light"
								onClick={this.showInfo}
								className='title-button'
							>
								<h4 className='title-button-h4'
									onClick={this.showInfo}
								>
									{this.props.dataInfo.name} Data
								</h4>
							</Button>
						</OverlayTrigger>
						<TutorialButton />
					</div> : null}
					{ this.props.dataInfo.info.length === 0 ?
						<h4 className="title-nobutton-h4">
							{this.props.dataInfo.name} Data
						</h4>: null
					}
					<Overlay
						target={this.table}
						show={this.state.showTooltip}
					>
						{({ placement, scheduleUpdate, arrowProps, ...props }) => (
							<div
								{...props}
								style={{
									backgroundColor: 'rgba(10, 10, 10,0.9)',
									padding: '2px 10px',
									color: 'white',
									borderRadius: 3,
									maxWidth: '300px',
									...props.style
								}}
							>
								{this.state.tooltip}
							</div>
						)}
					</Overlay>
					<ReactTable
						id={this.id}
						ref={( table ) => { this.table = table; }}
						data={rows}
						columns={this.state.columns}
						showPagination={true}
						sortable={true}
						resizable={true}
						filterable={true}
						filtered={this.state.filtered}
						sorted={this.state.sorted}
						showPageSizeOptions={false}
						defaultPageSize={50}
						onFilteredChange={this.handleFilterChange}
						onSortedChange={this.handleSortedChange}
						style={this.props.style}
					/>
					<label className="label-number-rows"><i>Number of rows: {selectedRows} (total: {this.state.rows.length})</i></label>
					<OverlayTrigger placement="top" overlay={<Tooltip>Reset filters and sorting</Tooltip>} >
						<Button
							onClick={this.reset}
							variant="primary"
							size="xsmall"
							className="data-table-footer-button reset-button"
						>
							Reset
						</Button>
					</OverlayTrigger>
					{ this.props.dataInfo.variables ? <OverlayTrigger placement="top" overlay={<Tooltip>Open variable descriptions</Tooltip>} ><Button
						onClick={this.showDescriptions}
						variant="primary"
						size="xsmall"
						className="data-table-footer-button variable-descriptions-button"
					>
						Variable Descriptions
					</Button></OverlayTrigger> : null }
				</div>
				{modal}
			</Fragment>
		);
	}
}


// PROPERTIES //

DataTable.defaultProps = {
	dataInfo: {
		'info': [],
		'name': '',
		'variables': null,
		'showInfo': false
	},
	deletable: false,
	onColumnDelete() {},
	onClickRemove() {},
	onFilteredChange() {},
	filters: [],
	showRemove: false,
	style: {}
};

DataTable.propTypes = {
	data: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.object
	]).isRequired,
	dataInfo: PropTypes.object,
	deletable: PropTypes.bool,
	onColumnDelete: PropTypes.func,
	onClickRemove: PropTypes.func,
	filters: PropTypes.array,
	onFilteredChange: PropTypes.func,
	showRemove: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
	style: PropTypes.object
};

DataTable.contextType = SessionContext;


// EXPORTS //

export default DataTable;

