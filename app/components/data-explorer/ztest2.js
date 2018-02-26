// MODULES //

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button, Panel, Row, Col } from 'react-bootstrap';
import NumberInput from 'components/input/number';
import SelectInput from 'components/input/select';
import TeX from 'components/tex';
import ztest2 from '@stdlib/math/stats/ztest2';
import copy from '@stdlib/utils/copy';
import bifurcateBy from '@stdlib/utils/bifurcate-by';
import unique from 'uniq';
import stdev from 'compute-stdev';


// MAIN //

class ZTest2 extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			var1: props.continuous[ 0 ],
			grouping: null,
			var2: null,
			diff: 0,
			direction: 'two-sided',
			alpha: 0.05
		};
	}

	calculateTwoSampleZTest = () => {
		const { var1, grouping, var2, diff, direction, alpha } = this.state;
		const { data } = this.props;
		let secondCategory;
		let firstCategory;
		let value;
		let x;
		let y;

		if ( grouping ) {
			let categories = data[ grouping ];
			firstCategory = categories[ 0 ];
			for ( let i = 1; i < categories.length; i++ ) {
				if ( categories[ i ] !== firstCategory ) {
					secondCategory = categories[ i ];
					break;
				}
			}
			const splitted = bifurcateBy( data[ var1 ], function splitter( x, idx ) {
				return categories[ idx ] === firstCategory;
			});
			x = splitted[ 0 ];
			y = splitted[ 1 ];
			const result = ztest2( x, y, stdev( x ), stdev( y ), {
				'alpha': alpha,
				'alternative': direction,
				'difference': diff
			});
			let arrow = '\\ne';
			if ( direction === 'less' ) {
				arrow = '<';
			} else if ( direction === 'greater' ){
				arrow = '>';
			}
			value = <div>
				<label>Hypothesis test for {var1} between {grouping}:</label>
				<TeX
					displayMode
					raw={`H_0: \\mu_{\\text{${grouping}:${firstCategory}}} - \\mu_{\\text{${grouping}:${secondCategory}}} = ${diff}`}
					tag=""
				/>
				<span> vs. </span>
				<TeX
					displayMode
					raw={`H_1: \\mu_{\\text{${grouping}:${firstCategory}}} - \\mu_{\\text{${grouping}:${secondCategory}}} ${arrow} ${diff}`}
					tag="" />
				<pre style={{ fontSize: '11px' }}>
					{result.print()}
				</pre>
			</div>;
		} else if ( var2 ) {
			x = data[ var1 ];
			y = data[ var2 ];
			const result = ztest2( x, y, stdev( x ), stdev( y ), {
				'alpha': alpha,
				'alternative': direction,
				'difference': diff
			});
			let arrow = '\\ne';
			if ( direction === 'less' ) {
				arrow = '<';
			} else if ( direction === 'greater' ){
				arrow = '>';
			}
			value = <div>
				<label>Hypothesis test for {var1} against {var2}:</label>
				<TeX
					displayMode
					raw={`H_0: \\mu_{${var1}} - \\mu_{${var2}} = ${diff}`}
					tag=""
				/>
				<span>vs.</span>
				<TeX
					displayMode
					raw={`\\; H_1: \\mu_{${var1}} - \\mu_{${var2}} ${arrow} ${diff}`}
					tag=""
				/>
				<pre style={{ fontSize: '11px' }}>
					{result.print()}
				</pre>
			</div>;
		} else {
			this.props.session.addNotification({
				title: 'Action required',
				message: `Please select either a grouping variable or a second variable to compare ${var1} against.`,
				level: 'warning',
				position: 'tr'
			});
		}
		if ( value ) {
			const output = {
				variable: 'Two-Sample Z-Test',
				type: 'Test',
				value: value
			};
			this.props.logAction( 'DATA_EXPLORER:TESTS:TWO_SAMPLE_ZTEST', {
				var1, grouping, var2, diff, direction, alpha
			});
			this.props.onCreated( output );
		}
	}

	getBinaryVars( vars ) {
		const out = [];
		for ( let i = 0; i < vars.length; i++ ) {
			let data = copy( this.props.data[ vars[ i ] ]);
			unique( data );
			if ( data.length === 2 ) {
				out.push( vars[ i ]);
			}
		}
		return out;
	}

	renderInputs() {
		const { continuous, categorical } = this.props;
		const binary = this.getBinaryVars( categorical );
		return ( <Fragment>
			<SelectInput
				legend="Variable:"
				defaultValue={this.state.var1}
				options={continuous}
				onChange={( value ) => {
					this.setState({
						var1: value
					});
				}}
			/>
			<Row>
				<Col md={5}>
					<SelectInput
						legend="Groups:"
						options={binary}
						defaultValue={this.state.grouping}
						clearable
						onChange={( value ) => {
							this.setState({
								grouping: value,
								var2: null
							});
						}}
					/>
				</Col>
				<Col md={2}>
					<p>OR</p>
				</Col>
				<Col md={5}>
					<SelectInput
						legend="Second Variable:"
						options={continuous}
						defaultValue={this.state.var2}
						clearable
						onChange={( value ) => {
							this.setState({
								var2: value,
								grouping: null
							});
						}}
					/>
				</Col>
			</Row>
			<NumberInput
				legend="Difference under H0"
				defaultValue={this.state.diff}
				step="any"
				onChange={( value ) => {
					this.setState({
						diff: value
					});
				}}
			/>
			<SelectInput
				legend="Direction:"
				defaultValue={this.state.direction}
				options={[ 'less', 'greater', 'two-sided' ]}
				onChange={( value ) => {
					this.setState({
						direction: value
					});
				}}
			/>
			<NumberInput
				legend={<span>Significance level <TeX raw="\alpha" /></span>}
				defaultValue={this.state.alpha}
				min={0.0}
				max={1.0}
				step="any"
				onChange={( value ) => {
					this.setState({
						alpha: value
					});
				}}
			/>
		</Fragment> );
	}

	render() {
		return (
			<Panel
				style={{ fontSize: '14px' }}
			>
				<Panel.Heading>
					<Panel.Title componentClass="h4">
						Two-Sample Mean Test
					</Panel.Title>
				</Panel.Heading>
				<Panel.Body>
					{this.renderInputs()}
					<Button bsStyle="primary" block onClick={this.calculateTwoSampleZTest}>Calculate</Button>
				</Panel.Body>
			</Panel>
		);
	}
}


// DEFAULT PROPERTIES //

ZTest2.defaultProps = {
	categorical: null,
	logAction() {},
	session: {}
};


// PROPERTY TYPES //

ZTest2.propTypes = {
	categorical: PropTypes.array,
	continuous: PropTypes.array.isRequired,
	data: PropTypes.object.isRequired,
	logAction: PropTypes.func,
	onCreated: PropTypes.func.isRequired,
	session: PropTypes.object
};


// EXPORTS //

export default ZTest2;
