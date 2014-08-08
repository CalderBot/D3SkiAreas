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
$(function() {

	var WINDOWHEIGHT = parseInt(window.innerHeight);

	function isComplete(area){
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

	var data = skiAreaList.filter(isComplete)

	var sortedSnowfall = data.sort(function(a,b) {
		return a.yearlySnowfall - b.yearlySnowfall;
	})
	var lowestSnow = sortedSnowfall[0].yearlySnowfall;

	var SNOWCONSTANT = 0.1;

	var makeSnowFall = (function() {
		for (var i=0; i<data.length; i++) {
			data[i].snowfall = new Array(
				Math.floor(
					(data[i].yearlySnowfall - lowestSnow) * (data[i].skiableAcres / (data[i].top - data[i].base)) * SNOWCONSTANT + 1
				)
			)
		}
	})();



	var SNOWFALLSCALE = 10
	var EXPERTSCALE = 40
	var ADVANCEDSCALE = EXPERTSCALE
	var ACRESSCALE = 0.8
	var VERTSCALE = 1


	var SVG_HEIGHT = WINDOWHEIGHT
	var AWESOMESCALE = 500
	var XSCALE = 200
	var WIDTHSCALE = 200
	var SVG_WIDTH = XSCALE * data.length + 100
	var YHEIGHT = SVG_HEIGHT
	var HEIGHTSCALE = .2

	//FUNCTION TO DETERMINE HOW AWESOME EACH MOUNTAIN IS
	function makeAwesomeness(obj){
	  var n = ACRESSCALE * obj.skiableAcres
	  	+ SNOWFALLSCALE * obj.yearlySnowfall 
	  	+ EXPERTSCALE * obj.expert 
	  	+ ADVANCEDSCALE * obj.advanced
	  	+ VERTSCALE * (obj.top - obj.base)
	  return n / AWESOMESCALE;
	}
	//LOOP THROUGH AND STORE THE AWESOMENESS TO LATER SORT BY THIS VARIABLE
	for (i=0;i<data.length;i++) {
	  data[i].awesomeness = makeAwesomeness(data[i])
	}
	//SORT THE ARRAY SO THE MOUNTAINS APPEAR ON THE SCREEN FROM LEFT (LEAST AWESOME) TO RIGHT
	//(MOST AWESOME)
	data.sort(function(a,b){
		return b.awesomeness - a.awesomeness 
	})

	// console.log(lowestSnow)


	for(i=0;i<data.length;i++){
		var width = (2 * data[i].skiableAcres / (data[i].top - data[i].base)) * WIDTHSCALE;
	  data[i].points=[
		  {x: i * XSCALE, y: YHEIGHT },
		  {x: i * XSCALE + width, y: YHEIGHT },
		  {x: i * XSCALE + (width / 2), y: YHEIGHT - ((data[i].top - data[i].base)) * HEIGHTSCALE }
	  ]
	}
	// for(i=0;i<data.length;i++){
	//   data[i].points=[
	// 	  {x:i*XSCALE,y:YHEIGHT},
	// 	  {x:i*XSCALE+data[i].skiableAcres/WIDTHSCALE,y:YHEIGHT},
	// 	  {x:i*XSCALE+data[i].skiableAcres/(2*WIDTHSCALE),y:YHEIGHT-((data[i].top-data[i].base))/HEIGHTSCALE}
	//   ]
	// }

	var svg = d3.select('body')
		.append('svg')
		.attr('width', SVG_WIDTH)
		.attr('height', SVG_HEIGHT)

	var mtns = svg.selectAll('polygon')
		.data(data)
		.enter()
		.append('polygon')
		.attr('points', function(d) {
			return d.points.map(function(item) { 
				return [item.x,item.y].join(',');
			}).join(' ');
		})
		.attr('fill', function(d) {
			return 'rgba(0, ' + Math.round( (100 - (d.advanced + d.expert)) * 2.55) + ',' + Math.round((d.advanced + d.expert) * 2.55) + ' , .7)'
		});

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
		.attr('y', function(d, i) {
			return 40 * i + 100
		})
		.attr('font-family', 'Open Sans')
		.style('text-transform', 'uppercase')
		.style('letter-spacing', '2px')
		.style('font-size', '13px')
		.attr('fill', '#555')

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
						var x = Math.random()
						if (x > 0.02) {
							return Math.round(Math.random()*3+3)
						}
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
							return 600
						}
					})
					.attr('cx', function() {
						var width = (XSCALE * data[j].skiableAcres)/((data[j].top-data[j].base))
						var randomWidth = Math.random()*width
						// var radius = +$(this).attr('r');
						// 100*j to set mtnStart location
						// randomWidth is random value within width of mtn
						// radius is radius of snowflake to protect from left-side clipping
						return (XSCALE * j + randomWidth)
					})
					.attr('cy', '-600')
					.transition()
					.ease('linear')
					.duration(interval)
					// d represents the first data response variable (data value at i)
					// i represents the 2nd data response variable (iteration/index)
					.delay(function(d, i) {
						return Math.random()*interval*1.5/data[j].snowfall.length * i
					})
					.style('opacity', '0')
					.attr('cy', function() {
						// console.log((data[j].top-data[j].base)/10)
						return SVG_HEIGHT - (data[j].top-data[j].base)/10 + 200
					})
					.each('end', function() {
						this.remove()
					})

		}
	}, interval/2)

	var DOCWIDTH = parseInt($(document).width());
	$('.key.sink').width(DOCWIDTH - 400)
	$('.sink.right').css('left', DOCWIDTH - 180 + 'px')
	console.log(DOCWIDTH)

});