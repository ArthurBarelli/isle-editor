---
id: data-explorer 
title: Data Explorer
sidebar_label: Data Explorer
---

This component is used by students to briefly summarize data as it is presented and perform various statistical tests.

## Example

In creating a data explorer, one needs a *.json dataset. This step may be accomplished by including the following in the header of a *.isle file:

```js
require:
	dataName: "./dataName.json"
```

Consider a dataset called "heartdisease" with the following variables:
* __Gender__: _Categorical_
* __Drugs__: _Categorical_
* __Complications__: _Categorical_
* __Cost__: _Quantitative_
* __Age__: _Quantitative_
* __Interventions__: _Quantitative_
* __ERVisit__: _Quantitative_
* __Comorbidities__: _Quantitative_
* __Duration__: _Quantitative_

We will include the explorer with the following code:

```js
<DataExplorer 
	id="heartdisease"
	data={heartdisease} 
	categorical={[ 'Gender', 'Drugs', 'Complications' ]}
	quantitative={[ 'Cost', 'Age', 'Interventions', 'ERVisit', 'Comorbidities', 'Duration' ]}
	tests={[]}
/>
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/data-explorer/)

## Options

* __categorical__ | `array`: array of strings indicating the name of each categorical variable. Default: `[]`.
* __quantitative__ | `array`: array of strings indicating the name of each quantitative variable. Default: `[]`.
* __data__ | `object`: data object or array to be viewed. If it is an object, the keys correspond to column values while an array will expect an array of objects with a named field corresponding to each column. If you wish to allow students the ability to import a `.csv` file, set the `data` option to be `false`. Default: `{}`.
* __dataInfo__ | `object`: object containing the keys \'name\', whose value is a string, \'info\', whose value is an array of strings in which each element in the array is a new line and \'variables\', an object with keys as variable names and values as variable descriptions. Default: `{
  'info': '',
  'name': '',
  'variables': null
}`.
* __editor__ | `boolean`: boolean indicating whether to show the editor to the user. Default: `true`.
* __editorProps__ | `object`: object to be passed to `MarkdownEditor` indicating properties to be used. Default: `none`.
* __editorTitle__ | `string`: string indicating the title of the explorer to be displayed. Default: `'Report'`.
* __dataTable__ | `boolean`: boolean value indicating whether to hide the data table from view. Default: `true`.
* __histogramDensities__ | `boolean`: boolean value indicating whether to display histogram densities. Default: `true`.
* __models__ | `array`: array of strings indicating models that may be fit on the data. Default: `[
  'Simple Linear Regression',
  'Multiple Linear Regression',
  'LASSO',
  'Decision Tree',
  'Random Forest',
  'Logistic Regression',
  'PCA',
  'Hierarchical Clustering',
  'kmeans'
]`.
* __opened__ | `string`: page opened at startup. Default: `none`.
* __plots__ | `array`: array of strings indicating which plots to show to the user. Default: `[
  'Bar Chart',
  'Pie Chart',
  'Mosaic Plot',
  'Histogram',
  'Box Plot',
  'Scatterplot',
  'Heat Map',
  'Contour Chart'
]`.
* __questions__ | `array`: array of nodes indicating surrounding text and question components to be displayed in a tabbed window. Default: `[]`.
* __showTestDecisions__ | `boolean`: boolean indicating whether to show the decisions made for each test based on the calculated p-values. Default: `true`.
* __statistics__ | `array`: array of strings indicating which summary statistics may be calculated. Default: `[
  'Mean',
  'Median',
  'Min',
  'Max',
  'Range',
  'Interquartile Range',
  'Standard Deviation',
  'Variance',
  'Correlation',
  'Skewness',
  'Excess Kurtosis'
]`.
* __style__ | `object`: CSS inline styles for main container. Default: `{}`.
* __tables__ | `array`: array of strings indicating which tables may be created from the data. Default: `[
  'Frequency Table',
  'Contingency Table'
]`.
* __tabs__ | `array`: array of objects and keys indicating any custom tabs to add. Default: `[]`.
* __tests__ | `array`: array of strings indicating which hypothesis tests to include. Default: `[
  'One-Sample Mean Test',
  'One-Sample Proportion Test',
  'Two-Sample Mean Test',
  'Two-Sample Proportion Test',
  'Correlation Test',
  'Chi-squared Independence Test',
  'One-Way ANOVA'
]`.
* __transformer__ | `boolean`: boolean indicating whether one wants to display a variable transformer. Default: `true`.
