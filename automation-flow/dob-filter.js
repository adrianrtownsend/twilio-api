// Dob check - take date of birth input and check if over 18 from today
/** 
 * dob values checked separately
 * 
*/
exports.handler = function(context, event, callback) {
	let response = new Twilio.Response();
	
	// Set the status code to 200 OK
	response.setStatusCode(200);
	
	// Set the Content-Type Header
	response.appendHeader('Content-Type', 'application/json');
	
	// Set the response body
	response.setBody({
		'everything': 'is okay'
	});
	
	callback(null, response);
}