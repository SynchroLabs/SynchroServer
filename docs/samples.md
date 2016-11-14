---
layout: page
title: Samples
description: Synchro Samples
permalink: /samples/
weight: 4
---

## {{ page.description }}

{% for sample in site.samples %}
  <a href="{{ site.baseurl }}{{ sample.url }}">{{ sample.title }}</a>
{% endfor %}