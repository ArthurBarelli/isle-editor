// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import pdfjs from 'pdfjs-dist/webpack';
import pdfMake from 'pdfmake-lite/build/pdfmake.min.js';
import logger from 'debug';
import Pressure from 'pressure';
import Panel from 'react-bootstrap/lib/Panel';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import isObject from '@stdlib/assert/is-object';
import isNull from '@stdlib/assert/is-null';
import round from '@stdlib/math/base/special/round';
import max from '@stdlib/math/base/special/max';
import min from '@stdlib/math/base/special/min';
import noop from '@stdlib/utils/noop';
import saveAs from 'utils/file-saver';
import base64toBlob from 'utils/base64-to-blob';
import Joyride from 'components/joyride';
import Tooltip from 'components/tooltip';
import { TwitterPicker } from 'react-color';
import Gate from 'components/gate';
import KeyControls from 'components/key-controls';
import SelectInput from 'react-select';
import ResetModal from './reset_modal.js';
import NavigationModal from './navigation_modal.js';
import TooltipButton from './tooltip_button.js';
import guide from './guide.json';
import removeUndoElements from './remove_undo_elements.js';
import './sketchpad.css';


// VARIABLES //

const debug = logger( 'isle-editor:sketchpad' );
const COLORPICKER_COLORS = [
	'#000000', '#FF6900', '#FCB900',
	'#00D084', '#8ED1FC', '#0693E3',
	'#ABB8C3', '#EB144C', '#9900EF'
];
const RECORD_TIME_INCREMENT = 100;
const RE_DIGITS = /^[0-9]*$/;


// MAIN //

class Sketchpad extends Component {
	constructor( props ) {
		super( props );

		this.force = 1.0;
		this.elements = new Array( props.noPages );
		this.backgrounds = new Array( props.noPages );
		this.recordingEndPositions = new Array( props.noPages );
		for ( let i = 0; i < props.noPages; i++ ) {
			this.elements[ i ] = [];
			this.backgrounds[ i ] = null;
			this.recordingEndPositions[ i ] = 0;
		}

		this.canvas = null;
		this.ctx = null;

		this.currentDrawing = 0;

		this.state = {
			color: props.color,
			brushSize: props.brushSize,
			showColorPicker: false,
			currentPage: this.readURL(),
			fontFamily: props.fontFamily,
			fontSize: props.fontSize,
			groupMode: props.groupMode,
			recording: false,
			isExporting: false,
			finishedRecording: false,
			modalMessage: null,
			nUndos: 0,
			noPages: props.noPages,
			showUploadModal: false,
			mode: 'drawing',
			showNavigationModal: false,
			transmitOwner: props.transmitOwner,
			receiveFrom: {},
			showResetModal: false
		};
		this.isMouseDown = false;
	}

	static getDerivedStateFromProps( props, state ) {
		if ( props.fullscreen ) {
			return {
				canvasHeight: window.innerHeight - 60,
				canvasWidth: window.innerWidth - 40
			};
		}
		if (
			state.canvasHeight !== props.canvasHeight ||
			state.canvasWidth !== props.canvasWidth
		) {
			return {
				canvasHeight: props.canvasHeight,
				canvasWidth: props.canvasWidth
			};
		}
		return null;
	}

	componentDidMount() {
		const { session } = this.context;
		if ( this.props.fullscreen ) {
			this.windowResize = window.addEventListener( 'resize', () => {
				this.setState({
					canvasHeight: window.innerHeight - 60,
					canvasWidth: window.innerWidth - 40
				}, () => {
					this.redraw();
				});
			});
		}
		let init;
		if ( this.props.pdf ) {
			init = this.initializePDF();
		} else {
			init = Promise.resolve();
		}
		init.then( () => {
			const promise = session.store.getItem( this.props.id + '_sketchpad' );
			promise
			.then( this.retrieveData )
				.catch( ( err ) => {
				debug( err );
			});
		});
		Pressure.set( '.sketch-canvas', {
			change: ( force, event ) => {
				debug( 'Changed pen pressue: '+force );
				this.force = force;
			}
		});
		if ( session ) {
			this.unsubscribe = session.subscribe( ( type, action ) => {
				if ( type === 'member_action' ) {
					debug( 'Received member action...' );
					if (
						action.email === session.user.email // 'Early return since own action...'
					) {
						return;
					}
					// Owners should only process actions from selected users:
					if ( session.isOwner() ) {
						if (
							this.state.receiveFrom.name !== action.name &&
							!action.owner &&
							!this.state.groupMode
						) {
							return;
						}
					}
					const type = action.type;
					if (
						type === 'SKETCHPAD_DRAW_TEXT' ||
						type === 'SKETCHPAD_DRAW_LINE' ||
						type === 'SKETCHPAD_REPLAY'
					) {
						let elem = JSON.parse( action.value );
						elem.shouldLog = false;
						if ( elem.page === this.state.currentPage ) {
							if ( elem.type === 'text' ) {
								this.drawText( elem );
							} else {
								this.drawLine( elem );
							}
						}
						const elements = this.elements[ elem.page ];
						elements.push( elem );
						this.props.onChange( elements );
					}
					else if ( type === 'SKETCHPAD_INSERT_PAGE' ) {
						debug( `Should insert page at ${action.value}...` );
						this.insertPage( action.value, false );
					}
					else if ( type === 'SKETCHPAD_DELETE_ELEMENT' ) {
						const { drawID, page, user } = JSON.parse( action.value );
						debug( `Should delete element with id ${drawID} by user ${user}` );
						const elems = this.elements[ page ];
						let deleteStart;
						let deleteEnd;
						for ( let i = 0; i < elems.length; i++ ) {
							if (
								deleteStart === void 0 &&
								elems[ i ].drawID === drawID &&
								elems[ i ].user === user
							) {
								deleteStart = i;
							} else if (
								deleteStart !== void 0 &&
								( elems[ i ].drawID !== drawID || elems[ i ].user === user )
							) {
								deleteEnd = i;
								break;
							}
						}
						// Handle case where last element shall be removed:
						if ( deleteStart !== void 0 && !deleteEnd ) {
							deleteEnd = elems.length - 1;
						}
						debug( `Delete elements ${deleteStart} to ${deleteEnd}` );
						elems.splice( deleteStart, deleteEnd - deleteStart + 1 );
						this.redraw();
					}
					else if ( type === 'SKETCHPAD_DRAG_ELEMENT' ) {
						const { drawID, user, page, dx, dy } = JSON.parse( action.value );
						debug( `Should drag element with id ${drawID} by dx: ${dx} and dy: ${dy}...` );
						const elems = this.elements[ page ];
						for ( let i = 0; i < elems.length; i++ ) {
							const e = elems[ i ];
							if ( e.drawID === drawID && e.user === user ) {
								if ( e.type === 'line' ) {
									e.startX += ( dx / this.canvas.width );
									e.endX += ( dx / this.canvas.width );
									e.startY += ( dy / this.canvas.height );
									e.endY += ( dy / this.canvas.height );
								}
								else if ( e.type === 'text' ) {
									e.x += ( dx / this.canvas.width );
									e.y += ( dy / this.canvas.height );
								}
							}
						}
						this.redraw();
					}
					else if ( type === 'SKETCHPAD_CLEAR_PAGE' ) {
						const page = action.value;
						const user = action.email;
						const elems = this.elements[ page ];
						const newElems = [];
						for ( let i = 0; i < elems.length; i++ ) {
							const e = elems[ i ];
							if ( e.user !== user ) {
								newElems.push( e );
							}
						}
						this.elements[ page ] = newElems;
						this.redraw();
					}
					else if ( type === 'SKETCHPAD_CLEAR_ALL_PAGES' ) {
						const user = action.email;
						for ( let page = 0; page < this.state.noPages; page++ ) {
							const elems = this.elements[ page ];
							const newElems = [];
							for ( let i = 0; i < elems.length; i++ ) {
								const e = elems[ i ];
								if ( e.user !== user ) {
									newElems.push( e );
								}
							}
							this.elements[ page ] = newElems;
						}
						this.redraw();
					}
				}
			});
		}

		if ( this.props.autoSave ) {
			this.saveInterval = setInterval( this.saveInBrowser, this.props.intervalTime );
		}

		// Prevent scrolling when touching the canvas on iOS
		const opts = {
			passive: false
		};
		document.body.addEventListener( 'touchstart', this.preventDefaultTouch, opts );
		document.body.addEventListener( 'touchend', this.preventDefaultTouch, opts );
		document.body.addEventListener( 'touchmove', this.preventDefaultTouch, opts );
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.noPages !== this.props.noPages ) {
			this.elements = new Array( this.props.noPages );
			this.backgrounds = new Array( this.props.noPages );
			this.recordingEndPositions = new Array( this.props.noPages );
			for ( let i = 0; i < this.props.noPages; i++ ) {
				this.elements[ i ] = [];
				this.backgrounds[ i ] = null;
				this.recordingEndPositions[ i ] = 0;
			}
			this.setState({
				noPages: this.props.noPages
			}, () => {
				this.redraw();
			});
		}
		if ( prevProps.pdf !== this.props.pdf ) {
			this.initializePDF();
		}
	}

	componentWillUnmount() {
		if ( this.recordingInterval ) {
			clearInterval( this.recordingInterval );
		}
		if ( this.saveInterval ) {
			clearInterval( this.saveInterval );
		}
		if ( this.unsubscribe ) {
			this.unsubscribe();
		}
		if ( this.windowResize ) {
			window.removeEventListener( 'resize', this.windowResize );
		}
		const opts = {
			passive: false
		};
		document.body.removeEventListener( 'touchstart', this.preventDefaultTouch, opts );
		document.body.removeEventListener( 'touchend', this.preventDefaultTouch, opts );
		document.body.removeEventListener( 'touchmove', this.preventDefaultTouch, opts );
	}

	retrieveData = ( data ) => {
		debug( 'Retrieved data from previous session...' );
		if ( isObject( data ) ) {
			this.elements = data.elements;
			this.recordingEndPositions = data.recordingEndPositions;
			const page = this.readURL();
			if ( page > 0 ) {
				data.state.currentPage = page;
			}
			this.setState( data.state, () => {
				this.redraw();
			});
		} else {
			this.redraw();
		}
	}

	toggleGroupMode = () => {
		this.setState({
			groupMode: !this.state.groupMode
		});
	}

	preventDefaultTouch = ( e ) => {
		if (
			this.state.mode === 'drawing' &&
			this.canvas === e.target
		) {
			e.preventDefault();
		}
	}

	renderBackground = ( pageNumber ) => {
		const page = this.backgrounds[ pageNumber ];
		if ( page ) {
			const heightRatio = this.state.canvasHeight / page.getViewport(1.0).height;
			const widthRatio = this.state.canvasWidth / page.getViewport(1.0).width;
			const viewport = page.getViewport( min( widthRatio, heightRatio ) );
			this.canvas.height = viewport.height;
			this.canvas.width = this.state.canvasWidth;

			// Move page to the center:
			viewport.transform[ 4 ] = max( ( this.state.canvasWidth - viewport.width ) / 2.0, 0.0 );
			/*
				`transform: [ a, b, c, d, e, f ]`

				a: Horizontal scaling.
				b: Horizontal skewing.
				c: Vertical skewing.
				d: Vertical scaling.
				e: Horizontal moving.
				f: Vertical moving.
			*/

			// Render PDF page into canvas context
			const renderContext = {
				canvasContext: this.ctx,
				viewport: viewport
			};
			return page.render( renderContext )
				.then( () => {
					debug( `Background rendered for page ${pageNumber}` );
				});
		}
		const canvas = this.canvas;
		const ctx = this.ctx;
		if ( ctx ) {
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		}
		// Return promise that immediately resolves as no background needs to be drawn:
		return Promise.resolve();
	}

	redraw = () => {
		if ( this.pageRendering ) {
			return debug( 'Early return because of active render task...' );
		}
		this.pageRendering = true;
		const currentPage = this.state.currentPage;

		debug( `Redrawing page ${currentPage+1}` );
		const ctx = this.ctx;
		const canvas = this.canvas;
		const recordingEndPos = this.recordingEndPositions[ currentPage ];
		if ( ctx ) {
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		}
		this.renderBackground( currentPage )
			.then( () => {
				const elems = this.elements[ currentPage ];
				debug( `Rendering ${elems.length} elements on page ${currentPage}...` );
				for ( let i = recordingEndPos; i < elems.length; i++ ) {
					this.drawElement( elems[ i ] );
				}
				this.pageRendering = false;
			})
			.catch( ( err ) => {
				this.pageRendering = false;
				debug( 'Encountered an error: '+err.message );
				// this.redraw();
			});
	}

	replay = () => {
		const currentPage = this.state.currentPage;
		debug( `Playing recording for page ${currentPage+1}` );
		const ctx = this.ctx;
		const canvas = this.canvas;
		if ( ctx ) {
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		}
		const endPos = this.recordingEndPositions[ currentPage ];
		this.renderBackground( currentPage ).then( () => {
			const elems = this.elements[ currentPage ];
			debug( `Rendering ${elems.length} elements...` );
			this.setState({
				playing: true
			}, () => {
				let idx = 0;
				let iter = () => {
					this.drawElement( elems[ idx ] );
					idx += 1;
					if ( idx < endPos ) {
						// Save replay actions and transmit to others:
						const action = {
							id: this.props.id,
							type: 'SKETCHPAD_REPLAY',
							value: JSON.stringify( elems[ idx ]),
							noSave: true
						};
						const session = this.context.session;
						if ( session.isOwner() && this.state.transmitOwner ) {
							session.log( action, 'members' );
						} else {
							session.log( action, 'owners' );
						}
						window.setTimeout( iter, elems[ idx ].time - elems[ idx-1 ].time );
					} else {
						this.setState({
							playing: false
						});
					}
				};
				window.setTimeout( iter, 0.0 );
			});
		});
	}

	drawPage = ( idx ) => {
		const ctx = this.ctx;
		const canvas = this.canvas;
		if ( ctx ) {
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		}
		this.renderBackground( idx );
		const elems = this.elements[ idx ];
		for ( let i = 0; i < elems.length; i++ ) {
			this.drawElement( elems[ i ] );
		}
	}

	mousePosition = ( evt ) => {
		const canvas = this.canvas;
		const rect = canvas.getBoundingClientRect();
		let clientX = evt.clientX;
		let clientY = evt.clientY;

		// Use first touch if available:
		if ( evt.touches && evt.touches.length > 0 ) {
			clientX = evt.touches[ 0 ].clientX;
			clientY = evt.touches[ 0 ].clientY;
		}

		// Return position inside of the canvas element:
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	clear = () => {
		const currentPage = this.state.currentPage;
		this.elements[ currentPage ] = [];
		this.recordingEndPositions[ currentPage ] = 0;
		const logAction = {
			id: this.props.id,
			type: 'SKETCHPAD_CLEAR_PAGE',
			value: currentPage
		};
		const session = this.context.session;
		if (
			session.isOwner() && this.state.transmitOwner
		) {
			session.log( logAction, 'members' );
		} else {
			session.log( logAction, 'owners' );
		}
		this.redraw();
	}

	clearAll = () => {
		const canvas = this.canvas;
		const ctx = this.ctx;
		if ( ctx ) {
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		}
		this.context.session.store.removeItem( this.props.id + '_sketchpad' );
		if ( this.props.pdf ) {
			this.initializePDF().then( () => {
				this.redraw();
				this.setState({
					nUndos: 0,
					finishedRecording: false
				});
			});
		} else {
			const noPages = this.props.noPages;
			this.elements = new Array( noPages );
			this.backgrounds = new Array( noPages );
			this.recordingEndPositions = new Array( noPages );
			for ( let i = 0; i < noPages; i++ ) {
				this.elements[ i ] = [];
				this.backgrounds[ i ] = null;
				this.recordingEndPositions[ i ] = 0;
			}
			this.setState({
				nUndos: 0,
				currentPage: 0,
				noPages: noPages,
				finishedRecording: false
			});
		}
		const logAction = {
			id: this.props.id,
			type: 'SKETCHPAD_CLEAR_ALL_PAGES',
			value: null
		};
		const session = this.context.session;
		if (
			session.isOwner() && this.state.transmitOwner
		) {
			session.log( logAction, 'members' );
		} else {
			session.log( logAction, 'owners' );
		}
	}

	delete = () => {
		const currentPage = this.state.currentPage;
		const canvas = this.canvas;

		if ( !isNull( this.backgrounds[ currentPage ] ) ) {
			this.renderBackground( currentPage );
		}
		else {
			const ctx = this.ctx;
			if ( ctx ) {
				ctx.clearRect( 0, 0, canvas.width, canvas.height );
			}
		}
		this.elements[ currentPage ] = [];
		this.recordingEndPositions[ currentPage ] = 0;
		this.setState({
			finishedRecording: false,
			nUndos: 0
		});
	}

	undo = () => {
		const currentPage = this.state.currentPage;
		const elems = this.elements[ currentPage ];
		const recordingEndPos = this.recordingEndPositions[ currentPage ];
		let nUndos = this.state.nUndos;
		const ctx = this.ctx;
		const canvas = this.canvas;
		if ( ctx ) {
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		}
		this.renderBackground( currentPage )
			.then( () => {
				nUndos += 1;
				let count = -1;
				let lastID;
				let end = elems.length - 1;
				for ( let i = end; i >= recordingEndPos; i-- ) {
					const elem = elems[ i ];
					if ( elem.type === 'text' ) {
						count += 1;
					} else if ( elem.type === 'line' ) {
						if ( lastID !== elem.drawID ) {
							count += 1;
							lastID = elem.drawID;
						}
					}
					if ( count === nUndos ) {
						end = i;
						break;
					} else if ( i === recordingEndPos ) {
						nUndos = count + 1;
						end = null;
					}
				}
				debug( 'Current number of undos: '+nUndos );
				this.setState({
					nUndos
				});
				if ( !isNull( end ) ) {
					debug( `UNDO: Redrawing elements 0 to ${end} out of ${elems.length} elements` );
					for ( let i = 0; i <= end; i++ ) {
						this.drawElement( elems[ i ] );
					}
				}
			});
	}

	redo = () => {
		const elems = this.elements[ this.state.currentPage ];
		let nUndos = this.state.nUndos;
		if ( nUndos > 0 ) {
			const idx = min( elems.length - nUndos, 0 );
			debug( 'Line index: '+idx );
			if ( idx >= 0 ) {
				let count = -1;
				let lastID;
				let end = elems.length - 1;
				nUndos -= 1;
				for ( let i = end; i >= 0; i-- ) {
					const elem = elems[ i ];
					if ( elem.type === 'text' ) {
						count += 1;
					} else if ( elem.type === 'line' ) {
						if ( lastID !== elem.drawID ) {
							count += 1;
							lastID = elem.drawID;
						}
					}
					if ( count === nUndos ) {
						end = i;
						break;
					}
				}
				debug( `REDO: Redrawing elements ${idx} to ${end} out of ${elems.length} elements` );
				for ( let i = idx; i <= end; i++ ) {
					this.drawElement( elems[ i ]);
				}
				this.setState({
					nUndos
				});
			}
		}
	}

	drawElement = ( elem ) => {
		if ( elem ) {
			if ( elem.type === 'line' ) {
				this.drawLine( elem );
			}
			else if ( elem.type === 'text' ) {
				this.drawText( elem );
			}
		}
	}

	drawLine = ({ startX, startY, endX, endY, color, drawID, user, lineWidth, selected, shouldLog = true }) => {
		const ctx = this.ctx;
		if ( ctx ) {
			ctx.lineWidth = lineWidth;
			ctx.lineCap = 'round';
			ctx.strokeStyle = selected ? 'yellow' : color;
			ctx.beginPath();
			const startXabs = round( startX*this.canvas.width );
			const startYabs = round( startY*this.canvas.height );
			ctx.moveTo( startXabs, startYabs );
			const endXabs = round( endX*this.canvas.width );
			const endYabs = round( endY*this.canvas.height );
			ctx.lineTo( endXabs, endYabs );
			ctx.stroke();
			const { session } = this.context;
			if ( shouldLog ) {
				const logAction = {
					id: this.props.id,
					type: 'SKETCHPAD_DRAW_LINE',
					value: JSON.stringify({
						startX: startX,
						startY: startY,
						endX: endX,
						endY: endY,
						color,
						lineWidth,
						page: this.state.currentPage,
						type: 'line',
						drawID: drawID,
						user: user
					}),
					noSave: true
				};
				if (
					this.state.groupMode ||
					session.isOwner() && this.state.transmitOwner
				) {
					session.log( logAction, 'members' );
				} else {
					session.log( logAction, 'owners' );
				}
			}
		}
	}

	drawStart = ( event ) => {
		event.stopPropagation();
		debug( '`onMouseDown` or `onTouchStart` event fired...' );
		const { x, y } = this.mousePosition( event );
		this.x = x;
		this.y = y;
		if ( this.state.mode === 'drawing' ) {
			this.isMouseDown = true;
			this.draw( event );
		}
	}

	drawEnd = ( event ) => {
		debug( 'Mouse is not clicked anymore...' );
		event.stopPropagation();
		if ( this.isMouseDown ) {
			this.isMouseDown = false;
		}
		this.currentDrawing += 1;
	}

	draw = ( evt ) => {
		evt.stopPropagation();
		let { x, y } = this.mousePosition( evt );
		if ( this.isSelected ) {
			if ( this.state.mode === 'drag' ) {
				debug( 'Drag elements around...' );
				const dx = x - this.x;
				const dy = y - this.y;
				const elems = this.elements[ this.state.currentPage ];
				for ( let i = 0; i < elems.length; i++ ){
					const e = elems[ i ];
					if ( e.selected ) {
						if ( e.type === 'line' ) {
							e.startX += ( dx / this.canvas.width );
							e.endX += ( dx / this.canvas.width );
							e.startY += ( dy / this.canvas.height );
							e.endY += ( dy / this.canvas.height );
						}
						else if ( e.type === 'text' ) {
							e.x += ( dx / this.canvas.width );
							e.y += ( dy / this.canvas.height );
						}
					}
				}
				const username = this.context.session.user.email || '';
				const action = {
					id: this.props.id,
					type: 'SKETCHPAD_DRAG_ELEMENT',
					value: JSON.stringify({
						dx: dx,
						dy: dy,
						page: this.state.currentPage,
						drawID: this.isSelected,
						user: username
					}),
					noSave: true
				};
				const session = this.context.session;
				if ( session.isOwner() || this.state.groupMode ) {
					session.log( action, 'members' );
				} else {
					session.log( action );
				}
				this.x = x;
				this.y = y;
				this.redraw();
			}
		}
		if ( this.isMouseDown && !this.props.disabled ) {
			const username = this.context.session.user.email || '';
			const line = {
				color: this.state.color,
				lineWidth: this.state.brushSize * ( 1.0 + this.force ) * 0.5,
				startX: this.x / this.canvas.width,
				startY: this.y / this.canvas.height,
				endX: x / this.canvas.width,
				endY: y / this.canvas.height,
				time: this.time,
				type: 'line',
				page: this.state.currentPage,
				drawID: this.currentDrawing,
				user: username,
				shadow: 0
			};
			this.drawElement( line );
			const elems = this.elements[ this.state.currentPage ];

			if ( this.state.nUndos > 0 ) {
				removeUndoElements( elems, this.state.nUndos );
				debug( `Page ${this.state.currentPage} now has ${elems.length} elements`);
				this.setState({
					nUndos: 0
				});
			}

			// Prevent future logging when redrawing element:
			line.shouldLog = false;
			elems.push( line );
			this.props.onChange( elems );

			// Set to current coordinates:
			this.x = x;
			this.y = y;
		}
	}

	toggleColorPicker = () => {
		this.setState({
			showColorPicker: !this.state.showColorPicker
		});
	}

	toggleTransmit = () => {
		this.setState({
			transmitOwner: !this.state.transmitOwner
		});
	}

	handleColorChange = ( color ) => {
		this.setState({
			color: color.hex,
			showColorPicker: !this.state.showColorPicker
		});
	}

	uploadSketches = () => {
		this.setState({
			isExporting: true
		}, () => {
			this.preparePDF( ( err, doc ) => {
				doc.getBase64( ( pdf ) => {
					debug( 'Processing base64 string of PDF document' );
					const pdfForm = new FormData();
					const name = this.props.id ? this.props.id : 'sketches';
					const filename = name + '.pdf';
					const pdfBlob = base64toBlob( pdf, 'application/pdf' );
					const pdfFile = new File([ pdfBlob ], filename, {
						type: 'application/pdf'
					});
					pdfForm.append( 'file', pdfFile );
					const onUpload = ( err, res ) => {
						if ( err ) {
							this.setState({
								isExporting: false,
								showUploadModal: true,
								modalMessage: err.message
							});
						} else {
							const session = this.context.session;
							const filename = res.filename;
							const link = session.server + '/' + filename;
							this.setState({
								isExporting: false,
								showUploadModal: true,
								modalMessage: <span>
									The file has been uploaded successfully and can be accessed at the following address: <a href={link} target="_blank" >{link}</a>
								</span>
							});
							const msg = {
								text: `Dear ${session.user.name}, your notes have been successfully uploaded and are now available at <a href="${link}">${link}</a>.`,
								subject: 'PDF uploaded'
							};
							session.sendMail( msg, session.user.email );
						}
					};
					this.context.session.uploadFile( pdfForm, onUpload );
				});
			});
		});
	}

	saveToPNG = () => {
		let name;
		if ( this.props.id ) {
			name = this.props.id+'.png';
		} else {
			name = 'sketches.png';
		}
		const current = this.state.currentPage;
		const canvas = this.canvas;
		if ( !this.backgrounds[ current ]) {
			// Set white background if none present:
			this.ctx.fillStyle = 'white';
			this.ctx.fillRect( 0, 0, canvas.width, canvas.height );
		}
		canvas.toBlob( function onBlob( blob ) {
			saveAs( blob, name );
		});
	}

	preparePDF = ( clbk = noop ) => {
		debug( 'Assembling PDF document object...' );
		const docDefinition = {
			content: [],
			pageSize: {
				width: this.canvas.width, // peek at first page and assume it's consistent over all pages
				height: this.canvas.height
			},
			pageMargins: [ 0, 0, 0, 0 ]
		};
		let idx = 0;
		const iter = () => {
			debug( `Creating page ${idx+1}` );
			this.renderBackground( idx ).then( () => {
				const elems = this.elements[ idx ];
				debug( `Rendering ${elems.length} elements...` );
				for ( let i = 0; i < elems.length; i++ ) {
					this.drawElement( elems[ i ] );
				}
				const data = this.canvas.toDataURL();
				docDefinition.content.push({
					image: data,
					width: this.canvas.width
				});
				idx += 1;
				if ( idx < this.state.noPages ) {
					iter();
				} else {
					debug( 'Creating PDF...' );
					return clbk( null, pdfMake.createPdf( docDefinition ) );
				}
			});
		};

		// Start rendering pages one by one:
		iter();
	}

	saveAsPDF = () => {
		this.setState({
			isExporting: true
		}, () => {
			this.preparePDF( ( err, doc ) => {
				const name = this.props.id ? this.props.id : 'sketches';
				doc.download( name+'.pdf', () => {
					this.setState({
						isExporting: false
					});
				});
			});
		});
	}

	insertPage = ( idx, logging = true ) => {
		this.elements.splice( idx, 0, []);
		this.backgrounds.splice( idx, 0, null );
		this.recordingEndPositions.splice( idx, 0, 0 );
		this.setState({
			noPages: this.state.noPages + 1,
			currentPage: idx,
			nUndos: 0
		}, () => {
			this.redraw();
			if ( logging ) {
				this.context.session.log({
					id: this.props.id,
					type: 'SKETCHPAD_INSERT_PAGE',
					value: idx
				}, 'members' );
			}
		});
	}

	handleEnter = ( event ) => {
		debug( 'Check if user hit ENTER...' );
		const rect = this.canvas.getBoundingClientRect();
		const x = parseInt( this.textInput.style.left, 10 ) - rect.left;
		const y = parseInt( this.textInput.style.top, 10 ) - rect.top;
		if ( event.keyCode === 13 ) {
			const value = this.textInput.value;
			this.textInput.value = '';
			this.textInput.style.top = String( parseInt( this.textInput.style.top, 10 ) + this.state.fontSize ) + 'px';
			const username = this.context.session.user.email || '';
			const text = {
				value: value,
				x: x / this.canvas.width,
				y: y / this.canvas.height,
				color: this.state.color,
				fontSize: this.state.fontSize,
				fontFamily: this.state.fontFamily,
				time: this.time,
				type: 'text',
				page: this.state.currentPage,
				user: username,
				drawID: this.currentDrawing
			};
			this.drawText( text );
			const elems = this.elements[ this.state.currentPage ];

			if ( this.state.nUndos > 0 ) {
				removeUndoElements( elems, this.state.nUndos );
				debug( `Page ${this.state.currentPage} now has ${elems.length} elements`);
				this.setState({
					nUndos: 0
				});
			}

			// Prevent future logging when redrawing element:
			text.shouldLog = false;
			elems.push( text );
			this.props.onChange( elems );
		}
	}

	drawText = ({ x, y, value, color, drawID, user, fontSize, fontFamily, selected, shouldLog = true }) => {
		const ctx = this.ctx;
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.fillStyle = selected ? 'yellow' : color;
		const xval = round( x*this.canvas.width );
		const yval = round( y*this.canvas.height ) + fontSize;
		debug( `Draw text at x: ${xval} and y: ${yval}` );
		ctx.fillText( value, xval, yval );
		const { session } = this.context;
		if ( shouldLog ) {
			const logAction = {
				id: this.props.id,
				type: 'SKETCHPAD_DRAW_TEXT',
				value: JSON.stringify({
					x: x,
					y: y,
					value,
					color,
					fontSize,
					fontFamily,
					page: this.state.currentPage,
					drawID: drawID,
					user: user,
					type: 'text'
				})
			};
			if ( session.isOwner() || this.state.groupMode ) {
				session.log( logAction, 'members' );
			} else {
				session.log( logAction );
			}
		}
	}

	deselectElements = () => {
		const elems = this.elements[ this.state.currentPage ];
		for ( let i = 0; i < elems.length; i++ ) {
			elems[ i ].selected = false;
		}
		this.isSelected = null;
	}

	handleClick = ( event ) => {
		debug( 'Handle click event...' );
		if ( this.state.mode === 'text' ) {
			const x = event.clientX;
			const y = event.clientY;
			const input = this.textInput;
			input.style.left = x + 'px';
			input.style.top = y + 'px';
			const width = max( this.state.canvasWidth - x, 60 );
			debug( `Resize to width ${width}...` );
			input.style.width = `${width}px`;
			input.focus();
		} else if ( this.state.mode === 'drawing' ) {
			// Handle click while drawing...
		} else if ( this.isSelected ) {
			this.deselectElements();
			this.redraw();
		} else {
			debug( 'Checking whether a shape has been selected...' );
			const { x, y } = this.mousePosition( event );
			const elems = this.elements[ this.state.currentPage ];
			let found = null;
			for ( let i = 0; i < elems.length; i++ ) {
				const elem = elems[ i ];
				if ( elem.type === 'line' ) {
					this.ctx.beginPath();
					this.ctx.lineCap = 'round';
					this.ctx.lineWidth = elem.linWidth;
					const startXabs = round( elem.startX*this.canvas.width );
					const startYabs = round( elem.startY*this.canvas.height );
					const endXabs = round( elem.endX*this.canvas.width );
					const endYabs = round( elem.endY*this.canvas.height );
					this.ctx.moveTo( startXabs, startYabs );
					this.ctx.lineTo( endXabs, endYabs );
					this.ctx.closePath();
					if ( this.ctx.isPointInStroke( x, y ) ) {
						found = i;
						this.isSelected = elem.drawID;
						break;
					}
				}
				else if ( elem.type === 'text' ) {
					const width = this.ctx.measureText( elem.value ).width;
					const xabs = round( elem.x * this.canvas.width );
					const yabs = round( elem.y * this.canvas.height );
					if (
						xabs <= x &&
						x <= xabs + width &&
						yabs <= y &&
						y <= yabs + elem.fontSize
					) {
						found = i;
						this.isSelected = elem.drawID;
						break;
					}
				}
			}
			if ( !isNull( found ) ) {
				const id = elems[ found ].drawID;
				this.deleteElement( id, found, elems );
				if ( this.state.mode === 'delete' ) {
					const username = this.context.session.user.email || '';
					const action = {
						id: this.props.id,
						type: 'SKETCHPAD_DELETE_ELEMENT',
						value: JSON.stringify({
							drawID: id,
							page: this.state.currentPage,
							user: username
						})
					};
					const session = this.context.session;
					if (
						( session.isOwner() && this.state.transmitOwner ) ||
						this.state.groupMode
					) {
						session.log( action, 'members' );
					} else {
						session.log( action, 'owners' );
					}
				}
			}
		}
	}

	deleteElement = ( id, foundPos, elems ) => {
		let deleteStart;
		let deleteEnd;
		for ( let j = foundPos; j < elems.length; j++ ) {
			if ( elems[ j ].drawID === id ) {
				deleteEnd = j;
				elems[ j ].selected = true;
			} else {
				break;
			}
		}
		for ( let j = foundPos; j >= 0; j-- ) {
			if ( elems[ j ].drawID === id ) {
				deleteStart = j;
				elems[ j ].selected = true;
			} else {
				break;
			}
		}
		if ( this.state.mode === 'delete' ) {
			debug( `Delete elements ${deleteStart} to ${deleteEnd}` );
			elems.splice( deleteStart, deleteEnd - deleteStart + 1 );
		}
		this.redraw();
	}

	firstPage = () => {
		this.setState({
			currentPage: 0,
			nUndos: 0
		}, () => {
			this.redraw();
			this.context.session.log({
				id: this.props.id,
				type: 'SKETCHPAD_FIRST_PAGE',
				value: this.state.currentPage
			});
		});
	}

	lastPage = () => {
		this.setState({
			currentPage: this.state.noPages - 1,
			nUndos: 0
		}, () => {
			this.redraw();
			this.context.session.log({
				id: this.props.id,
				type: 'SKETCHPAD_LAST_PAGE',
				value: this.state.currentPage
			});
		});
	}

	readURL = () => {
		const hash = window.location.hash;
		const pageNo = hash.slice( 2 );
		if ( RE_DIGITS.test( pageNo ) ) {
			return Number( pageNo ) - 1;
		}
		return 0;
	}

	updateURL = ( pageNo ) => {
		window.location.hash = '#/'+(pageNo+1);
	}

	nextPage = () => {
		if ( this.state.currentPage < this.state.noPages-1 ) {
			debug( 'Should go to next page...' );
			this.setState({
				currentPage: this.state.currentPage + 1,
				nUndos: 0
			}, () => {
				// Update hash of URL:
				this.updateURL( this.state.currentPage );

				this.redraw();
				this.context.session.log({
					id: this.props.id,
					type: 'SKETCHPAD_NEXT_PAGE',
					value: this.state.currentPage
				});
			});
		}
	}

	previousPage = () => {
		if ( this.state.currentPage > 0 ) {
			this.setState({
				currentPage: this.state.currentPage - 1,
				nUndos: 0
			}, () => {
				// Update hash of URL:
				this.updateURL( this.state.currentPage );

				this.redraw();
				this.context.session.log({
					id: this.props.id,
					type: 'SKETCHPAD_PREVIOUS_PAGE',
					value: this.state.currentPage
				});
			});
		}
	}

	gotoPage = ( idx ) => {
		debug( `Should go to page ${idx}...` );
		if ( idx !== this.state.currentPage ) {
			this.setState({
				currentPage: idx,
				showNavigationModal: false,
				nUndos: 0
			}, () => {
				// Update hash of URL:
				this.updateURL( this.state.currentPage );

				this.redraw();
				this.context.session.log({
					id: this.props.id,
					type: 'SKETCHPAD_GOTO_PAGE',
					value: idx
				});
			});
		} else {
			this.setState({
				showNavigationModal: false
			});
		}
	}

	loadPDF = () => {
		const input = document.createElement( 'input' );
		input.type = 'file';
		input.accept = '.pdf';
		input.addEventListener( 'change', this.handlePDFUpload, false );
		input.click();
	}

	handlePDFUpload = ( evt ) => {
		const files = evt.target.files;
		const reader = new FileReader();
		reader.onload = () => {
			let pdfData = reader.result;
			pdfData = new Uint8Array( pdfData );
			pdfjs.getDocument( pdfData )
				.then( this.processPDF )
				.catch(function onError( err ) {
					debug( err );
				});
		};
		reader.readAsArrayBuffer( files[ 0 ] );
	}

	initializePDF = () => {
		return new Promise( ( resolve, reject ) => {
			pdfjs.getDocument( this.props.pdf )
				.then( ( pdf ) => {
					this.processPDF( pdf, ( err ) => {
						if ( err ) {
							reject( err );
						} else {
							resolve();
						}
					});
				})
				.catch(function onError( err ) {
					debug( err );
				});
		});
	}

	processPDF = ( pdf, clbk = noop ) => {
		debug( 'PDF loaded...' );
		const noPages = pdf.numPages;
		const elems = new Array( noPages );
		const promises = new Array( noPages );
		const recordingEndPositions = new Array( noPages );
		this.setState({
			noPages: noPages
		}, () => {
			for ( let i = 0; i < noPages; i++ ) {
				elems[ i ] = [];
				promises[ i ] = pdf.getPage( i + 1 );
				recordingEndPositions[ i ] = 0;
			}
			return Promise.all( promises )
				.then( values => {
					debug( 'Retrieved all pages...' );
					this.backgrounds = values;
					this.elements = elems;
					this.recordingEndPositions = recordingEndPositions;
					clbk( null );
				})
				.catch( error => {
					debug( error );
					clbk( error );
				});
		});
	}

	saveInBrowser = ( clbk = noop ) => {
		if ( this.props.id ) {
			const session = this.context.session;
			const data = {
				elements: this.elements,
				recordingEndPositions: this.recordingEndPositions,
				state: this.state
			};
			session.store.setItem( this.props.id+'_sketchpad', data, clbk );
		}
	}

	record = () => {
		const recording = !this.state.recording;
		const currentPage = this.state.currentPage;
		let finishedRecording = false;
		if ( recording ) {
			this.delete();
			this.time = 0;
			this.recordingInterval = setInterval( () => {
				this.time += RECORD_TIME_INCREMENT;
			}, RECORD_TIME_INCREMENT );
		} else {
			const ctx = this.ctx;
			if ( ctx ) {
				ctx.clearRect( 0, 0, this.state.canvasWidth, this.state.canvasHeight );
			}
			this.renderBackground( currentPage );
			clearInterval( this.recordingInterval );
			finishedRecording = true;
		}
		const recordingEndPos = this.elements[ currentPage ].length;
		this.recordingEndPositions[ currentPage ] = recordingEndPos;
		this.setState({
			recording,
			finishedRecording
		});
	}

	toggleTextMode = () => {
		this.setState({
			mode: this.state.mode === 'text' ? 'none' : 'text'
		});
	}

	toggleDrawingMode = () => {
		this.setState({
			mode: this.state.mode === 'drawing' ? 'none' : 'drawing'
		});
	}

	toggleDragMode = () => {
		this.setState({
			mode: this.state.mode === 'drag' ? 'none' : 'drag'
		});
	}

	toggleDeleteMode = () => {
		this.setState({
			mode: this.state.mode === 'delete' ? 'none' : 'delete'
		});
	}

	closeResponseModal = () => {
		this.setState({
			showUploadModal: false,
			modalMessage: null
		});
	}

	renderProgressModal() {
		if ( !this.state.isExporting ) {
			return null;
		}
		return (
			<Modal
				show={this.state.isExporting}
				container={this}
			>
				<Modal.Header>
					<Modal.Title>Generating PDF...</Modal.Title>
				</Modal.Header>
			</Modal>
		);
	}

	renderUploadModal() {
		if ( !this.state.showUploadModal ) {
			return null;
		}
		return (
			<Modal
				show={this.state.showUploadModal}
				onHide={this.closeResponseModal}
				container={this}
			>
				<Modal.Header closeButton>
					<Modal.Title>Server Response</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{this.state.modalMessage}
				</Modal.Body>
				<Modal.Footer>
					<Button onClick={this.closeResponseModal}>Close</Button>
				</Modal.Footer>
			</Modal>
		);
	}

	toggleNavigationModal = () => {
		this.setState({
			showNavigationModal: !this.state.showNavigationModal
		});
	}

	renderPagination() {
		const bsSize = this.props.bsSize;
		const currentPage = this.state.currentPage;
		return ( <ButtonGroup bsSize={bsSize} className="sketch-pages" >
			<Button onClick={this.toggleNavigationModal}>{currentPage+1}/{this.state.noPages}</Button>
			<TooltipButton tooltip="Go to first page" onClick={this.firstPage} glyph="fast-backward" disabled={this.state.playing} bsSize={bsSize} />
			<TooltipButton tooltip="Go to previous page" onClick={this.previousPage} glyph="backward" disabled={this.state.playing} bsSize={bsSize} />
			<TooltipButton tooltip="Go to next page" onClick={this.nextPage} glyph="forward" disabled={this.state.playing} bsSize={bsSize} />
			<TooltipButton tooltip="Go to last page" onClick={this.lastPage} glyph="fast-forward" disabled={this.state.playing} bsSize={bsSize} />
			<TooltipButton tooltip="Insert page after current one" onClick={() => {
				const idx = this.state.currentPage + 1;
				this.insertPage( idx );
			}} glyph="plus" disabled={this.state.playing} bsSize={bsSize} />
		</ButtonGroup> );
	}

	renderRecordingButtons() {
		const bsSize = this.props.bsSize;
		const elems = this.elements[ this.state.currentPage ] || [];
		const deleteIsDisabled = elems.length === 0 ||
			!this.state.finishedRecording ||
			this.state.recording ||
			this.state.playing;
		return (
			<ButtonGroup bsSize={bsSize} className="sketch-button-group">
				<Tooltip placement="bottom" tooltip={!this.state.recording ? 'Record drawing' : 'Pause recording'} >
					<Button bsSize={bsSize} disabled={this.state.playing} onClick={this.record} >
						<Glyphicon glyph={!this.state.recording ? 'record' : 'stop'} />
					</Button>
				</Tooltip>
				<Tooltip placement="bottom" tooltip="Play recording" >
					<Button bsSize={bsSize} bsStyle={this.state.playing ? 'success' : 'default'} disabled={!this.state.finishedRecording} onClick={this.replay} >
						<Glyphicon glyph="play" />
					</Button>
				</Tooltip>
				<TooltipButton tooltip="Delete recording" onClick={this.delete} glyph="trash" disabled={deleteIsDisabled} bsSize={bsSize} />
			</ButtonGroup>
		);
	}

	renderDrawingButtons() {
		const bsSize = this.props.bsSize;
		return (
			<ButtonGroup bsSize={bsSize} className="sketch-drawing-buttons" >
				<Tooltip placement="bottom" tooltip="Drawing Mode" >
					<Button bsSize={bsSize} bsStyle={this.state.mode === 'drawing' ? 'success' : 'default'} onClick={this.toggleDrawingMode} >
						<Glyphicon glyph="pencil" />
					</Button>
				</Tooltip>
				<InputGroup bsSize={bsSize} className="sketch-input-group" >
					<InputGroup.Addon>Size</InputGroup.Addon>
					<FormControl
						type="number"
						min={1}
						max={42}
						onChange={( event ) => {
							this.setState({
								brushSize: event.target.value,
								mode: 'drawing'
							});
						}}
						defaultValue={this.state.brushSize}
					/>
				</InputGroup>
			</ButtonGroup>
		);
	}

	renderTextButtons() {
		const bsSize = this.props.bsSize;
		return (
			<ButtonGroup bsSize={bsSize} className="sketch-text-buttons" >
				<Tooltip placement="bottom" tooltip="Text Mode" >
					<Button bsSize={bsSize} bsStyle={this.state.mode === 'text' ? 'success' : 'default'} onClick={this.toggleTextMode} ><Glyphicon glyph="font" /></Button>
				</Tooltip>
				<DropdownButton
					id="sketch-font-dropdown"
					bsSize={bsSize}
					title={this.state.fontFamily}
					style={{ width: 90, textAlign: 'left' }}
					onSelect={(val) => {
						this.setState({
							fontFamily: val,
							mode: 'text'
						});
					}}
				>
					<MenuItem eventKey="Arial">Arial</MenuItem>
					<MenuItem eventKey="Helvetica">Helvetica</MenuItem>
					<MenuItem eventKey="Times">Times</MenuItem>
					<MenuItem eventKey="Courier">Courier</MenuItem>
					<MenuItem eventKey="Verdana">Verdana</MenuItem>
					<MenuItem eventKey="Palatino">Palatino</MenuItem>
				</DropdownButton>
				<InputGroup bsSize={bsSize} className="sketch-input-group" >
					<InputGroup.Addon>Size</InputGroup.Addon>
					<FormControl
						type="number"
						min={12}
						max={60}
						onChange={( event ) => {
							this.setState({
								fontSize: Number( event.target.value ),
								mode: 'text'
							});
						}}
						defaultValue={this.state.fontSize}
					/>
				</InputGroup>
			</ButtonGroup>
		);
	}

	renderSaveButtons() {
		const bsSize = this.props.bsSize;
		return (
			<ButtonGroup bsSize={bsSize} className="sketch-save-buttons sketch-button-group">
				{ !this.props.pdf ? <TooltipButton tooltip="Load PDF (clears current canvas)" onClick={this.loadPDF} bsSize={bsSize} glyph="file" /> : null }
				<TooltipButton tooltip="Export current page (PNG)" onClick={this.saveToPNG} glyph="save-file" bsSize={bsSize} />
				<TooltipButton tooltip="Export pages as PDF" onClick={this.saveAsPDF} glyph="floppy-save" bsSize={bsSize} />
				{ this.props.id ? <TooltipButton tooltip="Save in browser" onClick={() => {
					this.saveInBrowser( ( err ) => {
						if ( err ) {
							this.context.session.addNotification({
								title: 'Encountered an error',
								message: err.message,
								level: 'error',
								position: 'tr'
							});
						}
						this.context.session.addNotification({
							title: 'Saved',
							message: 'Notes saved in browser',
							level: 'success',
							position: 'tr'
						});
					});
				}} glyph="save" bsSize={bsSize} /> : null }
				{ this.props.id ? <TooltipButton tooltip="Upload to the server" onClick={this.uploadSketches} glyph="cloud-upload" bsSize={bsSize} /> : null }
			</ButtonGroup>
		);
	}

	renderTransmitButtons() {
		const bsSize = this.props.bsSize;
		const users = this.context.session.userList.map( user => {
			return { value: user.name, label: user.name };
		});
		const popover = <Popover id="popover-positioned-right" title="Receive actions from...">
			<SelectInput isClearable inline options={users} onChange={( newValue ) => {
				this.setState({
					receiveFrom: newValue
				});
			}} />
			<Checkbox checked={this.state.groupMode} onClick={this.toggleGroupMode} >Group Mode</Checkbox>
		</Popover>;
		return (
			<Gate owner>
				<ButtonGroup bsSize={bsSize} className="sketch-button-group" >
					<Tooltip placement="bottom" tooltip="Transmit Actions" >
						<Button bsSize={bsSize} bsStyle={this.state.transmitOwner ? 'success' : 'default'} onClick={this.toggleTransmit} ><Glyphicon glyph="bullhorn" /></Button>
					</Tooltip>
				</ButtonGroup>
				<OverlayTrigger trigger="click" placement="bottom" rootClose overlay={popover}>
					<Button bsSize={bsSize} >
						<Glyphicon glyph="eye-open" />
					</Button>
				</OverlayTrigger>
			</Gate>
		);
	}

	renderHTMLOverlays() {
		const node = this.props.nodes[ this.state.currentPage+1 ];
		if ( !node ) {
			return null;
		}
		if ( isObject( node ) && node.component ) {
			if ( node.style ) {
				return <div style={node.style} className="sketch-node-container-basic">{node.component}</div>;
			}
			return ( <div className="sketch-node-container" >
				{node.component}
			</div> );
		}
		return <div className="sketch-node-container" >{node}</div>;
	}

	render() {
		const bsSize = this.props.bsSize;
		let cursor = 'default';
		if ( this.state.mode === 'drawing' ) {
			cursor = 'crosshair';
		} else if ( this.state.mode === 'text' ) {
			cursor = 'text';
		} else if ( this.state.mode === 'drag' ) {
			cursor = 'move';
		}
		const canvas = <canvas
			className="sketch-canvas"
			width={this.state.canvasWidth}
			height={this.state.canvasHeight}
			style={{
				position: 'absolute',
				left: '0px',
				cursor: cursor,
				...this.props.style
			}}
			ref={( canvas ) => {
				if ( canvas ) {
					this.canvas = canvas;
					this.ctx = canvas.getContext( '2d' );
				}
			}}
			onClick={this.handleClick}
			onMouseDown={this.drawStart}
			onMouseMove={this.draw}
			onMouseOut={this.drawEnd}
			onMouseUp={this.drawEnd}
			onTouchCancel={this.drawEnd}
			onTouchEnd={this.drawEnd}
			onTouchMove={this.draw}
			onTouchStart={this.drawStart}
		/>;
		return (
			<Panel
				ref={( div ) => { this.sketchpadPanel = div; }}
				className="modal-container"
				style={{
					width: this.state.canvasWidth+2,
					position: 'relative'
				}}
				tabindex="0"
			>
				<div className="sketch-panel-heading clearfix unselectable">
					{this.renderPagination()}
					<ButtonGroup bsSize={bsSize} className="sketch-drag-delete-modes sketch-button-group" >
						<Tooltip placement="bottom" tooltip="Drag Mode" >
							<Button bsSize={bsSize} bsStyle={this.state.mode === 'drag' ? 'success' : 'default'} onClick={this.toggleDragMode} ><Glyphicon glyph="move" /></Button>
						</Tooltip>
						<Tooltip placement="bottom" tooltip="Delete Mode" >
							<Button bsSize={bsSize} bsStyle={this.state.mode === 'delete' ? 'success' : 'default'} onClick={this.toggleDeleteMode} ><Glyphicon glyph="remove" /></Button>
						</Tooltip>
					</ButtonGroup>
					{this.renderDrawingButtons()}
					{this.renderTextButtons()}
					<ButtonGroup bsSize={bsSize} className="sketch-button-group" >
						<Tooltip placement="right" tooltip="Change brush color" >
							<Button bsSize={bsSize} onClick={this.toggleColorPicker} style={{ background: this.state.color, color: 'white' }} >Color</Button>
						</Tooltip>
					</ButtonGroup>
					<ButtonGroup bsSize={bsSize} className="sketch-undo-redo sketch-button-group">
						<TooltipButton tooltip="Undo" onClick={this.undo} glyph="step-backward" disabled={this.state.playing} bsSize={bsSize} />
						<TooltipButton tooltip="Redo" disabled={this.state.nUndos <= 0 ||this.state.playing} glyph="step-forward" onClick={this.redo} bsSize={bsSize} />
						<TooltipButton tooltip="Clear current page" onClick={this.clear} label="Clear" disabled={this.state.playing || this.state.recording} bsSize={bsSize} />
						<TooltipButton tooltip="Reset all pages" onClick={() => {
							this.setState({
								showResetModal: !this.state.showResetModal
							});
						}} label="Reset" disabled={this.state.playing || this.state.recording} bsSize={bsSize} />
					</ButtonGroup>
					{this.renderRecordingButtons()}
					{this.renderTransmitButtons()}
					{this.renderSaveButtons()}
				</div>
				<div className="sketch-colorpicker" style={{ display: this.state.showColorPicker ? 'initial' : 'none' }} >
					<TwitterPicker
						color={this.state.color}
						colors={COLORPICKER_COLORS}
						onChangeComplete={this.handleColorChange}
						triangle="top-right"
					/>
				</div>
				<div style={{ width: this.state.canvasWidth, height: this.state.canvasHeight, overflow: 'auto', position: 'relative' }}>
					{this.renderHTMLOverlays()}
					{canvas}
				</div>
				<input type="text" className="sketch-text-input" style={{
					display: this.state.mode === 'text' ? 'inline-block' : 'none',
					fontSize: this.state.fontSize,
					fontFamily: this.state.fontFamily,
					color: this.state.color,
					width: this.state.canvasWidth
				}} onKeyDown={this.handleEnter} ref={( div ) => {
					this.textInput = div;
				}} />
				{this.renderUploadModal()}
				<NavigationModal
					container={this}
					show={this.state.showNavigationModal}
					onSelect={this.gotoPage}
					noPages={this.state.noPages}
					onHide={this.toggleNavigationModal}
				/>
				{this.renderProgressModal()}
				<ResetModal
					container={this}
					show={this.state.showResetModal}
					onSubmit={this.clearAll}
					onHide={() => {
						this.setState({ showResetModal: false });
					}}
				/>
				{ this.props.showTutorial ?
					<Joyride
						steps={guide}
						showProgress
						run={true}
					/> : null
				}
				<KeyControls
					container={this.sketchpadPanel}
					actions={{
						'ArrowRight': this.nextPage,
						'ArrowLeft': this.previousPage
					}}
				/>
			</Panel>
		);
	}
}


// TYPES //

Sketchpad.propDescriptions = {
	autoSave: 'controls whether the editor should save the current text to the local storage of the browser at a given time interval',
	intervalTime: 'time between auto saves',
	brushSize: 'size of the brush to paint with',
	bsSize: 'button sizes',
	color: 'color of the brush and texts',
	canvasWidth: 'width of the canvas element (in px)',
	canvasHeight: 'height of the canvas element (in px)',
	fullscreen: 'controls whether to automatically resize the canvas to the width and height of the browser window',
	disabled: 'whether to make the component read-only and forbid drawing on the sketchboard',
	fontFamily: 'Font family',
	fontSize: 'Font size',
	nodes: 'components to be rendered on top of specified slides; `keys` should correspond to page numbers, `values` to the components',
	noPages: 'initial number of pages',
	pdf: 'Link to PDF file for baked-in page backgrounds',
	showTutorial: 'show a tutorial for the sketchpad',
	transmitOwner: 'whether owner actions should be transmitted to other users in real-time',
	groupMode: 'controls whether all user\'s actions are transmitted to everyone else',
	style: 'CSS inline styles',
	onChange: 'callback invoked whenever a new line element is drawn'
};

Sketchpad.defaultProps = {
	autoSave: true,
	intervalTime: 30000,
	brushSize: 6,
	bsSize: 'small',
	color: '#444444',
	canvasWidth: 1200,
	canvasHeight: 700,
	fullscreen: false,
	disabled: false,
	fontFamily: 'Arial',
	fontSize: 24,
	nodes: {},
	noPages: 1,
	pdf: null,
	showTutorial: false,
	transmitOwner: true,
	groupMode: false,
	style: {},
	onChange() {}
};

Sketchpad.propTypes = {
	autoSave: PropTypes.bool,
	intervalTime: PropTypes.number,
	brushSize: PropTypes.number,
	bsSize: PropTypes.oneOf(['default', 'lg', 'large', 'sm', 'small', 'xs', 'xsmall']),
	color: PropTypes.string,
	canvasWidth: PropTypes.number,
	canvasHeight: PropTypes.number,
	fullscreen: PropTypes.bool,
	disabled: PropTypes.bool,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	nodes: PropTypes.object,
	noPages: PropTypes.number,
	pdf: PropTypes.string,
	showTutorial: PropTypes.bool,
	transmitOwner: PropTypes.bool,
	groupMode: PropTypes.bool,
	style: PropTypes.object,
	onChange: PropTypes.func
};

Sketchpad.contextTypes = {
	session: PropTypes.object
};


// EXPORTS //

export default Sketchpad;
