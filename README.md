#Waterfall

A bookmarklet to create page load waterfall in the browser using the Resource Timing API

Just add the bookmarklet below to your bookmarks bar.

```
<a href="javascript:(function(){var el=document.createElement('script');el.type='text/javascript';el.src='https://raw.github.com/andydavies/waterfall/master/waterfall.js';document.getElementsByTagName('body')[0].appendChild(el);})();">
```

#Works In*

IE 10, Chromium Nightly

*When I say 'works in' I mean you'll get a waterfall but sometimes there will be odd things about it!

#To Do

- Add DOM event markers e.g. onload etc.
- Add AppCache, SSL times, fix TCP times
- ~~Truncate URL display~~
- Remove protocol from URL display
- Fix blocked timings
- Display blocked / active times for 3rd party resources
- Check if bookmarklet script loaded before adding it
- Add iframe support
- Add tooltip with full URL and timing details
- Add row number?
- Add legend
- Cleanup and refactor drawing code
- Add Close button
- Add Jdrop / HAR Storage links
- Flexible width?

#To check

- Are dataURIs supposed to be in list of resources? - no
- Chromium's TCP connect timings
- responseEnd == 0 in Chromium for 3rd party resources
- Why is the API sometimes unavailable in IE10?
- "about:blank" in IE10 on http://t.uk.msn.com/ - valid

