// MODULES //

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Navbar from 'react-bootstrap/lib/Navbar';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Modal from 'react-bootstrap/lib/Modal';
import Nav from 'react-bootstrap/lib/Nav';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import NavItem from 'react-bootstrap/lib/NavItem';
import Panel from 'react-bootstrap/lib/Panel';
import Tab from 'react-bootstrap/lib/Tab';
import Well from 'react-bootstrap/lib/Well';
import isString from '@stdlib/assert/is-string';
import isNumberArray from '@stdlib/assert/is-number-array';
import isObject from '@stdlib/assert/is-object';
import isEmptyObject from '@stdlib/assert/is-empty-object';
import hasProp from '@stdlib/assert/has-property';
import startsWith from '@stdlib/string/starts-with';
import copy from '@stdlib/utils/copy';
import scrollTo from 'utils/scroll-to';
import MarkdownEditor from 'components/markdown-editor';
import SelectInput from 'components/input/select';
import ContingencyTable from 'components/data-explorer/contingency-table';
import FrequencyTable from 'components/data-explorer/frequency-table';
import SummaryStatistics from 'components/data-explorer/summary-statistics';
import SimpleLinearRegression from 'components/data-explorer/linear-regression';
import VariableTransformer from 'components/data-explorer/variable-transformer';
import GridLayout from './grid_layout.js';
import Pages from 'components/pages';
import Gate from 'components/gate';
import RealtimeMetrics from 'components/metrics/realtime';
import Plotly from 'components/plotly';
import RPlot from 'components/r/plot';
import LearnNormalDistribution from 'components/learn/distribution/normal';
import LearnExponentialDistribution from 'components/learn/distribution/exponential';
import LearnUniformDistribution from 'components/learn/distribution/uniform';
import SpreadsheetUpload from 'components/spreadsheet-upload';
import DataTable from 'components/data-table';
import OutputPanel from './output_panel.js';
import './data_explorer.css';


// PLOT COMPONENTS //

import Barchart, { generateBarchartConfig } from 'components/data-explorer/barchart';
import Boxplot, { generateBoxplotConfig } from 'components/data-explorer/boxplot';
import Heatmap, { generateHeatmapCode } from 'components/data-explorer/heatmap';
import Histogram, { generateHistogramConfig } from 'components/data-explorer/histogram';
import MosaicPlot, { generateMosaicPlotCode } from 'components/data-explorer/mosaicplot';
import Piechart, { generatePiechartConfig } from 'components/data-explorer/piechart';
import Scatterplot, { generateScatterplotConfig } from 'components/data-explorer/scatterplot';
import ContourChart, { generateContourChart } from 'components/data-explorer/contour.js';


// TEST COMPONENTS //

import MeanTest from 'components/data-explorer/meantest';
import MeanTest2 from 'components/data-explorer/meantest2';
import CorrTest from 'components/data-explorer/corrtest';
import Chi2Test from 'components/data-explorer/chi2';
import PropTest from 'components/data-explorer/proptest';
import PropTest2 from 'components/data-explorer/proptest2';
import Anova from 'components/data-explorer/anova';


// FUNCTIONS //

const generateTransformationCode = ( variable ) => `if ( datum.${variable} > 0 ) {
	return 'Yes'
} else {
	return 'No'
}`;


// MAIN //

class DataExplorer extends Component {
	/**
	* Constructor function
	*/
	constructor( props ) {
		super( props );
		let data = props.data;
		let continuous;
		let categorical;
		let groupVars;
		if ( !props.data && props.id ) {
			// Try to load data from local storage:
			data = JSON.parse( localStorage.getItem( props.id+'_data' ) );
			continuous = JSON.parse( localStorage.getItem( props.id+'_continuous' ) );
			categorical = JSON.parse( localStorage.getItem( props.id+'_categorical' ) );
			groupVars = ( categorical || [] ).slice();
		} else {
			continuous = props.continuous;
			categorical = props.categorical;
			groupVars = props.categorical.slice();
		}
		let ready = false;
		if (
			isObject( data ) &&
			continuous.length > 0 &&
			categorical.length > 0
		) {
			ready = true;
		}
		this.state = {
			data: data,
			continuous: continuous,
			categorical: categorical,
			output: [],
			groupVars,
			ready,
			showStudentPlots: false,
			openedNav: props.hideDataTable ? '2' : '1',
			studentPlots: [],
			unaltered: {
				data: props.data,
				continuous: props.continuous,
				categorical: props.categorical
			}
		};

		this.logAction = ( type, value ) => {
			const { session } = this.context;
			if ( this.props.id ) {
				session.log({
					id: this.props.id,
					type,
					value
				});
			}
		};
	}

	static getDerivedStateFromProps( nextProps, prevState ) {
		const newState = {};
		if ( nextProps.data !== prevState.unaltered.data ) {
			newState.data = nextProps.data;
		}
		if ( nextProps.data ) {
			if ( nextProps.continuous !== prevState.unaltered.continuous ) {
				newState.continuous = nextProps.continuous;
			}
			if ( nextProps.continuous !== prevState.continuous ) {
				newState.categorical = nextProps.categorical;
			}
		}
		if ( !isEmptyObject( newState ) ) {
			newState.unaltered = {
				data: nextProps.data,
				continuous: nextProps.continuous,
				categorical: nextProps.categorical
			};
			return newState;
		}
		return null;
	}

	componentDidUpdate( prevProps, prevState ){
		if ( this.state.output !== prevState.output ) {
			const outputPanel = document.getElementById( 'outputPanel' );
			scrollTo( outputPanel, outputPanel.scrollHeight, 1000 );
		}
	}

	resetLocalStorage = () => {
		localStorage.removeItem( this.props.id+'_data' );
		localStorage.removeItem( this.props.id+'_continuous' );
		localStorage.removeItem( this.props.id+'_categorical' );
		this.setState({
			data: null,
			categorical: [],
			continuous: [],
			ready: false
		});
	}

	/**
	* Display gallery of recently created plots by the students.
	*/
	toggleStudentPlots = () => {
		this.setState({
			showStudentPlots: !this.state.showStudentPlots
		});
	}

	/**
	* Remove output element at the specified index.
	*/
	clearOutput = ( idx ) => {
		let newOutputs = copy( this.state.output );
		newOutputs.splice( idx, 1 );
		this.setState({
			output: newOutputs
		});
	}

	/**
	* Remove all currently saved student plots.
	*/
	clearPlots = () => {
		this.setState({
			studentPlots: []
		});
	}

	/**
	* Stores all plot actions in the internal state.
	*/
	onUserAction = ( action ) => {
		let config;
		if ( action.type === 'DATA_EXPLORER_SHARE:HISTOGRAM' ) {
			config = generateHistogramConfig({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:BARCHART' ) {
			config = generateBarchartConfig({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:BOXPLOT' ) {
			config = generateBoxplotConfig({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:PIECHART' ) {
			config = generatePiechartConfig({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:SCATTERPLOT' ) {
			config = generateScatterplotConfig({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:MOSAIC' ) {
			config = generateMosaicPlotCode({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:HEATMAP' ) {
			config = generateHeatmapCode({ data: this.state.data, ...action.value });
		}
		else if ( action.type === 'DATA_EXPLORER_SHARE:CONTOURCHART' ) {
			config = generateContourChart({ data: this.state.data, ...action.value });
		}
		if ( config ) {
			const newStudentPlots = copy( this.state.studentPlots );
			const configString = JSON.stringify( config );
			let found = false;
			for ( let i = 0; i < newStudentPlots.length; i++ ) {
				if ( newStudentPlots[ i ].config === configString ) {
					newStudentPlots[ i ].count += 1;
					found = true;
					break;
				}
			}
			if ( !found ) {
				newStudentPlots.push({
					config: configString,
					count: 1
				});
			}
			this.setState({
				studentPlots: newStudentPlots
			});
		}
	}

	/**
	* Scrolls to the bottom of the output panel after result has been inserted.
	*/
	scrollToBottom() {
		const outputPanel = document.getElementById( 'outputPanel' );
		scrollTo( outputPanel, outputPanel.scrollHeight, 1000 );
	}

	/**
	* Adds the supplied element to the array of outputs.
	*/
	addToOutputs = ( element ) => {
		let newOutput = this.state.output.slice();
		newOutput.push( element );
		this.setState({
			output: newOutput
		});
	}

	onGenerateTransformedVariable = ( name, values ) => {
		let newData = copy( this.state.data );
		if ( !hasProp( this.props.data, name ) ) {
			newData[ name ] = values;
			let groupVars;
			let previous;
			let newContinuous = copy( this.state.continuous );
			let newCategorical = copy( this.state.categorical );
			if ( isNumberArray( values ) ) {
				if ( !( name in newContinuous ) ) {
					newContinuous.push( name );
					previous = newCategorical.indexOf( name );
					if ( previous > 0 ) {
						newCategorical.splice( previous, 1 );
						groupVars = newCategorical.slice();
					}
				}
			} else {
				if ( !( name in newCategorical ) ) {
					newCategorical.push( name );
					previous = newContinuous.indexOf( name );
					if ( previous > 0 ) {
						newContinuous.splice( previous, 1 );
					}
				}
				groupVars = newCategorical.slice();
			}
			let newState = {
				data: newData,
				categorical: newCategorical,
				continuous: newContinuous
			};
			if ( groupVars ) {
				newState[ 'groupVars' ] = groupVars;
			}
			this.setState( newState );
			const { session } = this.context;
			session.addNotification({
				title: 'Variable created',
				message: `The variable with the name ${name} has been successfully ${ previous > 0 ? 'overwritten' : 'created' }`,
				level: 'success',
				position: 'tr'
			});
		} else {
			const { session } = this.context;
			session.addNotification({
				title: 'Variable exists',
				message: 'The original variables of the data set cannot be overwritten.',
				level: 'error',
				position: 'tr'
			});
		}
	}

	onFileUpload = ( err, output ) => {
		if ( !err ) {
			const data = {};
			const columnNames = Object.keys( output[ 0 ]);
			for ( let j = 0; j < columnNames.length; j++ ) {
				let col = columnNames[ j ];
				data[ col ] = new Array( output.length );
			}
			for ( let i = 0; i < output.length; i++ ) {
				for ( let j = 0; j < columnNames.length; j++ ) {
					let col = columnNames[ j ];
					data[ col ][ i ] = output[ i ][ col ];
				}
			}
			const categoricalGuesses = [];
			const continuousGuesses = [];
			columnNames.forEach( variable => {
				if ( isNumberArray( data[ variable ]) ) {
					continuousGuesses.push( variable );
				} else {
					categoricalGuesses.push( variable );
				}
			});
			this.setState({
				continuous: continuousGuesses,
				categorical: categoricalGuesses,
				data
			}, () => {
				localStorage.setItem( this.props.id+'_data', JSON.stringify( this.state.data ) );
			});
		}
	}

	/**
	* React component render method.
	*/
	render() {
		if ( !this.state.data ) {
			return (
				<SpreadsheetUpload
					title="Data Explorer"
					onUpload={this.onFileUpload}
				/>
			);
		}
		if ( !this.state.ready ) {
			const variableNames = Object.keys( this.state.data );
			return ( <Panel>
				<Panel.Heading>
					<Panel.Title componentClass="h3">Data Explorer</Panel.Title>
				</Panel.Heading>
				<Panel.Body>
					<h4>Please select which variables should be treated as numeric and which ones as categorical:</h4>
					<SelectInput
						legend="Continuous:"
						options={variableNames}
						defaultValue={this.state.continuous}
						multi
						onChange={( continuous ) => {
							this.setState({ continuous });
						}}
					/>
					<SelectInput
						legend="Categorical:"
						options={variableNames}
						defaultValue={this.state.categorical}
						multi
						onChange={( categorical ) => {
							this.setState({ categorical });
						}}
					/>
					<Button onClick={() => {
						const groupVars = this.state.categorical.slice();
						const ready = true;
						this.setState({
							groupVars,
							ready
						}, () => {
							if ( this.props.id ) {
								localStorage.setItem( this.props.id+'_continuous', JSON.stringify( this.state.continuous ) );
								localStorage.setItem( this.props.id+'_categorical', JSON.stringify( this.state.categorical ) );
							}
						});
					}}>Submit</Button>
					<DataTable data={this.state.data} />
				</Panel.Body>
			</Panel> );
		}
		let colWidth = this.props.questions ? 4 : 6;
		let nStatistics = this.props.statistics.length;
		let defaultActiveKey = '1';
		if ( nStatistics === 0 ) {
			defaultActiveKey = '2';
		}
		const categoricalProps = {
			data: this.state.data,
			variables: this.state.categorical,
			groupingVariables: this.state.groupVars,
			onCreated: this.addToOutputs,
			onPlotDone: this.scrollToBottom
		};
		const continuousProps = {
			data: this.state.data,
			variables: this.state.continuous,
			groupingVariables: this.state.groupVars,
			onCreated: this.addToOutputs,
			onPlotDone: this.scrollToBottom
		};

		const navbar = <Nav bsStyle="tabs">
			{ nStatistics > 0 ?
				<NavItem eventKey="1">
				Statistics
				</NavItem> : null
			}
			{ this.props.tables.length > 0 && this.state.categorical.length > 0 ?
				<NavDropdown
					eventKey="2"
					title="Tables"
				>
					{ this.props.tables.map(
						( e, i ) => <MenuItem key={i} eventKey={`2.${i+1}`}>{e}</MenuItem>
					) }
				</NavDropdown> : null
			}
			{ this.props.plots.length > 0 ?
				<NavDropdown
					eventKey="3"
					title="Plots"
				>
					{ this.props.plots.map(
						( e, i ) => <MenuItem key={i} eventKey={`3.${i+1}`}>{e}</MenuItem>
					) }
				</NavDropdown> : null
			}
			{ this.props.tests.length > 0 ?
				<NavDropdown
					eventKey="4"
					title="Tests"
				>
					{ this.props.tests.map(
						( e, i ) => <MenuItem key={i} eventKey={`4.${i+1}`}>{e}</MenuItem>
					) }
				</NavDropdown> : null
			}
			{ this.props.models.length > 0 ?
				<NavDropdown
					eventKey="5"
					title="Models"
				>
					{this.props.models.map( ( e, i ) =>
						<MenuItem key={i} eventKey={`5.${i+1}`}>{e}</MenuItem> )}
				</NavDropdown> : null
			}
		</Nav>;

		const tabs = <Tab.Content animation={false}>
			<Tab.Pane eventKey="1">
				<SummaryStatistics
					{...continuousProps}
					statistics={this.props.statistics}
					logAction={this.logAction}
				/>
			</Tab.Pane>
			{this.props.tables.map( ( e, i ) => {
				let content = null;
				switch ( e ) {
				case 'Frequency Table':
					content = <FrequencyTable
						{...categoricalProps}
						logAction={this.logAction}
					/>;
					break;
				case 'Contingency Table':
					content = <ContingencyTable
						{...categoricalProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				}
				return ( <Tab.Pane key={i} eventKey={`2.${i+1}`}>
					{content}
				</Tab.Pane> );
			})}
			{this.props.plots.map( ( e, i ) => {
				let content = null;
				switch ( e ) {
				case 'Bar Chart':
					content = <Barchart
						{...categoricalProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				case 'Pie Chart':
					content = <Piechart
						{...categoricalProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				case 'Histogram':
					content = <Histogram
						{...continuousProps}
						logAction={this.logAction}
						session={this.context.session}
						showDensityOption={this.props.histogramDensities}
					/>;
					break;
				case 'Box Plot':
					content = <Boxplot
						{...continuousProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				case 'Scatterplot':
					content = <Scatterplot
						{...continuousProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				case 'Heat Map':
					content = <Heatmap
						{...continuousProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				case 'Mosaic Plot':
					content = <MosaicPlot
						{...categoricalProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				case 'Contour Chart':
					content = <ContourChart
						{...continuousProps}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				}
				return ( <Tab.Pane key={i} eventKey={`3.${i+1}`}>
					{content}
				</Tab.Pane> );
			})}
			{this.props.tests.map( ( e, i ) => {
				let content = null;
				switch ( e ) {
				case 'One-Sample Mean Test':
					content = <MeanTest
						onCreated={this.addToOutputs}
						data={this.state.data}
						continuous={this.state.continuous}
						logAction={this.logAction}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				case 'Two-Sample Mean Test':
					content = <MeanTest2
						onCreated={this.addToOutputs}
						data={this.state.data}
						continuous={this.state.continuous}
						categorical={this.state.categorical}
						logAction={this.logAction}
						session={this.context.session}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				case 'One-Sample Proportion Test':
					content = <PropTest
						onCreated={this.addToOutputs}
						data={this.state.data}
						categorical={this.state.categorical}
						logAction={this.logAction}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				case 'Two-Sample Proportion Test':
					content = <PropTest2
						onCreated={this.addToOutputs}
						data={this.state.data}
						categorical={this.state.categorical}
						logAction={this.logAction}
						session={this.context.session}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				case 'One-Way ANOVA':
					content = <Anova
						onCreated={this.addToOutputs}
						data={this.state.data}
						continuous={this.state.continuous}
						categorical={this.state.categorical}
						logAction={this.logAction}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				case 'Correlation Test':
					content = <CorrTest
						onCreated={this.addToOutputs}
						data={this.state.data}
						continuous={this.state.continuous}
						logAction={this.logAction}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				case 'Chi-squared Independence Test':
					content = <Chi2Test
						onCreated={this.addToOutputs}
						data={this.state.data}
						categorical={this.state.categorical}
						logAction={this.logAction}
						showDecision={this.props.showTestDecisions}
					/>;
					break;
				}
				return ( <Tab.Pane key={i} eventKey={`4.${i+1}`}>
					{content}
				</Tab.Pane> );
			})}
			{this.props.models.map( ( e, i ) => {
				let content = null;
				switch ( e ) {
				case 'Simple Linear Regression':
					content = <SimpleLinearRegression
						categorical={this.state.categorical}
						continuous={this.state.continuous}
						onCreated={this.addToOutputs}
						data={this.state.data}
						logAction={this.logAction}
						session={this.context.session}
					/>;
					break;
				}
				return ( <Tab.Pane key={i} eventKey={`5.${i+1}`}>
					{content}
				</Tab.Pane> );
			})}
		</Tab.Content>;

		return (
			<Row className="no-gutter data-explorer">
				{ this.props.questions ? <Col xs={colWidth} md={colWidth}><Pages
					title="Questions"
					height={470}
					bsSize="small"
					className="data-explorer-questions"
				>{this.props.questions}</Pages></Col> : null }
				<Col xs={colWidth} md={colWidth}>
					<Panel>
						<Navbar className="data-explorer-navbar" onSelect={( eventKey => this.setState({ openedNav: eventKey }))}>
							<Nav>
								{ !this.props.hideDataTable ? <NavItem eventKey="1" className="explorer-data-nav" active={this.state.openedNav === '1'}>
									Data
								</NavItem> : null }
								<NavItem eventKey="2" active={this.state.openedNav === '2'}>
									Toolbox
								</NavItem>
								{ this.props.distributions.length > 0 ?
									<NavDropdown
										eventKey="3"
										title="Distributions"
										active={startsWith( this.state.openedNav, '3' )}
									>
										{this.props.distributions.map( ( e, i ) =>
											<MenuItem key={i} eventKey={`3.${i+1}`}>{e}</MenuItem> )}
									</NavDropdown> : null
								}
								{ this.props.showEditor ?
									<NavItem className="explorer-editor-nav" eventKey="4" active={this.state.openedNav === '4'}>
										{this.props.editorTitle}
									</NavItem> : null
								}
								{ this.props.transformer ?
									<NavItem eventKey="5" active={this.state.openedNav === '5'}>
										Transform
									</NavItem> : null
								}
								{ this.props.tabs.length > 0 ? this.props.tabs.map( ( e, i ) => {
									return ( <NavItem key={i} eventKey={`${6+i}`}>
										{e.title}
									</NavItem> );
								}) : null }
							</Nav>
						</Navbar>
						<Panel.Body>
							{ this.state.openedNav === '1' ?
								<Fragment>
									{ !this.props.data ? <Button bsSize="small" onClick={this.resetLocalStorage} style={{ position: 'absolute' }}>Clear Data</Button> : null }
									<DataTable data={this.state.data} dataInfo={this.props.dataInfo} />
								</Fragment> : null
							}
							{ this.state.openedNav === '2' ?
								<Tab.Container id="options-menu" defaultActiveKey={defaultActiveKey}>
									<Row className="clearfix">
										<Col sm={12}>
											{navbar}
										</Col>
										<Col sm={12}>
											{tabs}
										</Col>
									</Row>
								</Tab.Container> : null
							}
							{this.props.distributions.map( ( e, i ) => {
								let content = null;
								switch ( e ) {
								case 'Normal':
									content = <LearnNormalDistribution step="any" />;
									break;
								case 'Uniform':
									content = <LearnUniformDistribution step="any" />;
									break;
								case 'Exponential':
									content = <LearnExponentialDistribution step="any" />;
									break;
								}
								return ( this.state.openedNav === `3.${i+1}` ?
									content : null );
							})}
							<MarkdownEditor {...this.props.editorProps} plots={this.state.output} id={this.props.id ? this.props.id + '_editor' : null} style={{ display: this.state.openedNav !== '4' ? 'none' : null }} submitButton />
							{ this.state.openedNav === '5' ?
								<VariableTransformer
									data={this.state.data}
									logAction={this.logAction}
									session={this.context.session}
									defaultCode={generateTransformationCode( this.state.continuous[ 0 ])}
									onGenerate={this.onGenerateTransformedVariable}
								/> : null
							}
							{this.props.tabs.map( ( e, i ) => {
								return ( this.state.openedNav === `6.${i+1}` ?
									e.content : null );
							})}
						</Panel.Body>
					</Panel>
				</Col>
				<Col xs={colWidth} md={colWidth}>
					<div className="panel panel-default" style={{ minHeight: window.innerHeight*0.9, padding: 0 }}>
						<div className="panel-heading clearfix">
							<h3 className="data-explorer-output-header">Output</h3>
							<Gate owner>
								<Modal
									show={this.state.showStudentPlots}
									onHide={this.toggleStudentPlots}
									dialogClassName="fullscreen-modal"
								>
									<Modal.Header closeButton>
										<Modal.Title>Plots</Modal.Title>
									</Modal.Header>
									<Modal.Body style={{ height: 0.90 * window.innerHeight, overflowY: 'scroll' }}>
										{ this.state.studentPlots.length > 0 ?
											<GridLayout>
												{this.state.studentPlots.map( ( elem, idx ) => {
													const config = JSON.parse( elem.config );
													return (
														<div key={idx} style={{ height: '450px' }}>
															{
																isString( config ) ?
																	<RPlot
																		code={config}
																		libraries={[ 'MASS' ]}
																	/>:
																	<Plotly
																		data={config.data}
																		layout={config.layout}
																		removeButtons
																		fit
																	/>
															}
															<span>
																<b>Count: </b>{elem.count}
															</span>
														</div>
													);
												})}
											</GridLayout> :
											<Well>
												No plots have been created yet...
											</Well>
										}
									</Modal.Body>
									<Modal.Footer>
										<Button onClick={this.clearPlots}>Clear Plots</Button>
										<Button onClick={this.toggleStudentPlots}>Close</Button>
									</Modal.Footer>
								</Modal>
								<ButtonGroup bsSize="small" style={{ float: 'right' }} >
									<Button onClick={this.toggleStudentPlots} >Open Shared Plots</Button>
								</ButtonGroup>
								<RealtimeMetrics returnFullObject for={this.props.id} onDatum={this.onUserAction} />
							</Gate>
						</div>
						{OutputPanel( this.state.output, this.clearOutput )}
						<Button bsSize="small" block onClick={() => {
							this.setState({ output: []});
						}}>Clear All</Button>
					</div>
				</Col>
			</Row>
		);
	}
}


// DEFAULT PROPERTIES //

DataExplorer.defaultProps = {
	data: {},
	dataInfo: {
		'info': '',
		'name': '',
		'variables': null
	},
	hideDataTable: false,
	tabs: [],
	questions: null,
	transformer: false,
	statistics: [
		'Mean',
		'Median',
		'Min',
		'Max',
		'Range',
		'Interquartile Range',
		'Standard Deviation',
		'Variance',
		'Correlation'
	],
	plots: [
		'Bar Chart',
		'Pie Chart',
		'Histogram',
		'Box Plot',
		'Scatterplot',
		'Heat Map',
		'Mosaic Plot',
		'Contour Chart'
	],
	tables: [
		'Frequency Table',
		'Contingency Table'
	],
	tests: [
		'One-Sample Mean Test',
		'One-Sample Proportion Test',
		'Two-Sample Mean Test',
		'Two-Sample Proportion Test',
		'Correlation Test',
		'Chi-squared Independence Test',
		'One-Way ANOVA'
	],
	models: [
		'Simple Linear Regression'
	],
	categorical: [],
	continuous: [],
	distributions: [ 'Normal', 'Uniform', 'Exponential' ],
	editorProps: null,
	editorTitle: 'Report',
	histogramDensities: true,
	showEditor: false,
	showTestDecisions: true
};


// TYPES //

DataExplorer.propDescriptions = {
	categorical: 'An array of strings indicating the name of each categorical variable.',
	continuous: 'An array of strings indicating the name of each continuous variable.',
	data: 'A data object or array to be viewed. If it is an object, the keys correspond to column values while an array will expect an array of objects with a named field corresponding to each column.',
	dataInfo: 'An object containing the keys \'name\', whose value is a string, \'info\', whose value is an array of strings in which each element in the array is a new line and \'variables\', an object with keys as variable names and values as variable descriptions.',
	distributions: 'An array of strings indicating distributions that may be used in calculating probabilities. This functionality exists independently of the dataset provided. Currently limited to normal, uniform and exponential distributions',
	editorProps: 'An object to be passed to `MarkdownEditor` indicating properties to be used',
	editorTitle: 'A string indicating the title of the explorer to be displayed',
	hideDataTable: 'A boolean value indicating whether to hide the data table from view',
	histogramDensities: 'A boolean value indicating whether to display histogram densities',
	models: 'An array of strings indicating models that may be fit on the data',
	plots: 'An array of strings indicating which plots to show to the user',
	questions: 'A node indicating surrounding text and question components to be displayed in a tabbed window',
	showEditor: 'A boolean indicating whether to show the editor to the user',
	showTestDecisions: 'A boolean indicating whether to show the decisions made for each test based on the calculated p-values',
	statistics: 'An array of strings indicating which summary statistics may be calculated',
	tables: 'An array of strings indicating which tables may be created from the data',
	tabs: 'An array of objects and keys indicating any custom tabs to add',
	tests: 'An array of strings indicating which hypothesis tests to include',
	transformer: 'A boolean indicating whether one wants to display a variable transformer'
};

DataExplorer.propTypes = {
	categorical: PropTypes.array,
	continuous: PropTypes.array,
	data: PropTypes.object,
	dataInfo: PropTypes.object,
	distributions: PropTypes.array,
	editorProps: PropTypes.object,
	editorTitle: PropTypes.string,
	hideDataTable: PropTypes.bool,
	histogramDensities: PropTypes.bool,
	models: PropTypes.array,
	plots: PropTypes.array,
	questions: PropTypes.node,
	showEditor: PropTypes.bool,
	showTestDecisions: PropTypes.bool,
	statistics: PropTypes.array,
	tables: PropTypes.array,
	tabs: PropTypes.array,
	tests: PropTypes.array,
	transformer: PropTypes.bool
};

DataExplorer.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default DataExplorer;

