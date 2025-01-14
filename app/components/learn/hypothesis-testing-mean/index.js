// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import { VictoryArea, VictoryChart, VictoryLine } from 'victory';
import logger from 'debug';
import abs from '@stdlib/math/base/special/abs';
import sqrt from '@stdlib/math/base/special/sqrt';
import roundn from '@stdlib/math/base/special/roundn';
import linspace from '@stdlib/math/utils/linspace';
import dnorm from '@stdlib/stats/base/dists/normal/pdf';
import pnorm from '@stdlib/stats/base/dists/normal/cdf';
import dt from '@stdlib/stats/base/dists/t/pdf';
import pt from '@stdlib/stats/base/dists/t/cdf';
import FeedbackButtons from 'components/feedback';
import NumberInput from 'components/input/number';
import SelectInput from 'components/input/select';
import Switch from 'components/switch';
import TeX from 'components/tex';


// VARIABLES //

const areaStyle = {
	data: {
		fill: 'tomato', stroke: 'tomato', opacity: 0.3
	}
};
const debug = logger( 'isle:learn:hypothesis-testing-mean' );


// MAIN //

/**
* A learning component on hypothesis tests for a population mean.
*
* @property {Array} types - the type(s) of test (`One-Sample`, `Two-Sample`) the widget should expose
* @property {boolean} nullHypothesisAsValue - always display the null hypothesis as a single value
* @property {boolean} feedback - controls whether to display feedback buttons
* @property {object} style - CSS inline styles
*/
class MeanTest extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			n: 5,
			n2: 5,
			mu0: 0,
			sigma: 1,
			sigma2: 1,
			pdfData: null,
			xbar: 0,
			xbar2: 0,
			zStat: 0,
			areaData: null,
			areaData2: null,
			probFormula: '',
			type: 0,
			samples: props.types[ 0 ],
			selectedTest: props.tests[ 0 ]
		};
	}

	componentDidMount() {
		this.onGenerate();
	}

	onGenerate = () => {
		debug( 'Should generate new values...' );
		const { mu0, xbar, xbar2, sigma, sigma2, n, n2, samples, selectedTest } = this.state;
		let pdf;
		let cdf;
		if ( selectedTest === 'Z-Test' ) {
			cdf = pnorm.factory( 0, 1 );
			pdf = dnorm.factory( 0, 1 );
		}
		// Case: t-test
		else if ( samples === 'Two-Sample' ) {
			cdf = pt.factory( n + n2 - 2 );
			pdf = dt.factory( n + n2 - 2 );
		} else {
			cdf = pt.factory( n - 1 );
			pdf = dt.factory( n - 1 );
		}
		let pdfData = linspace( -3.50, 3.5, 300 );
		pdfData = pdfData.map( x => {
			return { x: x, y: pdf( x ) };
		});
		let zStat;
		if ( samples === 'Two-Sample' ) {
			zStat = roundn( ( xbar - xbar2 - mu0 ) / sqrt( ( ( sigma*sigma ) / n )+( ( sigma2*sigma2 )/ n2 ) ), -3 );
		} else {
			zStat = roundn( ( xbar - mu0 ) / ( sigma / sqrt( n ) ), -3 );
		}

		let areaData;
		let areaData2;
		let probFormula;
		const statChar = selectedTest === 'Z-Test' ? 'Z' : 'T';
		switch ( this.state.type ) {
		case 2:
			areaData = linspace( -3, zStat, 200 ).map( d => {
				return { x: d, y: pdf( d ) };
			});
			probFormula = `P( ${statChar} < ${zStat}) = ${roundn( cdf( zStat ), -3 )}`;
			break;
		case 1:
			areaData = linspace( zStat, 3, 200 ).map( d => {
				return { x: d, y: pdf( d ) };
			});
			probFormula = `P( ${statChar} > ${zStat}) = ${roundn( 1-cdf( zStat ), -3 )}`;
			break;
		case 0:
			areaData = linspace( abs( zStat ), 3, 200 ).map( d => {
				return { x: d, y: pdf( d ) };
			});
			areaData2 = linspace( -3, -abs( zStat ), 200 ).map( d => {
				return { x: d, y: pdf( d ) };
			});
			probFormula = `P( |${statChar}| > ${abs( zStat )}) = ${roundn( ( 1-cdf( abs( zStat ) ) )+cdf( -abs( zStat ) ), -3 )}`;
			break;
		}
		this.setState({
			n,
			mu0,
			sigma,
			sigma2,
			pdfData,
			xbar,
			xbar2,
			zStat,
			areaData,
			areaData2,
			probFormula
		});
	}

	onDirectionChange = ( pos ) => {
		let areaData;
		let areaData2;
		let probFormula;
		let { zStat, selectedTest, samples, n, n2 } = this.state;
		let pdf;
		let cdf;
		if ( selectedTest === 'Z-Test' ) {
			cdf = pnorm.factory( 0, 1 );
			pdf = dnorm.factory( 0, 1 );
		} // Case: t-test
		else if ( samples === 'Two-Sample' ) {
			cdf = pt.factory( n + n2 - 2 );
			pdf = dt.factory( n + n2 - 2 );
		} else {
			cdf = pt.factory( n - 1 );
			pdf = dt.factory( n - 1 );
		}
		switch ( pos ) {
		case 0:
			areaData = linspace( abs( zStat ), 3, 200 ).map( d => {
				return {
					x: d,
					y: pdf( d )
				};
			});
			areaData2 = linspace( -3, -abs( zStat ), 200 ).map( d => {
				return {
					x: d,
					y: pdf( d )
				};
			});
			probFormula = `P( |Z| > ${zStat}) = ${roundn( 1-cdf( abs( zStat ) ) + cdf( -abs( zStat ) ), -3 )}`;
			break;
		case 1:
			areaData = linspace( zStat, 3, 200 ).map( d => {
				return { x: d, y: pdf( d ) };
			});
			probFormula = `P( Z > ${zStat}) = ${roundn( 1-cdf( zStat ), -3 )}`;
			break;
		case 2:
			areaData = linspace( -3, zStat, 200 ).map( d => {
				return { x: d, y: pdf( d ) };
			});
			probFormula = `P( Z < ${zStat}) = ${roundn( cdf( zStat ), -3 )}`;
			break;
		}
		this.setState({
			type: pos,
			probFormula,
			areaData,
			areaData2
		});
	}

	renderParametersPanel() {
		const { mu0, xbar, xbar2, sigma, sigma2, n, n2, samples, selectedTest } = this.state;
		const statChar = selectedTest === 'Z-Test' ? 'z' : 't';
		const firstSampleParams = <div>
			<Badge variant="secondary">First Sample</Badge>
			<NumberInput
				legend="Sample mean"
				defaultValue={xbar}
				step="any"
				onChange={( value ) => {
					this.setState({
						xbar: value
					}, this.onGenerate );
				}}
			/>
			<NumberInput
				legend="Sample standard deviation"
				defaultValue={sigma}
				min={0.1}
				step="any"
				onChange={( value ) => {
					this.setState({
						sigma: value
					}, this.onGenerate );
				}}
			/>
			<NumberInput
				legend="Sample size"
				defaultValue={n}
				step={1}
				min={1}
				onChange={( value ) => {
					this.setState({
						n: value
					}, this.onGenerate );
				}}
			/>
		</div>;
		const secondSampleParams = <div>
			<Badge variant="secondary">Second Sample</Badge>
			<NumberInput
				legend="Sample mean"
				defaultValue={xbar2}
				step="any"
				onChange={( value ) => {
					this.setState({
						xbar2: value
					}, this.onGenerate );
				}}
			/>
			<NumberInput
				legend="Sample standard deviation"
				defaultValue={sigma2}
				min={0.1}
				step="any"
				onChange={( value ) => {
					this.setState({
						sigma2: value
					}, this.onGenerate );
				}}
			/>
			<NumberInput
				legend="Sample size"
				defaultValue={n2}
				step={1}
				min={1}
				onChange={( value ) => {
					this.setState({
						n2: value
					}, this.onGenerate );
				}}
			/>
		</div>;
		const testStat = samples === 'Two-Sample' ? '\\mu_1 - \\mu_2' : '\\mu';
		const asValue = this.props.nullHypothesisAsValue;
		return ( <Card maxWidth={1600}>
			<Card.Header as="h4">
				Parameters
			</Card.Header>
			<Card.Body>
				<Card body className="bg-light">
					<SelectInput
						options={this.props.types}
						defaultValue={samples}
						onChange={( value ) => {
							this.setState({
								samples: value
							}, this.onGenerate );
						}}
					/>
					{ this.props.tests.length > 1 ? <SelectInput
						options={this.props.tests}
						defaultValue={this.props.tests[ 0 ]}
						onChange={( value ) => {
							this.setState({
								selectedTest: value
							}, this.onGenerate );
						}}
					/> : null }
					<NumberInput
						legend={`Hypothesized ${samples === 'Two-Sample' ? 'difference' : 'mean'} (null hypothesis)`}
						defaultValue={mu0}
						step="any"
						onChange={( value ) => {
							this.setState({
								mu0: value
							}, this.onGenerate );
						}}
					/>
				</Card>
				<p>Let&#39;s assume that we have observed data with the following characteristics</p>
				<Card body className="bg-light">
					{firstSampleParams}
					{samples === 'Two-Sample' ? secondSampleParams : null}
				</Card>
				<p>We conduct the following test (click on the formula to switch between the one-sided variants and the two-sided test):</p>
				<Switch onChange={this.onDirectionChange}>
					<TeX displayMode tag="" raw={`H_0: ${testStat} = ${mu0} \\; vs. \\; H_1: ${testStat} \\ne ${mu0}`} />
					<TeX displayMode tag="" raw={`H_0: ${testStat} ${asValue ? '=' : '\\le'} ${mu0} \\; vs. \\; H_1: ${testStat} > ${mu0}`} />
					<TeX displayMode tag="" raw={`H_0: ${testStat} ${asValue ? '=' : '\\ge'} ${mu0} \\; vs. \\; H_1: ${testStat} < ${mu0}`} />
				</Switch>
				<p>We calculate the following test statistic:</p>
				{ samples === 'Two-Sample' ?
					<TeX
						displayMode
						tag=""
						style={{
							fontSize: '1.5em'
						}}
						raw={`${statChar}  = \\frac{(\\bar x_1 - \\bar x_2) - (\\mu_1 - \\mu_2)}{\\sqrt{\\tfrac{s_1^2}{n_1}+\\tfrac{s_2^2}{n_2}}}`}
						elems={{
							'n': {
								tooltip: 'Sample Size'
							},
							's': {
								tooltip: 'Standard Deviation'
							},
							'μ': {
								tooltip: 'True mean'
							},
							'x': {
								tooltip: 'Sample Mean'
							},
							'z': {
								tooltip: 'Test Statistic'
							}
						}}
					/> :
					<TeX
						displayMode
						tag=""
						style={{
							fontSize: '1.5em'
						}}
						raw={`${statChar} = \\frac{\\bar x - \\mu}{s/\\sqrt{n}}`}
						elems={{
							'n': {
								tooltip: 'Sample Size'
							},
							's': {
								tooltip: 'Standard Deviation'
							},
							'μ': {
								tooltip: 'Mean under the Null Hypothesis'
							},
							'x': {
								tooltip: 'Sample Mean'
							},
							'z': {
								tooltip: 'Test Statistic'
							}
						}}
					/>
				}
			</Card.Body>
		</Card> );
	}

	renderResultPanel() {
		const { mu0, xbar, xbar2, sigma, sigma2, n, n2, samples, zStat, selectedTest } = this.state;
		const statChar = selectedTest === 'Z-Test' ? 'z' : 't';
		return ( <Card>
			<Card.Header as="h4">Test Result</Card.Header>
			<Card.Body>
				<p>Plugging in our values, we have:</p>
				{ samples === 'Two-Sample' ?
					<TeX
						tag=""
						displayMode
						raw={`${statChar} = \\frac{${roundn( xbar - xbar2, -3 )} - ${mu0}}{\\sqrt{${roundn( ( ( sigma*sigma ) / n ) + ( ( sigma2*sigma2 )/ n2 ), -3 )}}} = ${zStat}`}
					/> :
					<TeX
						tag=""
						displayMode
						raw={`${statChar} = \\frac{${xbar} - ${mu0}}{${sigma} / \\sqrt{${n}}} = ${zStat}`}
					/>
				}
				<p>Under the null hypothesis, we calculate the p-value:</p>
				<TeX raw={this.state.probFormula} />
				<VictoryChart
					domain={{ x: [ -3, 3 ]}}
				>
					<VictoryLine data={this.state.pdfData} />
					<VictoryArea
						data={this.state.areaData}
						style={areaStyle}
					/>
					{ this.state.areaData2 ? <VictoryArea
						data={this.state.areaData2}
						style={areaStyle}
					/> : null }
				</VictoryChart>
			</Card.Body>
		</Card> );
	}

	render() {
		return ( <Container style={{ paddingTop: 20, paddingBottom: 20, ...this.props.style }}>
			<Row>
				<Col md={6}>
					{this.renderParametersPanel()}
				</Col>
				<Col md={6}>
					{this.renderResultPanel()}
					<br />
					{this.props.feedback ?
						<FeedbackButtons id="hypothesisTestingMean" /> :
						null
					}
				</Col>
			</Row>
		</Container> );
	}
}


// PROPERTIES //

MeanTest.defaultProps = {
	types: [ 'One-Sample', 'Two-Sample' ],
	tests: [ 'Z-Test', 'T-Test' ],
	nullHypothesisAsValue: false,
	feedback: false,
	style: {}
};

MeanTest.propTypes = {
	types: PropTypes.arrayOf( PropTypes.string ),
	tests: PropTypes.arrayOf( PropTypes.oneOf([ 'Z-Test', 'T-Test' ] ) ),
	nullHypothesisAsValue: PropTypes.bool,
	feedback: PropTypes.bool,
	style: PropTypes.object
};


// EXPORTS //

export default MeanTest;
