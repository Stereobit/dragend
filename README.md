dragend.js, Readme File:
==============================================================================
2012-09-09, [Tobias Otte]

# DESCRIPTION

dragend.js is a touch ready, fully responsive, content swipe script. It has no dependencies but it can, doesn't have to, be used as a [jQuery](https://github.com/jquery/jquery/) plugin.

The current version is 0.2.0 release candidate 3

# Demos

* [Simple demo](http://stereobit.github.io/dragend/demos/simple/)
* [jQuery and content scribe demo](http://stereobit.github.io/dragend/demos/scribe/)
* [Responsive demo](http://stereobit.github.io/dragend/demos/responsive/)
* [Yahoo weather app like page swiping demo](http://stereobit.github.io/dragend/demos/yahoo-swipe/)
* [Demo with navigation buttons and a page overview](http://stereobit.github.io/dragend/demos/with-control-elements/)
* [Demo with infinit swiping through pages](http://stereobit.github.io/dragend/demos/infinit/)
* [Mobile demo](http://stereobit.github.io/dragend/demos/mobile/)

# Features

* horizontal and vertical swiping
* mobile and desktop ready
* lightweight (2.9KB gzipped)
* keyboard navigation
* fullscreen or boxed
* contend scribe (Sometimes you need to indicate to the user that there is more content to see. Especially on mobile devices. One easy approach to this problem is to show a bit of the next page)
* resize adjustment
* overscroll
* fully responsive

# Browser support
* Firefox 3.5+
* Chrome 4+
* IE 8+ (8 and 9 need hammer JS and jQuery)
* Safari 4+
* Safari on iOS 5+
* Android 2+

# How to

```html
<div id="demo">
  <div class="dragend-page"></div>
  <div class="dragend-page"></div>
</div>
```

## with jQuery
```javascript
$("#demo").dragend(options);
```

## without jQuery
```javascript
new Dragend(document.getElementById("demo"), options);
```

## update and jump to page

You can call the dragend method a second time to trigger some actions. When you want to go to a page when you click on a link you could do something like this:

```javascript
$("#container").dragend();

$("#my-link").on("click", function() {
   $("#container").dragend({
    scrollToPage: 2
  });
});
```

instead of scrollToPage you can use jumpToPage to get to a page without a animation. Or

```javascript
$("#container").dragend("left");
```

to swipe left or right.

## destroy

Call the destroy method to unbind the events and reset the styles

```javascript]
var instance =  new Dragend();
instance.destroy();
```

# Options
  * pageClass: classname selector for all elments that should provide a page
  * direction: "horizontal" or "vertical"
  * minDragDistance: minuimum distance (in pixel) the user has to drag to trigger swip
  * page: Number of page to load on start
  * scribe: pixel value for a possible scribe
  * onSwipeStart: callback function before the animation
  * onSwipeEnd: callback function after the animation
  * onDrag: callback on drag
  * onDragEnd: callback on dragend
  * afterInitialize:
  * borderBetweenPages: if you need space between pages add a pixel value
  * duration
  * hammerSettings
  * preventDrag: if want to prevent user interactions and only swipe manualy
  * disableScroll: prevent scroll on mobile version

# CHANGELOG

* 2013-1-17
  0.2.0_rc3 release

  Changes:
  - removed hammer as dependency
  - fixed several bugs

* 2013-09-30
  0.2.0_rc2 release

  Changes:
  - better cross browser css transition support
  - moved jumpToPage and scrollToPage to public instance methodes
  - callbacks are now called in the instace context
  - better initalisation handling with module loaders

* 2013-06-14
  0.2.0_rc1 release

  Changes:
  - remove jQuery dependency
  - add responsive support

* 2013-06-14
  0.1.3 release

  Changes:
  - fixed bug when adding new pages and updating the instance
  - add simple demo

* 2013-05-25
  0.1.2 release

  Changes:
  - fixed some bugs in Firefox
  - added callbacks for onDrag and onDragEnd
  - added borderBetweenPages option
  - switch overflow-y from scroll to auto

* 2013-05-02
  0.1.1 release

* 2013-04-21
  0.1.0 release

* 2012-09-9
  0.1.0 beta release

* 2012-08-12
  0.1.0 alpha release

* 2012-08-04
  Creation

# LICENCE

Copyright (c) 2012 [Tobias Otte](http://stereb.it)

Licensed under [MIT License](http://www.opensource.org/licenses/mit-license.php):

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
