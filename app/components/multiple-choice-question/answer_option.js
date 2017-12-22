// MODULES //

import React from 'react';
import PropTypes from 'prop-types';
import { ListGroupItem, OverlayTrigger, Popover } from 'react-bootstrap';


// MAIN //

const AnswerOption = ( props ) => {
	let bsStyle;
	if ( props.provideFeedback ) {
		if ( props.correct === true ) {
			bsStyle = 'success';
		}
		else if ( props.correct === false ) {
			bsStyle = 'danger';
		}
		else if ( props.solution === true ) {
			// Case: User did not pick correct answer...
			bsStyle = 'warning';
		}
	}
	const popover =
		<Popover id={props.no}>
			<strong>{ props.solution ? 'Correct answer: ' : 'Incorrect answer: ' }</strong>
			{props.answerExplanation}
		</Popover>;

	if ( props.disabled ) {
		return (
			<ListGroupItem
				bsStyle={bsStyle}
				disabled
			>
				{props.answerContent}
			</ListGroupItem>
		);
	}
	else if ( props.submitted ) {
		return (
			<OverlayTrigger
				trigger={[ 'click', 'hover' ]}
				placement="right"
				overlay={props.answerExplanation ? popover : <span />}
			>
				<ListGroupItem
					onClick={props.onAnswerSelected}
					bsStyle={bsStyle}
					disabled={!props.provideFeedback}
				>
					{props.answerContent}
				</ListGroupItem>
			</OverlayTrigger>
		);
	}
	return (
		<ListGroupItem
			onClick={props.onAnswerSelected}
			active={props.active}
		>
			{props.answerContent}
		</ListGroupItem>
	);
};


// TYPES //

AnswerOption.propTypes = {
	active: PropTypes.bool.isRequired,
	answerContent: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.string
	]).isRequired,
	answerExplanation: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.string
	]).isRequired,
	correct: PropTypes.bool.isRequired,
	disabled: PropTypes.bool.isRequired,
	no: PropTypes.string.isRequired,
	onAnswerSelected: PropTypes.func.isRequired,
	provideFeedback: PropTypes.bool.isRequired,
	solution: PropTypes.bool.isRequired,
	submitted: PropTypes.bool.isRequired
};


// EXPORTS //

export default AnswerOption;
