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
        jQueryDragend

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
    var instance;

    before(function(done) {
      instance = new Dragend(createDom());
      window.setTimeout(done, 20);
    });

    it('check if pages size got set right', function() {
      expect(instance.container.childNodes[0].childNodes[0].offsetWidth).to.eql(instance.container.offsetWidth);
    });

    it('check if pages are found', function() {
      expect(instance.pages.length).to.be(3);
    });

  });
});