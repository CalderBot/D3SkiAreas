// Locals
var indexController = require('./controllers/index.js');
var SkiArea = require('./models/skiArea.js');
// Modules
var express = require('express');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var request = require("request");
var async = require('async');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ColoradoSkiAreas');

// Express setup:
var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));

// Put our routes here:
app.get('/', indexController.index)



var server = app.listen(4068, function() {
	console.log('Express server listening on port ' + server.address().port);
});






// Below here are functions to populate the database.  

/* Notes on async.map:
1. Syntax: async.map(myArray,iterator,callback2)
2. iterator(item, callback1) - A function to apply to each item in arr. The iterator is passed a callback(err, transformed) which must be called once it has completed with an error (which can be null) and a transformed item.
3. But callback1(err,transformed) is determined by async.  Nonetheless, you must include something in your iterator that triggers it, because async is listening for that.
4. callback2(err, results) - A callback which is called when all iterator functions have finished, or an error occurs. Results is an array of the transformed items from the arr.
*/

// This populates the skiarea collection.  It is only called if the collection is empty.
function loadSkiAreas(){

// Get the list of Colorado ski Areas and their wikipedia page urls:
request('https://en.wikipedia.org/wiki/List_of_Colorado_ski_resorts#List_of_ski_areas',
	function(err, response){
		if(err) return console.log("error getting list of ski area names", err);
		// Load entire page:
		var $ = cheerio.load(response.body);

		// A list whose items are <a href="wikiurl" title="ski area name">
		var anchorList = $('[id="List_of_ski_areas"]').parent().next().find('a');

		// Fill a list of the names and wikipedia urls:
		var skiAreas = [];
		for (var i = 0; i < anchorList.length; i++) {
			// Ensure resort has a wiki page with conditional, then push name and url to skiAreas
			if($(anchorList[i]).attr('title').match("does not exist")==null ){
				skiAreas.push({'name':$(anchorList[i]).attr('title'), 
					'wikiURL':'https://en.wikipedia.org'+$(anchorList[i]).attr('href') } )
			}
		};
		// Asynchronous mapping to get the wiki page for each ski area:
		async.map(skiAreas, getSkiPage, function(err,results){
				for (var i = 0; i < skiAreas.length; i++) {
					skiAreas[i] = skiScraper(skiAreas[i],results[i]);
				};
				console.log(skiAreas)
				// Asynchronous mapping to save ski areas to database
				async.map(skiAreas, storeSkiArea,
					function(err,results){
						if(err) return console.log("Error storing ski areas to database");
						console.log('ski areas successfully stored in database')
					}
				)
			}
		)
	}				
)
// Little callbacks
function getSkiPage(a,callback){
	request(a.wikiURL,callback);
}

function storeSkiArea(a,callback){
	skiArea = new SkiArea(a); 
	skiArea.save(callback)
}

// Fills in properties of a ski area by scraping its wikipedia page:
function skiScraper(skiArea, wikiPageResponse){
	var wikiPage = cheerio.load(wikiPageResponse.body);
	var s = wikiPage('.infobox').text().replace(/[^\w]/g,'').toLowerCase()
	var snow = s.match(/snowfall\d*/)
	var vert = s.match(/vertical\d*/)
	var acres = s.match(/skiablearea\d*/)
	var adv = s.match(/\d*advanced/)
	var exp = s.match(/\d*expert/)
	var top = s.match((/topelevation\d*/))
	var base = s.match((/baseelevation\d*/))
	if(snow) skiArea.yearlySnowfall = +snow[0].slice("snowfall".length);
	if(vert) skiArea.vertical= +vert[0].slice("vertical".length);
	if(acres) skiArea.skiableAcres= +acres[0].slice("skiablearea".length);
	if(adv) skiArea.advanced = +adv[0].slice(0,-"advanced".length);
	if(exp) skiArea.expert = +exp[0].slice(0,-"expert".length);
	if(top) skiArea.top= +top[0].slice("topelevation".length);
	if(base) skiArea.base= +base[0].slice("baseelevation".length);
	return skiArea;
}

} // <-- end loadSkiAreas

// Populates the database if it is empty
SkiArea.count({},function(err,count){
	if(err) return console.log("Error loading skiAreas: ", err);
	if(count === 0) loadSkiAreas();
})

