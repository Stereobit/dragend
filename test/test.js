describe('Instantiation', function() {
  describe('Settings', function() {

    before(function(){
      dragend = new Dragend($('#dragend').get(0));
    });

    it('should return -1 when the value is not present', function() {
      console.log(dragend)
      expect([1,2,3].indexOf(5)).to.be(-1);
      expect([1,2,3].indexOf(0)).to.be(-1);
    });

  });
});