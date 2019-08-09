// MODULES //

import Typo from 'typo-js';
import contains from '@stdlib/assert/contains';
import isWhitespace from '@stdlib/assert/is-whitespace';


// VARIABLES //

const AFF_URL_EN = 'https://cdn.jsdelivr.net/codemirror.spell-checker/latest/en_US.aff';
const DIC_URL_EN = 'https://cdn.jsdelivr.net/codemirror.spell-checker/latest/en_US.dic';
const AFF_URL_DE = 'https://unpkg.com/dictionary-de@2.0.0/index.aff';
const DIC_URL_DE = 'https://unpkg.com/dictionary-de@2.0.0/index.dic';
const AFF_URL_FR = 'https://unpkg.com/dictionary-fr@2.0.0/index.aff';
const DIC_URL_FR = 'https://unpkg.com/dictionary-fr@2.0.0/index.dic';
const AFF_URL_IT = 'https://unpkg.com/dictionary-it@2.0.0/index.aff';
const DIC_URL_IT = 'https://unpkg.com/dictionary-it@2.0.0/index.dic';
const AFF_URL_PT = 'https://unpkg.com/dictionary-pt@2.0.0/index.aff';
const DIC_URL_PT = 'https://unpkg.com/dictionary-pt@2.0.0/index.dic';
const AFF_URL_SV = 'https://unpkg.com/dictionary-sv@2.0.0/index.aff';
const DIC_URL_SV = 'https://unpkg.com/dictionary-sv@2.0.0/index.dic';
const RE_NEWLINE = /\r?\n/;
const RX_WORD = '!\'"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ ';
const RE_CAMELCASE = /[A-Z]/;
const RE_DIGITS = /\d+/;


// FUNCTION //

const nextWhitespace = ( str, pos ) => {
	for ( let i = pos; i < str.length; i++ ) {
		const v = str[ i ];
		if ( v === ' ' || v === '\n' ) {
			return i - 1;
		}
	}
	return str.length;
};


// MAIN //

function SpellChecker( text, options ) {
	// Initialize
	options = options || {};
	const language = options.language;

	let AFF_URL;
	let DIC_URL;
	switch ( language ) {
	case 'en-US':
		AFF_URL = AFF_URL_EN;
		DIC_URL = DIC_URL_EN;
	break;
	case 'de':
		AFF_URL = AFF_URL_DE;
		DIC_URL = DIC_URL_DE;
	break;
	case 'fr':
		AFF_URL = AFF_URL_FR;
		DIC_URL = DIC_URL_FR;
	break;
	case 'it':
		AFF_URL = AFF_URL_IT;
		DIC_URL = DIC_URL_IT;
	break;
	case 'pt':
		AFF_URL = AFF_URL_PT;
		DIC_URL = DIC_URL_PT;
	break;
	case 'sv':
		AFF_URL = AFF_URL_SV;
		DIC_URL = DIC_URL_SV;
	break;
	}
	// Load AFF/DIC data
	if ( !SpellChecker.affLoading ) {
		SpellChecker.affLoading = true;
		var xhrAFF = new XMLHttpRequest();
		xhrAFF.open('GET', AFF_URL, true);
		xhrAFF.onload = function onLoad() {
			if ( xhrAFF.readyState === 4 && xhrAFF.status === 200) {
				SpellChecker.affData = xhrAFF.responseText;
				SpellChecker.numLoaded++;

				if ( SpellChecker.numLoaded === 2 ) {
					SpellChecker.typo = new Typo('en_US', SpellChecker.affData, SpellChecker.dicData, {
						platform: 'any'
					});
				}
			}
		};
		xhrAFF.send( null );
	}
	if ( !SpellChecker.dicLoading ) {
		SpellChecker.dicLoading = true;
		var xhrDIC = new XMLHttpRequest();
		xhrDIC.open('GET', DIC_URL, true);
		xhrDIC.onload = function onLoad() {
			if ( xhrDIC.readyState === 4 && xhrDIC.status === 200 ) {
				SpellChecker.dicData = xhrDIC.responseText;
				SpellChecker.numLoaded++;

				if ( SpellChecker.numLoaded === 2 ) {
					SpellChecker.typo = new Typo( 'en_US', SpellChecker.affData, SpellChecker.dicData, {
						platform: 'any'
					});
				}
			}
		};
		xhrDIC.send( null );
	}
	if ( SpellChecker.typo ) {
		const errs = [];
		let word = '';
		let line = 1;
		let col = 0;
		let startColumn = 0;
		for ( let i = 0; i < text.length; i++ ) {
			const ch = text[ i ];
			col += 1;
			if ( !contains( RX_WORD, ch ) ) {
				word += ch;
			} else if ( word.length > 1 ) {
				const beforeNextWhitespacePos = nextWhitespace( text, i );
				if ( beforeNextWhitespacePos > i + 1 ) {
					word = '';
					i = beforeNextWhitespacePos;
				}
			}
			if ( isWhitespace( ch ) || ch === '=' ) {
				// Do not flag strings containing digits:
				if ( RE_DIGITS.test( word ) ) {
					word = '';
				}
				// Assume that unknown capitalized words inside a sentence refer to proper nouns...
				else if ( RE_CAMELCASE.test( word ) ) {
					word = '';
				}
				else {
					const res = SpellChecker.typo.check( word );
					if ( !res ) {
						errs.push({
							startLineNumber: line,
							startColumn: startColumn,
							endLineNumber: line,
							endColumn: col - 1,
							code: word,
							message: 'Unknown word: ',
							severity: 2
						});
					}
				}
				startColumn = col;
				word = '';
			}
			const isEndOfLine = RE_NEWLINE.test( ch );
			if ( isEndOfLine ) {
				line += 1;
				col = 1;
			}
		}
		return errs;
	}
	return null;
}


// Initialize data globally to reduce memory consumption
SpellChecker.numLoaded = 0;
SpellChecker.affLoading = false;
SpellChecker.dicLoading = false;
SpellChecker.affData = '';
SpellChecker.dicData = '';


// EXPORTS //

export default SpellChecker;
