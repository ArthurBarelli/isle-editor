// MODULES //

import React, { Component } from 'react';
import { exec } from 'child_process';
import { ISLE_DOCS_LINK } from 'constants/links';
import HeaderUpperBar from 'editor-components/header-upper-bar';


// FUNCTIONS //

const openBrowser = ( url ) => {
	exec( 'xdg-open ' + url );
};


// MAIN //

class Documentation extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			width: window.innerWidth,
			height: window.innerHeight
		};
	}

	componentDidMount() {
		this.resize();
		this.webview.addEventListener( 'new-window', ( e ) => {
			try {
				openBrowser( e.url );
			} catch ( error ) {
				alert( `Ignoring ${e.url} due to ${error.message}` ); // eslint-disable-line no-alert
			}
		});
		window.addEventListener( 'resize', this.resize );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.resize );
	}

	resize = () => {
		this.setState({
			width: window.innerWidth,
			height: window.innerHeight
		});
	}

	render() {
		return (
			<div>
				<HeaderUpperBar backToEditor title="Documentation" />
				<webview
					id="DocumentationView"
					src={ISLE_DOCS_LINK}
					style={{
						display: 'flex',
						height: this.state.height,
						window: this.state.width
					}}
					ref={( div ) => { this.webview = div; }}
					autosize="on"
					disablewebsecurity
				/>
			</div>
		);
	}
}


// EXPORTS //

export default Documentation;