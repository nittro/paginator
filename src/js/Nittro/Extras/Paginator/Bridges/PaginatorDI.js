_context.invoke('Nittro.Extras.Paginator.Bridges', function(Nittro) {

    if (!Nittro.DI) {
        return;
    }

    var PaginatorDI = _context.extend('Nittro.DI.BuilderExtension', function(containerBuilder, config) {
        PaginatorDI.Super.call(this, containerBuilder, config);
    }, {
        load: function() {
            this._getContainerBuilder().addFactory('paginator', 'Nittro.Extras.Paginator.Paginator()');
        }
    });

    _context.register(PaginatorDI, 'PaginatorDI')

});
