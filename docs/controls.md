---
layout: page
title: Controls
description: Synchro Control Configuration and Usage
permalink: /controls/
weight: 2
---

## {{ page.description }}

{% for control in site.controls %}
  <p>
    <a href="{{ site.baseurl }}{{ control.url }}">{{ control.title }}</a>
  </p>
  <p>{{ control.description }}</p>
{% endfor %}


