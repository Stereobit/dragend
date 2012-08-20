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
          "duration"          : 400,
          "useWebkit"         : false,
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

  var dragend = function(container, options) {

    var scrollBorder = { x: 0, y: 0 },
        page = 0,
        preventScroll = false,
        settings,
        pageContainer,
        pageDimentions,
        scroll,
        animateScroll,
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

      settings.onSwipeEnd && settings.onSwipeEnd(container, activeElement);
      activeElement.trigger("active");

      container.on("drag", settings.hammerSettings, function(event) {
        event.stopPropagation();

        if (!preventScroll) _scrollTo(event.distanceX - scrollBorder.x, event.distanceY - scrollBorder.y);

      }).on("dragend", settings.hammerSettings, function(event) {
          event.stopPropagation();

          if (event.distance > settings.minTouchDistance) {
            swipe(event.direction);
          } else {
            _scrollToPage();
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

    _scrollTo = function(x, y) {
      var y = y || - scrollBorder.y,
          x = x || - scrollBorder.x;

      scroll[settings.direction](x, y);
    },

    _scrollToPage = function() {
      preventScroll = true;
      animateScroll();
    },

    _checkTranslateSupport = function() {
      if ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()) {

        scroll = {
          "horizontal": function(x, y) {
            pageContainer.css("-webkit-transform", "translate3d(" + x + "px, 0, 0)");
          },
          "vertical"  : function(x, y) {
            pageContainer.css("-webkit-transform", "translate3d(0, " + y + "px, 0)");
          }
        };

        animateScroll = function() {
          pageContainer.css("-webkit-transition", "-webkit-transform " + settings.duration + "ms ease-out");
          _scrollTo();

          window.setTimeout(function() {
            preventScroll = false;
            pageContainer.css("-webkit-transition", "-webkit-transform 0");
          }, settings.duration);
        }

      } else {

        scroll = {
          "horizontal": function() {
            pageContainer.css({ "margin-left": x});
          },
          "vertical"  : function() {
           pageContainer.css({"margin-top": y});
          }
        };

        animateScroll = function() {
          pageContainer.animate({ "margin-left": - scrollBorder.x, "margin-top": - scrollBorder.y}, settings.duration, "linear", function() {
            preventScroll = false;
          });
        }
      };
    },

    _calcNewPage = function(direction) {
      var scroll = {
        "up": function() {
          if (page < pages.length - 1) {
            scrollBorder.y = scrollBorder.y + pageDimentions.height;
            page++;
          };
        },
        "down": function() {
          if (page >= 0) {
            scrollBorder.y = scrollBorder.y - pageDimentions.height;
            page--;
          };
        },
        "left": function() {
          if (page < pages.length - 1) {
            scrollBorder.x = scrollBorder.x + pageDimentions.width;
            page++;
          };
        },
        "right": function() {
          if (page > 0) {
            scrollBorder.x = scrollBorder.x - pageDimentions.width;
            page--;
          };
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

      _checkTranslateSupport();
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

              pageContainer.css({
                "overflow"           : "hidden",
                "width"              : pageDimentions.width * pages.length,
                "padding-right"      : settings.scribe,
                "box-sizing"         : "content-box"
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

    _init();

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