---
layout: page
title: Controls
permalink: /controls/
---

{% for control in site.controls %}
  <p>
    <a href="{{ site.baseurl }}{{ control.url }}">{{ control.title }}</a>
  </p>
  <p>{{ control.description }}</p>
{% endfor %}


