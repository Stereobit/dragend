/**
 * ---------------------------- DRAGEND JS -------------------------------------
 *
 * Version: 0.1.0
 * https://github.com/Stereobit/dragend
 * Copyright (c) 2012 Tobias Otte, t@stereob.it
 *
 * Licensed under MIT-style license:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

 ;(function($) {
  "use strict";

  var WINDOW = $(window),
      BODY = $(document.body),
      settings;

  var dragend = (function() {

    var minTouchDistance = 40,
        scrollBorderY = 0,
        scrollBorderX = 0,
        page = 0,
        keycodes = {
          "37": "left",
          "38": "up",
          "39": "right",
          "40": "down"
        },
        container;

    function _calcPageDimentions() {
      return {
        "width"  : width,
        "height" : height
      }
    }

    function _sizePages() {
      var pages = container.find(settings.pageElements);

      container.css({"overflow": "hidden"})
               .find(settings.pageContainer).css({"width": WINDOW.width() * pages.length + "px"});

      pages.each(function(index, element) {
        $(this).css({"height" : WINDOW.height(), "width": WINDOW.width(), "display": "table-cell" });
      });
    }

    function _observe() {
      scrollBorderX = container.scrollLeft() || 0;
      scrollBorderY = container.scrollTop() || 0;

      BODY.on("drag", {"drag_min_distance": 0 }, function(event) {
        container.scrollTop( - event.distanceY + scrollBorderY)
               .scrollLeft( - event.distanceX + scrollBorderX);
      }).on("dragend", {"drag_min_distance": 0 }, function(event) {
          if (event.distance > settings.minTouchDistance) {
            _calcNewPage(event.direction);
          }
          _scrollToPage(scrollBorderX, scrollBorderY);
      }).on("keydown", function() {
        var direction = keycodes[event.keyCode];

        if (direction) {
          $(this).trigger("page-swipe", direction);
        }
      }).on("page-swipe", function(event, direction) {
        _calcNewPage(direction);
        _scrollToPage(scrollBorderX, scrollBorderY);
      });
    };

    function _scrollToPage() {
      _stopObserving();
      container.animate({ scrollLeft: scrollBorderX, scrollTop: scrollBorderY}, 200, "linear", _observe);
    }

    function _stopObserving() {
      BODY.off("drag dragend keydown page-swipe");
    }

    function _calcNewPage(direction) {
      var scroll = {
        "up" : function() {
          scrollBorderY = scrollBorderY + WINDOW.height();
          page++;
        },
        "down" : function() {
          scrollBorderY = scrollBorderY - WINDOW.height();
          page--;
        },
        "left" : function() {
          scrollBorderX = scrollBorderX + WINDOW.width();
          page++;
        },
        "right" : function() {
          scrollBorderX = scrollBorderX - WINDOW.width();
          page--;
        }
      };

      scroll[direction]();
    }

    return {
      init: function(element, options) {
        container = element;
        _sizePages();
        WINDOW.on("resize", _sizePages);
        _observe();
      }
    };
  })();
  
  $.fn.dragend = function(options) {
    settings = $.extend( {
      "pageElements": "li",
      "pageContainer": "ul",
      "minTouchDistance": "40",
      "fullscreen": true
    }, options);

    new dragend.init(this);
  };

})(jQuery);