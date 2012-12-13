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
 * javascript:(function(){var el=document.createElement('script');el.type='text/javascript';el.src='https://raw.github.com/andydavies/waterfall.js';document.getElementsByTagName('body')[0].appendChild(el);})();
 */

(function waterfall() {

	var xmlns = "http://www.w3.org/2000/svg";

	function getTimings() {

		var entries = [];
	
		// Page times come from Navigation Timing API

	  	entries.push(createEntryFromNavigationTiming());

		// Other entries come from Resource Timing API

		var resources = [];
		
		if(window.performance.getEntriesByType !== undefined) {
			resources = window.performance.getEntriesByType("resource");
		}
		else if(window.performance.webkitGetEntriesByType !== undefined) {
			resources = window.performance.webkitGetEntriesByType("resource");
		}
		
// TODO .length - 1 is a really hacky way of removing the bookmarklet script
// Do it by name???
		for(var n = 0; n < resources.length - 1; n++) {
			entries.push(createEntryFromResourceTiming(resources[n]));
		}

		return entries;
	}

	function createEntryFromNavigationTiming() {

		var timing = window.performance.timing;

// TODO - Clean this up
// Add fetchStart and duration, fix SSL etc. timings

		return {
			url: document.location.href,
			start: 0,
			duration: timing.responseEnd - timing.navigationStart,
			redirectStart: timing.redirectStart === 0 ? 0 : timing.redirectStart - timing.navigationStart,
			redirectDuration: timing.redirectEnd - timing.redirectStart,
			appCacheStart: 0,											// TODO
			appCacheDuration: 0,										// TODO
			dnsStart: timing.domainLookupStart - timing.navigationStart,
			dnsDuration: timing.domainLookupEnd - timing.domainLookupStart,
			tcpStart: timing.connectStart - timing.navigationStart,
			tcpDuration: timing.requestStart - timing.navigationStart,	// TODO
			sslStart: 0,												// TODO
			sslDuration: 0,												// TODO
			requestStart: timing.requestStart - timing.navigationStart,
			requestDuration: timing.responseStart - timing.requestStart,
			responseStart: timing.responseStart - timing.navigationStart,
			responseDuration: timing.responseEnd - timing.responseStart
  		}
	}

	function createEntryFromResourceTiming(resource) {

// TODO: Clean up! what's impact of CORS on this code?
// Add fetchStart and duration, fix SSL etc. timings

// NB
// AppCache: start = fetchStart, end = domainLookupStart, connectStart or requestStart
// TCP: start = connectStart, end = secureConnectionStart or connectEnd
// SSL: secureConnectionStart can be undefined

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
			tcpDuration: resource.connectEnd - resource.connectStart, 	// TODO
			sslStart: 0,												// TODO
			sslDuration: 0,												// TODO
			requestStart: resource.requestStart,
			requestDuration: resource.responseStart - resource.requestStart,
			responseStart: resource.responseStart,
			// ??? - Chromium returns zero for responseEnd for 3rd party URLs, bug?
			responseDuration: resource.responseStart == 0 ? 0 : resource.responseEnd - resource.responseStart
  		}
	}

	function drawWaterfall(entries) {
	
		var maxTime = 0;
		for(var n = 0; n < entries.length; n++) {
			maxTime = Math.max(maxTime, entries[n].start + entries[n].duration);
		}

		var containerID= "waterfall-div";
		var container = document.getElementById(containerID);

		if (container === null) {
			container = document.createElement('div');
			container.id = containerID;
		}

		container.style.cssText = 'background:#fff;border: 2px solid #000;margin:5px;position:absolute;top:0px;left:0px;z-index:99999;margin:0px;padding:0px;';
		document.body.appendChild(container);

		var rowHeight = 10;
		var rowPadding = 2;
		var barOffset = 200;

		//calculate size of chart
		// - max time
		// - number of entries
		var width = 1000;
		var height = (entries.length + 1) * (rowHeight + rowPadding); // +1 for axis

		container.width = width;
		container.height = height;

		var svg = createSVG(width, height);

		// scale - when to switch from seconds to milliseconds 
		var scaleFactor = maxTime / (width - barOffset);

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
			var g = createSVGGroup("translate(0," + (n + 1) * (rowHeight + rowPadding) + ")");

// TODO truncate long URLs
			g.appendChild(createSVGText(0, 0, 0, rowHeight, "font: 10px sans-serif;", "start", entry.url));

// TODO test for 3rd party!!! Use fetchStart == 0?

			g.appendChild(createSVGRect(barOffset + entry.start / scaleFactor, 0, entry.duration / scaleFactor, rowHeight, "fill: rgb(204, 204, 204)"));

			if(entry.redirectDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.redirectStart / scaleFactor , 0, entry.redirectDuration / scaleFactor, rowHeight, "fill: rgb(255, 221, 0)"));
			}

			if(entry.appCacheDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.appCacheStart / scaleFactor , 0, entry.appCacheDuration / scaleFactor, rowHeight, "fill: rgb(161, 103, 38)"));
			}

			if(entry.dnsDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.dnsStart / scaleFactor , 0, entry.dnsDuration / scaleFactor, rowHeight, "fill: rgb(48, 150, 158)"));
			}

			if(entry.tcpDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.tcpStart / scaleFactor , 0, entry.tcpDuration / scaleFactor, rowHeight, "fill: rgb(255, 157, 66)"));
			}

			if(entry.sslDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.sslStart / scaleFactor , 0, entry.sslDuration / scaleFactor, rowHeight, "fill: rgb(213,102, 223)"));
			}

			if(entry.requestDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.requestStart / scaleFactor , 0, entry.requestDuration / scaleFactor, rowHeight, "fill: rgb(64, 255, 64)"));
			}

			if(entry.responseDuration > 0) {
				g.appendChild(createSVGRect(barOffset + entry.responseStart / scaleFactor , 0, entry.responseDuration / scaleFactor, rowHeight, "fill: rgb(52,150,255)"));
			}

			svg.appendChild(g);
//			console.log(JSON.stringify(entry) + "\n" );
		}

		container.appendChild(svg);
	}


	function createSVG(width, height) {
		var el = document.createElementNS(xmlns, "svg");
 
		el.setAttribute("width", width);
		el.setAttribute("height", height);
    
		return el;
	}

	function createSVGGroup(transform) {		
		var el = document.createElementNS(xmlns, "g");
 
		el.setAttribute("transform", transform);
    
		return el;
	}

	function createSVGRect(x, y, width, height, style) {
		var el = document.createElementNS(xmlns, "rect");
 
		el.setAttribute("x", x);
		el.setAttribute("y", y);
		el.setAttribute("width", width);
		el.setAttribute("height", height);
		el.setAttribute("style", style);

		return el;
	}

	function createSVGLine(x1, y1, x2, y2, style) {
		var el = document.createElementNS(xmlns, "line");

		el.setAttribute("x1", x1);
		el.setAttribute("y1", y1);
		el.setAttribute("x2", x2);
		el.setAttribute("y2", y2);
		el.setAttribute("style", style);

  		return el;
	}

	function createSVGText(x, y, dx, dy, style, anchor, text) {
		var el = document.createElementNS(xmlns, "text");

		el.setAttribute("x", x);
		el.setAttribute("y", y);
		el.setAttribute("dx", dx);
		el.setAttribute("dy", dy);
		el.setAttribute("style", style);
		el.setAttribute("text-anchor", anchor);

		el.appendChild(document.createTextNode(text));

  		return el;
	}

	// Check for Navigation Timing and Resource Timing APIs

	if(window.performance !== undefined && 
	  (window.performance.getEntriesByType !== undefined || 
	   window.performance.webkitGetEntriesByType !== undefined)) {

		var timings = getTimings();

		drawWaterfall(timings);
	}
	else {
		alert("Resource Timing API not supported");
	}
})();