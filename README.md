#Waterfall

A bookmarklet to create page load waterfall in the browser using the Resource Timing API

Just add the bookmarklet below to your bookmarks bar.

```
javascript:(function(){var el=document.createElement('script');el.type='text/javascript';el.src='//andydavies.github.io/waterfall/bookmarklet/waterfall.js';document.getElementsByTagName('body')[0].appendChild(el);})();
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

- Why is the API sometimes unavailable in IE10?
- "about:blank" in IE10 on http://t.uk.msn.com/ - valid

#Browser Issues

Here are the issues and queries found so far with the browser implementations of Resource Timing - no CORS testing so far.

(Convert these to GH issues???)

##Chromium

Some of these issues are already marked as fixed on [crbug.com](http://crbug.com/) but waterfall code hasn't been tested against a new nightly build.

- [Unexpected connectStart and connectEnd values for connections that are currently open](http://code.google.com/p/chromium/issues/detail?id=165897)
- [Entries include dataURIs](http://code.google.com/p/chromium/issues/detail?id=165963&)
- [Cross Origin resources have responseEnd of 0](http://code.google.com/p/chromium/issues/detail?id=166006)
- [List of entries excludes resources retrieved from cache](http://code.google.com/p/chromium/issues/detail?id=166404)
- [fetchStart times always equal startTime](http://code.google.com/p/chromium/issues/detail?id=166710)

##IE10

(no link to issue tracker for these)

- Resource Timing is only available in IE9/IE10 document modes but during testing API wasn't present for some sites where it previously worked and a restart seemed to fix it. _This needs re-checking to ensure it wasn't my error._
- connectStart == connectEnd for both Navigation and Resource Timing entries - would expect different values for early page requests where new TCP connections would be opened.
- Frequently domainLookupStart == domainLookupEnd even for domains the Windows VM has never seen previously.
- responseStart == responseEnd in Navigation Timing for both first and repeat views even when waterfall in dev tools shows a response

##Change Log

2013-01-01 Add JSDoc comments, start re-factoring drawing code
