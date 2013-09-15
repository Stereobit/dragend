/**
 * ---------------------------- DRAGEND JS -------------------------------------
 *
 * Version: 0.2.0_rc1
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

 ;( function( $, window ) {
  "use strict";

  // Welcome To dragend JS
  // =====================
  //
  // dragend JS is a swipe plugin for jQuery (http://jquery.com/). It's open
  // source (https://github.com/Stereobit/dragend) and uses hammer.js
  // (http://eightmedia.github.com/hammer.js/) for observing multi-touch
  // gestures. You can use dragend JS in fullscreen or boxed mode.
  //
  // The current version is 0.1.3
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
  // * onDrag: callback on drag
  // * onDragEnd: callback on dragend
  // * borderBetweenPages: if you need space between pages add a pixel value
  // * duration
  // * hammerSettings

  var

    noop = function() {},

    // Default setting
    defaultSettings = {
      pageClass          : "dragend-page",
      direction          : "horizontal",
      minDragDistance    : "40",
      onSwipeStart       : noop,
      onSwipeEnd         : noop,
      onDrag             : noop,
      onDragEnd          : noop,
      keyboardNavigation : false,
      itemsInPage        : 1,
      scribe             : 0,
      borderBetweenPages : 0,
      duration           : 300,
      hammerSettings     : {
        drag_min_distance: 0,
        css_hacks        : false,
        prevent_default  : true
      }
    },

    keycodes = {
      37: "left",
      38: "up",
      39: "right",
      40: "down"
    },

    errors = {
      handling: "Dragend JS detected some problems with the event handling. Maybe the user-drag CSS attribute on images can help",
      pages: "No pages found"
    },

    containerStyles = {
      overflow: "hidden",
      padding : 0
    },

    setStyles = function(element, styles) {
      var property,
          value;

      for (property in styles) {

        if(styles.hasOwnProperty(property)) {
          value = styles[property];

          switch (property) {
            case "height":
            case "width":
            case "margin-left":
            case "margin-top":
              value += "px";
          }

          element.style[property] = value;

        }

      }

    },

    extend = function(destination, source) {
      for (var property in source)
        destination[property] = source[property];
      return destination;
    },

    proxy = function( fn, context ) {
      return function() {
        return fn.apply( context, Array.prototype.slice.call(arguments) );
      };
    },

    getElementsByClassName = function(className, root) {
      var elements = [];

      if( document.querySelector && document.querySelectorAll ) {
         elements = root.getElementsByClassName(className);
      } else {
        var allElements = root.getElementsByTagName('*');

        for (var i = 0; i < allElements.length; i++) {
          if ((' ' + allElements[i].className + ' ').indexOf(' ' + className +' ') > -1 ) {
            elements.push(allElements[i]);
          }
        }

      }

      return Array.prototype.slice.call(elements);
    },

    animate = function(element, propery, to, speed, callback) {

      var start = + new Date(),
          from = parseInt(element.style[propery], 10);

      var timer = setInterval(function() {

        var timeGone = + new Date() - start,
            value;

        if (timeGone >= speed) {

          value = to;
          callback();

          clearInterval(timer);

        } else {
          value = Math.round((( (to - from) * (Math.floor((timeGone / speed) * 100) / 100) ) + from));
        }

        element.style[propery] = value + "px";

      }, 5);

    },

    Dragend = function( container, settings ) {
      var defaultSettingsCopy = extend( {}, defaultSettings );

      this.settings      = extend( defaultSettingsCopy, settings );
      this.container     = container;
      this.pageContainer = document.createElement("div");
      this.scrollBorder  = { x: 0, y: 0 };
      this.page          = 0;
      this.preventScroll = false;
      this.pageCssProperties = {
        margin: 0
      };

      this.pageContainer.innerHTML = this.container.innerHTML;
      this.container.innerHTML = null;
      this.container.appendChild(this.pageContainer);

      // Initialisation

      setStyles(this.container, containerStyles);
      this._observe();

      // Give the DOM some time to update ...
      window.setTimeout(proxy(function() {
          this.updateInstance( settings );
      }, this), 10);

    },

    withTranslateMethodes = {
      // ### Scroll translate
      //
      // Animation when translate is supported
      //
      // Takes:
      // x and y values to go with

      _scroll: function( coordinates ) {
        switch ( this.settings.direction ) {
          case "horizontal":
            setStyles(this.pageContainer, {
              "-webkit-transform": "translate3d(" + coordinates.x + "px, 0, 0)"
            });
            break;

          case "vertical":
            setStyles(this.pageContainer, {
              "-webkit-transform": "translate3d(0, " + coordinates.y + "px, 0)"
            });
            break;
        }
      },

      // ### Animated scroll with translate support

      _animateScroll: function() {
        this.activeElement = this.pages[this.page * this.settings.itemsInPage];

        console.log();

        setStyles(this.pageContainer, {
          "-webkit-transition": "-webkit-transform " + this.settings.duration + "ms ease-out"
        });

        this._scroll({
          x: - this.scrollBorder.x,
          y: - this.scrollBorder.y
        });

        window.setTimeout( proxy( this.afterScroll, this ), this.settings.duration );
      },

      afterScroll: function() {
        this._onSwipeEnd();
        setStyles(this.pageContainer, {
          "-webkit-transition": "-webkit-transform 0"
        });
      }
    },

    withoutTranslateMethodes = {
      // ### Scroll fallback
      //
      // Animation lookup table  when translate isn't supported
      //
      // Takes:
      // x and y values to go with

      _scroll: function( coordinates ) {

        switch ( this.settings.direction ) {
          case "horizontal":

            setStyles(this.pageContainer, {
              "margin-left": coordinates.x
            });

            break;

          case "vertical":

            setStyles(this.pageContainer, {
              "margin-top": coordinates.y
            });

            break;
        }
      },

      // ### Animated scroll without translate support

      _animateScroll: function() {
        var property,
            value;

        this.activeElement = this.pages[this.page * this.settings.itemsInPage];

        switch ( this.settings.direction ) {
          case "horizontal":
            property = "margin-left";
            value = - this.scrollBorder.x;
            break;

          case "vertical":
            property = "margin-top";
            value = - this.scrollBorder.y;
            break;
        }

        animate(this.pageContainer, property, value, this.settings.duration, proxy( this._onSwipeEnd, this ));

      }

    };

  // ### Check translate support
  ( function checkTranslateSupport() {
    if ( "WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix() ) {
      extend( Dragend.prototype, withTranslateMethodes );
    } else {
      extend( Dragend.prototype, withoutTranslateMethodes );
    }
  } )();


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
          if ( !this.scrollBorder.x && this._checkGestureDirection( direction ) ) {
            Math.round( coordinates.x = (x - this.scrollBorder.x) / 5 );
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
          if ( !this.scrollBorder.y && this._checkGestureDirection( direction )) {
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
      var hammer = new Hammer(this.container, this.settings.hammerSettings);

      hammer.on("drag", proxy( this._onDrag, this ))
            .on( "dragend", proxy( this._onDragend, this ));

      Hammer.event.bindDom(window, "resize", proxy( this._sizePages, this ));

      if ( this.settings.keyboardNavigation ) {
        Hammer.event.bindDom(document.body, "keydown", proxy( this._onKeydown, this ));
      }

    },

    _onDrag: function( event ) {
      var gesture,
          coordinates;

      event.stopPropagation();

      if ( event.gesture ) {
        gesture = event.gesture;
        coordinates = this._checkOverscroll( gesture.direction, gesture.deltaX, gesture.deltaY );
        this.settings.onDrag( this.activeElement, gesture, coordinates.overscroll );
      } else {
        throw new Error(errors.handling);
      }

      if ( !this.preventScroll ) {
        this._scroll( coordinates );
      }

    },

    _onDragend: function( event ) {
      var gesture;

        if (event.preventDefault) {
          event.preventDefault();
        } else if (event.preventManipulation) {
          event.preventManipulation();
        }

      if (event.gesture) {
        gesture = event.gesture;
      } else {
        throw new Error(errors.handling);
      }

      if ( event.gesture.distance > this.settings.minDragDistance && this._checkGestureDirection( gesture.direction )) {
        this.swipe( gesture.direction );
      } else {
        this._scrollToPage();
      }

      this.settings.onDragEnd( this.container, this.activeElement, this.page );
    },

    _onKeydown: function( event ) {
      var direction = keycodes[event.keyCode];

      if ( direction ) {
        this._scrollToPage(direction);
      }
    },

    _checkGestureDirection: function( direction ) {
      if (((direction === "left" || direction === "right") && this.settings.direction === "horizontal") ||
          ((direction === "up" || direction === "down") && this.settings.direction === "vertical") ) {
        return true;
      }
    },

    setHorizontalContainerCssValues: function() {
      extend( this.pageCssProperties, {
        "float"   : "left",
        "overflow-y": "auto",
        "overflow-x": "hidden",
        "padding"   : 0,
        "display"   : "block"
      });

      setStyles(this.pageContainer, {
        "overflow"                   : "hidden",
        "width"                      : (this.pageDimentions.width + this.settings.borderBetweenPages) * this.pagesCount,
        "box-sizing"                 : "content-box",
        "-webkit-backface-visibility": "hidden",
        "-webkit-perspective"        : 1000,
        "margin"                     : 0,
        "padding"                    : 0
      });
    },

    setVerticalContainerCssValues: function() {
      extend( this.pageCssProperties, {
        "overflow": "hidden",
        "padding" : 0,
        "display" : "block"
      });

      setStyles(this.pageContainer, {
        "padding-bottom"              : this.settings.scribe,
        "box-sizing"                  : "content-box",
        "-webkit-backface-visibility" : "hidden",
        "-webkit-perspective"         : 1000,
        "margin"                      : 0
      });
    },

    setContainerCssValues: function(){
      switch ( this.settings.direction ) {
        case "horizontal":
          this.setHorizontalContainerCssValues();
          break;

        case "vertical":
          this.setVerticalContainerCssValues();
          break;
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

      if ( this.settings.scrollToPage !== undefined ) {
        this._scrollToPage( "page", this.page );
        delete this.settings.scrollToPage;
      } else {
        this._jumpToPage( "page", this.page );
      }

    },

    // ### Callculate new page
    //
    // Update global values for specific swipe action
    //
    // Takes direction and, if specific page is used the pagenumber

    _calcNewPage: function(direction, pageNumber) {
      switch ( direction ) {
        case "up":
          if ( this.page < this.pagesCount - 1 ) {
            this.scrollBorder.y = this.scrollBorder.y + this.pageDimentions.height + this.settings.borderBetweenPages;
            this.page++;
          }
          break;

        case "down":
          if ( this.page > 0 ) {
            this.scrollBorder.y = this.scrollBorder.y - this.pageDimentions.height - this.settings.borderBetweenPages;
            this.page--;
          }
          break;

        case "left":
          if ( this.page < this.pagesCount - 1 ) {
            this.scrollBorder.x = this.scrollBorder.x + this.pageDimentions.width + this.settings.borderBetweenPages;
            this.page++;
          }
          break;

        case "right":
          if ( this.page > 0 ) {
            this.scrollBorder.x = this.scrollBorder.x - this.pageDimentions.width - this.settings.borderBetweenPages;
            this.page--;
          }
          break;

        case "page":
          switch ( this.settings.direction ) {
            case "horizontal":
              this.scrollBorder.x = (this.pageDimentions.width + this.settings.borderBetweenPages) * pageNumber;
              break;

            case "vertical":
              this.scrollBorder.y = (this.pageDimentions.height + this.settings.borderBetweenPages) * pageNumber;
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

      // Call onSwipeEnd callback function
      this.settings.onSwipeEnd(this.container, this.activeElement, this.page);
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

    // Public functions
    // ================

    swipe: function( direction ) {
      this.activeElement = this.pages[this.page * this.settings.itemsInPage];

      // Call onSwipeStart callback function
      this.settings.onSwipeStart( this.container, this.activeElement, this.page );
      this._scrollToPage( direction );
    },

    updateInstance: function( settings ) {
      if ( typeof settings === "object" ) extend( this.settings, settings );

      if ( this.settings.jumpToPage !== undefined ) {
        this.page = this.settings.jumpToPage;
      } else if ( this.settings.scrollToPage !== undefined ) {
        this.page = this.settings.scrollToPage;
      }

      this.pages = getElementsByClassName(this.settings.pageClass, this.pageContainer);

      if (this.pages.length) {
        this.pagesCount = this.pages.length / this.settings.itemsInPage;
      } else {
        throw new Error(errors.pages);
      }

      this.activeElement = this.pages[this.page * this.settings.itemsInPage];

      this._sizePages();
    }

  });

    if ( $ ) {

        // Register jQuery plugin
        $.fn.dragend = function( settings ) {

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

          // jQuery functions should always return the intance
          return this;
        };

    }

    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() { return Dragend; });
    } else {
        window.Dragend = Dragend;
    }


})( window.jQuery || window.Zepto, window );
