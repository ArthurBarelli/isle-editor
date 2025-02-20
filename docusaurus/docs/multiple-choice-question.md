---
id: multiple-choice-question 
title: Multiple Choice Question
sidebar_label: Multiple Choice Question
---

An ISLE component that renders a multiple choice question. It supports the case where the learner has to select a single answer and when there might be multiple correct answers and all correct ones must be picked.

## Example

``` js
<MultipleChoiceQuestion
    solution={1}
    answers={[
        {content:"There's a 0.7% chance that average birthweights are the same among smoking and non-smoking mothers", explanation:""},
        {content:"If the null were true, the probability of observing this large a difference in average birthweights in our data is 0.7%", explanation:""},
        {content:"The probability that the confidence interval does not contain the true mean difference is 0.7%", explanation:""},
        {content:"Average birthweights are 0.7% higher among babies born to non-smoking mothers", explanation:""}
    ]}
    question="4. Which of the following is an accurate interpretation of the p-value?"
/>
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/multiple-choice-question/)

## Options

* __question__ | `(string|node)`: the question displayed at the top of the multiple choice component. Default: `''`.
* __solution__ | `(number|array)`: number denoting which answer is correct or an `array` of the correct answer numbers in case the learner should be able to select multiple answers. Default: `none`.
* __answers__ | `array (required)`: an `array` of answer objects. Each answer should be an object with `content` and `explanation` fields, which denote the displayed answer option and an explanation visible after the question has been submitted to explain why the answer is correct or incorrect. Default: `none`.
* __hintPlacement__ | `string`: placement of the hints (either `top`, `left`, `right`, or `bottom`). Default: `'bottom'`.
* __hints__ | `array<string>`: hints providing guidance on how to answer the question. Default: `[]`.
* __feedback__ | `boolean`: controls whether to display feedback buttons. Default: `true`.
* __disabled__ | `boolean`: controls whether the question is disabled. Default: `false`.
* __chat__ | `boolean`: controls whether the element should have an integrated chat. Default: `false`.
* __provideFeedback__ | `string`: either `full`, `incremental`, or `none`. If `full`, feedback including the correct answer is displayed after learners submit their answers; if `incremental`, feedback is only displayed for the selected answer; if `none`, no feedback is returned. Default: `'incremental'`.
* __disableSubmitNotification__ | `boolean`: controls whether to disable submission notifications. Default: `false`.
* __displaySolution__ | `boolean`: controls whether the solution is displayed upfront. Default: `false`.
* __voiceID__ | `string`: voice control identifier. Default: `none`.
* __style__ | `object`: CSS inline styles. Default: `{}`.
* __onChange__ | `function`: callback invoked every time the selected answer changes; receives the index of the selected question as its sole argument (or an array in case the question is of type "Choose all that apply"). Default: `onChange(){}`.
* __onSubmit__ | `function`: callback invoked after an answer is submitted. Default: `onSubmit(){}`.
