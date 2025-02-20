// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// MODULES //

import CodeMirror from 'codemirror';


// MAIN //

CodeMirror.commands.tabAndIndentMarkdownList = ( cm ) => {
	var ranges = cm.listSelections();
	var pos = ranges[0].head;
	var eolState = cm.getStateAfter(pos.line);
	var inList = eolState.list !== false;

	if (inList) {
		cm.execCommand('indentMore');
		return;
	}

	if (cm.options.indentWithTabs) {
		cm.execCommand('insertTab');
	}
	else {
		var spaces = Array(cm.options.tabSize + 1).join(' ');
		cm.replaceSelection(spaces);
	}
};

CodeMirror.commands.shiftTabAndUnindentMarkdownList = ( cm ) => {
	var ranges = cm.listSelections();
	var pos = ranges[0].head;
	var eolState = cm.getStateAfter(pos.line);
	var inList = eolState.list !== false;

	if (inList) {
		cm.execCommand('indentLess');
		return;
	}

	if (cm.options.indentWithTabs) {
		cm.execCommand('insertTab');
	}
	else {
		var spaces = Array(cm.options.tabSize + 1).join(' ');
		cm.replaceSelection(spaces);
	}
};
