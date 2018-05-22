import React, { Component } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import { select } from 'd3';
import './style.css';


// MAIN //

class Node extends Component {
	constructor(props) {
		super(props);
		const { parent } = props.nodeData;
		const originX = parent ? parent.x : 0;
		const originY = parent ? parent.y : 0;

		this.state = {
			transform: this.setTransformOrientation(originX, originY),
			initialStyle: {
				opacity: 0
			}
		};

		this.handleClick = this.handleClick.bind(this);
	}

	componentDidMount() {
		const { x, y } = this.props.nodeData;
		const transform = this.setTransformOrientation(x, y);

		this.applyTransform(transform);
	}

	componentDidUpdate() {
		const transform = this.setTransformOrientation(
			this.props.nodeData.x,
			this.props.nodeData.y,
		);
		this.applyTransform(transform);
	}

	setTransformOrientation(x, y) {
		return this.props.orientation === 'horizontal' ?
			`translate(${y},${x})` :
			`translate(${x},${y})`;
	}

	applyTransform(transform, opacity = 1, done = () => {}) {
		const { transitionDuration } = this.props;

		select(this.node)
			.transition()
			.duration(transitionDuration)
			.attr('transform', transform)
			.style('opacity', opacity)
			.on('end', done);
	}

	handleClick() {
		this.props.onClick( this.props.nodeData.data.id );
	}

	componentWillLeave(done) {
		const { parent } = this.props.nodeData;
		const originX = parent ? parent.x : 0;
		const originY = parent ? parent.y : 0;
		const transform = this.setTransformOrientation(originX, originY);
		this.applyTransform(transform, 0, done);
	}

	render() {
		const { nodeData, nodeSvgShape, textLayout, styles } = this.props;
		const nodeStyle = nodeData._children ?
			{ ...styles.node } :
			{ ...styles.leafNode };
		return (
			<g
				id={nodeData.id}
				ref={n => {
					this.node = n;
				}}
				style={this.state.initialStyle}
				className={nodeData._children ? 'nodeBase' : 'leafNodeBase'}
				transform={this.state.transform}
				onClick={this.handleClick}
			>
				{/* TODO: DEPRECATE <circle /> */}
				{this.props.circleRadius ? (
					<circle r={this.props.circleRadius} style={nodeStyle.circle} />
				) : (
					React.createElement(nodeSvgShape.shape, {
						...nodeSvgShape.shapeProps,
						...nodeStyle.circle
					})
				)}

				<text
					className="nodeNameBase"
					style={nodeStyle.name}
					textAnchor={textLayout.textAnchor}
					x={textLayout.x}
					y={textLayout.y}
					dy=".35em"
				>
					{this.props.name}
				</text>
				<text
					className="nodeAttributesBase"
					y={textLayout.y + 10}
					textAnchor={textLayout.textAnchor}
					style={nodeStyle.attributes}
				>
					{this.props.attributes &&
						Object.keys(this.props.attributes).map(labelKey => (
							<tspan x={textLayout.x} dy="1.2em" key={uuid.v4()}>
								{labelKey}: {this.props.attributes[labelKey]}
							</tspan>
						))}
				</text>
			</g>
		);
	}
}


// TYPES //

Node.defaultProps = {
	attributes: void 0,
	circleRadius: void 0,
	styles: {
		node: {
			circle: {},
			name: {},
			attributes: {}
		},
		leafNode: {
			circle: {},
			name: {},
			attributes: {}
		}
	}
};

Node.propTypes = {
	attributes: PropTypes.object,
	circleRadius: PropTypes.number,
	name: PropTypes.string.isRequired,
	nodeData: PropTypes.object.isRequired,
	nodeSvgShape: PropTypes.object.isRequired,
	onClick: PropTypes.func.isRequired,
	orientation: PropTypes.oneOf([ 'horizontal', 'vertical' ]).isRequired,
	styles: PropTypes.object,
	textLayout: PropTypes.object.isRequired,
	transitionDuration: PropTypes.number.isRequired
};


// EXPORTS //

export default Node;
