/*!
 * ---------------------------- DRAGEND JS -------------------------------------
 *
 * Version: 0.2.0_rc3
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

 ;(function( window ) {
  "use strict";

  function init( $, Hammer ) {

    // Welcome To dragend JS
    // =====================
    //
    // dragend.js is a touch ready, full responsive, content swipe script. It has no dependencies
    // but you can use hammer.js (http://eightmedia.github.com/hammer.js/) for crossbrowser support
    // of touch gestures. It also can, but don't has to, used as a jQuery
    // (https://github.com/jquery/jquery/) plugin.
    //
    // The current version is 0.2.0_rc3
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
    // * hammerSettings
    // * stopPropagation
    // * afterInitialize called after the pages are size
    // * preventDrag if want to prevent user interactions and only swipe manualy

    var

      cachedEvent,

      afterScrollTransformProxy,
      documentDragOverProxy,
      documentkeydownProxy,
      windowResizeProxy,

      fakeDiv,

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
        preventDrag        : false,
        hammerSettings     : {
          drag_min_distance: 0,
          css_hacks        : false,
          prevent_default  : false
        }
      },

      isTouch = 'ontouchstart' in window,

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

      supports = (function() {
         var div = document.createElement('div'),
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

      scrollWithTransForm = {
        // ### Scroll translate
        //
        // Animation when translate is supported
        //
        // Takes:
        // x and y values to go with

        _scroll: function ( coordinates ) {
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

        _animateScroll: function() {

          var style = "transform " + this.settings.duration + "ms ease-out";

          afterScrollTransformProxy = proxy(this.afterScrollTransform, this);

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

          addEventListener(this.container, "webkitTransitionEnd", afterScrollTransformProxy);
          addEventListener(this.container, "oTransitionEnd", afterScrollTransformProxy);
          addEventListener(this.container, "transitionEnd", afterScrollTransformProxy);

        },

        afterScrollTransform: function() {
          this._onSwipeEnd();

          removeEventListener(this.container, "webkitTransitionEnd", afterScrollTransformProxy);
          removeEventListener(this.container, "oTransitionEnd", afterScrollTransformProxy);
          removeEventListener(this.container, "transitionEnd", afterScrollTransformProxy);

          setStyles( this.pageContainer, {
            "-webkit-transition": "",
            "-moz-transition": "",
            "-ms-transition": "",
            "-o-transition": "",
            "transition": ""
          });

        }
      },

      scrollWithoutTransForm = {
        // ### Scroll fallback
        //
        // Animation lookup table  when translate isn't supported
        //
        // Takes:
        // x and y values to go with

        _scroll: function( coordinates ) {
          var styles = this.settings.direction === "horizontal" ? { "marginLeft": coordinates.x } : { "marginTop": coordinates.y };

          setStyles(this.pageContainer, styles);
        },

        // ### Animated scroll without translate support

        _animateScroll: function() {
          var property = this.settings.direction === "horizontal" ? "marginLeft" : "marginTop",
              value = this.settings.direction === "horizontal" ? - this.scrollBorder.x : - this.scrollBorder.y;

          animate( this.pageContainer, property, value, this.settings.duration, proxy( this._onSwipeEnd, this ));
        }
      };

    function noop() {}

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

    function Dragend( container, settings ) {
      var defaultSettingsCopy = extend( {}, defaultSettings );

      this.settings      = extend( defaultSettingsCopy, settings );
      this.container     = container;
      this.pageContainer = document.createElement( "div" );
      this.scrollBorder  = { x: 0, y: 0 };
      this.page          = 0;
      this.preventScroll = false;
      this.pageCssProperties = {
        margin: 0
      };

      this.pageContainer.innerHTML = container.cloneNode(true).innerHTML;
      container.innerHTML = "";
      container.appendChild( this.pageContainer );

      // Initialisation

      setStyles(container, containerStyles);

      // Give the DOM some time to update ...
      setTimeout( proxy(function() {
          this.updateInstance( settings );
          !this.settings.preventDrag && this._observe();
          this.settings.afterInitialize.call(this);
      }, this), 10 );

      fakeDiv = fakeDiv ? fakeDiv : setStyles(document.body.appendChild(document.createElement('div')), {
        width : "1",
        height: "1"
      });

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

    // ### Check translate support
    ( function() {

      var support = supports('transform');

      extend( Dragend.prototype, support ? scrollWithTransForm : scrollWithoutTransForm );

    })();


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

        documentDragOverProxy = proxy( this._onDrag, this );
        documentkeydownProxy = proxy( this._onKeydown, this );
        windowResizeProxy = proxy( this._sizePages, this );

        if (!Hammer) {
          if (isTouch) {
            addEventListener(this.container, "touchstart", proxy( this._onTouchStart, this ));
            addEventListener(this.container, "touchmove", proxy( this._onTouchMove, this ));
            addEventListener(this.container, "touchend", proxy( this._onTouchEnd, this ));
          } else {
            this.container.draggable = true;
            addEventListener(this.container, "dragstart", proxy( this._onDragStart, this ));
            if (typeof InstallTrigger !== 'undefined') {
              addEventListener(document, "dragover", documentDragOverProxy);
            } else {
              addEventListener(this.container, "drag", proxy( this._onDrag, this ));
            }

            addEventListener(this.container, "dragend", proxy( this._onDragEnd, this ));
          }
        } else {
          this.hammer = new Hammer(this.container, this.settings.hammerSettings);

          hammer.on("drag", proxy( this._onDrag, this ))
                .on( "dragend", proxy( this._onDragEnd, this ));
        }

        if ( this.settings.keyboardNavigation ) {
          addEventListener(document.body, "keydown", documentkeydownProxy);
        }

        addEventListener(window, "resize", windowResizeProxy);

      },

      _onDragStart: function(event) {

        event = event.originalEvent || event;

        var dataTransfer = event.dataTransfer;

        this.settings.stopPropagation && event.stopPropagation();

        dataTransfer.setDragImage && dataTransfer.setDragImage(fakeDiv, 0 , 0);
        dataTransfer.setData && dataTransfer.setData('text/html', null);
        dataTransfer.effectAllowed = "none";
        dataTransfer.dropEffect = "none";

        this.startPageX = event.screenX;
        this.startPageY = event.screenY;

        this.settings.onDragStart.call( this, event );

      },

      _onTouchStart: function(event) {

        event = event.originalEvent || event;

        this.settings.stopPropagation && event.stopPropagation();

        this.startPageX = event.touches[0].pageX;
        this.startPageY = event.touches[0].pageY;

        this.settings.onDragStart.call( this, event );

      },

      _onDrag: function( event ) {

        event = event.originalEvent || event;

        // filter out the last drag event
        if (cachedEvent && event.type === 'drag' && event.x === 0 && event.y  === 0) {
          this._onDragEnd(cachedEvent);
          cachedEvent = null;
          return;
        }

        cachedEvent = event;

        this._onTouchMove( event );

      },

      _onTouchMove: function( event ) {

        event = event.originalEvent || event;

        // ensure swiping with one touch and not pinching
        if ( event.touches && event.touches.length > 1 || event.scale && event.scale !== 1) return;

        event.preventDefault();
        this.settings.stopPropagation && event.stopPropagation();

        var parsedEvent = isTouch ? this._parseTouchEvent(event) : this._parseDragEvent(event),
            coordinates = this._checkOverscroll( parsedEvent.direction , - parsedEvent.distanceX, - parsedEvent.distanceY );

        this.settings.onDrag.call( this, this.activeElement, parsedEvent, coordinates.overscroll, event );

        if ( !this.preventScroll ) {
          this._scroll( coordinates );
        }
      },

      _onDragEnd: function( event ) {

        if (!cachedEvent) return;

        this._onTouchEnd( event );

      },

      _onTouchEnd: function( event ) {
        event = event.originalEvent || event;

        this.settings.stopPropagation && event.stopPropagation();

        var parsedEvent = isTouch ? this._parseTouchEvent(event) : this._parseDragEvent(event);

        this.startPageX = 0;
        this.startPageY = 0;

        if ( Math.abs(parsedEvent.distanceX) > this.settings.minDragDistance || Math.abs(parsedEvent.distanceY) > this.settings.minDragDistance) {
          this.swipe( parsedEvent.direction );
        } else {
          this._scrollToPage();
        }

        this.settings.onDragEnd.call( this, this.container, this.activeElement, this.page, event );
      },

      _parseTouchEvent: function( event ) {
        var touches = event.touches && event.touches.length ? event.touches: event.changedTouches,
        x = this.startPageX - touches[0].pageX,
        y = this.startPageY - touches[0].pageY;

        return this._addDistanceValues( x, y );
      },

      _parseDragEvent: function( event ) {
        var x = event.gesture ? event.gesture.deltaX : this.startPageX - event.screenX,
            y = event.gesture ? event.gesture.deltaY : this.startPageY - event.screenY;

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

        this.hammer && this.hammer.off("drag").off( "dragend");
        removeEventListener(container, "touchstart");
        removeEventListener(container, "touchmove");
        removeEventListener(container, "touchend");
        removeEventListener(container, "dragstart");
        removeEventListener(container, "drag");
        removeEventListener(container, "dragend");

        removeEventListener(document, "dragover", documentDragOverProxy);

        removeEventListener(document.body, "keydown", documentkeydownProxy);

        removeEventListener(window, "resize", windowResizeProxy);

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

          // jQuery functions should always return the intance
          return this;
        };

    }

    return Dragend;

  }

  if ( typeof define == 'function' && typeof define.amd == 'object' && define.amd ) {
      define( ["jquery", "hammer"], function( jquery, hammer ) {
        return init( jquery, hammer );
      } );
  } else {
      window.Dragend = init( window.jQuery || window.Zepto, window.Hammer );
  }

})( window );
