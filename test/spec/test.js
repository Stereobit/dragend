define(['dragend'], function(Dragend) {

  function createDom() {
    var container = document.createElement('div');
    container.style = 'width: 100px; height: 100px;';
    container.innerHTML = "<div class='dragend-page'></div><div class='dragend-page'></div><div class='dragend-page'></div>";
    return container;
  }

  describe('create instance', function() {

    it('should inherited settings', function() {
      var instance = new Dragend(createDom(), {
        duration: 14,
        onDrag: function() {}
      });

      expect(instance.settings.duration).to.be(14);
      expect(instance.settings.onDrag).to.be.a('function');
    });

    it('should create instance using the jQuery object', function() {
      var instance = $(createDom()).dragend();

      expect(instance.data('dragend')).to.be.an(Dragend);
      expect(instance).to.be.an(jQuery);
    });

    it('should copy the content into new container', function() {
      expect(new Dragend(createDom()).container.childNodes[0].className).not.to.equal('dragend-page');
    });

    it('should set the pages size to the same size as the container', function() {
      var instance = new Dragend(createDom());

      expect(instance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(instance.container.offsetWidth);
    });

    it.skip('itemsInPage option', function() {
      var instance = new Dragend(createDom(), {
        itemsInPage: 2
      });

      expect(instance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(50);
    });

  });

  describe('update dom and initialize', function() {

    describe('pages count', function() {

      var instance;

      before(function(done) {
        instance = new Dragend(createDom(), {
          afterInitialize: done
        });
      });

      it('should return the count of elements with the class dragend-page', function() {
        expect(instance.pagesCount).to.be(3);
      });

    });

    describe('scribe option', function() {

      var instance;

      before(function(done) {
        instance = new Dragend(createDom(), {
          afterInitialize: done,
          scribe: "10px"
        });
      });

      it.skip('should scale the width of every page reduced by the scribe distance', function() {
        expect(instance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(90);
      });

    });

  });

  describe('#updateInstance', function() {

    it('check if settings updated', function() {
      var instance = new Dragend(createDom(), {
        duration: 45,
      });

      instance.updateInstance({
        duration: 14,
        onDrag: function() {}
      });

      expect(instance.settings.duration).to.be(14);
      expect(instance.settings.onDrag).to.be.a('function');
    });

    it('check if jQuery updates instance', function() {
      var instance = $(createDom()).dragend({
        duration: 45,
      });

      instance.dragend({
        duration: 14,
        onDrag: function() {}
      });

      expect(instance.data('dragend').settings.duration).to.be(14);
      expect(instance.data('dragend').settings.onDrag).to.be.a('function');

    });

  });

  //   describe('jumpToPage', function() {
  //     var instance;

  //     before(function(done) {
  //       instance = new Dragend(createDom(), {
  //         jumpToPage: 2
  //       });
  //       window.setTimeout(done, 20);
  //     });

  //     it('scrollBorder is 100', function() {
  //       expect(instance.scrollBorder.x).to.eql(100);
  //     });

  //     it.skip('page number is right', function() {
  //       expect(instance.page).to.eql(2);
  //     });

  //   });

  //   describe('scrollToPage', function() {
  //     describe('scrollToPage on init', function() {
  //       var instance;

  //       before(function(done) {
  //         instance = new Dragend(createDom(), {
  //           scrollToPage: 2
  //         });
  //         window.setTimeout(done, 20);
  //       });

  //       it.skip('scrollBorder is still zero', function() {
  //         expect(instance.scrollBorder.x).to.eql(0);
  //       });

  //       it('page number is still one', function() {
  //         expect(instance.page).to.eql(1);
  //       });

  //     });

  //     describe('scrollToPage after scroll', function() {
  //       var instance;

  //       before(function(done) {
  //         instance = new Dragend(createDom(), {
  //           scrollToPage: 2
  //         });
  //         window.setTimeout(done, 320);
  //       });

  //       it('scrollBorder is 100', function() {
  //         expect(instance.scrollBorder.x).to.eql(100);
  //       });

  //       it('page number is right', function() {
  //         expect(instance.page).to.eql(1);
  //       });

  //     });

  //   });

  // });

  // describe('swipe', function() {

  //     describe('swipe right', function() {
  //       var instance;

  //       before(function(done) {
  //         // instance = new Dragend(createDom());
  //         // instance.swipe("left");
  //         window.setTimeout(done, 320);

  //       });

  //       it.skip('scrollBorder is 100', function() {
  //         expect(instance.scrollBorder.x).to.eql(100);
  //       });

  //     });

  // });

  // describe('private methodes', function() {

  //   describe('overscroll calculation', function() {
  //     var instanceOverScrollLeft,
  //         instanceOverScrollRight;

  //     before(function(done) {
  //       window.setTimeout(done, 20);
  //     });

  //   });

});