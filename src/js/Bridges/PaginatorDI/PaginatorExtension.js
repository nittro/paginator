_context.invoke('Nittro.Extras.Paginator.Bridges.PaginatorDI', function() {

    var PaginatorExtension = _context.extend('Nittro.DI.BuilderExtension', function(containerBuilder, config) {
        PaginatorExtension.Super.call(this, containerBuilder, config);
    }, {
        load: function() {
            this._getContainerBuilder().addFactory('paginator', 'Nittro.Extras.Paginator.Paginator()');
        }
    });

    _context.register(PaginatorExtension, 'PaginatorExtension')

});
