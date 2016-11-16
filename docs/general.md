---
layout: page
title: General
description: Synchro Architecture, Design, Usage, and API Documentation
permalink: /general/
collection: general
weight: 1
---

## {{ page.description }}

{% assign items = site.general | sort: 'weight' %}
{% for item in items %}
  <a href="{{ site.baseurl }}{{ item.url }}">{{ item.title }}</a>
{% endfor %}
