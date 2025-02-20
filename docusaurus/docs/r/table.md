---
id: r-table
title: R Table
sidebar_label: R Table
---

Component for rendering a R data frame or matrix in a tabular display.

## Example

``` js
<RTable
    code={`data <- matrix( runif(16), nrow=4, ncol=4)
data`}
/>
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/r-table/)

## Options

* __code__ | `string`: R code returning a data.frame containing the data to be displayed in the table. Default: `''`.
* __libraries__ | `array`: R libraries that should be loaded automatically when the input `code` is executed. Default: `[]`.
* __prependCode__ | `(string|array)`: R code `string` (or `array` of R code blocks) to be prepended to the code stored in `code` when evaluating. Default: `''`.
* __width__ | `number`: width (between 0 and 1). Default: `0.5`.
