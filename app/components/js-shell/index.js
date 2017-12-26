// MODULES //

import React, { Component } from 'react';
import ReactDom from 'react-dom';
import PropTypes from 'prop-types';
import $ from 'jquery';
import ChatButton from 'components/chat-button';
import { Button, ButtonToolbar, OverlayTrigger, Tooltip } from 'react-bootstrap';
import hasOwnProp from '@stdlib/assert/has-own-property';
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/katzenmilch';
import 'brace/theme/monokai';
import 'brace/theme/solarized_light';
import HintButton from 'components/hint-button';
import './js-shell.css';
import CONSOLE_STYLES from './console_styles.json';


// FUNCTIONS //

const showSolutionButton = ( exhaustedHints, clickHandler, displayed, nEvaluations ) => {
	const tooltip = (
		<Tooltip
			id="tooltip"
		>
			Solution becomes available once you have tried the exercise and used all hints.
		</Tooltip>
	);
	if ( !exhaustedHints || nEvaluations < 1 ) {
		return (
			<OverlayTrigger
				placement="top"
				positionLeft={100}
				overlay={tooltip}
				rootClose={true}
			>
				<span style={{ display: 'inline-block', marginLeft: '4px' }}>
					<Button
						bsStyle="warning"
						bsSize="sm"
						disabled
						style={{
							pointerEvents: 'none'
						}}
					>{ !displayed ? 'Show Solution' : 'Hide Solution' }</Button>
				</span>
			</OverlayTrigger>
		);
	}
	return (
		<Button
			bsStyle="warning"
			bsSize="sm"
			onClick={clickHandler}
		>{ !displayed ? 'Show Solution' : 'Hide Solution' }</Button>
	);
};


// MAIN //

class JSShell extends Component {
	constructor( props, context ) {
		super( props );

		this.state = {
			disabled: props.disabled,
			log: [],
			exhaustedHints: props.hints.length === 0,
			solutionOpen: false
		};

		this.isActive = false;
		this.jslog = [];

		if ( this.props.vars ) {
			for ( var key in this.props.vars ) {
				if ( hasOwnProp( this.props.vars, key ) ) {
					global[ key ] = this.props.vars[ key ];
				}
			}
		}
	}

	componentDidMount() {
		this.editor = ace.edit( this.props.id );
		this.editor.getSession().setMode( 'ace/mode/javascript' );
		this.editor.setTheme( 'ace/theme/monokai' );
		// this.aceSession.getDocument().setNewLineMode( 'auto' );
		this.editor.setValue( this.props.code, -1 );
		this.innerConsole();
	}

	componentDidUpdate() {
		this.scrollToBottom();
	}

	getLogs = () => {
		this.setState({
			log: this.jslog
		});
	}

	resetConsole = () => {
		this.jslog = [];
		this.setState({
			log: []
		});
	}

	handleSolutionClick = () => {
		const val = this.editor.getValue();
		const solutionUnescaped = this.props.solution.replace( /\\n/g, '\n' );
		if ( this.state.solutionOpen === false ) {
			this.editor.setTheme( 'ace/theme/solarized_light' );
			this.editor.setOptions({
				highlightActiveLine: false,
				highlightGutterLine: false,
				readOnly: true
			});
		} else {
			this.editor.setTheme( 'ace/theme/monokai' );
			this.editor.setOptions({
				highlightActiveLine: true,
				highlightGutterLine: true,
				readOnly: false
			});
		}

		if ( val !== solutionUnescaped ) {
			if ( this.props.id ) {
				const { session } = this.context;
				session.log({
					id: this.props.id,
					type: 'JSSHELL_DISPLAY_SOLUTION',
					value: val
				});
			}
			this.setState({
				lastSolution: val,
				solutionOpen: !this.state.solutionOpen
			});
			this.editor.setValue( solutionUnescaped, 1 );
		} else {
			this.setState({
				solutionOpen: !this.state.solutionOpen
			});
			this.editor.setValue( this.state.lastSolution || solutionUnescaped, 1 );
		}
	}

	handleEvaluationClick = () => {
		this.isActive = true;
		let currentCode = this.editor.getValue();
		if ( this.props.id ) {
			const { session } = this.context;
			session.log({
				id: this.props.id,
				type: 'JSSHELL_EVALUATION',
				value: currentCode
			});
		}
		try {
			if ( this.props.check ) {
				currentCode += ';' + this.props.check;
				eval( currentCode );  // eslint-disable-line no-eval
			} else {
				eval( currentCode ); // eslint-disable-line no-eval
			}
		}
		catch ( err ) {
			var x = {
				type: 'error',
				msg: err.message
			};

			this.jslog.push( x );
		}
		this.isActive = false;
		this.getLogs();
	}

	stringifyObject( arg ) {
		if ( typeof arg === 'object' ) {
			return ( JSON.stringify( arg, null, 2 ) );
		}
		return arg;
	}


	innerConsole() {
		var self = this;
		var lg = [ 'log', 'debug', 'info', 'warn', 'error' ];
		for ( let i = 0; i < lg.length; i++ ) {
			let verb = lg[ i ];
			console[ verb ] = ( ( method, verb ) => {
				return function logger() {
					method.apply( console, arguments );

					if ( self.isActive ) {
						var msg = '';
						if ( verb === 'log' ) {
							for ( var i = 0; i < arguments.length; i++) {
								if ( i > 0) msg += ' ';
								msg += self.stringifyObject( arguments[i] );
							}
						}
						if (msg === '') msg = Array.prototype.slice.call( arguments ).join( ' ' );

						var x = {
							type: verb,
							msg: msg
						};

						self.jslog.push( x );
					}
				};
			})( console[ verb ], verb );
		}
	}

	// Now the ordinary functions:
	getLog( e, i ) {
		const type = e.type || 'default';
		const style = CONSOLE_STYLES[ type ];
		return (
			<p key={i} style={style} >
				{ e.msg }
			</p>
		);
	}

	logHint( idx ) {
		const { session } = this.context;
		if ( this.props.id ) {
			session.log({
				id: this.props.id,
				type: 'JSSHELL_OPEN_HINT',
				value: idx
			});
		}
	}

	showHints() {
		return (
			<HintButton
				hints={this.props.hints}
				disabled={this.state.disabled}
				onClick={this.logHint}
				onFinished={() => {
					this.setState({ exhaustedHints: true });
				}}
			/>
		);
	}

	/**
	* Scrolls to the bottom of the console output.
	*/
	scrollToBottom() {
		const $outputPanel = $( this.consoleOutput );
		$outputPanel.animate({
			scrollTop: $outputPanel.prop( 'scrollHeight' )
		}, 1000 );
	}

	renderLogs() {
		let list = this.state.log;
		let res = [];
		for ( var i = 0; i < list.length; i++ ) {
			let e = list[ i ];
			res.push(
				this.getLog( e, i )
			);
		}
		return res;
	}

	renderResetButton() {
		return (
			<div className="reset" onClick={this.resetConsole} >☒</div>
		);
	}

	render() {
		const nHints = this.props.hints.length;
		const toolbar = <ButtonToolbar style={{ float: 'right', marginTop: '8px' }}>
			{ nHints > 0 ? this.showHints() : null }
			{ ( this.props.solution && !this.state.disabled ) ?
				showSolutionButton(
					this.state.exhaustedHints,
					this.handleSolutionClick,
					this.state.solutionOpen,
					this.state.nEvaluations
				) :
				null
			}
			{
				( this.props.chat && this.props.id ) ?
					<span style={{display: 'inline-block', marginLeft: '4px' }}>
						<ChatButton for={this.props.id} />
					</span> :
					null
			}
		</ButtonToolbar>;

		const editor = <div className="jsedit" id={this.props.id}></div>;
		return (
			<div>
				<div className="JSShell">
					{editor}
					<div className="toolbar">
						{ !this.state.disabled ?
							<Button
								bsStyle="primary"
								bsSize="sm"
								style={{
									marginTop: '8px',
									marginBottom: '8px'
								}}
								onClick={this.handleEvaluationClick}
							>Test Code</Button> :
							<span />
						}
						{ toolbar }
						<br />
					</div>
					{ this.renderResetButton() }
					<div
						id={this.props.id}
						ref={( div ) => { this.consoleOutput = div; }}
						className="console"
					>
						{this.renderLogs()}
					</div>
				</div>
			</div>
		);
	}
}


// DEFAULT PROPERTIES //

JSShell.defaultProps = {
	onResult() {},
	onEvaluate(){},
	id: 'editor',
	chat: false,
	check: null,
	code: '',
	lines: 5,
	solution: '',
	libraries: [],
	hints: [],
	fontSize: 16,
	fontFamily: 'monospace',
	disabled: false,
	vars: null
};


// PROPERTY TYPES //

/* eslint-disable react/no-unused-prop-types */

JSShell.propTypes = {
	chat: PropTypes.bool,
	check: PropTypes.string,
	code: PropTypes.string,
	disabled: PropTypes.bool,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	hints: PropTypes.array,
	id: PropTypes.string,
	libraries: PropTypes.array,
	lines: PropTypes.number,
	onEvaluate: PropTypes.func,
	onResult: PropTypes.func,
	solution: PropTypes.string,
	vars: PropTypes.object
};

/* eslint-enable */


// CONTEXT TYPES //

JSShell.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default JSShell;
