module.exports = function(req, res, next){
	if(req.url.endsWith('/')){
		res.redirect(req.url.substring(0, req.url.length - 1));
		return;
	}
	req.ejs = {};
	next();
}
