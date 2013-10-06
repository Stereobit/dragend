function createDom() {
  var dom = $("<div><div class='dragend-page'></div><div class='dragend-page'></div><div class='dragend-page'></div></div>");

  return dom.get(0);
}

describe('instantiation', function() {
  describe('settings', function() {
    var inheritedDragend,
        updateInstanceDragend;

    before(function(){

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

    });

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

  });
});