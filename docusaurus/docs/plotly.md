---
id: plotly 
title: Plotly
sidebar_label: Plotly
---

Plotly visualization.

## Example

``` js
<Plotly
    data={[{
        values: [ 24, 7, 0.5 ],
        labels: [ 'English', 'Spanish', 'Other' ],
        type: 'pie'
            }]}
    layout={{ width: 300 }}
/>
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/plotly)

## Options

* __data__ | `array (required)`: data array. Default: `none`.
* __draggable__ | `boolean`: controls whether the plot should be draggable. Default: `false`.
* __editable__ | `boolean`: controls whether labels of the created plot are editable. Default: `false`.
* __id__ | `string`: component identifier. Default: `none`.
* __layout__ | `object`: Plotly layout object. Default: `{}`.
* __config__ | `object`: undefined. Default: `{}`.
* __legendButtons__ | `boolean`: controls whether to display buttons for changing the legend. Default: `true`.
* __meta__ | `object`: plot meta-information. Default: `none`.
* __revision__ | `number`: when provided, causes the plot to update when the revision value is incremented. Default: `none`.
* __onAfterPlot__ | `function`: callback function invoked each time a chart is plotted. Default: `onAfterPlot() {}`.
* __onClick__ | `function`: callback function invoked when any element is clicked. Default: `onClick() {}`.
* __onLegendClick__ | `function`: callback function invoked when legend item is clicked. Default: `onLegendClick() {}`.
* __onLegendDoubleClick__ | `function`: callback function invoked when legend item is double-clicked. Default: `onLegendDoubleClick() {}`.
* __onRelayout__ | `function`: callback function invoked when plotly_relayout is triggered. Default: `onRelayout() {}`.
* __onSelected__ | `function`: callback function invoked when elements are selected. Default: `onSelected() {}`.
* __onShare__ | `function`: callback function invoked when clicking on the "Share" button. Default: `none`.
* __removeButtons__ | `boolean`: controls whether to remove all buttons. Default: `false`.
* __toggleFullscreen__ | `boolean`: controls whether to display the plot in fullscreen mode. Default: `true`.
