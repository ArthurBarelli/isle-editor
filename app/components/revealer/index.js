// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Gate from 'components/gate';
import generateUID from 'utils/uid';
import SessionContext from 'session/context.js';
import { REVEAL_CONTENT, HIDE_CONTENT } from 'constants/actions.js';


// VARIABLES //

const uid = generateUID( 'revealer' );


// MAIN //

/**
* An ISLE component that instructors may use to selectively reveal or hide children content to all users.
*
* @property {string} message - message to be displayed when content is hidden
* @property {boolean} show - controls whether to initially display child elements
*/
class Revealer extends Component {
	constructor( props ) {
		super( props );

		this.id = props.id || uid();

		this.state = {
			showChildren: props.show
		};
	}

	componentDidMount() {
		const session = this.context;
		if ( session ) {
			this.unsubscribe = session.subscribe( ( type, action ) => {
				if ( type === 'member_action' ) {
					if ( action.id === this.id ) {
						if ( action.type === 'REVEAL_CONTENT' ) {
							this.setState({
								showChildren: true
							});
						} else if ( action.type === 'HIDE_CONTENT' ) {
							this.setState({
								showChildren: false
							});
						}
					}
				} else if ( type === 'user_joined' ) {
					// When new users join, make sure they can see the component when it was already revealed:
					if ( this.state.showChildren ) {
						const session = this.context;
						session.log({
							id: this.id,
							type: REVEAL_CONTENT,
							value: this.state.showChildren,
							noSave: true
						}, 'members' );
					}
				}
			});
		}
	}

	componentWillUnmount() {
		if ( this.unsubscribe ) {
			this.unsubscribe();
		}
	}

	toggleContent = () => {
		this.setState({
			showChildren: !this.state.showChildren
		}, () => {
			// Send message to other users:
			const session = this.context;
			if ( this.state.showChildren ) {
				session.log({
					id: this.id,
					type: REVEAL_CONTENT,
					value: this.state.showChildren
				}, 'members' );
			} else {
				session.log({
					id: this.id,
					type: HIDE_CONTENT,
					value: this.state.showChildren
				}, 'members' );
			}
		});
	}

	render() {
		const header = <h3 className="center" >{this.props.message}</h3>;
		return (<div>
			<Gate owner >
				<Button
					className="centered"
					onClick={this.toggleContent}
					style={{
						marginBottom: '10px'
					}}
				>
					Click to {this.state.showChildren ? 'hide' : 'reveal'} <i>{this.id}</i> {this.state.showChildren ? 'from' : 'to'}  users
				</Button>
			</Gate>
				{this.state.showChildren ? this.props.children : header}
		</div> );
	}
}


// PROPERTIES //

Revealer.defaultProps = {
	message: 'Content hidden by instructor',
	show: false
};

Revealer.propTypes = {
	message: PropTypes.string,
	show: PropTypes.bool
};

Revealer.contextType = SessionContext;


// EXPORTS //

export default Revealer;
