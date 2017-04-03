// Global vars
var pymChild = null;
var isMobile = false;

DATA = [{
    'seat': 'House of Representatives, Texas 1st District',
    'years': [{
        'year': '2016',
        'races': [{
            'race': 'general',
            'pctWon': 73.9
        }, {
            'race': 'primary',
            'pctWon': 82.0
        }]
    }, {
        'year': '2014',
        'races': [{
            'race': 'general',
            'pctWon': 77.5
        }, {
            'race': 'primary',
            'pctWon': 'Unopposed in primary'
        }]
    }, {
        'year': '2012',
        'races': [{
            'race': 'general',
            'pctWon': 71.4
        }, {
            'race': 'primary',
            'pctWon': 'Unopposed in primary'
        }]
    }, {
        'year': '2010',
        'races': [{
            'race': 'general',
            'pctWon': 89.7
        }, {
            'race': 'primary',
            'pctWon': 'Unopposed in primary'
        }]
    }, {
        'year': '2008',
        'races': [{
            'race': 'general',
            'pctWon': 87.6
        }, {
            'race': 'primary',
            'pctWon': 'Unopposed in primary'
        }]
    }, {
        'year': '2006',
        'races': [{
            'race': 'general',
            'pctWon': 68.0
        }, {
            'race': 'primary',
            'pctWon': 'Unopposed in primary'
        }]
    }, {
        'year': '2004*',
        'races': [{
            'race': 'general',
            'pctWon': 61.5
        }, {
            'race': 'primary',
            'pctWon': 41.7
        }]
    }]
}, {
    'seat': 'Texas State Judge, 7th District (Smith County)',
    'years': [{
        'year': '2000',
        'races': [{
            'race': 'general',
            'pctWon': 'Unopposed'
        }]
    }, {
        'year': '1996',
        'races': [{
            'race': 'general',
            'pctWon': 'Unopposed'
        }]
    }, {
        'year': '1992',
        'races': [{
            'race': 'general',
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

    var seatGap = 20;

    var yearWidth = 45;
    var yearGap = 5;

    var yearGapY = 10;

    var valueGap = 6;

    var margins = {
        top: 0,
        right: 30,
        bottom: 30,
        left: 10
    };

    var ticksX = 4;
    var roundTicksFactor = 5;

    // Calculate actual chart dimensions
    var chartWidth = config['width'] - margins['left'] - margins['right'];
    var chartHeight = ((barHeight + barGap) * 19) + seatGap + (yearGapY * 8);

    var plotWidth = chartWidth - (yearWidth + yearGap);

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(config['container']);
    containerElement.html('');

    /*
     * Render the HTML legend.
     */
    var legend = containerElement.append('ul')
        .attr('class', 'key')
        .selectAll('g')
        .data(['General', 'Primary'])
        .enter().append('li')
            .attr('class', function(d) {
                return 'key-item ' + classify(d);
            });

    legend.append('b')

    legend.append('label')
        .text(function(d) {
            return d;
        });

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
        .attr('transform', makeTranslate(yearWidth + yearGap, 0))

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

    var yOffset = 0;

    _.each(DATA, function(seatData, k) {
        var seat = seatData['seat'];
        var years = seatData['years'];

        var seatElement = chartElement.append('g')
            .attr('class', 'seat');

        if (k > 0) {
            yOffset += seatGap;
        }

        seatElement.append('text')
            .attr('class', 'seat-label')
            .attr('y', yOffset)
            .attr('dy', (barHeight / 2) + 3)
            .text(seat);

        yOffset += barHeight + barGap;

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
                    .attr('transform', makeTranslate(0, yOffset))

                if (j == 0) {
                    raceElement.append('text')
                        .attr('class', 'year-label')
                        .attr('dy', (barHeight / 2) + 3)
                        .text(year);
                }

                if (isNaN(pctWon)) {
                    raceElement.append('text')
                        .attr('class', 'unopposed-label')
                        .attr('x', yearWidth + yearGap)
                        .attr('dy', (barHeight / 2) + 3)
                        .text(pctWon)
                } else {
                    plotElement.append('rect')
                        .attr('class', 'pct-won ' + race)
                        .attr('x', 0)
                        .attr('width', xScale(pctWon))
                        .attr('y', yOffset)
                        .attr('height', barHeight);

                    raceElement.append('text')
                        .attr('class', 'value-label')
                        .attr('x', yearWidth + yearGap + valueGap + xScale(pctWon))
                        .attr('dy', (barHeight / 2) + 3)
                        .text(pctWon + '%');
                }

                yOffset += barHeight + barGap;

                if (j == 1) {
                    yOffset += yearGapY;
                }
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
