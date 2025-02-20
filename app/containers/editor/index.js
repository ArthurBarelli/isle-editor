// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { CLIEngine } from 'eslint';
import SplitPane from 'react-split-pane';
import logger from 'debug';
import replace from '@stdlib/string/replace';
import isObject from '@stdlib/assert/is-object';
import SplitPanel from 'editor-components/split-panel';
import Loadable from 'components/loadable';
import { convertMarkdown, changeMode, changeView, toggleScrolling, toggleToolbar, updatePreamble, encounteredError, saveLintErrors, saveSpellingErrors } from 'actions';
import SpellChecker from 'utils/spell-checker';
const Header = Loadable( () => import( 'editor-components/header' ) );
const ErrorBoundary = Loadable( () => import( 'editor-components/error-boundary' ) );
const Preview = Loadable( () => import( 'editor-components/preview' ) );
const Editor = Loadable( () => import( 'editor-components/editor' ) );
const ErrorMessage = Loadable( () => import( 'editor-components/error-message' ) );
const DevTools = Loadable( () => import( '../dev_tools.js' ) );


// VARIABLES //

let yaml;
const debug = logger( 'isle-editor' );


// FUNCTIONS //

const updateSplitPos = ( size ) => {
	localStorage.setItem( 'splitPos', size );
};


// MAIN //

class App extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			splitPos: parseFloat( localStorage.getItem( 'splitPos' ) ) || 0.5,
			innerWidth: window.innerWidth
		};
	}

	async componentDidMount() {
		window.addEventListener( 'resize', this.updateDimensions );

		let eslintOpts = await import( './eslint_opts.js' );
		eslintOpts = eslintOpts.default;
		this.cliEngine = new CLIEngine( eslintOpts, this.props.fileName );

		const jsYAML = await import( 'js-yaml' );
		yaml = jsYAML.default;
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.updateDimensions );
	}

	updateDimensions = () => {
		this.setState({
			innerWidth: window.innerWidth
		});
	}

	onChange = ( value ) => {
		debug( 'Editor text changed...' );
		const handleChange = ( value ) => {
			debug( 'Should handle change...' );
			this.props.convertMarkdown( value );
			this.spellcheckCode( value );
			this.handlePreambleChange( value );
		};

		if ( this.debouncedChange ) {
			this.debouncedChange( value );
		} else {
			this.debouncedChange = debounce( handleChange, this.props.renderInterval );
			this.debouncedChange( value );
		}
	}

	handleSplitChange = ( size ) => {
		size /= this.state.innerWidth;
		if ( this.debouncedSplitUpdate ) {
			this.debouncedSplitUpdate( size );
		} else {
			this.debouncedSplitUpdate = debounce( updateSplitPos, 1000 );
			this.debouncedSplitUpdate( size );
		}
		this.setState({
			splitPos: size
		});
	}

	handlePreambleChange = ( text ) => {
		let preamble = text.match( /^(?:\s*)---([\S\s]*?)---/ );
		if ( preamble ) {
			// Extract the capture group:
			preamble = preamble[ 1 ];
			preamble = replace( preamble, '\t', '    ' ); // Replace tabs with spaces as YAML may not contain the former...
			let preambleHasChanged = preamble !== this.props.preambleText;
			debug( 'Check whether preamble has changed: '+preambleHasChanged );
			if ( preambleHasChanged && yaml ) {
				debug( 'Preamble has changed...' );
				try {
					const newPreamble = yaml.load( preamble );
					if ( !isObject( newPreamble ) ) {
						return this.props.encounteredError( new Error( 'Make sure the preamble is valid YAML code.' ) );
					}
					this.props.updatePreamble({
						preamble: newPreamble,
						preambleText: preamble
					});
				}
				catch ( err ) {
					this.props.encounteredError( err );
				}
			}
		}
	}

	spellcheckCode = ( code ) => {
		const language = this.props.preamble.language || 'en-US';
		const errs = SpellChecker( code, {
			language
		});
		if ( errs ) {
			this.props.saveSpellingErrors( errs );
		}
	}

	lintCode = ( code ) => {
		if ( this.cliEngine ) {
			const { results } = this.cliEngine.executeOnText( code, this.props.fileName );
			const errs = results[ 0 ].messages;
			if ( errs.length !== this.props.lintErrors.length ) {
				this.props.saveLintErrors( errs );
			}
		}
	}

	render() {
		let {
			error,
			fileName,
			filePath,
			markdown,
			hideToolbar,
			changeView,
			changeMode,
			currentRole,
			currentMode
		} = this.props;
		return (
			<div>
				{ !hideToolbar ?
					<Header
						fileName={fileName}
						onSelectRole={changeView}
						role={currentRole}
						onSelectMode={changeMode}
						mode={currentMode}
					/> :
					null
				}
				<SplitPane
					className="splitpane"
					split="vertical"
					primary="second"
					size={this.state.splitPos * this.state.innerWidth}
					onChange={this.handleSplitChange}
					maxSize={-300}
					minSize={300}
				>
					<SplitPanel style={{ overflow: 'none' }} >
						<Editor
							ref={( elem ) => { this.editor = elem; }}
							value={markdown}
							onChange={this.onChange}
							filePath={filePath}
							name="monaco_editor"
							fontSize={this.props.fontSize}
							preamble={this.props.preamble}
							splitPos={this.state.splitPos}
							lintErrors={this.props.lintErrors}
							spellingErrors={this.props.spellingErrors}
							hideToolbar={hideToolbar}
						/>
					</SplitPanel>
					<SplitPanel
						ref={( elem ) => { this.preview = elem; }}
						style={{
							transform: 'translateZ(0)' // applied so that the panel acts as viewport for the fixed position statusbar (https://www.w3.org/TR/css-transforms-1/#containing-block-for-all-descendants)
						}}
					>
						{ error ?
							<ErrorMessage msg={error.message} code={markdown} /> :
							<ErrorBoundary code={markdown} preamble={this.props.preamble} >
								<Preview
									code={markdown}
									filePath={filePath}
									preamble={this.props.preamble}
									currentRole={currentRole}
									currentMode={currentMode}
									onCode={this.lintCode}
									encounteredError={this.props.encounteredError}
									preambleText={this.props.preambleText}
									updatePreamble={this.props.updatePreamble}
									hideToolbar={hideToolbar}
								/>
							</ErrorBoundary>
						}
					</SplitPanel>
				</SplitPane>
				{
					( () => {
						// eslint-disable-next-line no-process-env
						if ( process.env.NODE_ENV !== 'production' ) {
							return <DevTools />;
						}
					})()
				}
			</div>
		);
	}
}


// PROPERTIES //

App.defaultProps = {
	error: null,
	fileName: null,
	filePath: null
};

App.propTypes = {
	changeMode: PropTypes.func.isRequired,
	changeView: PropTypes.func.isRequired,
	convertMarkdown: PropTypes.func.isRequired,
	currentMode: PropTypes.string.isRequired,
	currentRole: PropTypes.string.isRequired,
	encounteredError: PropTypes.func.isRequired,
	error: PropTypes.object,
	fileName: PropTypes.string,
	filePath: PropTypes.string,
	hideToolbar: PropTypes.bool.isRequired,
	lintErrors: PropTypes.array.isRequired,
	markdown: PropTypes.string.isRequired,
	preamble: PropTypes.object.isRequired,
	preambleText: PropTypes.string.isRequired,
	spellingErrors: PropTypes.array.isRequired,
	renderInterval: PropTypes.number.isRequired,
	saveLintErrors: PropTypes.func.isRequired,
	saveSpellingErrors: PropTypes.func.isRequired,
	updatePreamble: PropTypes.func.isRequired
};


// EXPORTS //

export default connect( mapStateToProps, {
	convertMarkdown,
	saveLintErrors,
	saveSpellingErrors,
	encounteredError,
	changeView,
	changeMode,
	toggleScrolling,
	toggleToolbar,
	updatePreamble
})( App );

function mapStateToProps({ markdown, linting, preview }) {
	return {
		...markdown,
		...linting,
		...preview
	};
}
