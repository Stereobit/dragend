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
      defaultSettings = {
          "pageElements"    : "li",
          "direction"       : "horizontal",
          "pageContainer"   : "ul",
          "minTouchDistance": "40",
          "cursorNavigation": false
      },
      keycodes = {
          "37": "left",
          "38": "up",
          "39": "right",
          "40": "down"
      },
      containerStyles = {
        "overflow": "hidden",
        "padding" : 0
      }

  var dragend = function(container, options) {

    var scrollBorder = { x: 0, y: 0 },
        page = 0,
        settings,
        pageDimentions,
        settings,

    _calcPageDimentions = function() {
      var width  = container.width(),
          height = container.height();

      pageDimentions = {
        "width"  : width,
        "height" : height
      };

      scrollBorder = {
        x: width * page,
        y: height * page
      };

    },

    _sizePages = function() {
      _calcPageDimentions();

      var pages = container.find(settings.pageElements),
          pageCssProperties = {
            "height"  : pageDimentions.height + "px",
            "width"   : pageDimentions.width  + "px",
            "padding" : 0
          };

      if (settings.direction === "horizontal") {
        $.extend(pageCssProperties, {"display": "table-cell"});

        container.find(settings.pageContainer).css({"width": pageDimentions.width * pages.length + "px"});
      } else if (settings.direction === "vertical") {
        container.css({"height": pageDimentions.height + "px"});
      };

      pages.each(function() {
        $(this).css(pageCssProperties);
      });

      container.scrollTop(scrollBorder.y)
               .scrollLeft(scrollBorder.x);
    },

    _observeDrag = function() {
      scrollBorder.x = container.scrollLeft();
      scrollBorder.y = container.scrollTop();

      container.on("drag", {"drag_min_distance": 0 }, function(event) {
        event.stopPropagation();

        container.scrollTop( - event.distanceY + scrollBorder.y)
                 .scrollLeft( - event.distanceX + scrollBorder.x);
      }).on("dragend", {"drag_min_distance": 0 }, function(event) {
          event.stopPropagation();

          if (event.distance > settings.minTouchDistance) {
            _calcNewPage(event.direction);
          };

          _scrollToPage(scrollBorder.x, scrollBorder.y);
      });
    },

    _observeBody = function() {
      WINDOW.on("resize", _sizePages);

      if (!settings.cursorNavigation) return;

      BODY.on("keydown", function() {
        var direction = keycodes[event.keyCode];

        if (direction) {
          _calcNewPage(direction);
          _scrollToPage(scrollBorder.x, scrollBorder.y);
        };
      });
    },

    _stopDragObserving = function() {
      container.off("drag dragend");
    },

    _scrollToPage = function() {
      _stopDragObserving();
      container.animate({ scrollLeft: scrollBorder.x, scrollTop: scrollBorder.y}, 200, "linear", _observeDrag);
    },

    _calcNewPage = function(direction) {
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
    },

    init = function() {
      if (!options || typeof options === "object") {
        settings = $.extend(defaultSettings, options);
      };

      container.css(containerStyles);
      _sizePages();
      _observeDrag();
      _observeBody();
    },

    swipe = function(direction) {
      _calcNewPage(direction);
      _scrollToPage(scrollBorder.x, scrollBorder.y);
    };

    init();
    
    return {
      "swipe": swipe
    }
  };
  
  $.fn.dragend = function(options) {
    var instance = this.data("dragend")

    if (!instance) {
      instance = new dragend(this, options);
      this.data("dragend", instance);
    };

    if (typeof options === "string") {
      instance.swipe(options);
    };

    return this;
  };

})(jQuery, window);