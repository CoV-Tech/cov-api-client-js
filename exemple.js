



// Defining the API
// the url is https://localhost/api/{version}/
// we are using authentication
// we are using version v1 (we can also say "latest")
let api = new cov.api.node.Api( "https://localhost/api/{version}/", true, "v1");

/*

//you can also "autobuild" the api, however, this is not recomended
//the url : https://localhost/api/{version}/
//version : v1
//forceUpdate : false (this means it will save the api specification for the next time, if set to true, it will rebuild itself everytime)
// the autoPrepate builds itself using the /dev endpoint on the api server, however at the moment only routes are supported
let api = cov.api.rest.Api.autoPrepare( "https://localhost/api/{version}/", "v1", false);


 */
// adding the status route (at /api/{version}/status via a GET request)
api.addRoute( "GET", "/status/", "status");

// adding a node called user with the fields id of type int, first_name and last_name of type string
api.addNode( "user", {
    id:"int",
    first_name:"string",
    last_name:"string"
});

// logging in with the username "user" and the password "password"
api.login( "user", "password");

//once logged in execute this (it will wait until someone logs in or if the token is already valid)
api.afterValid(true)
    .then(response => api.callRoute( "GET", "status")) // we are getting the status
    .then(console.log) //lets console log the response
    .catch(console.error); //we have an error, lets log it

// this will only check the token, and refresh it if needed, but if nobody is logged in, it will fail
api.afterValid()
    .then(r=>api.get('user', 1, "first_name,last_name")) // let's get the first_name and last_name of the user with the id 1
    .then(console.log) // let's log the user in the console
    .then(console.error); //we have an error, lets log it
