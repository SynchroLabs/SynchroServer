---
title: WebView Control
description: A control that displays a web view, populated either with local content, or loaded from a URL
---

{{ page.description }}

## Attributes:

* [Common Control Attributes](common)

One of:

* `contents` (html string)
* `url`

## Example:

```
{ control: "webview", width: 400, height: 200, contents: "<h1>Local Content</h1><p>This is local content</p>" },
```

```
{ control: "webview", width: 400, height: 200, url: "http://www.google.com" },
```
