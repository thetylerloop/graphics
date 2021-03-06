var YEARS = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
var AREA = {
    1950: 12.1,
    1960: 18.4,
    1970: 22.7,
    1980: 34.6,
    1990: 39.8,
    2000: 49.7,
    2010: 54.4,
    2020: 57.5
};

FRONT_AND_BROADWAY = [-95.300664, 32.346563];

var ANNOTATIONS = {
    '1950': [{
        'x': -95.395,
        'y': 32.385,
        'text': '<tspan>Front &</tspan><tspan dx="-50" dy="16">Broadway</tspan>',
        'anchor': 'middle',
        'line': [
            [-95.36, 32.375],
            [-95.34, 32.375],
            [-95.305, 32.35]
        ]
    }, {
        'x': -95.21,
        'y': 32.37,
        'text': 'Pre-1940 area',
        'anchor': 'middle',
        'line': [
            [-95.21, 32.365],
            [-95.23, 32.348],
            [-95.27, 32.348]
        ]
    }, {
        'x': -95.24,
        'y': 32.28,
        'text': '1940s additions',
        'anchor': 'middle',
        'line': [
            [-95.24, 32.295],
            [-95.26, 32.32],
            [-95.282, 32.32]
        ]
    }],
    '1960': [{
        'x': -95.24,
        'y': 32.4,
        'text': 'Woldert Park',
        'anchor': 'left',
        'line': [
            [-95.245, 32.403],
            [-95.29, 32.39],
            [-95.3, 32.383]
        ]
    }, {
        'x': -95.235,
        'y': 32.267,
        'text': 'Green Acres',
        'anchor': 'middle',
        'line': [
            [-95.235, 32.28],
            [-95.235, 32.30],
            [-95.255, 32.312]
        ]
    }, {
        'x': -95.35,
        'y': 32.28,
        'text': 'Robert E. Lee HS',
        'anchor': 'end',
        'line': [
            [-95.345, 32.285],
            [-95.33, 32.285],
            [-95.305, 32.297]
        ]
    }],
    '1970': [{
        'x': -95.41,
        'y': 32.3,
        'text': 'John Tyler HS',
        'anchor': 'middle',
        'line': [
            [-95.41, 32.315],
            [-95.39, 32.35],
            [-95.355, 32.362]
        ]
    }, {
        'x': -95.38,
        'y': 32.395,
        'text': 'Hwy 69',
        'anchor': 'end',
        'line': [
            [-95.375, 32.398],
            [-95.36, 32.398],
            [-95.35, 32.4]
        ]
    }, {
        'x': -95.2,
        'y': 32.395,
        'text': 'Hwy 271',
        'anchor': 'start',
        'line': [
            [-95.205, 32.398],
            [-95.22, 32.398],
            [-95.23, 32.41]
        ]
    }],
    '1980': [{
        'x': -95.215,
        'y': 32.26,
        'text': 'UT Tyler',
        'anchor': 'middle',
        'line': [
            [-95.215, 32.275],
            [-95.215, 32.29],
            [-95.235, 32.305]
        ]
    }, {
        'x': -95.4,
        'y': 32.28,
        'text': 'South Broadway',
        'anchor': 'middle',
        'line': [
            [-95.4, 32.275],
            [-95.4, 32.26],
            [-95.315, 32.255]
        ]
    }],
    '1990': [{
        'x': -95.23,
        'y': 32.24,
        'text': 'Trane',
        'anchor': 'middle',
        'line': [
            [-95.23, 32.25],
            [-95.23, 32.27],
            [-95.242, 32.281]
        ]
    }],
    '2000': [/*{
        'x': -95.21,
        'y': 32.225 ,
        'text': 'Single-family homes',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }*/],
    '2010': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'The Cascades',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
    '2020': [{
        'x': -95.42,
        'y': 32.405,
        'text': 'The airport',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.4],
            [-95.405, 32.38],
            [-95.405, 32.365]
        ]
    }, {
        'x': -95.2,
        'y': 32.375,
        'text': 'UT Health Center',
        'anchor': 'middle',
        'line': [
            [-95.2, 32.39],
            [-95.2, 32.4],
            [-95.21, 32.417]
        ]
    }]
}

// Global vars
var pymChild = null;
var isMobile = false;
var bbox = null;
var geoData = null;

/*
 * Initialize the graphic.
 */
var onWindowLoaded = function() {
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
    d3.json('data/annexations.json', function(error, data) {
        bbox = data['objects']['nad83']['bbox'];
        geoData = topojson.feature(data, data['objects']['nad83']);

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

    _.each(YEARS, function(year) {
        // Render the chart!
        renderLocatorMap({
            container: '#year-' + year,
            width: isMobile ? containerWidth : containerWidth / 2,
            data: geoData,
            year: year
        });
    })

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

    var defaultScale = 100000;

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
    var centroid = [((bbox[0] + bbox[2]) / 2), ((bbox[1] + bbox[3]) / 2)];
    var mapScale = (mapWidth / DEFAULT_WIDTH) * defaultScale;
    var scaleFactor = mapWidth / DEFAULT_WIDTH;

    projection = d3.geo.mercator()
        .center(centroid)
        .scale(mapScale)
        .translate([ mapWidth/2, mapHeight/2 ]);

    path = d3.geo.path()
        .projection(projection)

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
     * Render areas.
     */
    chartElement.append('g')
        .attr('class', 'areas')
        .selectAll('path')
            .data(config['data']['features'])
        .enter().append('path')
            .attr('class', function(d) {
                var cls = 'year-' + d['properties']['YEAR'];

                if (d['properties']['YEAR'] >= config['year']) {
                    cls += ' hide';
                } else if (d['properties']['YEAR'] >= config['year'] - 10) {
                    cls += ' new';
                } else {
                    cls += ' old';
                }

                return cls;
            })
            .attr('d', path);

    // Center marker
    var marker = chartElement.append('g')
        .attr('class', 'marker')

    marker.append('circle')
        .attr('cx', projection(FRONT_AND_BROADWAY)[0])
        .attr('cy', projection(FRONT_AND_BROADWAY)[1])
        .attr('r', 2)

    // Arrows!
    chartElement.append('defs')
         .append('marker')
         .attr('id','arrowhead')
         .attr('orient','auto')
         .attr('viewBox','0 0 5.108 8.18')
         .attr('markerHeight','8.18')
         .attr('markerWidth','5.108')
         .attr('orient','auto')
         .attr('refY','4.09')
         .attr('refX','5')
         .append('polygon')
         .attr('points','0.745,8.05 0.07,7.312 3.71,3.986 0.127,0.599 0.815,-0.129 5.179,3.999')
         .attr('fill','#aaa')

    var arrowLine = d3.svg.line()
        .interpolate('basis')
        .x(function(d) {
            return projection([d[0], d[1]])[0];
        })
        .y(function(d) {
            return projection([d[0], d[1]])[1];
        });

    var annotations = chartElement.append('g')
        .attr('class', 'annotations');

    _.each(ANNOTATIONS[config['year']], function(ann) {
        if (ann['line']) {
            annotations.append('path')
                .attr('class', 'arrow')
                .attr('d', arrowLine(ann['line']))
                .style('marker-end', 'url(#arrowhead)');
        }

        annotations.append('text')
            .attr('x', projection([ann['x'], ann['y']])[0])
            .attr('y', projection([ann['x'], ann['y']])[1])
            .attr('text-anchor', ann['anchor'])
            .html(ann['text']);
    })

  var labels = chartElement.append('g')
      .attr('class', 'labels');

  labels.append('text')
      .attr('class', 'year')
      .attr('x', mapWidth / 2)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .text((config['year'] - 10).toString() + "s");

  labels.append('text')
      .attr('class', 'area')
      .attr('x', mapWidth / 2)
      .attr('y', 75)
      .attr('text-anchor', 'middle')
      .text(function(d) {
          var label = 'sq mi';

          if (config['year'] == 1950) {
              label = 'square miles'
          }

          return AREA[config['year']].toFixed(0) + ' ' + label;
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
