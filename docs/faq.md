---
layout: page
title: FAQ
permalink: /faq/
---

{% assign items = site.faq | sort: 'weight' %}
{% for item in items %}
  <a href="{{ site.baseurl }}{{ item.url }}">{{ item.title }}</a>
{% endfor %}
