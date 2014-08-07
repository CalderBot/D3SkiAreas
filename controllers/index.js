var skiArea = require('../models/skiArea.js')
var indexController = {
	index: function(req, res) {

		// 	data: skiAreaList;

		// 	skiArea.find(function(err,result){ 
		// 		res.render('index', {
		// 		skiAreaList = result;
		// 		console.log(skiAreaList);
		// 		})
		// });
		
		skiArea.find(function(err, result) {
			if(err) {
				console.log(err)
			}
			else {
				res.render('index', {
					skiAreaList: result
				})
			}
		})


	}
};

module.exports = indexController;