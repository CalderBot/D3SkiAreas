$(function() {

	// get window height so SVG is full-height
	var WINDOWHEIGHT = parseInt(window.innerHeight);

	// filter out bad data & ski cooper
	function isComplete(area) {
		if (area.expert == undefined) area.expert = 0;
		if (area.advanced == undefined) area.advanced = 0;
		return ( area
			 	&& area.top < 15000
			 	&& area.top > area.base 
			 	&& area.base > 0 
			 	&& area.skiableAcres > 0 
			 	&& area.skiableAcres < 10000 
			 	&& area.yearlySnowfall >0 
			 	&& area.yearlySnowfall < 1000
			 	&& area.advanced + area.expert > 0
			 	&& area.name !== 'Ski Cooper'
		 )
	}

	// set data to filtered array
	var data = skiAreaList.filter(isComplete)

	// sort array by snowfall
	var sortedSnowfall = data.sort(function(a,b) {
		return a.yearlySnowfall - b.yearlySnowfall;
	})

	// number value of lowest snowfall is first item in sorted array
	var lowestSnow = sortedSnowfall[0].yearlySnowfall;

	var SNOWCONSTANT = 0.1;

	// make an array with a certain length to use as snowfall data
	//  ... new Array(3) would make [,,]
	//  ... scale by reducing snow values by lowestSnow to normalize
	//  ... include width (2 * acres / top - bottom) to increase density over wide mountains
	//  ... SNOWCONSTANT keeps number manageable
	var makeSnowFall = (function() {
		for (var i=0; i<data.length; i++) {
			data[i].snowfall = new Array(
				Math.floor(
					(data[i].yearlySnowfall - lowestSnow) * (data[i].skiableAcres / (data[i].top - data[i].base)) * SNOWCONSTANT + 1
				)
			)
		}
	})();

	// awesomeness constants
	var SNOWFALLSCALE = 10
	var EXPERTSCALE = 40
	var ADVANCEDSCALE = EXPERTSCALE
	var ACRESSCALE = 0.8
	var VERTSCALE = 1


	// mountain building & snowflake constants
	var SVG_HEIGHT = WINDOWHEIGHT
	var AWESOMESCALE = 500
	var XSCALE = 200
	var WIDTHSCALE = 200
	var SVG_WIDTH = XSCALE * data.length + 100
	var YHEIGHT = SVG_HEIGHT
	var HEIGHTSCALE = .2

	// FUNCTION TO DETERMINE HOW AWESOME EACH MOUNTAIN IS
	//	... normalize numbers using constants
	function makeAwesomeness(obj){
	  var n = ACRESSCALE * obj.skiableAcres
	  	+ SNOWFALLSCALE * obj.yearlySnowfall 
	  	+ EXPERTSCALE * obj.expert 
	  	+ ADVANCEDSCALE * obj.advanced
	  	+ VERTSCALE * (obj.top - obj.base)
	  return n / AWESOMESCALE;
	}

	// store `awesomeness` as a value in data array
	// ... awesomeness is a number generated by makeAwesome()
	for (i=0;i<data.length;i++) {
	  data[i].awesomeness = makeAwesomeness(data[i])
	}

	// sort array by `awesomeness` so mtns are in order
	// ... left to right, by most to least awesome
	data.sort(function(a,b){
		return b.awesomeness - a.awesomeness 
	})

	// SVG points to make triangles
	// ... save to data[i]
	// ... bottom left, bottom right, top center
	for(i=0;i<data.length;i++){
		var width = (2 * data[i].skiableAcres / (data[i].top - data[i].base)) * WIDTHSCALE;
	  data[i].points=[
		  {x: i * XSCALE, y: YHEIGHT },
		  {x: i * XSCALE + width, y: YHEIGHT },
		  {x: i * XSCALE + (width / 2), y: YHEIGHT - ((data[i].top - data[i].base)) * HEIGHTSCALE }
	  ]
	}

	var svg = d3.select('body')
		.append('svg')
		.attr('width', SVG_WIDTH)
		.attr('height', SVG_HEIGHT)

	// ------------------------ MAKE TRIANGLE MOUNTAINS ------------------------
	var mtns = svg.selectAll('polygon')
		.data(data)
		.enter()
		.append('polygon')
		.attr('points', function(d) {
			return d.points.map(function(item) { 
				// use previously created points array to populate 'points' attribute
				return [item.x,item.y].join(',');
			}).join(' ');
		})
		// fill each mountain with color
		// ... more blue = more advanced
		// ... more green = more easy
		// ... 70% opacity
		.attr('fill', function(d) {
			return 'rgba(0, ' + Math.round( (100 - (d.advanced + d.expert)) * 2.55) + ',' + Math.round((d.advanced + d.expert) * 2.55) + ' , .7)'
		});

	// ------------------------ MAKE MOUNTAIN TITLE TEXT ------------------------
	var text = svg.selectAll('text')
		.data(data)
		.enter()
		.append('text')
		.text(function(d) {
			return d.name
		})
		.attr('x', function(d, i) {
			return XSCALE * i + (XSCALE/2)
		})
		// each label will be 40px below the last to avoid stacking
		.attr('y', function(d, i) {
			return 40 * i + 100
		})
		// css stuff...
		.attr('font-family', 'Open Sans')
		.style('text-transform', 'uppercase')
		.style('letter-spacing', '2px')
		.style('font-size', '13px')
		.attr('fill', '#555')



	// ------------------------ DISPLAY SKI AREA INFO (on hover) ------------------------
	var infoBox = d3.select('body')
		.selectAll('.info')
		.data(data)
		.enter()
		.append('p')
		.attr('class', 'info')
		.attr('style', function(d, i) {
			console.log(XSCALE, i)
			return 'left: ' + (XSCALE * i + XSCALE/2) + 'px; top: ' + d.points[2].y + 'px;'
		})
		.html(function(d) {
			console.log(d)
			return 'Yearly snowfall: ' + d.yearlySnowfall + ' inches<br>Skiable acres: ' + d.skiableAcres 
		})


	// ------------------------ MAKE SNOW FALL! ------------------------
	var interval = 4000;

	// for each mountain...
	setInterval(function() {
		for (var j=0, len=data.length; j<len; j++) {

			// snowflake constructor (kinda)
			// makes circles with...
			// 	- class 'snow'
			// 	- random radius between 5 and 15
			// 	- random x-coordinate (within mtn width)

				var snowflake = svg.selectAll('.snow')
					.select('.snow')
					// data creates 2 response variables that are passed into all callback functions
					.data(data[j].snowfall)
					.enter()
					.append('circle')
					.attr('class', 'snow')
					.attr('fill', 'white')
					.attr('r', function(d) {
						var x = Math.random();
						// radius is usually a random number between 3 and 6
						if (x > 0.02) {
							return Math.round(Math.random()*3+3)
						}
						// rarely...
						else if (x > .005 ) {
							return 15
						}
						else if (x > .0005) {
							return 20
						}
						else if (x > .0001) {
							return 40
						}
						else {
							// 1 in 100000 snowflakes... 
							return 600
						}
					})
					.attr('cx', function() {
						// snow falls at any random x-value within its mountain's width
						var width = (XSCALE * data[j].skiableAcres)/((data[j].top-data[j].base))
						var randomWidth = Math.random()*width
						return (XSCALE * j + randomWidth)
					})
					// start snow at -600 px, since huge snowflake has that radius
					.attr('cy', '-600')
					.transition()
					.ease('linear')
					.duration(interval)
					// d represents the first data response variable (data value at i)
					// i represents the 2nd data response variable (iteration/index)
					.delay(function(d, i) {
						return Math.random() * interval * 1.5 / data[j].snowfall.length * i
					})
					.style('opacity', '0')
					// position at end of animation
					.attr('cy', function() {
						return SVG_HEIGHT - 200
					})
					// because snowflakes are created on an interval,
					// remove them at the end of their animation to free up memory
					.each('end', function() {
						this.remove()
					})

		}
	}, interval/2)
	
	// put 'least awesome' text at far right
	var DOCWIDTH = parseInt($(document).width());
	$('.key.sink').width(DOCWIDTH - 400)
	$('.sink.right').css('left', DOCWIDTH - 180 + 'px')

});




// var data = [
// 	{
// 		name: 'Vail',
// 		difficulty: 50,
// 		runs: 193,
// 		skiableAcres: 5289,
// 		vertical: 3450,
// 		yearlySnowfall: 370,
// 		snowfall: [,,,,,,,]
// 	},
// 	{
// 		name: 'Heavenly',
// 		difficulty: 30,
// 		runs: 97,
// 		skiableAcres: 4800,
// 		vertical: 3812,
// 		yearlySnowfall: 360,
// 		snowfall: [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]
// 	},
// 	{
// 		name: 'Breckenridge',
// 		difficulty: 80,
// 		runs: 155,
// 		skiableAcres: 2908,
// 		vertical: 3398,
// 		yearlySnowfall: 370,
// 		snowfall: [,,,]
// 	}
// ]