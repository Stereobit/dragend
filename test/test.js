describe('Instantiation', function() {
  before();
  describe('Settings', function() {
    it('should return -1 when the value is not present', function(){
      expect([1,2,3].indexOf(5)).to.be(-1);
      expect([1,2,3].indexOf(0)).to.be(-1);
    });
  });
});