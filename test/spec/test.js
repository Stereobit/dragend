define(['dragend'], function(Dragend) {

  console.log(Dragend);

  var domCache = [];

  function createDom() {
    var dom = $("<div style='width: 100px; height: 100px;'><div class='dragend-page'></div><div class='dragend-page'></div><div class='dragend-page'></div></div>");
    $(document.body).append(dom);
    domCache.push(dom);
    return dom.get(0);
  }

  function clearDom() {
    $.each(domCache, function(index, element) {
      element.remove();
    });
  }

  describe('instantiation', function() {
    describe('settings', function() {
      var inheritedDragend,
          updateInstanceDragend,
          jQueryDragend;

      before(function(done){

        inheritedDragend = new Dragend(createDom(), {
          duration: 14,
          onDrag: function() {}
        });

        updateInstanceDragend = new Dragend(createDom());
        updateInstanceDragend.updateInstance({
          duration: 14,
          onDrag: function() {}
        });

        jQueryDragend = $(createDom()).dragend();

        window.setTimeout(done, 20);

      });

      after(clearDom);

      it('check if settings are inherited', function() {
        expect(inheritedDragend.settings.duration).to.be(14);
        expect(inheritedDragend.settings.onDrag).to.be.a('function');
      });

      it('check if settings updated', function() {
        expect(updateInstanceDragend.settings.duration).to.be(14);
        expect(updateInstanceDragend.settings.onDrag).to.be.a('function');
      });

      it('check if jquery creates instance', function() {
        expect(jQueryDragend.data('dragend')).to.be.an(Dragend);
      });

      it('check if content gets copied into new container', function() {
        expect(inheritedDragend.container.childNodes[0].className).not.to.equal('dragend-page');
      });


    });

    describe('create pages and sizing', function() {
      var instance,
          scribeInstance,
          itemsInPageInstance;

      before(function(done) {
        instance = new Dragend(createDom());
        scribeInstance = new Dragend(createDom(), {
          scribe: "10px"
        });
        itemsInPageInstance = new Dragend(createDom(), {
          itemsInPage: 2
        });
        window.setTimeout(done, 20);
      });

      after(clearDom);

      it('check if pages size got set right', function() {
        expect(instance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(instance.container.offsetWidth);
      });

      it('scribe option', function() {
        expect(scribeInstance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(90);
      });

      it('itemsInPage option', function() {
        expect(itemsInPageInstance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(50);
      });

      it('check if pages are found', function() {
        expect(instance.pages.length).to.be(3);
        expect(instance.pagesCount).to.be(3);
      });

    });

    describe('jumpToPage', function() {
      var instance;

      before(function(done) {
        instance = new Dragend(createDom(), {
          jumpToPage: 2
        });
        window.setTimeout(done, 20);
      });

      after(clearDom);

      it('scrollBorder is 100', function() {
        expect(instance.scrollBorder.x).to.eql(100);
      });

      it.skip('page number is right', function() {
        expect(instance.page).to.eql(2);
      });

    });

    describe('scrollToPage', function() {
      describe('scrollToPage on init', function() {
        var instance;

        before(function(done) {
          instance = new Dragend(createDom(), {
            scrollToPage: 2
          });
          window.setTimeout(done, 20);
        });

        after(clearDom);

        it.skip('scrollBorder is still zero', function() {
          expect(instance.scrollBorder.x).to.eql(0);
        });

        it('page number is still one', function() {
          expect(instance.page).to.eql(1);
        });

      });

      describe('scrollToPage after scroll', function() {
        var instance;

        before(function(done) {
          instance = new Dragend(createDom(), {
            scrollToPage: 2
          });
          window.setTimeout(done, 320);
        });

        after(clearDom);

        it('scrollBorder is 100', function() {
          expect(instance.scrollBorder.x).to.eql(100);
        });

        it('page number is right', function() {
          expect(instance.page).to.eql(1);
        });

      });

    });

  });

  describe('swipe', function() {

      describe('swipe right', function() {
        var instance;

        before(function(done) {
          // instance = new Dragend(createDom());
          // instance.swipe("left");
          window.setTimeout(done, 320);

        });

        after(clearDom);

        it.skip('scrollBorder is 100', function() {
          expect(instance.scrollBorder.x).to.eql(100);
        });

      });

  });

  describe('private methodes', function() {

    describe('overscroll calculation', function() {
      var instanceOverScrollLeft,
          instanceOverScrollRight;

      before(function(done) {
        window.setTimeout(done, 20);
      });

      after(clearDom);

    });

  });

});