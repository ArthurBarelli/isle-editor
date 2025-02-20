// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'debug';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import ListGroupItem from 'react-bootstrap/ListGroupItem';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Tooltip from 'components/tooltip';
import copy from '@stdlib/utils/copy';
import keys from '@stdlib/utils/keys';
import contains from '@stdlib/assert/contains';
import round from '@stdlib/math/base/special/round';
import incrmean from '@stdlib/stats/incr/mean';
import formatTime from 'utils/format-time';


// VARIABLES //

const debug = logger( 'isle:statusbar:instructor-view' );


// FUNCTIONS //

function isHidden( el ) {
	return el.offsetParent === null;
}

function removeGlowElems() {
	// Remove glow effect from previously highlighted elements:
	const focused = document.getElementsByClassName( 'focus-glow' );
	while ( focused.length ) {
		focused[0].classList.remove( 'focus-glow' );
	}
	const element = document.getElementById( 'duplicated-container' );
	if ( element ) {
		element.parentNode.removeChild( element );
	}
}


// MAIN //

class ResponseVisualizers extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			selected: null,
			means: {}
		};
	}

	componentDidMount() {
		const session = this.props.session;
		const visualizers = session.responseVisualizers;
		const ids = keys( visualizers );

		const means = {};
		for ( let i = 0; i < ids.length; i++ ) {
			const viz = visualizers[ ids[ i ] ];
			const acc = incrmean();
			viz.ref.state.actions.forEach( x => {
				acc( x.time );
			});
			means[ ids[ i ] ] = acc;
		}
		this.setState({
			means
		});

		this.unsubscribe = session.subscribe( ( type, value ) => {
			if ( type === 'member_action' && contains( ids, value.id ) ) {
				const newMeans = copy( this.state.means );
				newMeans[ value.id ]( value.time );
				this.setState({
					means: newMeans
				});
			}
			else if (
				type === 'updated_visualizer' ||
				type === 'selected_cohort'
			) {
				this.forceUpdate();
			}
		});
	}

	componentWillUnmount() {
		removeGlowElems();
		this.unsubscribe();
	}

	thumbnailClickFactory = ( id ) => {
		return ( event ) => {
			event.stopPropagation();
			this.props.onThumbnailClick( id );
		};
	}

	highlightFactory = ( id ) => {
		return () => {
			removeGlowElems();
			if ( this.state.selected === id ) {
				return this.setState({
					selected: null
				});
			}
			const elem = document.getElementById( id );
			if ( elem ) {
				debug( 'Found element, should add glow effect...' );
				if ( isHidden( elem ) ) {
					const clone = elem.cloneNode( true );
					clone.addEventListener( 'click', ( event ) => {
						debug( `Clicked on element with ID ${event.target.id}` );

						// Returns original element with the given ID since it was first inserted into the DOM:
						const button = document.getElementById( event.target.id );
						button.click();
					});
					const newDiv = document.createElement( 'div' );
					newDiv.id = 'duplicated-container';
					clone.id = 'duplicated-elem';
					clone.classList.add( 'focus-glow' );
					newDiv.append( clone );
					document.body.appendChild( newDiv );
				} else {
					elem.classList.add( 'focus-glow' );
					elem.scrollIntoView();
				}
			}
			this.setState({
				selected: id
			});
		};
	}

	render() {
		debug( 'Render response visualizer statistics...' );
		let completionTooltip;
		let nUsers;
		if ( this.props.selectedCohort ) {
			nUsers = this.props.selectedCohort.members.length;
			completionTooltip = `Completion rate for students from cohort ${this.props.selectedCohort.title}`;
		} else {
			nUsers = this.props.session.userList.length;
			completionTooltip = 'Completion rate for currently active students from all cohorts';
		}
		const visualizers = this.props.session.responseVisualizers;
		const { means } = this.state;
		const ids = keys( visualizers );
		ids.sort( ( a, b ) => {
			const na = visualizers[ a ].ref.state.nInfo;
			const nb = visualizers[ b ].ref.state.nInfo;
			return nb - na;
		});
		const list = new Array( ids.length );
		const currentTime = new Date() - this.props.session.startTime;
		let overallProgress = 0;
		for ( let i = 0; i < ids.length; i++ ) {
			const viz = visualizers[ ids[ i ] ];
			const nInfo = viz.ref.state.nInfo;
			const nActions = viz.ref.state.nActions;
			const emails = keys( viz.ref.emailHash );
			const nUniqueActions = emails.length;
			const infoRate = ( nInfo / nUsers ) * 100.0;
			overallProgress += infoRate;
			const id = ids[ i ];
			const time = `time: ${means[ id ] ? formatTime( means[ id ]() ) : ''}`;
			let timeBadgeVariant;
			if (
				nInfo > 0 &&
				means[ id ] &&
				currentTime > means[ id ]()
			) {
				if ( infoRate < 10 ) {
					timeBadgeVariant = 'danger';
				} else if ( infoRate > 75 ) {
					timeBadgeVariant = 'success';
				} else {
					timeBadgeVariant = 'info';
				}
			} else {
				timeBadgeVariant = 'light';
			}
			list[ i ] = (
				<ListGroupItem
					key={i}
					style={{
						background: this.state.selected === id ? '#e0a800' : 'lightgrey',
						padding: '0.4rem 1rem',
						cursor: 'pointer'
					}}
					onClick={this.highlightFactory( id )}
				>
					<Tooltip placement="right" tooltip="Question ID (click on row to show question">
						<label style={{ margin: 0 }}>{id}</label>
					</Tooltip>
					<Tooltip placement="left" tooltip="Open actions">
						<Badge variant="light" style={{ float: 'right', margin: '2px' }} onClick={this.thumbnailClickFactory( id )}>
							Open
						</Badge>
					</Tooltip>
					<Tooltip placement="left" tooltip={`# of actions (${this.props.selectedCohort ? this.props.selectedCohort.title: 'all cohorts'})`}>
						<Badge variant="light" style={{ float: 'right', margin: '2px' }}>{`n: ${nActions}`}</Badge>
					</Tooltip>
					<Tooltip placement="left" tooltip={`# of students who answered (${this.props.selectedCohort ? this.props.selectedCohort.title: 'all cohorts'})`}>
						<Badge variant="light" style={{ float: 'right', margin: '2px' }}>{`s: ${nUniqueActions}`}</Badge>
					</Tooltip>
					<Tooltip placement="left" tooltip="Average elapsed time until answer (all cohorts)">
						<Badge
							variant={timeBadgeVariant}
							style={{ float: 'right', margin: '2px' }}
						>{time}</Badge>
					</Tooltip>
					<Tooltip placement="left" tooltip={completionTooltip}>
						<ProgressBar
							variant="info"
							now={infoRate}
							max={100} min={0}
							label={`${nInfo} / ${nUsers}`}
							style={{
								width: '180px',
								float: 'right',
								height: '1.25rem'
							}}
						/>
					</Tooltip>
				</ListGroupItem>
			);
		}

		overallProgress /= ids.length;
		return ( <div>
			<ProgressBar
				striped
				variant="success"
				label={`Current class progress: ${round( overallProgress )}%`}
				now={overallProgress}
			/>
			<ListGroup style={{
				height: window.innerHeight / 1.5,
				overflowY: 'scroll'
			}}>
				{list}
			</ListGroup>
		</div> );
	}
}


// PROPERTIES //

ResponseVisualizers.propTypes = {
	selectedCohort: PropTypes.object,
	onThumbnailClick: PropTypes.func.isRequired,
	session: PropTypes.object.isRequired
};

ResponseVisualizers.defaultProps = {
	selectedCohort: null
};


// EXPORTS //

export default ResponseVisualizers;
