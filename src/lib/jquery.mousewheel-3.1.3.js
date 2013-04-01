/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */

(function ($) {

  var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
      toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
      lowestDelta,
      lowestDeltaXY,
      lastTimestamp;

  if ( $.event.fixHooks ) {
    $.each(toFix, function(index, item) {
      $.event.fixHooks[item] = $.event.mouseHooks;
    });
  }

  $.event.special.mousewheel = {
    setup: function(data) {
      var element = this,
          instance = new handler(this);

      if ( this.addEventListener ) {

        $.each(toBind, function(index, item) {
          element.addEventListener( item, $.proxy(instance.onMouseWheel, instance), false );
        });
      } else {
        element.onmousewheel = $.proxy(instance.onMouseWheel, instance);
      }
    },

    teardown: function() {
      if ( this.removeEventListener ) {
        $.each(toBind, function(index, item) {
          this.removeEventListener( item, handler, false );
        });
      } else {
        this.onmousewheel = null;
      }
    }
  };

  var handler = function(element) {
    this.element = element;
    this.cachedDelta = 0;
    this.cachedDeltaX = 0;
    this.cachedDeltaY = 0;
  };

  $.extend(handler.prototype, {

    onMouseWheel: function(event) {
      var orgEvent = event || window.event,
          args = [].slice.call(arguments, 1),
          delta = 0,
          deltaX = 0,
          deltaY = 0,
          absDelta = 0,
          absDeltaXY = 0,
          gesture,
          fn;

      this.event = $.event.fix(orgEvent);
      this.event.type = "mousewheel";

      // Old school scrollwheel delta
      if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
      if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

      // New school wheel delta (wheel event)
      if ( orgEvent.deltaY ) {
        deltaY = orgEvent.deltaY * -1;
        delta  = deltaY;
      }
      if ( orgEvent.deltaX ) {
        deltaX = orgEvent.deltaX;
        delta  = deltaX * -1;
      }

      // Webkit
      if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
      if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

      // Look for lowest delta to normalize the delta values
      absDelta = Math.abs(delta);
      if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
      absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
      if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

      // Get a whole value for the deltas
      fn = delta > 0 ? 'floor' : 'ceil';

      this._setCache(event, delta, deltaX, deltaY);

      window.setTimeout($.proxy(this._checkForStop, this), 700);

      gesture = {
        delta: Math[fn](delta / lowestDelta) - this.cachedDelta,
        deltaX: Math[fn](deltaX / lowestDeltaXY) - this.cachedDeltaX,
        deltaY: Math[fn](deltaY / lowestDeltaXY) - this.cachedDeltaY,
        direction: this._getScrollDirection(deltaX, deltaY)
      };

      $.extend(this.event, {
        "gesture": gesture
      });

      // Add event and delta to the front of the arguments
      args.unshift(this.event);

      return ($.event.dispatch || $.event.handle).apply(this.element, args);
    },

    _checkForStop: function() {
      var currentTimeStamp = new Date().getTime(),
          stampDifference = currentTimeStamp - this.lastTimestamp;

      if (stampDifference >= 700) {
        this.event.type = "mousewheelend";
        $(this.element).trigger(this.event);
      }

    },

    _setCache: function (event, delta, deltaX, deltaY) {

      if (event.timeStamp - this.lastTimestamp > 700) {
        this._resetCache();
      } else {
        this._updateCache(delta, deltaX, deltaY);
      }

      this.lastTimestamp = event.timeStamp;

    },

    _resetCache: function() {
      this.cachedDelta = 0;
      this.cachedDeltaX = 0;
      this.cachedDeltaY = 0;
    },

    _updateCache: function(delta, deltaX, deltaY) {
      this.cachedDelta = this.cachedDelta + delta;
      this.cachedDeltaX = this.cachedDeltaX + deltaX;
      this.cachedDeltaY = this.cachedDeltaY + deltaY;
    },

    _getScrollDirection: function(deltaX, deltaY) {
      var x = Math.abs(deltaX),
          y = Math.abs(deltaY);

      if(x >= y) {
        return deltaX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
      }
      else {
        return deltaY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
      }
    }
  });

})(jQuery);