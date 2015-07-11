/*
 * Uses Resource Timing API to build a page load waterfall
 *
 * Only currently works in IE10, and Chromium nightly builds, has a few issues still to be fixed,
 * contributions welcomed!
 *
 * Feel free to do what you want with it, @andydavies
 *
 * To use, create a bookmark with the script below in, load a page, click the bookmark
 *
 * javascript:(function(){var el=document.createElement('script');el.type='text/javascript';el.src='http://andydavies.me/sandbox/waterfall.js';document.getElementsByTagName('body')[0].appendChild(el);})();
 */

(function waterfall(w,d) {

	var xmlns = "http://www.w3.org/2000/svg";

	var barColors = {
		blocked: "rgb(204, 204, 204)",
		thirdParty: "rgb(0, 0, 0)",
		redirect: "rgb(255, 221, 0)",
		appCache: "rgb(161, 103, 38)",
		dns: "rgb(48, 150, 158)",
		tcp: "rgb(255, 157, 66)",
		ssl: "rgb(213,102, 223)",
		request: "rgb(64, 255, 64)",
		response: "rgb(52, 150, 255)"
	}

	/**
     * Creates array of timing entries from Navigation and Resource Timing Interfaces
     * @returns {object[]}
     */
	function getTimings() {

		var entries = [];

		// Page times come from Navigation Timing API
	  	entries.push(createEntryFromNavigationTiming());

		// Other entries come from Resource Timing API
		var resources = [];

		if(w.performance.getEntriesByType !== undefined) {
			resources = w.performance.getEntriesByType("resource");
		}
		else if(w.performance.webkitGetEntriesByType !== undefined) {
			resources = w.performance.webkitGetEntriesByType("resource");
		}

		for(var n = 0; n < resources.length; n++) {
			if(resources[n].name.indexOf('/waterfall.js') === -1){
				entries.push(createEntryFromResourceTiming(resources[n]));
			}
		}

		return entries;
	}

	/**
     * Creates an entry from a PerformanceResourceTiming object
     * @param {object} resource
     * @returns {object}
     */
	function createEntryFromNavigationTiming() {

		var timing = w.performance.timing;

// TODO: Add fetchStart and duration, fix TCP timings

		return {
			url: d.URL,
			start: 0,
			duration: timing.responseEnd - timing.navigationStart,
			redirectStart: timing.redirectStart === 0 ? 0 : timing.redirectStart - timing.navigationStart,
			redirectDuration: timing.redirectEnd - timing.redirectStart,
			appCacheStart: 0,											// TODO
			appCacheDuration: 0,										// TODO
			dnsStart: timing.domainLookupStart - timing.navigationStart,
			dnsDuration: timing.domainLookupEnd - timing.domainLookupStart,
			tcpStart: timing.connectStart - timing.navigationStart,
			tcpDuration: (timing.secureConnectionStart > 0 ? timing.secureConnectionStart : timing.connectEnd) - timing.connectStart,
			sslStart: timing.secureConnectionStart > 0 ? timing.secureConnectionStart - timing.navigationStart : 0,
			sslDuration: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
			requestStart: timing.requestStart - timing.navigationStart,
			requestDuration: timing.responseStart - timing.requestStart,
			responseStart: timing.responseStart - timing.navigationStart,
			responseDuration: timing.responseEnd - timing.responseStart
  		}
	}

	/**
     * Creates an entry from a PerformanceResourceTiming object
     * @param {object} resource
     * @returns {object}
	 */
	function createEntryFromResourceTiming(resource) {

// TODO: Add fetchStart and duration, fix TCP timings
// NB
// AppCache: start = fetchStart, end = domainLookupStart, connectStart or requestStart
// TCP: start = connectStart, end = secureConnectionStart or connectEnd

		return {
			url: resource.name,
			start: resource.startTime,
			duration: resource.duration,
			redirectStart: resource.redirectStart,
			redirectDuration: resource.redirectEnd - resource.redirectStart,
			appCacheStart: 0,											// TODO
			appCacheDuration: 0,										// TODO
			dnsStart: resource.domainLookupStart,
			dnsDuration: resource.domainLookupEnd - resource.domainLookupStart,
			tcpStart: resource.connectStart,
			tcpDuration: (resource.secureConnectionStart > 0 ? resource.secureConnectionStart : resource.connectEnd) - resource.connectStart,
			sslStart: resource.secureConnectionStart > 0 ? resource.secureConnectionStart : 0,
			sslDuration: resource.secureConnectionStart > 0 ? resource.connectEnd - resource.secureConnectionStart : 0,
			requestStart: resource.requestStart,
			requestDuration: resource.responseStart - resource.requestStart,
			responseStart: resource.responseStart,
			// ??? - Chromium returns zero for responseEnd for 3rd party URLs, bug?
			responseDuration: resource.responseStart == 0 ? 0 : resource.responseEnd - resource.responseStart
  		}
	}

	/**
     * Draw waterfall
     * @param {object[]} entries
     */
	function drawWaterfall(entries) {

		var maxTime = 0;
		for(var n = 0; n < entries.length; n++) {
			maxTime = Math.max(maxTime, entries[n].start + entries[n].duration);
		}

		var containerID= "waterfall-div",
			container = d.getElementById(containerID),
			closeBtn = createCloseBtn();

		if (container === null) {
			container = d.createElement('div');
			container.id = containerID;
		}

		container.style.cssText = 'background:#fff;border: 2px solid #000;position:absolute;top:0;left:0;right:0;z-index:99999;margin:0px 8px;padding:0px;';
		container.appendChild(closeBtn);
		d.body.appendChild(container);

		var rowHeight = 10;
		var rowPadding = 2;
		var barOffset = 200;

		//calculate size of chart
		// - max time
		// - number of entries
		var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 16;
		var height = (entries.length + 1) * (rowHeight + rowPadding); // +1 for axis

		container.width = width;
		container.height = height;

		var svg = createSVG(width, height);

		// scale
		// TO DO - When to switch from seconds to milliseconds ???
		var scaleFactor = maxTime / (width - 5 - barOffset);

		// draw axis
		var interval = 1000 / scaleFactor;
		var numberOfLines = maxTime / interval;
		var x1 = barOffset,
			y1 = rowHeight + rowPadding,
			y2 = height;

		for(var n = 0; n < numberOfLines; n++) {
			svg.appendChild(createSVGText(x1, 0, 0, rowHeight, "font: 10px sans-serif;", "middle", n));
			svg.appendChild(createSVGLine(x1, y1, x1, y2, "stroke: #ccc;"));
			x1 += interval;
		}

		// draw resource entries
		for(var n = 0; n < entries.length; n++) {

			var entry = entries[n];

			var row = createSVGGroup("translate(0," + (n + 1) * (rowHeight + rowPadding) + ")");

			row.appendChild(createSVGText(5, 0, 0, rowHeight, "font: 10px sans-serif;", "start", shortenURL(entry.url)));

			row.appendChild(drawBar(entry, barOffset, rowHeight, scaleFactor));

			svg.appendChild(row);
//			console.log(JSON.stringify(entry) + "\n" );
		}

		container.appendChild(svg);
	}

// TODO: Split out row, bar and axis drawing
// drawAxis
// drawRow()

	/**
     * Draw bar for resource
     * @param {object} entry Details of URL, and timings for individual resource
     * @param {int} barOffset Offset of the start of the bar along  x axis
     * @param {int} rowHeight
     * @param {double} scaleFactor Factor used to scale down chart elements
     * @returns {element} SVG Group element containing bar
     *
     * TODO: Scale bar using SVG transform? - any accuracy issues?
     */
	function drawBar(entry, barOffset, rowHeight, scaleFactor) {

		var bar = createSVGGroup("translate(" + barOffset + ", 0)");

		// add tooltip
		var title = document.createElementNS(xmlns,"title")
		title.textContent = JSON.stringify(entry, function(key, value){
		if (typeof value == "object") return value;
			// keep tooltip to just non-zero durations.
			if (!key.endsWith('Start') && key != 'url' && value != 0)
				return value.toFixed(1);
		}, '  ');
		bar.appendChild(title);

		bar.appendChild(createSVGRect(entry.start / scaleFactor, 0, entry.duration / scaleFactor, rowHeight, "fill:" + barColors.blocked));

// TODO: Test for 3rd party and colour appropriately

		if(entry.redirectDuration > 0) {
			bar.appendChild(createSVGRect(entry.redirectStart / scaleFactor , 0, entry.redirectDuration / scaleFactor, rowHeight, "fill:" + barColors.redirect));
		}

		if(entry.appCacheDuration > 0) {
			bar.appendChild(createSVGRect(entry.appCacheStart / scaleFactor , 0, entry.appCacheDuration / scaleFactor, rowHeight, "fill:" + barColors.appCache));
		}

		if(entry.dnsDuration > 0) {
			bar.appendChild(createSVGRect(entry.dnsStart / scaleFactor , 0, entry.dnsDuration / scaleFactor, rowHeight, "fill:" + barColors.dns));
		}

		if(entry.tcpDuration > 0) {
			bar.appendChild(createSVGRect(entry.tcpStart / scaleFactor , 0, entry.tcpDuration / scaleFactor, rowHeight, "fill:" + barColors.tcp));
		}

		if(entry.sslDuration > 0) {
			bar.appendChild(createSVGRect(entry.sslStart / scaleFactor , 0, entry.sslDuration / scaleFactor, rowHeight, "fill:" + barColors.ssl));
		}

		if(entry.requestDuration > 0) {
			bar.appendChild(createSVGRect(entry.requestStart / scaleFactor , 0, entry.requestDuration / scaleFactor, rowHeight, "fill:" + barColors.request));
		}

		if(entry.responseDuration > 0) {
			bar.appendChild(createSVGRect(entry.responseStart / scaleFactor , 0, entry.responseDuration / scaleFactor, rowHeight, "fill:" + barColors.response));
		}

		return bar;
	}

// drawBarSegment - start, length, height, fill

	/**
     * Shorten URLs over 40 characters
     * @param {string} url URL to be shortened
     * @returns {string} Truncated URL
     *
     * TODO: Remove protocol
     */
	function shortenURL(url) {
		// Strip off any query string and fragment
		var strippedURL = url.match("[^?#]*")

		var shorterURL = strippedURL[0];
		if(shorterURL.length > 40) {
			shorterURL = shorterURL.slice(0, 25) + " ... " + shorterURL.slice(-10);
		}

		return shorterURL;
	}

	/**
	*Create Close Button
	* returns {element} span element
	*/
	function createCloseBtn(){
		var btnEle = d.createElement('span');
		btnEle.innerHTML = 'x';
		btnEle.style.cssText = 'position:absolute;margin:-3px 5px;right:0;font-size:22px;cursor:pointer';
		addEvent(btnEle,'click',closeBtnHandler);
		return btnEle;
	}

	/**
     * Create SVG element
     * @param {int} width
     * @param {int} height
     * @returns {element} SVG element
     */
	function createSVG(width, height) {
		var el = d.createElementNS(xmlns, "svg");

		el.setAttribute("width", width);
		el.setAttribute("height", height);

		return el;
	}

	/**
     * Create SVG Group element
     * @param {string} transform SVG tranformation to apply to group element
     * @returns {element} SVG Group element
     */
	function createSVGGroup(transform) {
		var el = d.createElementNS(xmlns, "g");

		el.setAttribute("transform", transform);

		return el;
	}

	/**
     * Create SVG Rect element
     * @param {int} x
     * @param {int} y
     * @param {int} width
     * @param {int} height
     * @param {string} style
     * @returns {element} SVG Rect element
     */
	function createSVGRect(x, y, width, height, style) {
		var el = d.createElementNS(xmlns, "rect");

		el.setAttribute("x", x);
		el.setAttribute("y", y);
		el.setAttribute("width", width);
		el.setAttribute("height", height);
		el.setAttribute("style", style);

		return el;
	}

	/**
     * Create SVG Rect element
     * @param {int} x1
     * @param {int} y1
     * @param {int} x2
     * @param {int} y2
     * @param {string} style
     * @returns {element} SVG Line element
     */
	function createSVGLine(x1, y1, x2, y2, style) {
		var el = d.createElementNS(xmlns, "line");

		el.setAttribute("x1", x1);
		el.setAttribute("y1", y1);
		el.setAttribute("x2", x2);
		el.setAttribute("y2", y2);
		el.setAttribute("style", style);

  		return el;
	}

	/**
     * Create SVG Text element
     * @param {int} x
     * @param {int} y
     * @param {int} dx
     * @param {int} dy
     * @param {string} style
     * @param {string} anchor
     * @param {string} text
     * @returns {element} SVG Text element
     */
	function createSVGText(x, y, dx, dy, style, anchor, text) {
		var el = d.createElementNS(xmlns, "text");

		el.setAttribute("x", x);
		el.setAttribute("y", y);
		el.setAttribute("dx", dx);
		el.setAttribute("dy", dy);
		el.setAttribute("style", style);
		el.setAttribute("text-anchor", anchor);

		el.appendChild(d.createTextNode(text));

  		return el;
	}

	/**
     * Event Handler for Close Button
     */
	function closeBtnHandler(e){
		var elem = d.getElementById("waterfall-div");
		if(elem){
			elem.parentNode.removeChild(elem);
		}
	}

	/**
     * Add Events On DOM Elements
     * @param {element} elem
     * @param {event} event
     * @param {function} fn
     * return {EventListener} listener that fires event
     */
	function addEvent(elem, event, fn) {
	    if (elem.addEventListener) {
	        elem.addEventListener(event, fn, false);
	    } else {
	        elem.attachEvent("on" + event, function() {
	            return(fn.call(elem, w.event));
	        });
	    }
	}

	// Check for Navigation Timing and Resource Timing APIs

	if(w.performance !== undefined &&
	  (w.performance.getEntriesByType !== undefined ||
	   w.performance.webkitGetEntriesByType !== undefined)) {

		var timings = getTimings();

		drawWaterfall(timings);
	}
	else {
		alert("Resource Timing API not supported");
	}
})(window,window.document);
