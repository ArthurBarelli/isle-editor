// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import FormControl from 'react-bootstrap/FormControl';
import Dropdown from 'react-bootstrap/Dropdown';
import Accordion from 'components/accordion';
import Plotly from 'components/plotly';
import TextArea from 'components/input/text-area';
import TextInput from 'components/input/text';
import mean from 'utils/statistic/mean.js';
import min from 'utils/statistic/min.js';
import max from 'utils/statistic/max.js';
import contains from '@stdlib/assert/contains';
import replace from '@stdlib/string/replace';
import isObject from '@stdlib/assert/is-object';
import hasOwnProp from '@stdlib/assert/has-own-property';
import round from '@stdlib/math/base/special/round';
import sqrt from '@stdlib/math/base/special/sqrt';
import exp from '@stdlib/math/base/special/exp';
import pow from '@stdlib/math/base/special/pow';
import ln from '@stdlib/math/base/special/ln';
import incrspace from '@stdlib/math/utils/incrspace';
import { DATA_EXPLORER_VARIABLE_TRANSFORMER } from 'constants/actions.js';
import { generateHistogramConfig } from './histogram.js';


// VARIABLES //

const FUNCTION_KEYS = [
	'exp',
	'ln',
	'pow',
	'round',
	'sqrt'
];
const FUNCTIONS = [
	exp,
	ln,
	pow,
	round,
	sqrt
];
const IF_ELSE = `if (  ) {
	return
} else {
	return
}`;
const DIGITS = incrspace( 0, 10, 1 );
const RE_LAST_EXPRESSION = /(?:^|\n)([^\n]*)$/;


// FUNCTIONS //

class CustomMenu extends Component {
	constructor( props, context ) {
		super( props, context );

		this.state = {
			value: ''
		};
	}

	handleChange = ( e ) => {
		this.setState({ value: e.target.value.toLowerCase().trim() });
	}

	render() {
		const {
			children,
			style,
			className,
			'aria-labelledby': labeledBy
		} = this.props;
		const { value } = this.state;
		return (
		<div style={style} className={className} aria-labelledby={labeledBy}>
			<FormControl
				autoFocus
				className="mx-3 my-2 w-auto"
				placeholder="Type to filter..."
				onChange={this.handleChange}
				value={value}
			/>
			<ul className="list-unstyled">
			{React.Children.toArray( children )
				.filter( ( child, idx ) => {
					return child.props.children.toLowerCase().startsWith( value );
				})
				.filter( ( child, idx ) => idx < 10 )
			}
			</ul>
		</div>
		);
	}
}


// MAIN //

class Transformer extends Component {
	constructor( props ) {
		super( props );

		let data = [];
		for ( let key in props.data ) {
			if ( hasOwnProp( props.data, key ) ) {
				for ( let i = 0; i < props.data[ key ].length; i++ ) {
					if ( !isObject( data[ i ]) ) {
						data[ i ] = {};
					}
					data[ i ][ key ] = props.data[ key ][ i ];
				}
			}
		}

		this.state = {
			code: props.defaultCode,
			selection: null,
			data: data,
			name: ''
		};
	}

	handleNameChange = ( value ) => {
		this.setState({
			name: value
		});
	}

	handleCodeChange = ( value ) => {
		this.setState({
			code: value
		});
	}

	handleGenerate = () => {
		let { data, code, name } = this.state;
		if ( name.length < 2 ) {
			return this.props.session.addNotification({
				title: 'Name is too short',
				message: 'Please select a variable name with at least two characters',
				level: 'error',
				position: 'tr'
			});
		}
		if ( !contains( code, 'return ' ) ) {
			code = replace( code, RE_LAST_EXPRESSION, '\nreturn $1' );
		}
		const fun = new Function( 'datum', ...FUNCTION_KEYS, code ); // eslint-disable-line no-new-func
		const values = new Array( data.length );
		try {
			for ( let i = 0; i < data.length; i++ ) {
				values[ i ] = fun( data[ i ], ...FUNCTIONS );
			}
		} catch ( err ) {
			return this.props.session.addNotification({
				title: 'Errored',
				message: 'Encountered the following error: '+err.message,
				level: 'error',
				position: 'tr'
			});
		}
		this.props.logAction( DATA_EXPLORER_VARIABLE_TRANSFORMER, {
			code, name
		});
		this.props.onGenerate( name, values );
	}

	insertVarFactory = ( name ) => {
		return () => {
			let newCode = this.state.code.substring( 0, this.state.selection );
			const replacement = 'datum.'+name;
			newCode += replacement;
			newCode += this.state.code.substring( this.state.selection );
			this.setState({
				code: newCode,
				selection: this.state.selection + replacement.length
			});
		};
	}

	insertLiteralFactory = ( operator ) => {
		return () => {
			let newCode = this.state.code.substring( 0, this.state.selection );
			const replacement = operator;
			newCode += replacement;
			newCode += this.state.code.substring( this.state.selection );
			this.setState({
				code: newCode,
				selection: this.state.selection + replacement.length
			});
		};
	}

	insertFuncFactory = ( funcName ) => {
		return () => {
			let newCode = this.state.code.substring( 0, this.state.selection );
			const replacement = ' '+funcName+'()';
			newCode += replacement;
			newCode += this.state.code.substring( this.state.selection );
			this.setState({
				code: newCode,
				selection: this.state.selection + replacement.length - 1
			});
		};
	}

	insertIfElse = () => {
		let newCode = this.state.code.substring( 0, this.state.selection );
			newCode += IF_ELSE;
			newCode += this.state.code.substring( this.state.selection );
			this.setState({
				code: newCode,
				selection: this.state.selection + 5
			});
	}

	renderContinuous = () => {
		return ( <div>
			<Card className="mb-2" >
				<Card.Header>Generate new variables:</Card.Header>
				<Card.Body>
					<TextInput legend="Variable Name" placeholder="Select name..." onChange={this.handleNameChange} width={160} />
				</Card.Body>
			</Card>
			<Card className="mb-2" >
				<Card.Body>
					<ButtonToolbar style={{ marginBottom: 5 }} >
						<Dropdown className="mr-2">
							<Dropdown.Toggle variant="light" as={Button} id="dropdown-custom-components">
								Continuous
							</Dropdown.Toggle>
							<Dropdown.Menu variant="light" as={CustomMenu} id="bg-nested-dropdown">
								{this.props.continuous.map( ( v, i ) => {
									return <Dropdown.Item key={i} onClick={this.insertVarFactory( v )} eventKey={i}>{v}</Dropdown.Item>;
								})}
							</Dropdown.Menu>
						</Dropdown>
						<Dropdown className="mr-2">
							<Dropdown.Toggle variant="light" as={Button} id="dropdown-custom-components">
								Categorical
							</Dropdown.Toggle>
							<Dropdown.Menu variant="light" as={CustomMenu} id="bg-nested-dropdown">
								{this.props.categorical.map( ( v, i ) => {
									return <Dropdown.Item key={i} onClick={this.insertVarFactory( v )} eventKey={i}>{v}</Dropdown.Item>;
								})}
							</Dropdown.Menu>
						</Dropdown>
						<ButtonGroup size="sm" className="mr-2" >
							<Button variant="light" onClick={this.insertLiteralFactory(' < ')} >{'<'}</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' > ')} >{'>'}</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' <= ')} >{'<='}</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' >= ')} >{'>='}</Button>
						</ButtonGroup>
						<ButtonGroup size="sm" className="mr-2" >
							<Button variant="light" onClick={this.insertLiteralFactory(' ( ')} >(</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' ) ')} >)</Button>
						</ButtonGroup>
						<ButtonGroup size="sm" className="mr-2" >
							<Button variant="light" onClick={this.insertLiteralFactory(' + ')} >+</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' - ')} >-</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' * ')} >*</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' / ')} >/</Button>
						</ButtonGroup>
					</ButtonToolbar>
					<ButtonToolbar style={{ marginBottom: 5 }} >
						<ButtonGroup size="sm" className="mr-2" >
							<Button variant="light" onClick={this.insertIfElse} >ifelse</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' && ')} >and</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' || ')} >or</Button>
							<Button variant="light" onClick={this.insertLiteralFactory(' !')} >not</Button>
						</ButtonGroup>
						<ButtonGroup size="sm" className="mr-2" >
							{DIGITS.map( ( d, i ) => {
								return <Button key={i} variant="light" onClick={this.insertLiteralFactory( `${d}`)} >{d}</Button>;
							})}
							<Button variant="light" onClick={this.insertLiteralFactory('.')} >.</Button>
						</ButtonGroup>
						<Dropdown className="mr-2">
							<Dropdown.Toggle variant="light" as={Button} id="dropdown-custom-components">
								Functions
							</Dropdown.Toggle>
							<Dropdown.Menu variant="light" as={CustomMenu} id="bg-nested-dropdown">
								{FUNCTION_KEYS.map( ( v, i ) => {
									return <Dropdown.Item key={i} onClick={this.insertFuncFactory( v )} eventKey={i}>{v}</Dropdown.Item>;
								})}
							</Dropdown.Menu>
						</Dropdown>
					</ButtonToolbar>
				</Card.Body>
			</Card>
			<Card className="mb-2" >
				<Card.Body>
					<TextArea ref={div => { this.textarea = div; }} legend="Expression:" value={this.state.code} onChange={this.handleCodeChange} onBlur={( event ) => {
						const selectionStart = event.target.selectionStart;
						this.setState({
							selection: selectionStart
						});
					}} />
				</Card.Body>
			</Card>
			<Button onClick={this.handleGenerate} >Generate</Button>
		</div> );
	}

	renderCategoricalTransform = () => {
		const histConfigSettings = {
			'data': this.props.data,
			'variable': this.props.continuous[ 0 ],
			'group': null,
			'overlayDensity': true,
			'densityType': 'Data-driven',
			'chooseBins': false,
			'nBins': null
		};
		const vals = this.props.data[ this.props.continuous[ 0 ] ];
		const avg = mean( vals );
		const configHist = generateHistogramConfig( histConfigSettings );
		configHist.layout.shapes = [
			{
				type: 'line',
				x0: avg,
				y0: -100,
				x1: avg,
				y1: 100,
				line: {
					color: 'red',
					width: 3
				}
			}
		];
		configHist.layout.yaxis = {
			range: [
				min( configHist.data[ 1 ].y ),
				max( configHist.data[ 1 ].y )
			]
		};
		return (
			<div>
				<h5>Categorical Transformation</h5>
				<Plotly
					data={configHist.data}
					layout={configHist.layout}
					editable
					fit
					removeButtons
					legendButtons={false}
					onRelayout={( data ) => {
						console.log( data );
					}}
				/>
			</div>
		);
	}

	render() {
		return (
			<Accordion
				headers={['Continuous Transformation', 'Categorical Transformation']}
				headerStyle={{
					'fontSize': 20
				}}
				active={null}
			>
				{this.renderContinuous()}
				{this.renderCategoricalTransform()}
			</Accordion>
		);
	}
}


// PROPERTIES //

Transformer.defaultProps = {
	logAction() {},
	onGenerate() {},
	defaultCode: '',
	session: {}
};

Transformer.propTypes = {
	categorical: PropTypes.array.isRequired,
	continuous: PropTypes.array.isRequired,
	data: PropTypes.object.isRequired,
	defaultCode: PropTypes.string,
	logAction: PropTypes.func,
	onGenerate: PropTypes.func,
	session: PropTypes.object
};


// EXPORTS //

export default Transformer;
