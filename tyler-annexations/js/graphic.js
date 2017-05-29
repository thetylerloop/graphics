var YEARS = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
var AREA_PLUS = {
    1950: 2.0,
    1960: 6.2,
    1970: 4.4,
    1980: 11.9,
    1990: 5.2,
    2000: 9.9,
    2010: 4.7,
    2020: 3.1
};

var ANNOTATIONS = {
    '1950': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'Old Tyler',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
    '1960': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'TKTK',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
    '1970': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'TKTK',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
    '1980': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'UT Tyler (Texas State College)',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
    '1990': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'TKTK',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
    '2000': [{
        'x': -95.42,
        'y': 32.267,
        'text': 'TKTK',
        'anchor': 'middle',
        'line': [
            [-95.42, 32.28],
            [-95.40, 32.30],
            [-95.374, 32.317]
        ]
    }],
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
        'text': 'The Airport',
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
     * Render countries.
     */
    chartElement.append('g')
        .attr('class', 'areas')
        .selectAll('path')
            .data(config['data']['features'])
        .enter().append('path')
            .attr('class', function(d) {
                if (d['properties']['YEAR'] >= config['year']) {
                    return 'hide';
                } else if (d['properties']['YEAR'] >= config['year'] - 10) {
                    return 'new';
                } else {
                    return 'old';
                }
            })
            .attr('d', path);

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
         .attr('fill','#999')

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
        annotations.append('path')
            .attr('class', 'arrow')
            .attr('d', arrowLine(ann['line']))
            .style('marker-end', 'url(#arrowhead)');

        annotations.append('text')
            .attr('x', projection([ann['x'], ann['y']])[0])
            .attr('y', projection([ann['x'], ann['y']])[1])
            .attr('text-anchor', ann['anchor'])
            .text(ann['text']);
    })



  var labels = chartElement.append('g')
      .attr('class', 'labels');

  labels.append('text')
      .attr('class', 'year')
      .attr('x', mapWidth / 2)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .text((config['year'] - 10).toString() + "'s");

  if (AREA_PLUS[config['year']] != null) {
      labels.append('text')
          .attr('class', 'area')
          .attr('x', mapWidth / 2)
          .attr('y', 75)
          .attr('text-anchor', 'middle')
          .text('+' + AREA_PLUS[config['year']] + ' sq. mi.');
  }
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
