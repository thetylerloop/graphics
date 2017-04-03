// Global vars
var pymChild = null;
var isMobile = false;

DATA = [{
    'seat': '1st District',
    'years': [{
        'year': 2016,
        'races': [{
            'race': 'TKTK',
            'pctWon': 73.9
        }, {
            'race': 'Primary',
            'pctWon': 82.0
        }]
    }, {
        'year': 2014,
        'races': [{
            'race': 'TKTK',
            'pctWon': 77.5
        }, {
            'race': 'Primary',
            'pctWon': NaN
        }]
    }, {
        'year': 2012,
        'races': [{
            'race': 'TKTK',
            'pctWon': 71.4
        }, {
            'race': 'Primary',
            'pctWon': NaN
        }]
    }, {
        'year': 2010,
        'races': [{
            'race': 'TKTK',
            'pctWon': 89.7
        }, {
            'race': 'Primary',
            'pctWon': NaN
        }]
    }, {
        'year': 2008,
        'races': [{
            'race': 'TKTK',
            'pctWon': 87.6
        }, {
            'race': 'Primary',
            'pctWon': NaN
        }]
    }, {
        'year': 2006,
        'races': [{
            'race': 'TKTK',
            'pctWon': 68.0
        }, {
            'race': 'Primary',
            'pctWon': NaN
        }]
    }, {
        'year': 2004,
        'races': [{
            'race': 'TKTK',
            'pctWon': 61.5
        }, {
            'race': 'Primary',
            'pctWon': 41.7
        }]
    }]
}, {
    'seat': '7th District Judge',
    'years': [{
        'year': 2000,
        'races': [{
            'race': 'TKTK',
            'pctWon': NaN
        }]
    }, {
        'year': 1996,
        'races': [{
            'race': 'TKTK',
            'pctWon': NaN
        }]
    }, {
        'year': 1992,
        'races': [{
            'race': 'TKTK',
            'pctWon': 58.5
        }]
    }]
}];

/*
 * Initialize the graphic.
 */
var onWindowLoaded = function() {
    if (Modernizr.svg) {
        pymChild = new pym.Child({
            renderCallback: render
        });
    } else {
        pymChild = new pym.Child({});
    }

    pymChild.onMessage('on-screen', function(bucket) {
        ANALYTICS.trackEvent('on-screen', bucket);
    });
    pymChild.onMessage('scroll-depth', function(data) {
        data = JSON.parse(data);
        ANALYTICS.trackEvent('scroll-depth', data.percent, data.seconds);
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
    renderBarChart({
        container: '#bar-chart',
        width: containerWidth,
        data: DATA
    });

    // Update iframe
    if (pymChild) {
        pymChild.sendHeight();
    }
}

/*
 * Render a bar chart.
 */
var renderBarChart = function(config) {
    /*
     * Setup
     */
    var barHeight = 30;
    var barGap = 5;

    var yearWidth = 45;
    var yearGap = 5;

    var raceWidth = 140;
    var raceGap = 5;

    var valueGap = 6;

    var margins = {
        top: 0,
        right: 15,
        bottom: 30,
        left: 10
    };

    var ticksX = 4;
    var roundTicksFactor = 5;

    // Calculate actual chart dimensions
    var chartWidth = config['width'] - margins['left'] - margins['right'];
    var chartHeight = ((barHeight + barGap) * 19);

    var plotWidth = chartWidth - (yearWidth + yearGap + raceWidth + raceGap);

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(config['container']);
    containerElement.html('');

    /*
     * Create the root SVG element.
     */
    var chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    var chartElement = chartWrapper.append('svg')
        .attr('width', chartWidth + margins['left'] + margins['right'])
        .attr('height', chartHeight + margins['top'] + margins['bottom'])
        .append('g')
        .attr('transform', makeTranslate(margins['left'], margins['top']));

    var plotElement = chartElement.append('g')
        .attr('transform', makeTranslate(yearWidth + yearGap + raceWidth + raceGap, 0))

    /*
     * Create D3 scale objects.
     */
    var xScale = d3.scale.linear()
        .domain([0, 100])
        .range([0, plotWidth]);

    /*
     * Create D3 axes.
     */
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .ticks(ticksX)
        .tickFormat(function(d) {
            return d.toFixed(0) + '%';
        });

    /*
     * Render axes to chart.
     */
    plotElement.append('g')
        .attr('class', 'x axis')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxis);

    /*
     * Render grid to chart.
     */
    var xAxisGrid = function() {
        return xAxis;
    };

    plotElement.append('g')
        .attr('class', 'x grid')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxisGrid()
            .tickSize(-chartHeight, 0, 0)
            .tickFormat('')
        );

    var totalRaces = 0;

    _.each(DATA, function(seatData) {
        var seat = seatData['seat'];
        var years = seatData['years'];

        var seatElement = chartElement.append('g')
            .attr('class', 'seat');

        seatElement.append('text')
            .attr('class', 'seat-label')
            .attr('y', totalRaces * (barHeight + barGap))
            .attr('dy', (barHeight / 2) + 3)
            .text(seat);

        totalRaces += 1;

        _.each(years, function(yearData, i) {
            var year = yearData['year'];
            var races = yearData['races'];

            var yearElement = chartElement.append('g')
                .attr('class', 'year');

            _.each(races, function(raceData, j) {
                var race = raceData['race'];
                var pctWon = raceData['pctWon'];

                var raceElement = yearElement.append('g')
                    .attr('class', 'race')
                    .attr('transform', makeTranslate(0, totalRaces * (barHeight + barGap)))

                if (j == 0) {
                    raceElement.append('text')
                        .attr('class', 'year-label')
                        .attr('dy', (barHeight / 2) + 3)
                        .text(year);
                }

                raceElement.append('text')
                    .attr('class', 'race-label')
                    .attr('x', yearWidth + yearGap)
                    .attr('dy', (barHeight / 2) + 3)
                    .text(race);

                if (_.isNaN(pctWon)) {
                    raceElement.append('text')
                        .attr('class', 'unopposed-label')
                        .attr('x', yearWidth + yearGap + raceWidth + raceGap)
                        .attr('dy', (barHeight / 2) + 3)
                        .text('Unopposed')
                } else {
                    plotElement.append('rect')
                        .attr('class', 'pct-won')
                        .attr('x', 0)
                        .attr('width', xScale(pctWon))
                        .attr('y', totalRaces * (barHeight + barGap))
                        .attr('height', barHeight);

                    raceElement.append('text')
                        .attr('class', 'value-label')
                        .attr('x', yearWidth + yearGap + raceWidth + raceGap + valueGap + xScale(pctWon))
                        .attr('dy', (barHeight / 2) + 3)
                        .text(pctWon + '%');
                }

                totalRaces += 1;
            });

            yearElement.selectAll('g')
                .data(races)
        });
    });

    chartElement.append('g')
        .selectAll('g')

    /*
     * Render bars to chart.
     */
    // chartElement.append('g')
    //     .attr('class', 'bars')
    //     .selectAll('rect')
    //     .data(config['data'])
    //     .enter()
    //     .append('rect')
    //         .attr('x', function(d) {
    //             if (d[valueColumn] >= 0) {
    //                 return xScale(0);
    //             }
    //
    //             return xScale(d[valueColumn]);
    //         })
    //         .attr('width', function(d) {
    //             return Math.abs(xScale(0) - xScale(d[valueColumn]));
    //         })
    //         .attr('y', function(d, i) {
    //             return i * (barHeight + barGap);
    //         })
    //         .attr('height', barHeight)
    //         .attr('class', function(d, i) {
    //             return 'bar-' + i + ' ' + classify(d[labelColumn]);
    //         });
    //
    // /*
    //  * Render bar values.
    //  */
    // chartElement.append('g')
    //     .attr('class', 'value')
    //     .selectAll('text')
    //     .data(config['data'])
    //     .enter()
    //     .append('text')
    //         .text(function(d) {
    //             return d[valueColumn].toFixed(0) + '%';
    //         })
    //         .attr('x', function(d) {
    //             return xScale(d[valueColumn]);
    //         })
    //         .attr('y', function(d, i) {
    //             return i * (barHeight + barGap);
    //         })
    //         .attr('dx', function(d) {
    //             var xStart = xScale(d[valueColumn]);
    //             var textWidth = this.getComputedTextLength()
    //
    //             // Negative case
    //             if (d[valueColumn] < 0) {
    //                 var outsideOffset = -(valueGap + textWidth);
    //
    //                 if (xStart + outsideOffset < 0) {
    //                     d3.select(this).classed('in', true)
    //                     return valueGap;
    //                 } else {
    //                     d3.select(this).classed('out', true)
    //                     return outsideOffset;
    //                 }
    //             // Positive case
    //             } else {
    //                 if (xStart + valueGap + textWidth > chartWidth) {
    //                     d3.select(this).classed('in', true)
    //                     return -(valueGap + textWidth);
    //                 } else {
    //                     d3.select(this).classed('out', true)
    //                     return valueGap;
    //                 }
    //             }
    //         })
    //         .attr('dy', (barHeight / 2) + 3)
}

/*
 * Initially load the graphic
 * (NB: Use window.load to ensure all images have loaded)
 */
window.onload = onWindowLoaded;
