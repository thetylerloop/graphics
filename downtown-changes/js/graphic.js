// Global config
var GEO_DATA_URL = 'data/topo.json';

// Global vars
var pymChild = null;
var isMobile = false;
var geoData = null;
var mapData = {};
var structureGeoLookup = {};
var structureLabelsLookup = {};

/*
 * Initialize the graphic.
 */
var onWindowLoaded = function() {
    STRUCTURE_LABELS.forEach(function(d) {
        structureLabelsLookup[d['account']] = d;
    });

    MAP_LABELS.forEach(function(d) {
        d['lat'] = parseFloat(d['lat']);
        d['lng'] = parseFloat(d['lng']);
    });

    if (Modernizr.svg) {
        loadJSON()
    } else {
        pymChild = new pym.Child({});

        pymChild.onMessage('on-screen', function(bucket) {
            ANALYTICS.trackEvent('on-screen', bucket);
        });
        pymChild.onMessage('scroll-depth', function(data) {
            data = JSON.parse(data);
        ANALYTICS.trackEvent('scroll-depth', data.percent, data.seconds);
        });
    }
}

/*
 * Load graphic data from a CSV.
 */
var loadJSON = function() {
    d3.json(GEO_DATA_URL, function(error, data) {
        geoData = data;

        /*
        * Extract topo data.
        */
        for (var key in geoData['objects']) {
            mapData[key] = topojson.feature(geoData, geoData['objects'][key]);
        }

        mapData['parcel_structures']['features'].forEach(function(d) {
            structureGeoLookup[d['properties']['ACCOUNT']] = d;
        });

        pymChild = new pym.Child({
            renderCallback: render
        });

        pymChild.onMessage('on-screen', function(bucket) {
            ANALYTICS.trackEvent('on-screen', bucket);
        });
        pymChild.onMessage('scroll-depth', function(data) {
            data = JSON.parse(data);
        ANALYTICS.trackEvent('scroll-depth', data.percent, data.seconds);
        });
    });
}

/*
 * Render the graphic(s). Called by pym with the container width.
 */
var render = function(containerWidth) {
    if (!containerWidth) {
        containerWidth = DEFAULT_WIDTH;
    }

    if (containerWidth <= MOBILE_THRESHOLD) {
        isMobile = true;
    } else {
        isMobile = false;
    }

    // Render the chart!
    renderLocatorMap({
        container: '#locator-map',
        width: containerWidth,
        data: geoData
    });

    // Update iframe
    if (pymChild) {
        pymChild.sendHeight();
    }
}

var renderLocatorMap = function(config) {
    /*
     * Setup
     */
    var aspectWidth = 1;
    var aspectHeight = 1;

    var bbox = config['data']['bbox'];
    var defaultScale = 3500000;

    // Calculate actual map dimensions
    var mapWidth = config['width'];
    var mapHeight = Math.ceil((config['width'] * aspectHeight) / aspectWidth);

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(config['container']);
    containerElement.html('');

    var mapProjection = null;
    var path = null;
    var chartWrapper = null;
    var chartElement = null;

    /*
     * Create the map projection.
     */
    // var centroid = [((bbox[0] + bbox[2]) / 2), ((bbox[1] + bbox[3]) / 2)];
    var mapScale = (mapWidth / DEFAULT_WIDTH) * defaultScale;
    var scaleFactor = mapWidth / DEFAULT_WIDTH;

    var center = [-95.3034, 32.3547];

    projection = d3.geo.mercator()
        .center(center)
        .scale(mapScale)
        .translate([ mapWidth / 4, 0]);

    path = d3.geo.path()
        .projection(projection);
        // .pointRadius(cityDotRadius * scaleFactor);

    /*
     * Create the root SVG element.
     */
    chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    chartElement = chartWrapper.append('svg')
        .attr('width', mapWidth)
        .attr('height', mapHeight)
        .append('g')

    /*
     * Buildings
     */
    chartElement.append('g')
        .attr('class', 'parcel_structures')
        .selectAll('path')
            .data(mapData['parcel_structures']['features'])
        .enter().append('path')
            .attr('class', function(d) {
                return "account-" + d['properties']['ACCOUNT'];
            })
            .attr('d', path);

    /*
     * Roads
     */
    chartElement.append('g')
        .attr('class', 'osm_streets')
        .selectAll('path')
            .data(mapData['osm_streets']['features'])
        .enter().append('path')
            .attr('class', function(d) {
                return "type-" + d['properties']['highway'];
            })
            .attr('d', path);

    chartElement.append('g')
        .attr('class', 'railroads')
        .selectAll('path')
            .data(mapData['railroads']['features'])
        .enter().append('path')
            .attr('d', path);

    /*
     * Render map labels.
     */
    var layers = [
        'map-labels shadow',
        'map-labels'
    ];

    layers.forEach(function(layer) {
        chartElement.append('g')
            .attr('class', layer)
            .selectAll('.label')
                .data(MAP_LABELS)
            .enter().append('text')
                .attr('class', function(d) {
                    return 'label ' + classify(d['text']);
                })
                .attr('transform', function(d) {
                    return 'translate(' + projection([d['lng'], d['lat']]) + ') rotate(' + d['rotate'] + ')';
                })
                .attr('style', function(d) {
                    return 'text-anchor: ' + (d['anchor'] || 'start');
                })
                .text(function(d) {
                    return d['text'];
                });
    });

    chartElement.append('g')
        .attr('class', 'icons')
        .selectAll('.circle')
            .data(STRUCTURE_LABELS)
        .enter().append('circle')
            .attr('class', function(d) {
                return 'type-' + d['type'];
            })
            .attr('transform', function(d) {
                var point = null;

                if (d['lng'] != null) {
                    var lng = parseFloat(d['lng']);
                    var lat = parseFloat(d['lat']);
                    point = projection([lng, lat]);
                } else {
                    var structureGeo = structureGeoLookup[d['account']];
                    point = path.centroid(structureGeo);
                }

                return 'translate(' + point + ')';
            })
            .attr('cx', function(d) {
                return d['nudge_x'];
            })
            .attr('cy', function(d) {
                return d['nudge_y'];
            })
            .attr('r', isMobile ? 8 : 12 );

    chartElement.append('g')
        .attr('class', 'icons')
        .selectAll('.label')
            .data(STRUCTURE_LABELS)
        .enter().append('text')
            .attr('class', function(d) {
                return 'label ' + d['id'];
            })
            .attr('transform', function(d) {
                var point = null;

                if (d['lng'] != null) {
                    var lng = parseFloat(d['lng']);
                    var lat = parseFloat(d['lat']);
                    point = projection([lng, lat]);
                } else {
                    var structureGeo = structureGeoLookup[d['account']];
                    point = path.centroid(structureGeo);
                }

                return 'translate(' + point + ')';
            })
            .attr('style', function(d) {
                return 'text-anchor: ' + (d['anchor'] || 'start');
            })
            .attr('dx', function(d) {
                return d['nudge_x'] - 4;
            })
            .attr('dy', function(d) {
                return d['nudge_y'];
            })
            .text(function(d) {
                return d['id'];
            });
}

/*
 * Move a set of D3 elements to the front of the canvas.
 */
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

/*
 * Initially load the graphic
 * (NB: Use window.load to ensure all images have loaded)
 */
window.onload = onWindowLoaded;
