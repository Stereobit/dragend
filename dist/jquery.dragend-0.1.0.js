/**
 * ---------------------------- DRAGEND JS -------------------------------------
 *
 * Version: 0.1.0 beta
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

  // Welcome To dragend JS
  // =====================
  //
  // dragend JS is a swipe plugin for jQuery (http://jquery.com/). It's open
  // source (https://github.com/Stereobit/dragend) and uses hammer.js
  // (http://eightmedia.github.com/hammer.js/) for observing multi-touch
  // gestures. You can use dragend JS in fullscreen or boxed mode.
  //
  // The current version is 0.1.0.
  //
  // Usage
  // =====================
  //
  // To activate dragend JS just call the function on a jQuery element
  //
  // $("#swipe-container").dragend();
  //
  // You could rather pass in a options object or a string to bump on of the
  // following behaviors: "up", "down", "left", "right" for swiping in one of
  // these directions, "page" with the page number as second argument to go to a
  // explicit page and "reset" to go to the first page
  //
  // Settings
  // =====================
  //
  // You can use the following options:
  //
  // * pageContainer: container for the swiping elments
  // * pageElements: selector for all elments that should provide a page
  // * direction: "horizontal" or "vertical"
  // * minTouchDistance: minuimum distance (in pixel) the user has to drag
  //   to swip
  // * scripe: pixel value for a possible scripe
  // * onSwipeStart: callback function before the animation
  // * onSwipeEnd: callback function after the animation
  // * duration
  // * hammerSettings

  var defaultSettings = {
          "pageContainer"     : "ul",
          "pageElements"      : "li",
          "direction"         : "horizontal",
          "minTouchDistance"  : "40",
          "keyboardNavigation": false,
          "scribe"            : 0,
          "duration"          : 400,
          "hammerSettings"    : {
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

  var Dragend = function(container, options) {

    // Cached objects
    var WINDOW = $(window),
        BODY   = $(document.body);

    var scrollBorder  = { x: 0, y: 0 },
        page          = 0,
        preventScroll = false,
        settings      = $.extend({}, defaultSettings),
        pageContainer,
        pageDimentions,
        pages,
        activeElement,
        _scroll,
        _animateScroll,

    // Private functions
    // =================

    // ### Calculate page dimentions
    //
    // Updates the page dimentions values

    _calcPageDimentions = function() {
      var width  = container.width(),
          height = container.height();

      if (settings.direction === "horizontal") {
        width = width - parseInt(settings.scribe, 10);
      } else {
        height = height - parseInt(settings.scribe, 10);
      }

      pageDimentions = {
        "width" : width,
        "height": height
      };

      scrollBorder = {
        x: width * page,
        y: height * page
      };

    },

    // ### Overscroll  lookup table
    //
    // Checks if its the last or first page to slow down the scrolling if so
    //
    // Takes:
    // Drag event

    _overscroll = {
      "right": function(event) {
        if (!scrollBorder.x) {
          return (event.distanceX - scrollBorder.x) / 4;
        }
      },
      "left": function(event) {
        if ((pages.length - 1) * pageDimentions.width <= scrollBorder.x) {
          return - ((pages.length - 1) * pageDimentions.width) + event.distanceX / 4;
        }
      },
      "down": function(event) {
        if (!scrollBorder.y) {
          return (event.distanceY - scrollBorder.y) / 4;
        }
      },
      "up": function(event) {
        if ((pages.length - 1) * pageDimentions.height <= scrollBorder.y) {
          return - ((pages.length - 1) * pageDimentions.height) + event.distanceY / 4;
        }
      }
    },

    // Observe
    //
    // Sets the observers for drag, resize and key events

    _observe = function() {
      container.on("drag", settings.hammerSettings, function(event) {
        event.stopPropagation();
        event.preventDefault();

        var x = Math.round(_overscroll[event.direction](event)) || event.distanceX - scrollBorder.x,
            y = Math.round(_overscroll[event.direction](event)) || event.distanceY - scrollBorder.y;

        if (!preventScroll) _scroll[settings.direction](x, y);

      }).on("dragend", settings.hammerSettings, function(event) {
          event.stopPropagation();
          event.preventDefault();

          if (event.distance > settings.minTouchDistance) {
            swipe(event.direction);
          } else {
            _scrollToPage();
          }

      });

      WINDOW.on("resize", sizePages);

      if (!settings.keyboardNavigation) return;

      BODY.on("keydown", function() {
        var direction = keycodes[event.keyCode];

        if (direction) _scrollToPage(direction);
      });
    },

    // ### Scroll translate
    //
    // Animation lookup table when translate is supported
    //
    // Takes:
    // x and y values to go with

    _scrollTranslate = {
      "horizontal": function(x, y) {
        pageContainer.css("-webkit-transform", "translate3d(" + x + "px, 0, 0)");
      },
      "vertical"  : function(x, y) {
        pageContainer.css("-webkit-transform", "translate3d(0, " + y + "px, 0)");
      }
    },

    // ### Scroll fallback
    //
    // Animation lookup table  when translate isn't supported
    //
    // Takes:
    // x and y values to go with

    _scrollFallback = {
      "horizontal": function(x, y) {
        pageContainer.css({ "margin-left": x });
      },
      "vertical"  : function(x, y) {
       pageContainer.css({"margin-top": y });
      }
    },

    // ### Animated scroll with translate support

    _animateScrollTranslate = function() {
      activeElement = $(pages[page]);

      pageContainer.css("-webkit-transition", "-webkit-transform " + settings.duration + "ms ease-out");
      _scroll[settings.direction](- scrollBorder.x, - scrollBorder.y);

      window.setTimeout(function() {
        _onSwipeEnd();
        pageContainer.css("-webkit-transition", "-webkit-transform 0");
      }, settings.duration);
    },

    // ### Animated scroll without translate support

    _animateScrollFallback = function() {
      activeElement = $(pages[page]);

      pageContainer.animate({"margin-left": - scrollBorder.x, "margin-top": - scrollBorder.y}, settings.duration, "linear", _onSwipeEnd);
    },

    // ### Check translate support

    _checkTranslateSupport = function() {
      if ("WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix()) {
        _scroll = _scrollTranslate;
        _animateScroll = _animateScrollTranslate;
      } else {
        _scroll = _scrollFallback;
        _animateScroll = _animateScrollFallback;
      }
    },

    // ### Size pages

    sizePages = function() {
      var pageCssProperties = {},
          direction = {
            "horizontal": function() {
              $.extend(pageCssProperties, {
                "float"     : "left",
                "overflow-x": "scroll",
                "padding"   : 0
              });

              pageContainer.css({
                "overflow"                   : "hidden",
                "width"                      : pageDimentions.width * pages.length,
                "padding-right"              : settings.scribe,
                "box-sizing"                 : "content-box",
                "-webkit-backface-visibility": "hidden",
                "-webkit-perspective"        : 1000,
                "margin"                     : 0
              });
            },
            "vertical": function() {
              container.css({"height": pageDimentions.height + parseInt(settings.scribe, 10)});
              container.find(settings.pageContainer).css({"padding-bottom": settings.scribe});
            }
          };

      pages = container.find(settings.pageElements);
      pageContainer = container.find(settings.pageContainer);

      _calcPageDimentions();
      direction[settings.direction]();

      $.extend(pageCssProperties, {
        "height": pageDimentions.height,
        "width" : pageDimentions.width,
        "margin": 0,
        "border": 0
      });

      pages.each(function() {
        $(this).css(pageCssProperties);
      });

      if (settings.scrollToPage) {
        _scrollToPage("page", page);
        delete settings.scrollToPage;
      } else {
        _jumpToPage("page", page);
      }
    },

    // ### Callculate new page
    //
    // Update global values for specific swipe action
    //
    // Takes direction and, if specific page is used the pagenumber

    _calcNewPage = function(direction, pageNumber) {
      var target = {
        "up": function() {
          if (page < pages.length - 1) {
            scrollBorder.y = scrollBorder.y + pageDimentions.height;
            page++;
          }
        },
        "down": function() {
          if (page >= 0) {
            scrollBorder.y = scrollBorder.y - pageDimentions.height;
            page--;
          }
        },
        "left": function() {
          if (page < pages.length - 1) {
            scrollBorder.x = scrollBorder.x + pageDimentions.width;
            page++;
          }
        },
        "right": function() {
          if (page > 0) {
            scrollBorder.x = scrollBorder.x - pageDimentions.width;
            page--;
          }
        },
        "page": function(pageNumber) {
          scrollBorder.x = pageDimentions.width * pageNumber;
          page = pageNumber;
        },
        "reset": function() {
          scrollBorder.y = 0;
          scrollBorder.x = 0;
          page           = 0;
        }
      };

      target[direction](pageNumber);
    },

    // ### On swipe end
    //
    // Function called after the scroll animation ended

    _onSwipeEnd = function() {
      preventScroll = false;
      activeElement.trigger("active");
      if (settings.onSwipeEnd) settings.onSwipeEnd(container, activeElement, page);
    },

    // Jump to page
    //
    // Jumps without a animantion to specific page. The page number is only
    // necessary for the specific page direction
    //
    // Takes:
    // Direction and pagenumber

    _jumpToPage = function(options, pageNumber) {
      if (options) _calcNewPage(options, pageNumber);
      _scroll[settings.direction](- scrollBorder.x, - scrollBorder.y);
    },

    // Scroll to page
    //
    // Scrolls with a animantion to specific page. The page number is only necessary
    // for the specific page direction
    //
    // Takes:
    // Direction and pagenumber

    _scrollToPage = function(options, pageNumber) {
      preventScroll = true;

      if (options) _calcNewPage(options, pageNumber);
      _animateScroll();
    },

    // Initialisation

    _init = function() {
      _checkTranslateSupport();
      container.css(containerStyles);
      updateInstance(options);
      _observe();
    },

    // Public functions
    // ================

    swipe = function(direction) {
      var activeElement = $(pages[page]);

      if (settings.onSwipeStart) settings.onSwipeStart(container, activeElement);
      _scrollToPage(direction);
    },

    updateInstance = function(options) {
      if (typeof options === "object") settings = $.extend(settings, options);

      page = settings.jumpToPage || settings.scrollToPage || page;

      sizePages();
    };

    _init();

    return {
      "swipe"         : swipe,
      "updateInstance": updateInstance
    };
  };

  // Register jQuery plugin
  $.fn.dragend = function(options) {
    var instance = this.data("dragend");

    // check if instance already created
    if (instance) {
      instance.updateInstance(options);
    } else {
      instance = new Dragend(this, options);
      this.data("dragend", instance);
    }

    // check if should trigger swipe
    if (typeof options === "string") instance.swipe(options);

    // jQuery functions should always return the elment
    return this;
  };

})(jQuery, window);
