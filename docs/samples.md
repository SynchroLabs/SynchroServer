---
layout: page
title: Samples
permalink: /samples/
---

{% for sample in site.samples %}
  <a href="{{ site.baseurl }}{{ sample.url }}">{{ sample.title }}</a>
{% endfor %}