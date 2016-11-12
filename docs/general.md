---
layout: page
title: General
permalink: /general/
---

{% assign items = site.general | sort: 'weight' %}
{% for item in items %}
  <a href="{{ site.baseurl }}{{ item.url }}">{{ item.title }}</a>
{% endfor %}
