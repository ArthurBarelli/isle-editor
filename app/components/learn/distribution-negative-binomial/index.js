// MODULES //

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { VictoryAxis, VictoryChart, VictoryBar, VictoryLine, VictoryTheme } from 'victory';
import roundn from '@stdlib/math/base/special/roundn';
import incrspace from '@stdlib/math/utils/incrspace';
import dnbinom from '@stdlib/stats/base/dists/negative-binomial/pmf';
import pnbinom from '@stdlib/stats/base/dists/negative-binomial/cdf';
import qnbinom from '@stdlib/stats/base/dists/negative-binomial/quantile';
import FeedbackButtons from 'components/feedback';
import NumberInput from 'components/input/number';
import SliderInput from 'components/input/slider';
import Panel from 'components/panel';
import TeX from 'components/tex';


// VARIABLES //

const NEAR_ONE = 0.999;


// MAIN //

/**
* A learning component for calculating probabilities of a negative binomial distribution.
*
* @property {boolean} countTrials - set to true if instead of counting the number of failures until the r-th success, a random variable from a negative binomial distribution should be defined as the number of trials until the r-th success
* @property {number} step - step size of the scroll input
* @property {Object} style - CSS inline styles
*/
class NegativeBinomial extends Component {
	constructor( props ) {
		super( props );

		const r = 10;
		const p = 0.5;
		const minValue = props.countTrials ? r : 0;
		const max = qnbinom( NEAR_ONE, r, p ) + 1 + minValue;
		const x = incrspace( minValue, max+1, 1 );
		const data = new Array( x.length );
		for ( let i = 0; i < x.length; i++ ) {
			data[ i ] = {
				x: x[ i ],
				y: dnbinom( x[ i ] - minValue, r, p )
			};
		}
		this.state = {
			r,
			p,
			x0: 0,
			x1: 1,
			data,
			max
		};
	}

	handleSuccessesChange = ( r ) => {
		const minValue = this.props.countTrials ? r : 0;
		const max = qnbinom( NEAR_ONE, r, this.state.p ) + 1 + minValue;
		const x = incrspace( minValue, max+1, 1 );
		const data = new Array( x.length );
		for ( let i = 0; i < x.length; i++ ) {
			data[ i ] = {
				x: x[ i ],
				y: dnbinom( x[ i ] - minValue, r, this.state.p )
			};
		}
		this.setState({
			r, data, max
		});
	}

	handleProbChange = ( p ) => {
		const minValue = this.props.countTrials ? this.state.r : 0;
		const max = qnbinom( NEAR_ONE, this.state.r, p ) + 1 + minValue;
		const x = incrspace( minValue, max+1, 1 );
		const data = new Array( x.length );
		for ( let i = 0; i < x.length; i++ ) {
			data[ i ] = {
				x: x[ i ],
				y: dnbinom( x[ i ] - minValue, this.state.r, p )
			};
		}
		this.setState({
			p, data, max
		});
	}

	handleLowerChange = ( x0 ) => {
		this.setState({ x0 });
	}

	handleUpperChange = ( x1 ) => {
		this.setState({ x1 });
	}

	renderInputs( type ) {
		return (
			<Fragment>
				<NumberInput
					key={`${type}-r`}
					legend="Successes until stop (r)"
					defaultValue={this.state.r}
					min={1}
					step={1}
					onChange={this.handleSuccessesChange}
				/>
				<NumberInput
					key={`${type}-p`}
					legend="Success probability (p)"
					defaultValue={this.state.p}
					step={this.props.step}
					max={0.99}
					min={0.01}
					onChange={this.handleProbChange}
				/>
				<SliderInput
					key={`${type}-x0`}
					legend="x0"
					defaultValue={this.state.x0}
					step={1}
					min={0}
					max={this.state.max}
					onChange={this.handleLowerChange}
				/>
				{ type === 'range' ?
					<SliderInput
						key={`${type}-x1`}
						legend="x1"
						defaultValue={this.state.x1}
						min={0}
						max={this.state.max}
						step={1}
						onChange={this.handleUpperChange}
					/> : null
				}
			</Fragment>
		);
	}

	render() {
		const { x0, x1, r, p, max } = this.state;
		const minValue = this.props.countTrials ? r : 0;
		return ( <Card style={{ maxWidth: 1200, margin: '10px auto', ...this.props.style }}>
			<Card.Header as="h3">
				Negative Binomial Distribution
			</Card.Header>
			<Card.Body>
				<Tabs defaultActiveKey={0} id="negative-binomial-tabs">
					<Tab eventKey={0} title={<TeX raw="P(X = x)" />}>
						<Container>
							<Row>
								<Col md={5} >
								<Panel title="Negative binomial probabilities" >
									<span>For number of successes until experiment is stopped </span><NumberInput
										inline
										legend="r"
										defaultValue={this.state.r}
										step={1}
										min={1}
										max={999}
										onChange={this.handleSuccessesChange}
									/><span> and a success probability of</span>
									<NumberInput
										inline
										legend="p"
										defaultValue={this.state.p}
										step={0.01}
										max={0.99}
										min={0.01}
										onChange={this.handleProbChange}
									/>
									<span>we get</span>
									{this.props.countTrials ?
										<TeX raw={`P(X=x)= \\Large \\tbinom{x - 1}{${r}-1} ${p}^{${r}} ${roundn(1-p, -4)}^{x-${r}}`} displayMode /> :
										<TeX raw={`P(X=x)= \\Large \\tbinom{x + ${r} - 1}{x} ${p}^{${r}} ${roundn(1-p, -4)}^{x}`} displayMode />
									}
									<span>Evaluated at </span><NumberInput
										inline
										legend="x"
										defaultValue={this.state.x}
										step={1}
										max={max}
										min={0}
									/> <span>we get</span>
									{this.props.countTrials ?
										<TeX raw={`P(X=${x0}) = \\Large \\tbinom{${x0-1}}{${r-1}} ${p}^{${r}} ${roundn(1-p, -4 )}^{${x0-r}} \\approx ${dnbinom(x0 - minValue, r, p).toFixed(4)}`} displayMode /> :
										<TeX raw={`P(X=${x0}) = \\Large \\tbinom{${r+x0-1}}{${x0}} ${p}^{${r}} ${roundn(1-p, -4 )}^{${x0}} \\approx ${dnbinom(x0 - minValue, r, p).toFixed(4)}`} displayMode />
									}
									<p>The random variable X denotes the number of {this.props.countTrials ? 'trials' : 'failures' } until the r-th success is reached.</p>
								</Panel>
								</Col>
								<Col md={7} >
									<Panel header="Probability Plot">
										<Row>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material}>
												<VictoryAxis dependentAxis />
												<VictoryAxis
													label="PMF" tickFormat={(x) => roundn(x, -2)}
													style={{ axisLabel: { padding: 40 }}}
												/>
												<VictoryBar
													data={this.state.data}
													style={{
														data: {
															fill: data => ( data.x === x0 ) ? 'tomato' : 'steelblue'
														}
													}}
												/>
												</VictoryChart>
											</Col>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material} >
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="CDF" tickFormat={(x) => `${x}`} crossAxis={false}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryLine
														samples={600}
														y={( data ) => {
															return pnbinom( data.x - minValue, r, p );
														}}
														domain={{
															x: [ 0, max+1 ],
															y: [ 0, 1.1 ]
														}}
													/>
													<VictoryLine
														data={[
															{ x: x0, y: 0 },
															{ x: x0, y: pnbinom( x0 - minValue, r, p ) }
														]}
														style={{
															data: { stroke: '#e95f46', strokeWidth: 1, opacity: 0.5 }
														}}
													/>
													<VictoryLine
														data={[
															{ x: 0, y: pnbinom( x0 - minValue, r, p ) },
															{ x: x0, y: pnbinom( x0 - minValue, r, p ) }
														]}
														style={{
															data: { stroke: '#e95f46', strokeWidth: 1, opacity: 0.5 }
														}}
													/>
												</VictoryChart>
											</Col>
										</Row>
									</Panel>
								</Col>
							</Row>
						</Container>
					</Tab>
					<Tab eventKey={1} title={<TeX raw="P(X \le x_0)" />}>
						<Container>
							<Row>
								<Col md={4} >
									<Panel>
										{this.renderInputs( 'smaller' )}
										<TeX raw={`P(X \\le ${roundn( x0, -4 )} ) = ${roundn( pnbinom( x0 - minValue, r, p ), -4 )}`} displayMode tag="" />
									</Panel>
								</Col>
								<Col md={8} >
									<Panel header="Probability Plot">
										<Row>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material}>
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="PMF" tickFormat={(x) => `${x}`}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryBar
														data={this.state.data}
														style={{
															data: {
																fill: data => ( data.x <= x0 ) ? 'tomato' : 'steelblue'
															}
														}}
													/>
												</VictoryChart>
											</Col>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material} >
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="CDF" tickFormat={(x) => `${x}`}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryLine
														samples={600}
														y={( data ) => {
															return pnbinom( data.x - minValue, r, p );
														}}
														domain={{
															x: [ 0, max+1 ],
															y: [ 0, 1.1 ]
														}}
													/>
													<VictoryLine
														data={[
															{ x: x0, y: 0 },
															{ x: x0, y: pnbinom( x0 - minValue, r, p ) }
														]}
														style={{
															data: { stroke: '#e95f46', strokeWidth: 1, opacity: 0.5 }
														}}
													/>
													<VictoryLine
														data={[
															{ x: 0, y: pnbinom( x0 - minValue, r, p ) },
															{ x: x0, y: pnbinom( x0 - minValue, r, p ) }
														]}
														style={{
															data: { stroke: '#e95f46', strokeWidth: 1, opacity: 0.5 }
														}}
													/>
												</VictoryChart>
											</Col>
										</Row>
									</Panel>
								</Col>
							</Row>
						</Container>
					</Tab>
					<Tab eventKey={2} title={<TeX raw="P(X > x_0)" />}>
						<Container>
							<Row>
								<Col md={4} >
									<Panel>
										{this.renderInputs( 'greater' )}
										<TeX raw={`P(X > ${roundn( x0, -4 )}) = ${roundn( 1.0 - pnbinom( x0 - minValue, r, p ), -4 )}`} displayMode tag="" />
									</Panel>
								</Col>
								<Col md={8} >
									<Panel header="Probability Plot">
										<Row>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material}>
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="PMF" tickFormat={(x) => `${x}`}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryBar
														data={this.state.data}
														style={{
															data: {
																fill: data => ( data.x > this.state.x0 ) ? 'tomato' : 'steelblue'
															}
														}}
													/>
												</VictoryChart>
											</Col>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material} >
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="CDF" tickFormat={(x) => `${x}`}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryLine
														samples={600}
														y={( data ) => {
															return pnbinom( data.x - minValue, r, p );
														}}
														domain={{
															x: [ 0, max ],
															y: [ 0, 1.1 ]
														}}
													/>
													<VictoryLine
														data={[
															{ x: x0, y: 0 },
															{ x: x0, y: pnbinom( x0 - minValue, r, p ) }
														]}
														style={{
															data: { stroke: '#e95f46', strokeWidth: 1, opacity: 0.5 }
														}}
													/>
													<VictoryLine
														data={[
															{ x: 0, y: pnbinom( x0 - minValue, r, p ) },
															{ x: x0, y: pnbinom( x0 - minValue, r, p ) }
														]}
														style={{
															data: { stroke: '#e95f46', strokeWidth: 1, opacity: 0.5 }
														}}
													/>
												</VictoryChart>
											</Col>
										</Row>
									</Panel>
								</Col>
							</Row>
						</Container>
					</Tab>
					<Tab eventKey={3} title={<TeX raw="P( x_0 \le X \le x_1)" />}>
						<Container>
							<Row>
								<Col md={4} >
									<Panel>
										{this.renderInputs( 'range' )}
										{ x1 >= x0 ?
											<TeX raw={`P(${roundn( x0, -4 )} \\le X \\le ${roundn( x1, -4 )}) = ${roundn( pnbinom( x1 - minValue, r, p ) - pnbinom( x0 - minValue - 1, r, p ), -4 )}`} displayMode tag="" /> :
											<Alert variant="warning">Lower bound must be smaller than or equal to upper bound.</Alert>
										}
									</Panel>
								</Col>
								<Col md={8} >
									<Panel header="Probability Plot">
										<Row>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material}>
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="PMF" tickFormat={(x) => `${x}`}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryBar
														data={this.state.data}
														style={{
															data: {
																fill: data => ( x0 <= data.x && data.x <= x1 ) ? 'tomato' : 'steelblue'
															}
														}}
													/>
												</VictoryChart>
											</Col>
											<Col md={6} >
												<VictoryChart theme={VictoryTheme.material} >
													<VictoryAxis dependentAxis />
													<VictoryAxis
														label="CDF" tickFormat={(x) => `${x}`}
														style={{ axisLabel: { padding: 40 }}}
													/>
													<VictoryLine
														samples={600}
														y={( data ) => {
															return pnbinom( data.x - minValue, r, p );
														}}
														domain={{
															x: [ 0, max ],
															y: [ 0, 1.1 ]
														}}
													/>
												</VictoryChart>
											</Col>
										</Row>
									</Panel>
								</Col>
							</Row>
						</Container>
					</Tab>
				</Tabs>
				<FeedbackButtons
					id="negative_binomial_distribution"
				/>
			</Card.Body>
		</Card> );
	}
}


// PROPERTIES //

NegativeBinomial.propTypes = {
	countTrials: PropTypes.bool,
	step: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.string
	]),
	style: PropTypes.object
};

NegativeBinomial.defaultProps = {
	countTrials: false,
	step: 0.01,
	style: {}
};


// EXPORTS //

export default NegativeBinomial;
