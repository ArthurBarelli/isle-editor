
/**
* Contains MIT-licensed code:
*
* The MIT License (MIT)
*
* Copyright (c) 2013 Yurii Lahodiuk
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
* the Software, and to permit persons to whom the Software is furnished to do so,
* subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// MODULES //

import sample from '@stdlib/random/sample';
import contains from '@stdlib/assert/contains';
import hasOwnProp from '@stdlib/assert/has-own-property';
import ln from '@stdlib/math/base/special/ln';
import round from '@stdlib/math/base/special/round';
import incrspace from '@stdlib/math/utils/incrspace';
import Plot from './tree_plot.js';
import split from './split.js';


// FUNCTIONS //

/**
* Calculating how many elements have the same
* values
*
* @param values - array of values
*/
function countUniqueValues( values, indices ) {
	const counter = {};

	// Detect different values of attribute:
	for ( let i = indices.length - 1; i >= 0; i--) {
		const idx = indices[ i ];
		counter[ values[ idx ] ] = 0;
	}

	// Count number of occurrences of each of value:
	for ( let i = indices.length - 1; i >= 0; i--) {
		const idx = indices[ i ];
		counter[ values[ idx ] ] += 1;
	}
	return counter;
}

/**
* Finding value which is most frequent in an array.
*
* @param values - array of values
*/
function mostFrequentValue( values, indices ) {
	// Counting number of occurrences:
	const counter = countUniqueValues( values, indices );

	let mostFrequentCount = 0;
	let mostFrequentValue;
	for ( let value in counter ) {
		if ( counter[value] > mostFrequentCount ) {
			mostFrequentCount = counter[value];
			mostFrequentValue = value;
		}
	}
	return mostFrequentValue;
}

function gini( values, indices ) {
	const counter = countUniqueValues( values, indices );
	let out = 0;
	for ( let i in counter ) {
		if ( hasOwnProp( counter, i ) ) {
			const p = counter[i] / indices.length;
			out += p * (1-p);
		}
	}
	return out;
}

/**
* Calculating entropy of a variable.
*
* @param values - array of values
*/
function entropy( values, indices ) {
	// Count number of occurrences of each value:
	const counter = countUniqueValues( values, indices );
	let entropy = 0;
	for ( let i in counter ) {
		if ( hasOwnProp( counter, i ) ) {
			const p = counter[i] / indices.length;
			entropy += -p * ln(p);
		}
	}
	return entropy;
}

/**
* Calculates the variance of a variable.
*
* @param values - array of values
*/
function variance( values, indices ) {
	const len = indices.length;
	let delta = 0;
	let mean = 0;
	let M2 = 0;
	let N = 0;

	if ( !len ) {
		return null;
	}
	if ( len < 2 ) {
		return 0;
	}
	for ( let i = 0; i < len; i++ ) {
		const idx = indices[ i ];
		const x = values[ idx ];
		N += 1;
		delta = x - mean;
		mean += delta / N;
		M2 += delta * ( x - mean );
	}
	return M2 / ( N - 1 );
}

/**
* Calculates the mean of a variable.
*
* @param values - array of values
*/
function mean( values, indices ) {
	const len = indices.length;
	if ( !len ) {
		return null;
	}
	let mu = 0;
	for ( let i = 0; i < len; i++ ) {
		const idx = indices[ i ];
		const delta = values[ idx ] - mu;
		mu += delta / (i+1);
	}
	return mu;
}

// VARIABLES //

const predicates = {
	'==': ( a, b ) => a == b, // eslint-disable-line eqeqeq
	'>=': ( a, b ) => a >= b
};


// MAIN //

/**
* Creates an instance of a decision tree for classification problems.
*
* @constructor
* @param opts - contains training set and some configuration parameters
*/
function ClassificationTreeConstructor( opts ) {
	const nobs = opts.data[ opts.response ].length;

	this.root = buildClassificationTree({
		data: opts.data,
		response: opts.response,
		predictors: opts.predictors,
		indices: opts.indices ? opts.indices : incrspace( 0, nobs, 1 ),
		minItemsCount: opts.minItemsCount || 50,
		minBucket: opts.minBucket || ( round( ( opts.minItemsCount || 50 ) / 3 )),
		scoreThreshold: opts.scoreThreshold || 0.01,
		maxTreeDepth: opts.maxTreeDepth || 20,
		quantitative: opts.quantitative,
		criterion: opts.criterion === 'gini' ? gini : entropy
	});

	this.predict = ( data, idx ) => {
		if ( idx === void 0 ) {
			const nobs = data[ opts.predictors[ 0 ] ].length;
			const out = new Array( nobs );
			for ( let i = 0; i < nobs; i++ ) {
				out[ i ] = predict( this.root, data, i );
			}
			return out;
		}
		return predict( this.root, data, idx );
	};
}

/**
 * Creates an instance of DecisionTree
 *
 * @constructor
 * @param builder - contains training set and
 *                  some configuration parameters
 */
function RegressionTreeConstructor( opts ) {
	const nobs = opts.data[ opts.response ].length;

	this.root = buildRegressionTree({
		data: opts.data,
		response: opts.response,
		predictors: opts.predictors,
		indices: opts.indices ? opts.indices : incrspace( 0, nobs, 1 ),
		minItemsCount: opts.minItemsCount || 50,
		minBucket: opts.minBucket || ( round( ( opts.minItemsCount || 50 ) / 3 )),
		scoreThreshold: opts.scoreThreshold || 0.01,
		maxTreeDepth: opts.maxTreeDepth || 20,
		quantitative: opts.quantitative
	});

	this.predict = ( data, idx ) => {
		if ( idx === void 0 ) {
			const nobs = data[ opts.predictors[ 0 ] ].length;
			const out = new Array( nobs );
			for ( let i = 0; i < nobs; i++ ) {
				out[ i ] = Number( predict( this.root, data, i ) );
			}
			return out;
		}
		return Number( predict( this.root, data, idx ) );
	};
}

/**
* Creates an instance of RandomForest with specific number of trees.
*
* @constructor
* @param opts - contains configuration parameters for building decision trees
*/
function RandomForestClassifierConstructor( opts ) {
	this.trees = buildRandomForestClassifier( opts );

	this.predict = ( data, idx ) => {
		if ( idx === void 0 ) {
			const nobs = data[ opts.predictors[ 0 ] ].length;
			const out = new Array( nobs );
			for ( let i = 0; i < nobs; i++ ) {
				out[ i ] = predictRandomForest( this.trees, data, i );
			}
			return out;
		}
		return predictRandomForest( this.trees, data, idx );
	};
}

/**
* Function for building classification decision tree.
*/
function buildClassificationTree( opts ) {
	const {
		data, predictors, indices, response,
		minItemsCount, scoreThreshold, maxTreeDepth,
		quantitative, criterion, minBucket, mTry
	} = opts;
	const nobs = indices.length;
	if ( ( maxTreeDepth === 0 ) || ( nobs <= minItemsCount ) ) {
		// Restriction by maximal depth of tree or size of training set is to small so we have to terminate process of building tree...
		return {
			category: mostFrequentValue( data[ response ], indices )
		};
	}
	const initialScore = criterion( data[ response ], indices );

	// Used as hash-set for avoiding the checking of split by rules with the same 'attribute-predicate-pivot' more than once
	const alreadyChecked = {};

	let bestSplit = {
		gain: 0
	};

	if ( mTry ) {
		predictors = sample( predictors, { size: mTry });
	}
	for ( let i = nobs - 1; i >= 0; i-- ) {
		const idx = indices[ i ];
		for ( let j = 0; j < predictors.length; j++ ) {
			const attr = predictors[ j ];

			// Let the value of current attribute be the pivot:
			const pivot = data[ attr ][ idx ];

			// Pick the predicate depending on the type of the attribute value...
			let predicateName;
			if ( contains( quantitative, attr ) ) {
				predicateName = '>=';
			} else {
				// No sense to compare non-numeric attributes so we will check only equality of such attributes...
				predicateName = '==';
			}

			const attrPredPivot = attr + predicateName + pivot;
			if ( alreadyChecked[attrPredPivot] ) {
				// Skip such pairs of 'attribute-predicate-pivot' which have been already checked...
				continue;
			}
			alreadyChecked[ attrPredPivot ] = true;
			const predicate = predicates[ predicateName ];

			// Splitting training set by given 'attribute-predicate-value':
			const currSplit = split( data, indices, attr, predicate, pivot );

			// Recursively calculating for subsets:
			const matchEntropy = criterion( data[ response ], currSplit.match );
			const notMatchEntropy = criterion( data[ response ], currSplit.notMatch );

			// Calculating gain:
			let newScore = 0;
			newScore += matchEntropy * currSplit.match.length;
			newScore += notMatchEntropy * currSplit.notMatch.length;
			newScore /= nobs;
			const currGain = initialScore - newScore;
			if (
				currGain > bestSplit.gain &&
				currSplit.match.length > minBucket &&
				currSplit.notMatch.length > minBucket
			) {
				// Remember pairs 'attribute-predicate-value' which provide gain...
				bestSplit = currSplit;
				bestSplit.predicateName = predicateName;
				bestSplit.predicate = predicate;
				bestSplit.attribute = attr;
				bestSplit.pivot = pivot;
				bestSplit.gain = currGain;
			}
		}
	}

	if ( !bestSplit.gain || ( bestSplit.gain / initialScore ) < scoreThreshold ) {
		return { category: mostFrequentValue( data[ response ], indices ) };
	}
	// Building sub-trees:
	opts.maxTreeDepth = maxTreeDepth - 1;

	opts.indices = bestSplit.match;
	const matchSubTree = buildClassificationTree( opts );

	opts.indices = bestSplit.notMatch;
	const notMatchSubTree = buildClassificationTree( opts );

	return {
		attribute: bestSplit.attribute,
		predicate: bestSplit.predicate,
		predicateName: bestSplit.predicateName,
		pivot: bestSplit.pivot,
		match: matchSubTree,
		notMatch: notMatchSubTree,
		matchedCount: bestSplit.match.length,
		notMatchedCount: bestSplit.notMatch.length
	};
}

/**
* Function for building classification decision tree.
*/
function buildRegressionTree( opts ) {
	const {
		data, predictors, indices, response,
		minItemsCount, scoreThreshold, maxTreeDepth,
		quantitative, minBucket, mTry
	} = opts;

	const nobs = indices.length;
	if ((maxTreeDepth === 0) || ( nobs <= minItemsCount)) {
		// restriction by maximal depth of tree
		// or size of training set is to small
		// so we have to terminate process of building tree
		return {
			category: mean( data[ response ], indices )
		};
	}

	var initialScore = variance( data[ response ], indices );

	// used as hash-set for avoiding the checking of split by rules
	// with the same 'attribute-predicate-pivot' more than once
	var alreadyChecked = {};

	// this variable expected to contain rule, which splits training set
	// into subsets with smaller values of entropy (produces informational gain)
	let bestSplit = {
		gain: 0
	};

	if ( mTry ) {
		predictors = sample( predictors, { size: mTry });
	}
	for ( let i = nobs - 1; i >= 0; i-- ) {
		const idx = indices[ i ];

		// iterating over all attributes of item
		for ( let j = 0; j < predictors.length; j++ ) {
			const attr = predictors[ j ];

			// let the value of current attribute be the pivot
			var pivot = data[ attr ][ idx ];

			// pick the predicate
			// depending on the type of the attribute value
			var predicateName;
			if ( contains( quantitative, attr ) ) {
				predicateName = '>=';
			} else {
				// there is no sense to compare non-numeric attributes
				// so we will check only equality of such attributes
				predicateName = '==';
			}

			var attrPredPivot = attr + predicateName + pivot;
			if ( alreadyChecked[attrPredPivot] ) {
				// skip such pairs of 'attribute-predicate-pivot',
				// which been already checked
				continue;
			}
			alreadyChecked[attrPredPivot] = true;

			var predicate = predicates[predicateName];

			// splitting training set by given 'attribute-predicate-value'
			var currSplit = split( data, indices, attr, predicate, pivot );

			// calculating for subsets:
			var matchEntropy = variance( data[ response ], currSplit.match );
			var notMatchEntropy = variance( data[ response ], currSplit.notMatch );

			// calculating informational gain
			let newScore = 0;
			newScore += matchEntropy * currSplit.match.length;
			newScore += notMatchEntropy * currSplit.notMatch.length;
			newScore /= nobs;
			var currGain = initialScore - newScore;

			if (
				currGain > bestSplit.gain &&
				currSplit.match.length > minBucket &&
				currSplit.notMatch.length > minBucket
			) {
				// remember pairs 'attribute-predicate-value'
				// which provides informational gain
				bestSplit = currSplit;
				bestSplit.predicateName = predicateName;
				bestSplit.predicate = predicate;
				bestSplit.attribute = attr;
				bestSplit.pivot = pivot;
				bestSplit.gain = currGain;
			}
		}
	}

	if ( !bestSplit.gain || ( bestSplit.gain / initialScore ) < scoreThreshold ) {
		return { category: mean( data[ response ], indices ) };
	}

	// Building sub-trees:
	opts.maxTreeDepth = maxTreeDepth - 1;

	opts.indices = bestSplit.match;
	var matchSubTree = buildRegressionTree( opts );

	opts.indices = bestSplit.notMatch;
	var notMatchSubTree = buildRegressionTree( opts );

	return {
		attribute: bestSplit.attribute,
		predicate: bestSplit.predicate,
		predicateName: bestSplit.predicateName,
		pivot: bestSplit.pivot,
		match: matchSubTree,
		notMatch: notMatchSubTree,
		matchedCount: bestSplit.match.length,
		notMatchedCount: bestSplit.notMatch.length
	};
}

/**
* Returns the predicted value for the i-th observation using the decision tree.
*/
function predict( tree, data, i ) {
	// Traversing tree from the root to leaf:
	while ( true ) {
		if ( tree.category ) {
			// Only leafs contains predicted category...
			return tree.category;
		}
		const attr = tree.attribute;
		const value = data[ attr ][ i ];
		const predicate = tree.predicate;
		const pivot = tree.pivot;

		// Move to one of the sub-trees:
		if ( predicate( value, pivot ) ) {
			tree = tree.match;
		} else {
			tree = tree.notMatch;
		}
	}
}

/**
* Building array of decision trees.
*/
function buildRandomForestClassifier( opts ) {
	// Creating training sets for each tree:
	const trainingSets = [];
	const nobs = opts.data[ opts.response ].length;
	const indices = incrspace( 0, nobs, 1 );
	for ( let t = 0; t < opts.nTrees; t++ ) {
		trainingSets[ t ] = sample( indices );
	}
	const forest = [];
	for ( let t = 0; t < opts.nTrees; t++ ) {
		opts.indices = trainingSets[ t ];
		const tree = new ClassificationTreeConstructor( opts );
		forest.push( tree );
	}
	return forest;
}

/**
* Returns the majority vote prediction for the chosen item.
*/
function predictRandomForest( forest, data, idx ) {
	const result = {};
	for ( let i = 0; i < forest.length; i++ ) {
		const tree = forest[ i ];
		const prediction = tree.predict( data, idx );
		result[ prediction ] = result[ prediction ] ? result[ prediction ] + 1 : 1;
	}
	let max = -1;
	let out;
	for ( let key in result ) {
		if ( hasOwnProp( result, key ) ) {
			if ( result[ key ] > max ) {
				max = result[ key ];
				out = key;
			}
		}
	}
	return out;
}


// EXPORTS //

export const ClassificationTree = ClassificationTreeConstructor;
export const RegressionTree = RegressionTreeConstructor;
export const RandomForestClassifier = RandomForestClassifierConstructor;
export const TreePlot = Plot;
