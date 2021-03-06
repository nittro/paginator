_context.invoke('Nittro.Extras.Paginator', function (Arrays, Strings, DOM, undefined) {

    var Paginator = _context.extend('Nittro.Object', function(ajax, history, options) {
        Paginator.Super.call(this);

        this._.ajax = ajax;
        this._.history = history;
        this._.options = Arrays.mergeTree({}, Paginator.defaults, options);
        this._.container = this._.options.container;
        this._.viewport = this._resolveViewport(this._.options.container, this._.options.viewport);
        this._.currentRequest = null;

        if (this._.options.pageSize === null) {
            throw new Error('You must specify the page size (number of items per page)');
        }

        if (this._.options.pageCount === null) {
            throw new Error('You must specify the page count');
        }

        if (this._.options.disablePreviousPages === null) {
            this._.options.disablePreviousPages = this._.options.currentPage === 1;
        }

        if (this._.options.margin === null) {
            this._.options.margin = this._computeMargin();
        }

        if (this._.options.history === null) {
            this._.options.history = !!this._.options.url;
        }

        if (typeof this._.options.itemRenderer === 'string') {
            this._.template = DOM.getById(this._.options.itemRenderer).innerHTML;
        } else if (typeof this._.options.template === 'string') {
            this._.template = this._.options.template;
        }

        if (this._.options.responseProcessor === null) {
            this._.options.responseProcessor = this._processResponse.bind(this);
        }

        this._.firstPage = this._.lastPage = this._.currentPage = this._.options.currentPage;
        this._.lock = false;
        this._.nextThreshold = this._computeNextThreshold();
        this._.handleScroll = this._handleScroll.bind(this);

        if (!this._.options.disablePreviousPages) {
            var prevElem = this._.container.tagName.toLowerCase();
            this._.prevContainer = DOM.create(prevElem, {'class': 'nittro-paginator-previous'});
            this._.container.insertBefore(this._.prevContainer, this._.container.firstChild);

            this._.previousItems = null;
            this._.previousLock = {
                time: Date.now() + 1000,
                threshold: this._computeElemOffset(this._getFirstItem())
            };

            this._.previousThreshold = this._computePreviousThreshold();
        }

        this._.pageThresholds = [
            {
                page: this._.currentPage,
                threshold: this._computeElemOffset(this._getFirstItem()) + this._getScrollTop()
            }
        ];

        if (Array.isArray(this._.options.items)) {
            this._getItems(this._.options.currentPage);
        }

        if (!this._.options.disablePreviousPages) {
            this._preparePreviousPage();
        }

        DOM.addListener(this._.viewport, 'scroll', this._.handleScroll);

    }, {
        STATIC: {
            defaults: {
                container: null,
                viewport: null,
                itemRenderer: null,
                template: null,
                items: null,
                url: null,
                responseProcessor: null,
                history: null,
                margin: null,
                currentPage: 1,
                pageCount: null,
                pageSize: null,
                disablePreviousPages: null
            }
        },

        destroy: function () {
            if (this._.prevContainer) {
                this._.prevContainer.parentNode.removeChild(this._.prevContainer);
            }

            if (this._.currentRequest) {
                this._.currentRequest.abort();
            }

            DOM.removeListener(this._.viewport, 'scroll', this._.handleScroll);
            this._.container = this._.prevContainer = this._.viewport = this._.options = this._.currentRequest = null;
            this._.lock = false;
        },

        _handleScroll: function () {
            if (this._.lock) {
                return;
            }

            this._.lock = true;

            window.requestAnimationFrame(function() {
                if (!this._.lock) {
                    return;
                }

                this._.lock = false;

                var top = this._getScrollTop(),
                    i, t, p, n;

                if (this._.nextThreshold !== null && top > this._.nextThreshold) {
                    this._.nextThreshold = null;
                    this._renderNextPage();

                } else if (this._.previousLock) {
                    if (this._.previousLock.time < Date.now() && top > this._.previousLock.threshold) {
                        this._.previousLock = null;

                    }
                } else if (this._.previousThreshold !== null && top < this._.previousThreshold) {
                    this._.previousThreshold = null;
                    this._renderPreviousPage();

                }

                if ((!this._.previousLock || this._.previousLock.time < Date.now()) && this._.options.history) {
                    for (i = 1, t = this._.pageThresholds.length; i <= t; i++) {
                        p = this._.pageThresholds[i - 1];
                        n = this._.pageThresholds[i];

                        if (top > p.threshold && (!n || top < n.threshold) && p.page !== this._.currentPage) {
                            this._.currentPage = p.page;
                            this._.history.replace(this._getPageUrl(p.page, true));
                            break;

                        }
                    }
                }
            }.bind(this));
        },

        _getPageUrl: function(page, history) {
            var url = history && typeof this._.options.history !== 'boolean' ? this._.options.history : this._.options.url;

            if (typeof url === 'function') {
                return url.call(null, page);
            } else {
                return url.replace(/%page%/g, page);
            }
        },

        _getItems: function(page) {
            if (Array.isArray(this._.options.items)) {
                var args = new Array(this._.options.pageSize),
                    items;

                args.unshift((page - 1) * this._.options.pageSize, this._.options.pageSize);
                items = this._.options.items.splice.apply(this._.options.items, args);
                return Promise.resolve(items);

            } else {
                var url = this._getPageUrl(page);

                this._.currentRequest = this._.ajax.get(url);

                return this._.currentRequest
                    .then(function(response) { this._.currentRequest = null; return response; }.bind(this))
                    .then(this._.options.responseProcessor)
                    .then(function(items) { return Array.isArray(items) ? items : []; });
            }
        },

        _processResponse: function(response) {
            return response.getPayload().items || [];
        },

        _preparePreviousPage: function() {
            if (this._.firstPage > 1) {
                this._.previousItems = this._getItems(this._.firstPage - 1)
                    .then(function(items) {
                        items = items
                            .map(this._createItem.bind(this))
                            .map(function(elem) {
                                this._.prevContainer.appendChild(elem);
                                return elem;
                            }.bind(this));

                        this.trigger('page-prepared', {
                            items: items
                        });

                        return items;
                    }.bind(this), function() { return null; });
            } else {
                this._.previousItems = Promise.resolve(null);
            }
        },

        _renderPreviousPage: function() {
            return this._.previousItems.then(function(items) {
                if (!items) {
                    return;
                }

                this._.firstPage--;

                var scrollTop = this._getScrollTop(),
                    style = window.getComputedStyle(this._.prevContainer),
                    first = items[0],
                    existing = this._.prevContainer.nextElementSibling || null,
                    itemStyle = window.getComputedStyle(first),
                    pt = parseFloat(style.paddingTop.replace(/px$/, '')),
                    pb = parseFloat(style.paddingBottom.replace(/px$/, '')),
                    m = 0,
                    delta,
                    i;

                if (!style.display.match(/flex$/) && itemStyle.float === 'none') {
                    m = Math.max(parseFloat(itemStyle.marginTop.replace(/px$/, '')), parseFloat(itemStyle.marginBottom.replace(/px$/, '')));
                }

                delta = this._.prevContainer.clientHeight - pt - pb - m;
                scrollTop += delta;

                for (i = 0; i < items.length; i++) {
                    this._.container.insertBefore(items[i], existing);
                }

                this.trigger('page-rendered', { items: items });

                window.requestAnimationFrame(function() {
                    this._setScrollTop(scrollTop);

                    this._.pageThresholds.forEach(function(t) {
                        t.threshold += delta
                    });

                    this._.pageThresholds.unshift({
                        page: this._.firstPage,
                        threshold: this._computeElemOffset(first) + scrollTop
                    });

                }.bind(this));

                this._preparePreviousPage();
                this._.previousThreshold = this._computePreviousThreshold();

            }.bind(this));
        },

        _renderNextPage: function() {
            return this._getItems(this._.lastPage + 1).then(function(items) {
                this._.lastPage++;

                items = items.map(this._createItem.bind(this));

                for (var i = 0; i < items.length; i++) {
                    this._.container.appendChild(items[i]);
                }

                this.trigger('page-rendered', { items: items });

                this._.nextThreshold = this._computeNextThreshold();

                this._.pageThresholds.push({
                    page: this._.lastPage,
                    threshold: this._computeElemOffset(items[0]) + this._getScrollTop()
                });

            }.bind(this), function() { return null; });
        },

        _createItem: function(data) {
            var item = this._renderItem(data);

            if (typeof item === 'string') {
                item = DOM.createFromHtml(item);
            }

            if (Array.isArray(item)) {
                throw new Error("Rendered item contains more than one root HTML element");
            }

            return item;

        },

        _renderItem: function(data) {
            if (typeof data === 'string') {
                return data;

            } else if (this._.template) {
                return this._.template.replace(/%([a-z0-9_.-]+)%/gi, function () {
                    var path = arguments[1].split(/\./g),
                        cursor = data,
                        i, p, n = path.length;

                    for (i = 0; i < n; i++) {
                        p = path[i];

                        if (Array.isArray(cursor) && p.match(/^\d+$/)) {
                            p = parseInt(p);
                        }

                        if (cursor[p] === undefined) {
                            return '';
                        }

                        cursor = cursor[p];
                    }

                    return Strings.escapeHtml(cursor + '');
                });
            } else {
                return this._.options.itemRenderer.call(null, data);
            }
        },

        _getFirstItem: function () {
            return this._.options.disablePreviousPages
                ? this._.container.firstElementChild
                : this._.prevContainer.nextElementSibling;
        },

        _computePreviousThreshold: function() {
            return this._.firstPage > 1 ? this._.options.margin : null;
        },

        _computeNextThreshold: function() {
            if (!this._.container.lastElementChild || this._.lastPage >= this._.options.pageCount) {
                return null;
            }

            var ofs = this._computeElemOffset(this._.container.lastElementChild, 'bottom');
            return Math.max(0, ofs + this._getScrollTop() - this._getViewportHeight() - this._.options.margin);
        },

        _computeElemOffset: function(elem, edge) {
            var rect = elem
                ? elem.getBoundingClientRect()
                : this._.container.getBoundingClientRect();

            var offset = rect[edge || 'top'];

            if (this._.viewport !== window) {
                offset -= this._.viewport.getBoundingClientRect().top;
            }

            return offset;

        },

        _computeMargin: function () {
            return this._getViewportHeight() / 2;
        },

        _getViewportHeight: function() {
            return this._.viewport.clientHeight || this._.viewport.innerHeight;
        },

        _getScrollTop: function() {
            return this._.viewport === window ? window.pageYOffset : this._.viewport.scrollTop;
        },

        _setScrollTop: function(to) {
            if (this._.viewport === window) {
                window.scrollTo(0, to);
            } else {
                this._.viewport.scrollTop = to;
            }
        },

        _resolveViewport: function (elem, viewport) {
            if (viewport === 'auto') {
                viewport = elem;

                function isScrollable(elem) {
                    var style = window.getComputedStyle(elem);
                    return style.overflow === 'auto' || style.overflow === 'scroll'
                        || style.overflowY === 'auto' || style.overflowY === 'scroll';
                }

                while (viewport && viewport !== document.body && !isScrollable(viewport)) {
                    viewport = viewport.parentNode;
                }
            } else if (viewport === null) {
                return window;
            }

            return viewport && DOM.contains(document.body, viewport) ? viewport : window;
        }
    });

    _context.register(Paginator, 'Paginator');

}, {
    Arrays: 'Utils.Arrays',
    Strings: 'Utils.Strings',
    DOM: 'Utils.DOM'
});
