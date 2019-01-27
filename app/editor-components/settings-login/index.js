// MODULES //

import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import Card from 'react-bootstrap/Card';


// MAIN //

class SettingsLogin extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			server: localStorage.getItem( 'server' ) || '',
			email: localStorage.getItem( 'email' ) || '',
			password: localStorage.getItem( 'password' ) || '',
			encounteredError: null
		};

		this.handleInputChange = ( event ) => {
			const target = event.target;
			const value = target.value;
			const name = target.name;
			this.setState({
				[ name ]: value
			}, () => {
				localStorage.setItem( name, value );
			});
		};

		this.unlink = () => {
			localStorage.removeItem( 'token' );
			this.forceUpdate();
		};

		this.connectToServer = () => {
			let form = {
				password: this.state.password,
				email: this.state.email
			};
			fetch( this.state.server+'/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( form )
			})
			.then( res => res.json() )
			.then( body => {
				try {
					if ( body.type === 'incorrect_password' ) {
						return this.setState({
							encounteredError: new Error( body.message )
						});
					}
					localStorage.setItem( 'token', body.token );
					this.forceUpdate();
				} catch ( error ) {
					this.setState({
						encounteredError: 'Couldn\'t login to server. Please check the address and port.'
					});
				}
			})
			.catch( err => {
				this.setState({
					encounteredError: err
				});
			});
		};
	}

	render() {
		return (
			<Card>
				<Card.Header as="h5">
						Connect to ISLE server
				</Card.Header>
				<Card.Body>
					{ localStorage.getItem( 'token' ) === null ?
						<Form>
							<FormGroup>
								<label>Server Address</label>
								<FormControl
									name="server"
									type="text"
									placeholder="Enter text"
									onChange={this.handleInputChange}
									value={this.state.server}
								/>
							</FormGroup>
							<FormGroup>
								<label>Email</label>
								<FormControl
									name="email"
									type="text"
									placeholder="Enter email address"
									onChange={this.handleInputChange}
									value={this.state.email}
								/>
							</FormGroup>
							<FormGroup>
								<label>Password</label>
								<FormControl
									name="password"
									type="password"
									placeholder="Enter password"
									onChange={this.handleInputChange}
									value={this.state.password}
								/>
							</FormGroup>
							<Button
								variant="primary"
								size="sm"
								block
								onClick={this.connectToServer}
							>Connect</Button>
							{ this.state.encounteredError ?
								<Card style={{ marginTop: 20 }} border="danger">
									<Card.Header as="h3">
										Error encountered
									</Card.Header>
									<Card.Body>
									The following error was encountered while connecting to {this.state.server}: <br />{this.state.encounteredError.message}.
									</Card.Body>
								</Card> : null
							}
						</Form> :
						<Card border="success">
							<Card.Body>
								<p>You are linked to the ISLE server at {this.state.server}.</p>
								<Button
									variant="danger"
									size="sm"
									onClick={this.unlink}
									style={{ float: 'right' }}
								>Unlink</Button>
							</Card.Body>
						</Card>
					}
				</Card.Body>
			</Card>
		);
	}
}


// EXPORTS //

export default SettingsLogin;