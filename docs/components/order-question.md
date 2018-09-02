# Order Question

An order question component.

#### Example:

``` js
<OrderQuestion
    question="Order the letters alphabetically"
    options={[
        { id: 0, text: "A" },
        { id: 1, text: "G" },
        { id: 2, text: "V" }
        { id: 3, text: "W" },
        { id: 4, text: "Y" },
        { id: 5, text: "Z" }
    ]}
/>
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/order-question/)

#### Options:

* __question__ | `string`: question for which the student has to bring the available `options` into the correct order. Default: `''`.
* __options__ | `array (required)`: an array of objects with `id` and `text` keys which the student has to bring into the correct ordering, which is assumed to be the supplied order. Default: `none`.
* __hintPlacement__ | `string`: placement of the hints (either `top`, `left`, `right`, or `bottom`). Default: `'bottom'`.
* __hints__ | `array<string>`: hints providing guidance on how to answer the question. Default: `[]`.
* __feedback__ | `boolean`: controls whether to display feedback buttons. Default: `false`.
* __chat__ | `boolean`: controls whether the element should have an integrated chat. Default: `false`.
* __failureMsg__ | `string`: message to be displayed when student submits a wrong answer. Default: `'Not quite, try again!'`.
* __successMsg__ | `string`: message to be displayed when student submits the correct answer. Default: `'That's the correct ordering!'`.
* __onChange__ | `function`: callback  which is triggered after dragging an element; has two parameters: a `boolean` indicating whether the elements were placed in the correct order and and `array` with the current ordering. Default: `onChange() {}`.
* __onSubmit__ | `function`: callback invoked when answer is submitted; has as a sole parameter a `boolean` indicating whether the elements were placed in the correct order. Default: `onSubmit() {}`.