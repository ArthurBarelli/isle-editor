// MODULES //

import webpack from 'webpack';
import baseConfig from './webpack.config.base';


// MAIN //

export default {
	...baseConfig,

	devtool: 'cheap-source-map',

	entry: './main.development',

	output: {
		path: __dirname,
		filename: './main.js'
	},

	plugins: [
		new webpack.BannerPlugin({
			banner: 'require("source-map-support").install();',
			raw: true,
			entryOnly: false
		})
	],

	target: 'electron-main',

	node: {
		__dirname: false,
		__filename: false
	},

	externals: [
		'font-awesome',
		'source-map-support',
		'webpack',
		'react',
		'react-dom'
	]
};
