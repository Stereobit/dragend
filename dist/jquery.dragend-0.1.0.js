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
  // explicit page and without any value to go to the first page
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

  var

    // Cached objects
    WINDOW = $( window ),
    BODY   = $( document.body ),

    // Default setting
    defaultSettings = {
      "pageContainer"     : "ul",
      "pageElements"      : "li",
      "direction"         : "horizontal",
      "minTouchDistance"  : "40",
      "minScrollDistance" : "500",
      "keyboardNavigation": false,
      "scribe"            : 0,
      "duration"          : 300,
      "hammerSettings"    : {
        "drag_min_distance": 0,
        "css_hacks"        : false,
        "prevent_default"  : true
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
    },

    Dragend = function( container, options ) {

      this.settings      = $.extend( {}, defaultSettings, options );
      this.container     = container;
      this.pageContainer = container.find( this.settings.pageContainer );
      this.pages         = container.find( this.settings.pageElements );
      this.scrollBorder  = { x: 0, y: 0 };
      this.page          = 0;
      this.preventScroll = false;
      this.pageCssProperties = {
        "margin": 0,
        "border": 0
      };

      // Initialisation

      this.container.css( containerStyles );
      this.updateInstance( options );
      this._observe();

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
            this.pageContainer.css( "-webkit-transform", "translate3d(" + coordinates.x + "px, 0, 0)" );
            break;

          case "vertical":
            this.pageContainer.css( "-webkit-transform", "translate3d(0, " + coordinates.y + "px, 0)" );
            break;
        }
      },

      // ### Animated scroll with translate support

      _animateScroll: function() {
        this.activeElement = this.pages.eq( this.page );

        this.pageContainer.css( "-webkit-transition", "-webkit-transform " + this.settings.duration + "ms ease-out" );
        this._scroll({
          x: - this.scrollBorder.x,
          y: - this.scrollBorder.y
        });

        window.setTimeout( $.proxy( this.afterScroll, this ), this.settings.duration );
      },

      afterScroll: function() {
        this._onSwipeEnd();
        this.pageContainer.css( "-webkit-transition", "-webkit-transform 0" );
      }
    },

    withoutTranslateMethodes = {
      // ### Scroll fallback
      //
      // Animation lookup table  when translate isn't supported
      //
      // Takes:
      // x and y values to go with

      _scrollFallback: function( x, y ) {
        switch ( this.settings.direction ) {
          case "horizontal":
            this.pageContainer.css( { "margin-left": x } );
            break;

          case "vertical":
            this.pageContainer.css( { "margin-top": y } );
            break;
        }
      },

      // ### Animated scroll without translate support

      _animateScrollFallback: function() {
        this.activeElement = this.pages.eq( this.page );

        this.pageContainer.animate({
          "margin-left": - this.scrollBorder.x,
          "margin-top": - this.scrollBorder.y
        }, this.settings.duration, "linear", this._onSwipeEnd);
      }
    };

  // ### Check translate support
  ( function checkTranslateSupport() {
    if ( "WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix() ) {
      $.extend( Dragend.prototype, withTranslateMethodes );
    } else {
      $.extend( Dragend.prototype, withoutTranslateMethodes );
    }
  } )();


  $.extend(Dragend.prototype, {

    // Private functions
    // =================

    // ### Overscroll lookup table
    //
    // Checks if its the last or first page to slow down the scrolling if so
    //
    // Takes:
    // Drag event

    _overscroll: function( direction, x, y ) {
      var coordinates = {
        x: x,
        y: y
      };

      switch ( direction ) {

        case "right":
          if ( !this.scrollBorder.x ) {
            Math.round( coordinates.x = (x - this.scrollBorder.x) / 5 );
            return coordinates;
          }
          break;

        case "left":
          if ( (this.pages.length - 1) * this.pageDimentions.width <= this.scrollBorder.x ) {
            coordinates.x = Math.round( - ((this.pages.length - 1) * this.pageDimentions.width) + x / 5 );
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
          if ( (this.pages.length - 1) * this.pageDimentions.height <= this.scrollBorder.y ) {
            coordinates.y = Math.round( - ((this.pages.length - 1) * this.pageDimentions.height) + y / 5 );
            return coordinates;
          }
          break;
      }

      return {
        x: x - this.scrollBorder.x,
        y: y - this.scrollBorder.y
      };
    },

    // Observe
    //
    // Sets the observers for drag, resize and key events

    _observe: function() {
      this.container.hammer()
        .on( "drag", this.settings.hammerSettings, $.proxy( this._onDrag, this ) )
        .on( "dragend", this.settings.hammerSettings, $.proxy( this._onDragend, this ) );

      WINDOW.on( "resize", $.proxy( this._sizePages, this ) );

      if ( this.settings.keyboardNavigation ) {
        BODY.on( "keydown", $.proxy( this._onKeydown, this ) );
      }

    },

    _onDrag: function( event ) {
      var gesture = event.gesture,
          coordinates = this._overscroll( gesture.direction, gesture.deltaX, gesture.deltaY );

      event.stopPropagation();

      if ( !this.preventScroll ) {
        this._scroll( coordinates );
      }

    },

    _onDragend: function( event ) {
      var gestureDirection = event.gesture.direction;

      event.stopPropagation();
      event.preventDefault();

      if ( event.gesture.distance > this.settings.minTouchDistance ) {
        if (
            ((gestureDirection === "left" || gestureDirection === "right") && (this.settings.direction === "vertical")) ||
            ((gestureDirection === "up" || gestureDirection === "down") && (this.settings.direction === "horizontal"))
           ) {
          this._scrollToPage();
          return;
        }
        this.swipe( gestureDirection );
      } else {
        this._scrollToPage();
      }
    },

    _onKeydown: function( event ) {
      var direction = keycodes[event.keyCode];

      if ( direction ) {
        this._scrollToPage(direction);
      }
    },

    setHorizontalContainerCssValues: function() {
      $.extend( this.pageCssProperties, {
        "float"     : "left",
        "overflow-y": "scroll",
        "overflow-x": "hidden",
        "padding"   : 0,
        "display"   : "block"
      });

      this.pageContainer.css({
        "overflow"                   : "hidden",
        "width"                      : this.pageDimentions.width * this.pages.length,
        "box-sizing"                 : "content-box",
        "-webkit-backface-visibility": "hidden",
        "-webkit-perspective"        : 1000,
        "margin"                     : 0,
        "padding"                    : 0
      });
    },

    setVerticalContainerCssValues: function() {
      $.extend( this.pageCssProperties, {
        "overflow": "hidden",
        "padding" : 0,
        "display" : "block"
      });

      this.pageContainer.css({
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

      var width  = this.container.width(),
          height = this.container.height();

      if ( this.settings.direction === "horizontal" ) {

        width = width - parseInt( this.settings.scribe, 10 );
        this.scrollBorder.x = width * this.page;

      } else {

        height = height - parseInt( this.settings.scribe, 10 );
        this.scrollBorder.y = height * this.page;

      }

      this.pageDimentions = {
        "width" : width,
        "height": height
      };

    },

    // ### Size pages

    _sizePages: function() {
      this._setPageDimentions();

      this.setContainerCssValues();

      $.extend( this.pageCssProperties, {
        "height": this.pageDimentions.height,
        "width" : this.pageDimentions.width
      });

      this.pages.css( this.pageCssProperties );

      if ( this.settings.scrollToPage ) {
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
          if ( this.page < this.pages.length - 1 ) {
            this.scrollBorder.y = this.scrollBorder.y + this.pageDimentions.height;
            this.page++;
          }
          break;

        case "down":
          if ( this.page > 0 ) {
            this.scrollBorder.y = this.scrollBorder.y - this.pageDimentions.height;
            this.page--;
          }
          break;

        case "left":
          if ( this.page < this.pages.length - 1 ) {
            this.scrollBorder.x = this.scrollBorder.x + this.pageDimentions.width;
            this.page++;
          }
          break;

        case "right":
          if ( this.page > 0 ) {
            this.scrollBorder.x = this.scrollBorder.x - this.pageDimentions.width;
            this.page--;
          }
          break;

        case "page":
          this.scrollBorder.x = this.pageDimentions.width * pageNumber;
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
      this.activeElement.trigger( "active" );

      // Call onSwipeEnd caalback function
      if ( this.settings.onSwipeEnd ) {
        this.settings.onSwipeEnd(this.container, this.activeElement, this.page);
      }
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
      this.activeElement = this.pages.eq( this.page );

      // Call onSwipeStart callback function
      if ( this.settings.onSwipeStart ) this.settings.onSwipeStart( container, this.activeElement );
      this._scrollToPage( direction );
    },

    updateInstance: function( options ) {
      if ( typeof options === "object" ) $.extend( this.settings, options );

      this.page = this.settings.jumpToPage || this.settings.scrollToPage || this.page;

      this._sizePages();
    }
  });

  // Register jQuery plugin
  $.fn.dragend = function( options ) {
    var instance = this.data( "dragend" );

    // check if instance already created
    if ( instance ) {
      instance.updateInstance( options );
    } else {
      instance = new Dragend( this, options );
      this.data( "dragend", instance );
    }

    // check if should trigger swipe
    if ( typeof options === "string" ) instance.swipe( options );

    // jQuery functions should always return the elment
    return this;
  };

})( jQuery, window );