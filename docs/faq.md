---
layout: page
title: FAQ
description: Frequently Asked Questions
permalink: /faq/
collection: faq
weight: 5
---

## {{ page.description }}

{% assign items = site.faq | sort: 'weight' %}
{% for item in items %}
  <a href="{{ site.baseurl }}{{ item.url }}">{{ item.title }}</a>
{% endfor %}
