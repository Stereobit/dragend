
!function( $, Dragend, Blazy ) {

    var  proto      = Dragend.prototype;

    proto.plugins.blazy = function(dragend, args)
        {
            var hooks = {
                afterInitialize: function() {
                    this.blazy = new Blazy(args);
                },

                onSwipeStart:function()
                {
                    var ele =  $(dragend.container).find(".b-lazy")[dragend.page+1];
                    if( ele != undefined ) this.blazy.load( ele );
                },

                onSwipeEnd:function()
                {
                    var ele =  $(dragend.container).find(".b-lazy")[dragend.page+1];
                    if( ele != undefined ) this.blazy.load( ele );
                }
            }
            return hooks;
        }

}( jQuery || Zepto || Ender, Dragend, Blazy );
