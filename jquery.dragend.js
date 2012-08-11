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

 ;(function($, window) {
  "use strict";

  var WINDOW = $(window),
      BODY = $(document.body),
      settings;

  var dragend = (function() {

    var minTouchDistance = 40,
        scrollBorder = { x: 0, y: 0 },
        page = 0,
        keycodes = {
          "37": "left",
          "38": "up",
          "39": "right",
          "40": "down"
        },
        container,
        pageDimentions;


    function _calcPageDimentions() {
      if (settings.fullscreen) {
        var width  = WINDOW.width(),
            height = WINDOW.height();
      } else {
        var width  = container.width(),
            height = container.height();
      };

      pageDimentions = {
        "width"  : width,
        "height" : height
      };

      scrollBorder = {
        x: width * page,
        y: height * page
      };

    }

    function _sizePages() {
      var pages = container.find(settings.pageElements);

      _calcPageDimentions();

      container.css({"overflow": "hidden"})
               .find(settings.pageContainer).css({"width": pageDimentions.width * pages.length  + "px"});

      pages.each(function(index, element) {
        $(this).css({"height" : pageDimentions.height + "px", "width": pageDimentions.width  + "px", "display": "table-cell" });
      });

      container.scrollTop(scrollBorder.y)
               .scrollLeft(scrollBorder.x);
    }

    function _observe() {
      scrollBorder.x = container.scrollLeft();
      scrollBorder.y = container.scrollTop();

      BODY.on("drag", {"drag_min_distance": 0 }, function(event) {
        event.stopPropagation();

        container.scrollTop( - event.distanceY + scrollBorder.y)
                 .scrollLeft( - event.distanceX + scrollBorder.x);
      }).on("dragend", {"drag_min_distance": 0 }, function(event) {
          event.stopPropagation();

          if (event.distance > settings.minTouchDistance) {
            _calcNewPage(event.direction);
          };

          _scrollToPage(scrollBorder.x, scrollBorder.y);
      }).on("keydown", function() {
        var direction = keycodes[event.keyCode];
        console.log(event.keyCode, event.keycodes, event.which);

        if (direction) {
          $(this).trigger("page-swipe", direction);
        };
      }).on("page-swipe", function(event, direction) {
        _calcNewPage(direction);
        _scrollToPage(scrollBorder.x, scrollBorder.y);
      });
    };

    function _scrollToPage() {
      _stopObserving();
      container.animate({ scrollLeft: scrollBorder.x, scrollTop: scrollBorder.y}, 200, "linear", _observe);
    };

    function _stopObserving() {
      BODY.off("drag dragend keydown page-swipe");
    };

    function _calcNewPage(direction) {
      var scroll = {
        "up" : function() {
          scrollBorder.y = scrollBorder.y + pageDimentions.height;
          page++;
        },
        "down" : function() {
          scrollBorder.y = scrollBorder.y - pageDimentions.height;
          page--;
        },
        "left" : function() {
          scrollBorder.x = scrollBorder.x + pageDimentions.width;
          page++;
        },
        "right" : function() {
          scrollBorder.x = scrollBorder.x - pageDimentions.width;
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

})(jQuery, window);