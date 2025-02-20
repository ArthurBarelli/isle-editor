// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import logger from 'debug';
import isEmptyArray from '@stdlib/assert/is-empty-array';


// VARIABLES //

const debug = logger( 'isle:lesson:contextmenu' );


// MAIN //

class LessonContextMenu extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			lastRange: null,
			lastText: '',
			contextMenuIsOpen: false
		};
	}

	componentDidMount() {
		this.selectionListener = document.addEventListener( 'selectionchange', this.handleSelectionChange );
	}

	componentWillUnmount() {
		if ( this.selectionListener ) {
			document.removeEventListener( 'selectionchange', this.handleSelectionChange );
		}
	}

	handleSelectionChange = ( event ) => {
		if ( this.state.contextMenuIsOpen ) {
			return;
		}
		const selection = window.getSelection();
		if ( !selection.isCollapsed || selection.type === 'Range' ) {
			this.lastSelection = selection;
			if ( selection.getRangeAt && selection.rangeCount ) {
				const range = selection.getRangeAt( 0 );
				const text = selection.toString();
				this.setState({
					lastRange: range,
					lastText: text
				});
			}
		} else {
			setTimeout( () => {
				this.forceUpdate();
			}, 150 );
		}
	}

	highlightText = ( event ) => {
		debug( 'Highlight the selected text...' );
		document.designMode = 'on';
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange( this.state.lastRange );
		document.execCommand( 'styleWithCSS', false, true );
		document.execCommand( 'backColor', false, 'yellow' );
		document.designMode = 'off';
	}

	removeHighlight = ( event ) => {
		debug( 'Highlight the selected text...' );
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange( this.state.lastRange );
		document.designMode = 'on';
		document.execCommand( 'styleWithCSS', false, true );
		document.execCommand( 'backColor', false, 'inherit' );
		document.designMode = 'off';
	}

	copyToClipboard = ( event ) => {
		debug( 'Copying selection to clipboard... ' );
		navigator.clipboard.writeText( this.state.lastText );
	}

	textToSpeech = () => {
		const str = this.state.lastText;
		debug( 'Read aloud: '+str );
		const session = this.props.session;
		if ( isEmptyArray( window.speechSynthesis.getVoices() ) ) {
			return session.addNotification({
				title: 'Not supported.',
				message: 'The text-to-speech functionality is currently not supported on your browser. Please try Google Chrome.',
				level: 'error',
				position: 'tr'
			});
		}
		const ssu = new SpeechSynthesisUtterance( str );
		ssu.lang = session.config.language || 'en-US';
		window.speechSynthesis.speak( ssu );
	}

	render() {
		const menuItems = [];
		const sel = window.getSelection();
		if ( !sel.isCollapsed || sel.type === 'Range' ) {
			menuItems.push( <MenuItem key={0} onClick={this.copyToClipboard}>
				Copy
			</MenuItem> );
			menuItems.push( <MenuItem key={1} onClick={this.textToSpeech}>
				Read aloud
			</MenuItem> );
			menuItems.push( <MenuItem key={2} onClick={this.highlightText}>
				Highlight
			</MenuItem> );
			menuItems.push( <MenuItem key={3} onClick={this.removeHighlight}>
				Remove Highlight
			</MenuItem> );
		}
		menuItems.push(
			<MenuItem key={4} onClick={( event ) => {
				this.props.addNote({ left: event.pageX, top: event.pageY });
			}}>
				Add Note
			</MenuItem>
		);
		return ( <ContextMenu
			id="lessonWindow"
			onShow={() => {
				debug( 'Context menu has been opened...' );
				this.setState({ contextMenuIsOpen: true });
			}}
			onHide={() => {
				debug( 'Context menu has been closed...' );
				this.setState({ contextMenuIsOpen: false });
			}}
		>
			{menuItems}
		</ContextMenu> );
	}
}


// PROPERTIES //

LessonContextMenu.propTypes = {
	addNote: PropTypes.func.isRequired,
	session: PropTypes.object.isRequired
};


// EXPORTS //

export default LessonContextMenu;
