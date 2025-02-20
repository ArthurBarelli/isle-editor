/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

function Help(props) {
	const { config: siteConfig, language = '' } = props;
	const { baseUrl, docsUrl } = siteConfig;
	const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
	const langPart = `${language ? `${language}/` : ''}`;
	const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

	const supportLinks = [
		{
			content: `Learn more using the [documentation on this site](${docUrl('overview/intro', language)}) or by following the [tutorials](${docUrl('video-tutorials', language)}).`,
			title: 'Browse Docs'
		},
		{
			content: 'Ask questions about the documentation and project in the [discussion forum](https://discourse.isledocs.com).',
			title: 'Join the community'
		},
		{
			content: "Find out what's new with this project by browsing the [releases](https://github.com/isle-project/isle-editor/releases) of the ISLE editor.",
			title: 'Stay up to date'
		}
	];

	return (
		<div className="docMainWrapper wrapper">
			<Container className="mainContainer documentContainer postContainer">
				<div className="post">
					<header className="postHeader">
						<h1>Need help?</h1>
					</header>
					<p>This project is maintained by a dedicated group of people.</p>
					<GridBlock contents={supportLinks} layout="threeColumn" />
				</div>
			</Container>
		</div>
	);
}

module.exports = Help;
