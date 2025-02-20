// MODULES //

import { app, dialog, ipcMain, BrowserWindow } from 'electron';
import fs from 'fs';
import { extname, basename } from 'path';
import logger from 'debug';
import Store from 'electron-store';
import { EXTENSIONS } from './globals.js';
import createWindow from './create_window.js';
import { exec } from 'child_process';


// VARIABLES //

const debug = logger( 'isle-editor:main' );
const config = new Store( 'ISLE' );


// MAIN //

app.on( 'certificate-error', ( event, webContents, url, error, certificate, callback ) => {
	debug( 'Test URL:' );
	if ( /https:\/\/localhost/g.test( url ) ) {
		// Verification logic.
		event.preventDefault();
		return callback( true );
	}
	callback( false );
});

ipcMain.on( 'save-file', ( e, { data, filePath }) => {
	fs.writeFile( filePath, data, 'utf-8', ( err ) => {
		if ( err ) {
			return;
		}
		e.sender.send( 'file-loaded', {
			fileName: basename( filePath ),
			filePath: filePath,
			file: data
		});
	});
});

ipcMain.on( 'save-file-as', ( e, { data, filePath }) => {
	const opts = {
		filters: [
			{ name: 'isle', extensions: [ 'isle' ]}
		],
		buttonLabel: 'Save file'
	};
	if ( filePath ) {
		opts.defaultPath = filePath;
	}
	dialog.showSaveDialog( opts, ( filePath ) => {
		if ( filePath ) {
			fs.writeFile( filePath, data, 'utf-8', ( err ) => {
				if ( err ) {
					return;
				}
				BrowserWindow.fromWebContents( e.sender ).setTitle( `ISLE -- ${filePath}` );
				e.sender.send( 'file-loaded', {
					fileName: basename( filePath ),
					filePath: filePath,
					file: data
				});
			});
		}
	});
});


// EXPORTS //

export function hideToolbar( browserWindow ) {
	if ( browserWindow ) {
		browserWindow.webContents.send( 'hide-toolbar' );
	}
}

export function openBrowser( url ) {
	debug( `Should open ${url} in the default browser...` ); // eslint-disable-line no-console
	exec( 'xdg-open ' + url );
}

export function openFile( filePath, browserWindow ) {
	debug( 'Open file at path '+filePath );
	if ( !filePath ) {
		return;
	}
	if (
		EXTENSIONS.indexOf( extname( filePath )
			.slice( 1 )
			.toLowerCase()
		) !== -1 || !extname( filePath )
	) {
		const fileSize = fs.statSync( filePath )[ 'size' ];
		if ( fileSize >= 1048576 ) { // 1MB
			const confirm = dialog.showMessageBox( browserWindow, {
				type: 'error',
				title: 'Unsupported File',
				message: 'You are trying to load a large file, ISLE Editor will be unresponsive',
				detail: 'Do you still want to load this file?',
				buttons: [ 'Proceed', 'Cancel' ]
			});
			if ( confirm === 1 ) return;
		}
		fs.readFile( filePath, 'utf-8', ( err ) => {
			if ( err ) {
				return err;
			}
			createWindow( filePath );
		});
		return;
	}
	dialog.showMessageBox( browserWindow, {
		type: 'error',
		title: 'Unsupported File',
		message: 'You are trying to load a not supported file',
		detail: 'The supported file extensions are \n\n' + EXTENSIONS.join( ' ,' ),
		buttons: [ 'Ok' ]
	});
}

export function open({ browserWindow }) {
	const filePath = config.get( 'mostRecentFilePath' );
	const opts = {
		properties: [ 'openFile' ],
		filters: [
			{ name: 'isle', extensions: [ 'isle' ]},
			{ name: 'markdown', extensions: [ 'markdown', 'md', 'mdown', 'mkd', 'mdwn' ]},
			{ name: 'html', extensions: [ 'html' ]}
		],
		buttonLabel: 'Open file'
	};
	if ( filePath ) {
		opts.defaultPath = filePath;
	}
	dialog.showOpenDialog( browserWindow, opts, ( fileNames ) => {
		if ( fileNames === void 0 ) {
			return;
		}
		openFile( fileNames[ 0 ], browserWindow );
	});
}

export function reload( browserWindow ) {
	if ( browserWindow ) {
		browserWindow.webContents.send( 'prepare-reload' );
		browserWindow.reload();
	}
}

export function save({ browserWindow }) {
	browserWindow.webContents.send( 'save-file' );
}

export function saveAs({ browserWindow }) {
	browserWindow.webContents.send( 'save-file-as' );
}

export function newFile({ browserWindow }) {
	browserWindow.webContents.send( 'clear-cache' );
	createWindow();
}

export function closeApp({ browserWindow }) {
	debug( 'Should close browser window...' ); // eslint-disable-line no-console
	browserWindow.webContents.send( 'close-editor' );
	browserWindow.close();
}
