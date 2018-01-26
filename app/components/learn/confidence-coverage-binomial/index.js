// MODULES //

import React, { Component } from 'react';
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Panel from 'react-bootstrap/lib/Panel';
import Row from 'react-bootstrap/lib/Row';
import { VictoryAxis, VictoryChart, VictoryErrorBar, VictoryLine, VictoryTheme, VictoryTooltip } from 'victory';
import abs from '@stdlib/math/base/special/abs';
import sqrt from '@stdlib/math/base/special/sqrt';
import randu from '@stdlib/random/base/randu';
import qnorm from '@stdlib/math/base/dists/normal/quantile';
import ztest from '@stdlib/math/stats/ztest';
import Dashboard from 'components/dashboard';
import TeX from 'components/tex';
import FeedbackButtons from 'components/feedback';
import SliderInput from 'components/input/slider';
import NumberInput from 'components/input/number';


// VARIABLES //

const ELEM_TOOLTIPS = {
	'p': { tooltip: 'Success probability' },
	'n': { tooltip: 'Number of trials' },
	'α': { tooltip: 'Significance level' },
	'Z': { tooltip: 'Standard normal quantile' }
};


// MAIN //

class ConfidenceCoverageBinomial extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			errorBars: [],
			p: null,
			nTrapped: null
		};
	}

	onGenerate = ( n, p, level ) => {
		let nTrapped = 0;
		let alpha = 1.0 - level;
		let errorBars = new Array( 20 );
		for ( let i = 0; i < 20; i++ ) {
			let data = new Array( n );
			for ( let j = 0; j < data.length; j++ ) {
				data[ j ] = randu() <= p ? 1.0 : 0.0;
			}
			let sd = sqrt( p * ( 1.0-p ) );
			let res = ztest( data, sd, {
				'alpha': alpha
			});
			let o = {
				'num': i,
				'yval': res.statistic * res.sd,
				'err': abs( res.sd * qnorm( 1.0 - alpha/ 2.0, 0.0, 1.0 ) )
			};
			o.label = ( o.yval - o.err > p ) ||
				( o.yval + o.err < p ) ? 'does not contain p' :
				'contains p';
			if ( o.label === 'contains p' ) {
				nTrapped += 1;
			}
			errorBars[ i ] = o;
		}
		this.setState({
			nTrapped: nTrapped,
			p: p,
			errorBars: errorBars
		});
	}

	renderChart() {
		const { errorBars } = this.state;
		if ( !errorBars || errorBars.length === 0 ) {
			return null;
		}
		return ( <VictoryChart
			padding={30}
			height={180}
			theme={VictoryTheme.material}
			domain={{ y: [ 0, 1 ] }}
		>
			<VictoryAxis
				padding={20}
				standalone={false}
				tickCount={10}
			/>
			<VictoryAxis
				dependentAxis
				padding={20}
				standalone={false}
			/>
			<VictoryErrorBar
				animate={{ duration: 500 }}
				labelComponent={<VictoryTooltip />}
				style={{
					data: {
						stroke: ( data ) => (
							( data.y - data.err > this.state.p ) ||
							( data.y + data.err < this.state.p )
						) ? 'darkred' : 'steelblue'
					}
				}}
				data={this.state.errorBars}
				x="num"
				y="yval"
				errorY={( d ) => d.err}
				labels={( d ) => d.label}
			/>
			<VictoryLine
				data={[
					{ x: 0, y: this.state.p },
					{ x: 20, y: this.state.p }
				]}
			/>
		</VictoryChart> );
	}

	render() {
		const intro = <div>
			<p>Now we'll switch to asking a Yes/No question about a population.  We're interested in estimating the true population proportion p of "Yes" answers (for example, what proportion of the population has blue eyes?).  We can take a sample of size n, find how many observations in our sample are a "Yes", and then estimate the true proportion p with <TeX raw="\hat p = \frac{X}{n}" elems={ELEM_TOOLTIPS} />. Then <TeX raw="\hat p \sim \text{Normal}\left( p, \sqrt{ p(1-p)/n } \right)" elems={ELEM_TOOLTIPS} />. Our confidence interval is then <TeX raw="\hat p \pm Z_{\alpha/2} \cdot \sqrt{p(1-p)/n}" elems={ELEM_TOOLTIPS} />.</p>
			<p>For our choice of sample size (n), true proportion p, and confidence level, we'll simulate 20 different samples from our normal distribution and calculate the corresponding sample proportions and confidence intervals.</p>
		</div>;

		return (
			<Panel id="coverageModuleBinomial">
				<Panel.Heading>
					<Panel.Title componentClass="h4">Confidence Interval Coverage for Sample Proportion</Panel.Title>
				</Panel.Heading>
				<Panel.Body>
					<Grid>
						<Row>
							{intro}
						</Row>
						<Row>
							<Col md={4}>
								<Dashboard
									title="Change parameters"
									onGenerate={this.onGenerate}
									autoStart={true}
								>
									<NumberInput
										legend="Sample size (n)"
										defaultValue={30}
										max={999}
										step={1}
									/>
									<NumberInput
										legend="True proportion p"
										defaultValue={0.5}
										max={1}
										min={0}
										step={0.01}
									/>
									<SliderInput
										legend="Confidence level"
										defaultValue={0.95}
										min={0.01}
										max={0.99}
										step={0.01}
										fractionDigits={2}
									/>
								</Dashboard>
							</Col>
							<Col md={8}>
								<Panel>
									<Panel.Heading>
										<Panel.Title componentClass="h4">Confidence Intervals</Panel.Title>
									</Panel.Heading>
									<Panel.Body>
										{this.renderChart()}
										<p>Of the 20 confidence intervals, {this.state.nTrapped} capture the true proportion <b>(coverage: {this.state.nTrapped/20}).</b></p>
									</Panel.Body>
								</Panel>
								<FeedbackButtons
									for="coverageModuleBinomial"
								/>
							</Col>
						</Row>
					</Grid>
				</Panel.Body>
			</Panel>
		);
	}
}


// EXPORTS //

export default ConfidenceCoverageBinomial;
