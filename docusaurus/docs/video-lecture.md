---
id: video-lecture 
title: Video Lecture
sidebar_label: Video Lecture
---

A video lecture component that displays videos interspersed with interactive elements.

## Example

``` js
<VideoLecture steps={[
    'https://www.youtube.com/watch?v=Lkj8b25ppZo',
    <FreeTextQuestion id="video-lecture-brainstorming" question="Write down a few ideas of how one could enrich video lectures using other ISLE components" />
]} />
```

[Open interactive preview](https://isle.heinz.cmu.edu/components/video-lecture/)

## Options

* __controls__ | `boolean`: indicates whether to display control elements of the video players. Default: `true`.
* __steps__ | `array (required)`: array of video URLs and components to be displayed in-between. Default: `none`.
