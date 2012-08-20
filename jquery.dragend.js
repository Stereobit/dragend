/**
 * ---------------------------- DRAGEND JS -------------------------------------
 *
 * Version: 0.1.0 alpha
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

  var WINDOW,
      BODY,
      defaultSettings = {
          "pageElements"      : "li",
          "direction"         : "horizontal",
          "pageContainer"     : "ul",
          "minTouchDistance"  : "40",
          "keyboardNavigation": false,
          "scribe"            : 0,
          "hammerSettings"     : {
            "drag_min_distance": 0,
            "css_hacks"        : false
          }
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
      };

  var dragend = function(container, options) {

    var scrollBorder = { x: 0, y: 0 },
        page = 0,
        settings,
        pageDimentions,
        settings,
        pages,

    _calcPageDimentions = function() {
      var width  = container.width(),
          height = container.height();

      if (settings.direction === "horizontal") {
        width = width - parseInt(settings.scribe, 10);
      } else {
        height = height - parseInt(settings.scribe, 10);
      };

      pageDimentions = {
        "width" : width,
        "height": height
      };

      scrollBorder = {
        x: width * page,
        y: height * page
      };

    },

    _observeDrag = function() {
      var activeElement = $(pages[page]);

      scrollBorder.x = container.scrollLeft();
      scrollBorder.y = container.scrollTop();

      settings.onSwipeEnd && settings.onSwipeEnd(container, activeElement);
      activeElement.trigger("active");

      container.on("drag", settings.hammerSettings, function(event) {
        event.stopPropagation();

        _scrollTo( - event.distanceX + scrollBorder.x,  - event.distanceY + scrollBorder.y);

      }).on("dragend", settings.hammerSettings, function(event) {
          event.stopPropagation();

          if (event.distance > settings.minTouchDistance) {
            swipe(event.direction);
          } else {
            container.animate({ scrollLeft: scrollBorder.x, scrollTop: scrollBorder.y}, 200, "linear");
          };
      });
    },

    _observeBody = function() {
      WINDOW.on("resize", sizePages);

      if (!settings.keyboardNavigation) return;

      BODY.on("keydown", function() {
        var direction = keycodes[event.keyCode];

        if (direction) {
          _calcNewPage(direction);
          _scrollToPage();
        };
      });
    },

    _stopDragObserving = function() {
      container.off("drag dragend");
    },

    _scrollTo = function(x, y) {
      var y = y || scrollBorder.y,
          x = x || scrollBorder.x;

      container.scrollTop(y)
               .scrollLeft(x);
    },

    _scrollToPage = function() {
      _stopDragObserving();
      container.animate({ scrollLeft: scrollBorder.x, scrollTop: scrollBorder.y}, 200, "linear", _observeDrag);
    },

    _calcNewPage = function(direction) {
      var scroll = {
        "up": function() {
          scrollBorder.y = scrollBorder.y + pageDimentions.height;
          if (page < pages.length - 1) page++;
        },
        "down": function() {
          scrollBorder.y = scrollBorder.y - pageDimentions.height;
          if (page >= 0) page--;
        },
        "left": function() {
          scrollBorder.x = scrollBorder.x + pageDimentions.width;
          if (page < pages.length - 1) page++;
        },
        "right": function() {
          scrollBorder.x = scrollBorder.x - pageDimentions.width;
          if (page > 0) page--;
        },
        "reset": function() {
          scrollBorder.y = 0;
          scrollBorder.x = 0;
          page = 0;
        }
      };

      scroll[direction]();
    },

    _init = function() {
      WINDOW = $(window),
      BODY = $(document.body);

      container.css(containerStyles);
      sizePages(options);
      _observeDrag();
      _observeBody();
    },

    swipe = function(direction) {
      var activeElement = $(pages[page]);

      settings.onSwipeStart && settings.onSwipeStart(container, activeElement);
      _calcNewPage(direction);
      _scrollToPage();
    },

    sizePages = function(options) {
      if (!options || typeof options === "object") {
        settings = $.extend(defaultSettings, options);
      };

      var pageCssProperties = containerStyles,
          direction = {
            "horizontal": function() {
              $.extend(pageCssProperties, {
                "float": "left"
              });

              container.find(settings.pageContainer).css({
                "overflow"     : "hidden",
                "width"        : pageDimentions.width * pages.length,
                "padding-right": settings.scribe,
                "box-sizing"   : "content-box"
              });
            },
            "vertical": function() {
              container.css({"height": pageDimentions.height + parseInt(settings.scribe, 10)});
              container.find(settings.pageContainer).css({"padding-bottom": settings.scribe});
            }
          };

      pages = container.find(settings.pageElements);

      _calcPageDimentions();

      $.extend(pageCssProperties, {
        "height" : pageDimentions.height,
        "width"  : pageDimentions.width
      });

      direction[settings.direction]();

      pages.each(function() {
        $(this).css(pageCssProperties);
      });

      _scrollTo();
    };

    _init()

    return {
      "swipe"    : swipe,
      "sizePages": sizePages
    }
  };

  $.fn.dragend = function(options) {
    var instance = this.data("dragend");

    if (instance) {
      instance.sizePages(options);
    } else {
      instance = new dragend(this, options);
      this.data("dragend", instance);
    };

    if (typeof options === "string") instance.swipe(options);

    return this;
  };

})(jQuery, window);