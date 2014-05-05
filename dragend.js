/*!
 * ---------------------------- DRAGEND JS -------------------------------------
 *
 * Version: <%= pkg.version %>
 * https://github.com/Stereobit/dragend
 * Copyright (c) 2014 Tobias Otte, t@stereob.it
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

 ;(function( window ) {
  "use strict";

  // help the minifier
  var doc = document,
      win = window;

  function init( $ ) {

    // Welcome To dragend JS
    // =====================
    //
    // dragend.js is a touch ready, full responsive, content swipe script. It has no dependencies
    // It also can, but don't has to, used as a jQuery
    // (https://github.com/jquery/jquery/) plugin.
    //
    // The current version is <%= pkg.version %>
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
    // explicit page and without any value to go to the first page
    //
    // Settings
    // =====================
    //
    // You can use the following options:
    //
    // * pageClass: classname selector for all elments that should provide a page
    // * direction: "horizontal" or "vertical"
    // * minDragDistance: minuimum distance (in pixel) the user has to drag
    //   to trigger swip
    // * scribe: pixel value for a possible scribe
    // * onSwipeStart: callback function before the animation
    // * onSwipeEnd: callback function after the animation
    // * onDragStart: called on drag start
    // * onDrag: callback on drag
    // * onDragEnd: callback on dragend
    // * borderBetweenPages: if you need space between pages add a pixel value
    // * duration
    // * stopPropagation
    // * afterInitialize called after the pages are size
    // * preventDrag if want to prevent user interactions and only swipe manualy

    var

      // Default setting
      defaultSettings = {
        pageClass          : "dragend-page",
        direction          : "horizontal",
        minDragDistance    : "40",
        onSwipeStart       : noop,
        onSwipeEnd         : noop,
        onDragStart        : noop,
        onDrag             : noop,
        onDragEnd          : noop,
        afterInitialize    : noop,
        keyboardNavigation : false,
        stopPropagation    : false,
        itemsInPage        : 1,
        scribe             : 0,
        borderBetweenPages : 0,
        duration           : 300,
        preventDrag        : false
      },

      isTouch = 'ontouchstart' in win,

      startEvent = isTouch ? 'touchstart' : 'mousedown',
      moveEvent = isTouch ? 'touchmove' : 'mousemove',
      endEvent = isTouch ? 'touchend' : 'mouseup',

      keycodes = {
        37: "left",
        38: "up",
        39: "right",
        40: "down"
      },

      errors = {
        pages: "No pages found"
      },

      containerStyles = {
        overflow: "hidden",
        padding : 0
      },

      supports = (function() {
         var div = doc.createElement('div'),
             vendors = 'Khtml Ms O Moz Webkit'.split(' '),
             len = vendors.length;

         return function( prop ) {
            if ( prop in div.style ) return true;

            prop = prop.replace(/^[a-z]/, function(val) {
               return val.toUpperCase();
            });

            while( len-- ) {
               if ( vendors[len] + prop in div.style ) {
                  return true;
               }
            }
            return false;
         };
      })(),

      supportTransform = supports('transform');

    function noop() {}

    function falseFn() {
      return false;
    }

    function setStyles( element, styles ) {

      var property,
          value;

      for ( property in styles ) {

        if ( styles.hasOwnProperty(property) ) {
          value = styles[property];

          switch ( property ) {
            case "height":
            case "width":
            case "marginLeft":
            case "marginTop":
              value += "px";
          }

          element.style[property] = value;

        }

      }

      return element;

    }

    function extend( destination, source ) {

      var property;

      for ( property in source ) {
        destination[property] = source[property];
      }

      return destination;

    }

    function proxy( fn, context ) {

      return function() {
        return fn.apply( context, Array.prototype.slice.call(arguments) );
      };

    }

    function getElementsByClassName( className, root ) {
      var elements;

      if ( $ ) {
        elements = $(root).find("." + className);
      } else {
        elements = Array.prototype.slice.call(root.getElementsByClassName( className ));
      }

      return elements;
    }

    function animate( element, propery, to, speed, callback ) {
      var propertyObj = {};

      propertyObj[propery] = to;

      if ($) {
        $(element).animate(propertyObj, speed, callback);
      } else {
        setStyles(element, propertyObj);
      }

    }

    /**
     * Returns an object containing the co-ordinates for the event, normalising for touch / non-touch.
     * @param {Object} event
     * @returns {Object}
     */
    function getCoords(event) {
      // touch move and touch end have different touch data
      var touches = event.touches,
          data = touches && touches.length ? touches : event.changedTouches;

      return {
        x: isTouch ? data[0].pageX : event.pageX,
        y: isTouch ? data[0].pageY : event.pageY
      };
    }

    function Dragend( container, settings ) {
      var defaultSettingsCopy = extend( {}, defaultSettings );

      this.settings      = extend( defaultSettingsCopy, settings );
      this.container     = container;
      this.pageContainer = doc.createElement( "div" );
      this.scrollBorder  = { x: 0, y: 0 };
      this.page          = 0;
      this.preventScroll = false;
      this.pageCssProperties = {
        margin: 0
      };

      // bind events
      this._onStart = proxy( this._onStart, this );
      this._onMove = proxy( this._onMove, this );
      this._onEnd = proxy( this._onEnd, this );
      this._onKeydown = proxy( this._onKeydown, this );
      this._sizePages = proxy( this._sizePages, this );
      this._afterScrollTransform = proxy(this._afterScrollTransform, this);

      this.pageContainer.innerHTML = container.cloneNode(true).innerHTML;
      container.innerHTML = "";
      container.appendChild( this.pageContainer );

      this._scroll = supportTransform ? this._scrollWithTransform : this._scrollWithoutTransform;
      this._animateScroll = supportTransform ? this._animateScrollWithTransform : this._animateScrollWithoutTransform;

      // Initialization

      setStyles(container, containerStyles);

      // Give the DOM some time to update ...
      setTimeout( proxy(function() {
          this.updateInstance( settings );
          if (!this.settings.preventDrag) {
            this._observe();
          }
          this.settings.afterInitialize.call(this);
      }, this), 10 );

    }

    function addEventListener(container, event, callback) {
      if ($) {
        $(container).on(event, callback);
      } else {
        container.addEventListener(event, callback, false);
      }
    }

    function removeEventListener(container, event, callback) {
      if ($) {
        $(container).off(event, callback);
      } else {
        container.removeEventListener(event, callback, false);
      }
    }

    extend(Dragend.prototype, {

      // Private functions
      // =================

      // ### Overscroll lookup table
      //
      // Checks if its the last or first page to slow down the scrolling if so
      //
      // Takes:
      // Drag event

      _checkOverscroll: function( direction, x, y ) {
        var coordinates = {
          x: x,
          y: y,
          overscroll: true
        };

        switch ( direction ) {

          case "right":
            if ( !this.scrollBorder.x ) {
              coordinates.x = Math.round((x - this.scrollBorder.x) / 5 );
              return coordinates;
            }
            break;

          case "left":
            if ( (this.pagesCount - 1) * this.pageDimentions.width <= this.scrollBorder.x ) {
              coordinates.x = Math.round( - ((Math.ceil(this.pagesCount) - 1) * (this.pageDimentions.width + this.settings.borderBetweenPages)) + x / 5 );
              return coordinates;
            }
            break;

          case "down":
            if ( !this.scrollBorder.y ) {
              coordinates.y = Math.round( (y - this.scrollBorder.y) / 5 );
              return coordinates;
            }
            break;

          case "up":
            if ( (this.pagesCount - 1) * this.pageDimentions.height <= this.scrollBorder.y ) {
              coordinates.y = Math.round( - ((Math.ceil(this.pagesCount) - 1) * (this.pageDimentions.height + this.settings.borderBetweenPages)) + y / 5 );
              return coordinates;
            }
            break;
        }

        return {
          x: x - this.scrollBorder.x,
          y: y - this.scrollBorder.y,
          overscroll: false
        };
      },

      // Observe
      //
      // Sets the observers for drag, resize and key events

      _observe: function() {

        addEventListener(this.container, startEvent, this._onStart);
        this.container.onselectstart = falseFn;
        this.container.ondragstart = falseFn;

        if ( this.settings.keyboardNavigation ) {
          addEventListener(doc.body, "keydown", this._onKeydown);
        }

        addEventListener(win, "resize", this._sizePages);

      },


      _onStart: function(event) {

        event = event.originalEvent || event;

        if (this.settings.stopPropagation) {
          event.stopPropagation();
        }

        addEventListener(doc.body, moveEvent, this._onMove);
        addEventListener(doc.body, endEvent, this._onEnd);

        this.startCoords = getCoords(event);

        this.settings.onDragStart.call( this, event );

      },

      _onMove: function( event ) {

        event = event.originalEvent || event;

        // ensure swiping with one touch and not pinching
        if ( event.touches && event.touches.length > 1 || event.scale && event.scale !== 1) return;

        event.preventDefault();
        if (this.settings.stopPropagation) {
          event.stopPropagation();
        }

        var parsedEvent = this._parseEvent(event),
            coordinates = this._checkOverscroll( parsedEvent.direction , - parsedEvent.distanceX, - parsedEvent.distanceY );

        this.settings.onDrag.call( this, this.activeElement, parsedEvent, coordinates.overscroll, event );

        if ( !this.preventScroll ) {
          this._scroll( coordinates );
        }
      },

      _onEnd: function( event ) {

        event = event.originalEvent || event;

        if (this.settings.stopPropagation) {
          event.stopPropagation();
        }

        var parsedEvent = this._parseEvent(event);

        this.startCoords = { x: 0, y: 0 };

        if ( Math.abs(parsedEvent.distanceX) > this.settings.minDragDistance || Math.abs(parsedEvent.distanceY) > this.settings.minDragDistance) {
          this.swipe( parsedEvent.direction );
        } else if (parsedEvent.distanceX > 0 || parsedEvent.distanceX > 0) {
          this._scrollToPage();
        }

        this.settings.onDragEnd.call( this, this.container, this.activeElement, this.page, event );

        removeEventListener(doc.body, moveEvent, this._onMove);
        removeEventListener(doc.body, endEvent, this._onEnd);

      },

      _parseEvent: function( event ) {
        var coords = getCoords(event),
            x = this.startCoords.x - coords.x,
            y = this.startCoords.y - coords.y;

        return this._addDistanceValues( x, y );
      },

      _addDistanceValues: function( x, y ) {
        var eventData = {
          distanceX: 0,
          distanceY: 0
        };

        if ( this.settings.direction === "horizontal" ) {
          eventData.distanceX = x;
          eventData.direction = x > 0 ? "left" : "right";
        } else {
          eventData.distanceY = y;
          eventData.direction = y > 0 ? "up" : "down";
        }

        return eventData;
      },

      _onKeydown: function( event ) {
        var direction = keycodes[event.keyCode];

        if ( direction ) {
          this._scrollToPage(direction);
        }
      },

      _setHorizontalContainerCssValues: function() {
        extend( this.pageCssProperties, {
          "cssFloat" : "left",
          "overflowY": "auto",
          "overflowX": "hidden",
          "padding"  : 0,
          "display"  : "block"
        });

        setStyles(this.pageContainer, {
          "overflow"                   : "hidden",
          "width"                      : (this.pageDimentions.width + this.settings.borderBetweenPages) * this.pagesCount,
          "boxSizing"                  : "content-box",
          "-webkit-backface-visibility": "hidden",
          "-webkit-perspective"        : 1000,
          "margin"                     : 0,
          "padding"                    : 0
        });
      },

      _setVerticalContainerCssValues: function() {
        extend( this.pageCssProperties, {
          "overflow": "hidden",
          "padding" : 0,
          "display" : "block"
        });

        setStyles(this.pageContainer, {
          "padding-bottom"              : this.settings.scribe,
          "boxSizing"                   : "content-box",
          "-webkit-backface-visibility" : "hidden",
          "-webkit-perspective"         : 1000,
          "margin"                      : 0
        });
      },

      setContainerCssValues: function(){
        if ( this.settings.direction === "horizontal") {
            this._setHorizontalContainerCssValues();
        } else {
            this._setVerticalContainerCssValues();
        }
      },

      // ### Calculate page dimentions
      //
      // Updates the page dimentions values

      _setPageDimentions: function() {
        var width  = this.container.offsetWidth,
            height = this.container.offsetHeight;

        if ( this.settings.direction === "horizontal" ) {
          width = width - parseInt( this.settings.scribe, 10 );
        } else {
          height = height - parseInt( this.settings.scribe, 10 );
        }

        this.pageDimentions = {
          width : width,
          height: height
        };

      },

      // ### Size pages

      _sizePages: function() {

        var pagesCount = this.pages.length;

        this._setPageDimentions();

        this.setContainerCssValues();

        if ( this.settings.direction === "horizontal" ) {
          extend( this.pageCssProperties, {
            height: this.pageDimentions.height,
            width : this.pageDimentions.width / this.settings.itemsInPage
          });
        } else {
          extend( this.pageCssProperties, {
            height: this.pageDimentions.height / this.settings.itemsInPage,
            width : this.pageDimentions.width
          });
        }

        for (var i = 0; i < pagesCount; i++) {
          setStyles(this.pages[i], this.pageCssProperties);
        }

        this._jumpToPage( "page", this.page );

      },

      // ### Callculate new page
      //
      // Update global values for specific swipe action
      //
      // Takes direction and, if specific page is used the pagenumber

      _calcNewPage: function( direction, pageNumber ) {

        var borderBetweenPages = this.settings.borderBetweenPages,
            height = this.pageDimentions.height,
            width = this.pageDimentions.width,
            page = this.page;

        switch ( direction ) {
          case "up":
            if ( page < this.pagesCount - 1 ) {
              this.scrollBorder.y = this.scrollBorder.y + height + borderBetweenPages;
              this.page++;
            }
            break;

          case "down":
            if ( page > 0 ) {
              this.scrollBorder.y = this.scrollBorder.y - height - borderBetweenPages;
              this.page--;
            }
            break;

          case "left":
            if ( page < this.pagesCount - 1 ) {
              this.scrollBorder.x = this.scrollBorder.x + width + borderBetweenPages;
              this.page++;
            }
            break;

          case "right":
            if ( page > 0 ) {
              this.scrollBorder.x = this.scrollBorder.x - width - borderBetweenPages;
              this.page--;
            }
            break;

          case "page":
            switch ( this.settings.direction ) {
              case "horizontal":
                this.scrollBorder.x = (width + borderBetweenPages) * pageNumber;
                break;

              case "vertical":
                this.scrollBorder.y = (height + borderBetweenPages) * pageNumber;
                break;
            }
            this.page = pageNumber;
            break;

          default:
            this.scrollBorder.y = 0;
            this.scrollBorder.x = 0;
            this.page           = 0;
            break;
        }
      },

      // ### On swipe end
      //
      // Function called after the scroll animation ended

      _onSwipeEnd: function() {
        this.preventScroll = false;

        this.activeElement = this.pages[this.page * this.settings.itemsInPage];

        // Call onSwipeEnd callback function
        this.settings.onSwipeEnd.call( this, this.container, this.activeElement, this.page);
      },

      // Jump to page
      //
      // Jumps without a animantion to specific page. The page number is only
      // necessary for the specific page direction
      //
      // Takes:
      // Direction and pagenumber

      _jumpToPage: function( options, pageNumber ) {

        if ( options ) {
          this._calcNewPage( options, pageNumber );
        }

        this._scroll({
          x: - this.scrollBorder.x,
          y: - this.scrollBorder.y
        });
      },

      // Scroll to page
      //
      // Scrolls with a animantion to specific page. The page number is only necessary
      // for the specific page direction
      //
      // Takes:
      // Direction and pagenumber

      _scrollToPage: function( options, pageNumber ) {
        this.preventScroll = true;

        if ( options ) this._calcNewPage( options, pageNumber );

        this._animateScroll();
      },

      // ### Scroll translate
      //
      // Animation when translate is supported
      //
      // Takes:
      // x and y values to go with

      _scrollWithTransform: function ( coordinates ) {
        var style = this.settings.direction === "horizontal" ? "translateX(" + coordinates.x + "px)" : "translateY(" + coordinates.y + "px)";

        setStyles( this.pageContainer, {
          "-webkit-transform": style,
          "-moz-transform": style,
          "-ms-transform": style,
          "-o-transform": style,
          "transform": style
        });

      },

      // ### Animated scroll with translate support

      _animateScrollWithTransform: function() {

        var style = "transform " + this.settings.duration + "ms ease-out",
            container = this.container,
            afterScrollTransform = this._afterScrollTransform;

        setStyles( this.pageContainer, {
          "-webkit-transition": "-webkit-" + style,
          "-moz-transition": "-moz-" + style,
          "-ms-transition": "-ms-" + style,
          "-o-transition": "-o-" + style,
          "transition": style
        });

        this._scroll({
          x: - this.scrollBorder.x,
          y: - this.scrollBorder.y
        });

        addEventListener(this.container, "webkitTransitionEnd", afterScrollTransform);
        addEventListener(this.container, "oTransitionEnd", afterScrollTransform);
        addEventListener(this.container, "transitionend", afterScrollTransform);
        addEventListener(this.container, "transitionEnd", afterScrollTransform);

      },

      _afterScrollTransform: function() {

        var container = this.container,
            afterScrollTransform = this._afterScrollTransform;

        this._onSwipeEnd();

        removeEventListener(container, "webkitTransitionEnd", afterScrollTransform);
        removeEventListener(container, "oTransitionEnd", afterScrollTransform);
        removeEventListener(container, "transitionend", afterScrollTransform);
        removeEventListener(container, "transitionEnd", afterScrollTransform);

        setStyles( this.pageContainer, {
          "-webkit-transition": "",
          "-moz-transition": "",
          "-ms-transition": "",
          "-o-transition": "",
          "transition": ""
        });

      },

      // ### Scroll fallback
      //
      // Animation lookup table  when translate isn't supported
      //
      // Takes:
      // x and y values to go with

      _scrollWithoutTransform: function( coordinates ) {
        var styles = this.settings.direction === "horizontal" ? { "marginLeft": coordinates.x } : { "marginTop": coordinates.y };

        setStyles(this.pageContainer, styles);
      },

      // ### Animated scroll without translate support

      _animateScrollWithoutTransform: function() {
        var property = this.settings.direction === "horizontal" ? "marginLeft" : "marginTop",
            value = this.settings.direction === "horizontal" ? - this.scrollBorder.x : - this.scrollBorder.y;

        animate( this.pageContainer, property, value, this.settings.duration, proxy( this._onSwipeEnd, this ));

      },

      // Public functions
      // ================

      swipe: function( direction ) {
        // Call onSwipeStart callback function
        this.settings.onSwipeStart.call( this, this.container, this.activeElement, this.page );
        this._scrollToPage( direction );
      },

      updateInstance: function( settings ) {

        settings = settings || {};

        if ( typeof settings === "object" ) extend( this.settings, settings );

        this.pages = getElementsByClassName(this.settings.pageClass, this.pageContainer);

        if (this.pages.length) {
          this.pagesCount = this.pages.length / this.settings.itemsInPage;
        } else {
          throw new Error(errors.pages);
        }

        this.activeElement = this.pages[this.page * this.settings.itemsInPage];
        this._sizePages();

        if ( this.settings.jumpToPage ) {
          this.jumpToPage( settings.jumpToPage );
          delete this.settings.jumpToPage;
        }

        if ( this.settings.scrollToPage ) {
          this.scrollToPage( this.settings.scrollToPage );
          delete this.settings.scrollToPage;
        }

      },

      destroy: function() {

        var container = this.container;

        removeEventListener(container, startEvent);
        removeEventListener(container, moveEvent);
        removeEventListener(container, endEvent);
        removeEventListener(doc.body, "keydown", this._onKeydown);
        removeEventListener(win, "resize", this._sizePages);

        container.removeAttribute("style");

        for (var i = 0; i < this.pages.length; i++) {
          this.pages[i].removeAttribute("style");
        }

        container.innerHTML = this.pageContainer.innerHTML;

      },

      scrollToPage: function( page ) {
        this._scrollToPage( "page", page - 1);
      },

      jumpToPage: function( page ) {
        this._jumpToPage( "page", page - 1);
      }

    });

    if ( $ ) {

        // Register jQuery plugin
        $.fn.dragend = function( settings ) {

          settings = settings || {};

          this.each(function() {
            var instance = $(this).data( "dragend" );

            // check if instance already created
            if ( instance ) {
              instance.updateInstance( settings );
            } else {
              instance = new Dragend( this, settings );
              $(this).data( "dragend", instance );
            }

            // check if should trigger swipe
            if ( typeof settings === "string" ) instance.swipe( settings );

          });

          // jQuery functions should always return the instance
          return this;
        };

    }

    return Dragend;

  }

  if ( typeof define == 'function' && typeof define.amd == 'object' && define.amd ) {
      define(function() {
        return init( win.jQuery || win.Zepto );
      });
  } else {
      win.Dragend = init( win.jQuery || win.Zepto );
  }

})( window );