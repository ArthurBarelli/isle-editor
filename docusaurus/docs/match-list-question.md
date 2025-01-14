---
id: match-list-question 
title: Match List Question
sidebar_label: Match List Question
---

An ISLE component that renders a question in which the learner has to match elements from two lists with each other in the correct way.

## Example

``` javascript
<MatchListQuestion
    question="Please match the correct surnames and first names."
    elements={[
        { a: 'Ronald', b: 'Fisher' },
        { a: 'Florence', b: 'Nightingale' },
        { a: 'Karl', b: 'Pearson' },
    ]}
    onSubmit={ ( answers ) => {
        
    }}
/>
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/match-list-question/)

## Options

* __question__ | `(string|node)`: question to be displayed at the top of the match list question component. Default: `''`.
* __elements__ | `array<{a,b}>`: an `array` holding the correct pairs displayed at the top of the free text question component. Each `array` element must be an `object` with `a` and `b` properties. Default: `[]`.
* __hintPlacement__ | `string`: placement of the hints (either `top`, `left`, `right`, or `bottom`). Default: `'bottom'`.
* __hints__ | `array<string>`: hints providing guidance on how to answer the question. Default: `[]`.
* __provideFeedback__ | `boolean`: indicates whether the solution should be accessible after learners submit their answers. Default: `true`.
* __feedback__ | `object`: controls whether to display feedback buttons. Default: `true`.
* __chat__ | `boolean`: controls whether the element should have an integrated chat. Default: `false`.
* __colorScale__ | `array`: if set, the supplied colors are used for the tiles. Default: `none`.
* __shuffle__ | `string`: specifies whether to shuffle the `left`, `right`, or `both` columns whose elements have to be matched. Default: `'both'`.
* __disableSubmitNotification__ | `boolean`: controls whether to disable submission notifications. Default: `false`.
* __submissionMsg__ | `string`: notification displayed when the learner first submits his answer. Default: `'You have successfully submitted your answer.'`.
* __resubmissionMsg__ | `string`: notification displayed for all submissions after the first one. Default: `'You have successfully re-submitted your answer.'`.
* __style__ | `object`: CSS inline styles. Default: `{}`.
* __onSubmit__ | `function`: callback invoked when students submits an answer. Default: `onSubmit() {}`.
