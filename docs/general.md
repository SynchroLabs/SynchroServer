---
layout: page
title: General
permalink: /general/
---

{% assign items = site.general | sort: 'weight' %}
{% for item in items %}
  <a href="{{ item.url }}">{{ item.title }}</a>
{% endfor %}
