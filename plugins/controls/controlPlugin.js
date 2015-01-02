
!function( $, Dragend ) {

    var  proto      = Dragend.prototype;

    function extend(destination, source) {
        var property;
        for (property in source) {
            destination[property] = source[property];
        }
        return destination;
    }

    extend( proto.plugins, {
        controls : function(dragend, args)
        {
            args = extend( {controls:true, pageing:true}, args );

            var cntrls_tpl = $('<div id="prev"><div id="prevChev"></div></div><div id="next"><div id="nextChev"></div></div>');
            var dots_tpl = $('<div id="dots"></div>');

            var click = function(event) {
                var target = event.currentTarget;

                switch (target.id) {
                    case 'prev': dragend.swipe('right');break;
                    case 'next': dragend.swipe('left');break;
                }
            };

            var clickk = function(event) {

                if(event.target) {
                    var dotClicked = event.target.className;
                } else if(e.srcElement) {
                    var dotClicked = event.srcElement.className;
                }
                var n = dotClicked.match(/\d+/);
                dragend.scrollToPage(Number(n[0])+1);

            };

            var hooks = {
                afterInitialize: function() {

                    var length = dragend.pagesCount;

                    if( args.controls ) {
                        $(dragend.container).append(
                            cntrls_tpl
                        );
                        $(dragend.container).find("#prev,#next").click(click);
                    }

                    if( args.pageing ) {
                        var dots = $(dragend.container.parentNode).append(
                                dots_tpl
                            ),

                            $dots = $(dragend.container.parentNode).find("#dots")
                                .click(clickk);

                        for(var i = 0; i < length; i++) {
                            var dot = document.createElement('div');
                            dot.className = 'dot' + ' frame' + [i];
                            dot.innerHTML = ''+(i+1);
                            $dots.append(dot);
                        }

                        $(dragend.container.parentNode).find('.frame0').addClass('current');
                    }

                    $(dragend.container).find('.frame'+dragend.page).toggleClass('current');
                    this.paginate();
                },


                onSwipeEnd:function()
                {
                    $(dragend.container.parentNode).find('.dot').removeClass('current');
                    $(dragend.container.parentNode).find('.frame'+dragend.page).addClass('current');
                    this.paginate();

                },
                paginate:function()
                {
                    if( dragend.page >= (dragend.pagesCount-1) ) { $(dragend.container).find("#next").css('display', 'none'); }
                    else $(dragend.container).find("#next").css('display', 'block');

                    if( dragend.page == 0 ) { $(dragend.container).find("#prev").css('display', 'none'); }
                    else $(dragend.container).find("#prev").css('display', 'block');
                }
            }

            return hooks;
        }
    });


}( jQuery || Zepto || Ender, Dragend );