// MODULES //

import isAlphanumeric from '@stdlib/assert/is-alphanumeric';
import isWhitespace from '@stdlib/assert/is-whitespace';
import removeFirst from '@stdlib/string/remove-first';
import COMPONENT_DOCS from './components_documentation.json';
import { componentSnippets } from 'snippets';


// VARIABLES //

const RE_TAG_START = /<[a-z]*$/i;


// MAIN //

function factory( monaco ) {
	return provideCompletionItems;

	function provideCompletionItems( model, position ) {
		const lastLine = model.getValueInRange({
			startLineNumber: position.lineNumber,
			startColumn: 0,
			endLineNumber: position.lineNumber,
			endColumn: position.column
		});
		const lastChar = lastLine[ lastLine.length-1 ];
		let suggestions = [];
		if (
			isWhitespace( lastChar ) ||
			lastChar === '<' ||
			!lastChar ||
			isAlphanumeric( lastChar )
		) {
			suggestions = componentSnippets.map( x => {
				const docs = COMPONENT_DOCS[ x.name ];
				let description = 'No documentation available';
				if ( docs ) {
					description = docs.description;
				}
				return {
					label: x.name,
					kind: monaco.languages.CompletionItemKind.Snippet,
					documentation: description,
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					insertText: RE_TAG_START.test( lastLine ) ? removeFirst( x.value ) : x.value,
					sortText: 'b'+x.value
				};
			});
		}
		return {
			suggestions: suggestions,
			incomplete: false
		};
	}
}


// EXPORTS //

export default factory;
