
!function( Dragend ) {

    // help the minifier
    var  proto      = Dragend.prototype,
        _observe    = proto._observe;

    function extend(destination, source) {
        var property;
        for (property in source) {
            destination[property] = source[property];
        }
        return destination;
    }

    function isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    // add Plugin API

    extend( proto, {

        plugins : {},

        _observe: function() {

            for( var f in this.settings ) {
                if( isFunction(this.settings[f]) ) {
                    (function(f, obj, fnc){
                            obj[f] = function() { this._callPlugins( f ); fnc.call(this); }
                    })(f, this.settings, this.settings[f]);
                }
            }
            this._initPlugins();
            _observe.call(this);

        },

        _initPlugins : function()
        {
            this._plugins = [];
            for (var plugin in this.plugins)
            {
                if( typeof this.settings[plugin] === 'object' ) {
                    var p = this.plugins[plugin](this, this.settings[plugin]);
                    if (p) this._plugins.push(p);
                }
            };
        },

        _callPlugins : function (method, args) {

            if (!args) args = {};
            for (var i = 0; i < this._plugins.length; i++) {
                if (method in this._plugins[i]) {
                    this._plugins[i][method](args);
                }
            }
        }

    });

}(Dragend);