---
id: r-plot
title: R Plot
sidebar_label: R Plot
---

Component for rendering an R plot inside an ISLE lesson.

## Example

``` js
<RPlot code="hist( c(20,50,40,70,40,30) )" />
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/r-plot/)

## Options

* __code__ | `string`: R code to generate the plot. Default: `''`.
* __width__ | `(number|string)`: width of the plot (in px). Default: `600`.
* __height__ | `(number|string)`: height of the plot (in px). Default: `350`.
* __fileType__ | `string`: file type of the plot (`png` or `svg`). Default: `'png'`.
* __libraries__ | `array`: R libraries that should be loaded automatically when the input `code` is executed. Default: `[]`.
* __prependCode__ | `(string|array)`: `string` or an `array` of R code snippets to be prepended to the code stored in `code` when evaluating. Default: `''`.
* __onDone__ | `function`: callback invoked with `err`, `img` and `body` arguments once a plot is created. Default: `onDone() {}`.
