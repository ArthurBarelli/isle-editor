// MODULES //

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'debug';
import Card from 'react-bootstrap/Card';
import generateUID from 'utils/uid';
import DraggableList from 'components/draggable-list';
import TimedButton from 'components/timed-button';
import HintButton from 'components/hint-button';
import ResponseVisualizer from 'components/response-visualizer';
import ChatButton from 'components/chat-button';
import FeedbackButtons from 'components/feedback';
import SessionContext from 'session/context.js';
import { ORDER_QUESTION_SUBMISSION, ORDER_QUESTION_OPEN_HINT } from 'constants/actions.js';
import './order-question.css';


// VARIABLES //

const uid = generateUID( 'order-question' );
const debug = logger( 'isle:order-question' );


// MAIN //

/**
* An order question component that asks student to bring a collection of elements into the correct order.
*
* @property {string} question - question for which the student has to bring the available `options` into the correct order
* @property {Array} options - an array of objects with `id` and `text` keys which the student has to bring into the correct ordering, which is assumed to be the supplied order
* @property {boolean} provideFeedback - controls whether to show a notification displaying whether the submitted answer is correct or not
* @property {Array} hints - hints providing guidance on how to answer the question
* @property {string} hintPlacement - placement of the hints (either `top`, `left`, `right`, or `bottom`)
* @property {boolean} feedback - controls whether to display feedback buttons
* @property {boolean} chat - controls whether the element should have an integrated chat
* @property {boolean} disableSubmitNotification - controls whether to disable submission notifications
* @property {string} failureMsg - message to be displayed when student submits a wrong answer
* @property {string} successMsg - message to be displayed when student submits the correct answer
* @property {Object} style - CSS inline styles
* @property {Function} onChange - callback  which is triggered after dragging an element; has two parameters: a `boolean` indicating whether the elements were placed in the correct order and and `array` with the current ordering
* @property {Function} onSubmit - callback invoked when answer is submitted; has as a sole parameter a `boolean` indicating whether the elements were placed in the correct order
*/
class OrderQuestion extends Component {
	constructor( props ) {
		super( props );

		this.id = props.id || uid( props );

		// Initialize state variables...
		this.state = {
			cards: null,
			correct: false,
			submitted: false
		};
	}

	handleChange = ( cards ) => {
		let correct = true;
		for ( let i = 0; i < cards.length; i++ ) {
			if ( cards[ i ].id !== i ) {
				correct = false;
				break;
			}
		}
		this.props.onChange( cards, correct );
		this.setState({
			cards,
			correct
		});
	}

	logHint = ( idx ) => {
		debug( 'Logging hint...' );
		const session = this.context;
		session.log({
			id: this.id,
			type: ORDER_QUESTION_OPEN_HINT,
			value: idx
		});
	}

	sendSubmitNotification = () => {
		const session = this.context;
		if ( this.props.provideFeedback ) {
			if ( this.state.correct ) {
				session.addNotification({
					title: 'Correct',
					message: this.props.successMsg,
					level: 'success',
					position: 'tr'
				});
			} else {
				session.addNotification({
					title: 'Incorrect',
					message: this.props.failureMsg,
					level: 'error',
					position: 'tr'
				});
			}
		} else {
			session.addNotification({
				title: 'Submitted',
				message: 'You have successfully submitted your answer',
				level: 'info',
				position: 'tr'
			});
		}
	}

	handleSubmit = () => {
		const session = this.context;
		if ( !this.props.disableSubmitNotification ) {
			this.sendSubmitNotification();
		}
		this.props.onSubmit( this.state.cards, this.state.correct );
		this.setState({
			submitted: true
		});
		session.log({
			id: this.id,
			type: ORDER_QUESTION_SUBMISSION,
			value: this.state.cards
		});
	}

	render() {
		const nHints = this.props.hints.length;
		return (
			<Card id={this.id} className="order-question" style={this.props.style} >
				<Card.Body style={{ width: this.props.feedback ? 'calc(100%-60px)' : '100%', display: 'inline-block' }} >
					<label>{this.props.question}</label>
					<DraggableList shuffle data={this.props.options} onChange={this.handleChange} />
					<div className="order-question-toolbar">
						{ nHints > 0 ?
							<HintButton onClick={this.logHint} hints={this.props.hints} placement={this.props.hintPlacement} /> :
							null
						}
						<TimedButton className="submit-button" variant="primary" size="sm" onClick={this.handleSubmit}>
							{ this.state.submitted ? 'Resubmit' : 'Submit' }
						</TimedButton>
						{
							this.props.chat ?
								<ChatButton for={this.id} /> : null
						}
					</div>
					<ResponseVisualizer
						id={this.id}
						data={{
							type: 'text'
						}}
						info="ORDER_QUESTION_SUBMISSION"
					/>
					{ this.props.feedback ? <FeedbackButtons
						id={this.id+'_feedback'}
					/> : null }
				</Card.Body>
			</Card>
		);
	}
}


// PROPERTIES //

OrderQuestion.defaultProps = {
	question: '',
	provideFeedback: true,
	hints: [],
	hintPlacement: 'bottom',
	feedback: true,
	chat: false,
	failureMsg: 'Not quite, try again!',
	successMsg: 'That\'s the correct ordering!',
	disableSubmitNotification: false,
	style: {},
	onChange() {},
	onSubmit() {}
};

OrderQuestion.propTypes = {
	question: PropTypes.string,
	options: PropTypes.array.isRequired,
	provideFeedback: PropTypes.bool,
	hintPlacement: PropTypes.string,
	hints: PropTypes.arrayOf( PropTypes.string ),
	feedback: PropTypes.bool,
	chat: PropTypes.bool,
	failureMsg: PropTypes.string,
	successMsg: PropTypes.string,
	disableSubmitNotification: PropTypes.bool,
	style: PropTypes.object,
	onChange: PropTypes.func,
	onSubmit: PropTypes.func
};

OrderQuestion.contextType = SessionContext;


// EXPORTS //

export default OrderQuestion;
