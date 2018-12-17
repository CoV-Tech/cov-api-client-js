if(typeof cov=== "undefined"){cov={};}if(typeof cov.api==="undefined"){cov.api={};}

cov.api.rest={};
cov.api.node={};


if(typeof cov.utils==="undefined"){cov.utils={}}
if(typeof cov.utils.httpRequest==="undefined"){cov.utils.httpRequest=(method,url,headers,body)=> new Promise((r,e)=>{const xhr=new XMLHttpRequest();xhr.open(method,url,!0);xhr.onload=()=>{cov.utils.httpRequest._requests[xhr.requestId]=1;r(xhr)};xhr.onerror=()=>{cov.utils.httpRequest._requests[xhr.requestId]=2;e(xhr)};xhr.requestId=btoa(JSON.stringify({time:Date.now(),url:url,headers:headers,method:method,body:body}));if(typeof headers==="object"){Object.keys(headers).forEach(v=>xhr.setRequestHeader(v,headers[v]))}if(typeof body!=="undefined"){xhr.send(body)}else{xhr.send()}cov.utils.httpRequest._requests[xhr.requestId]=0;setTimeout(()=>{let keys=Object.keys(cov.utils.httpRequest._requests);let liefi=cov.utils.httpRequest._requests[xhr.requestId]<1;if(liefi!==cov.utils.httpRequest._liefi){let done=!1;cov.utils.httpRequest._callbacks.forEach(callback=>{if(typeof callback==="function"){callback(liefi);done=!0}});if(!done&&liefi){alert("WARNING, LIE-FI detected (a very slow connection)")}}cov.utils.httpRequest._liefi=liefi},cov.utils.httpRequest.timeOut)});cov.utils.httpRequest._requests={};cov.utils.httpRequest._liefi=!1;cov.utils.httpRequest.timeOut=20000;cov.utils.httpRequest._callbacks=[];cov.utils.httpRequest.onLiefi=function(callback){cov.utils.httpRequest._callbacks.push(callback)}}

if(typeof cov.utils.isNumber==="undefined"){cov.utils.isNumber=object=>typeof object==="number";}
if(typeof cov.utils.isString==="undefined"){cov.utils.isString=object=>(typeof object==="string")||(object instanceof String);}
if(typeof cov.utils.isBoolean==="undefined"){cov.utils.isBoolean=object=>typeof object==="boolean";}
if(typeof cov.utils.isUndefined==="undefined"){cov.utils.isUndefined=object=>typeof object==="undefined";}
if(typeof cov.utils.isObject==="undefined"){cov.utils.isObject=object=>typeof object==="object";}

cov.api.rest.Api = class{

    _addAuthFunctions(){
        this.addRoute( "POST", "/auth/login/",  "login");
        this.addRoute( "GET",  "/auth/logout/", "logout");
        this.addRoute( "GET",  "/auth/token/",  "check");
        this.addRoute( "POST", "/auth/token/",  "refresh");
        this._checkedToken = false;
        this._auth = true;
        this._token = localStorage.getItem(btoa(this._baseUrl) + "_token");
        this._username = this._token === null ? null : JSON.parse(this._token).username;
        this._buffer = [];
        this._getToken = function(c=false){
            return new Promise((resolve, reject) => {
                let token = this._token;
                if (typeof token === "string" && token.length > 0){
                    let json = JSON.parse(token);
                    if (c){
                        return resolve(json);
                    }else{
                        return resolve(json.id);
                    }
                }else{
                    return reject("not logged in");
                }
            });
        };
        this.login = function( username, password){
            const _this = this;
            return new Promise((resolve, reject) => {
                if (!cov.utils.isString(username) || !cov.utils.isString(password) || username.length < 1 || password.length < 1){
                    return reject("username and password must be set");
                }
                let route = _this._getRoute("POST", "login");
                if (route === null) {
                    return reject("the route doesn't exist");
                }
                let url = route.prepareUrl({});
                if (url === null) {
                    return reject("url couldn't be prepared");
                }
                url += "?http=false";
                let headers = {};
                headers.Authorization = "Basic " + btoa( username + ":" + password);
                cov.utils.httpRequest( "POST", url, headers)
                    .then(result => {
                        let json = JSON.parse( result.responseText);
                        if (json.status.api.message === "OK" || json.status.api.message === "Created"){
                            localStorage.setItem( btoa(_this._baseUrl)+"_token", JSON.stringify(json.response.token));
                            _this._token = JSON.stringify(json.response.token);
                            _this._username = json.response.token.username;
                            while (_this._buffer.length > 0){
                                _this._buffer.shift().resolve("logged in");
                            }
                            return resolve(json);
                        }else{
                            return reject(json);
                        }
                    })
                    .catch(err => reject(err));
            });
        };
        this.logout = function( ){
            return new Promise((resolve, reject) => {
                this.callRoute( "GET", "logout").then(r=>{
                    this._token = null;
                    this._username = null;
                    localStorage.removeItem( btoa(this._baseUrl)+"_token");
                    resolve(r);
                }).catch(reject);
            });
        };
        this.refreshToken = function(){
            const _this = this;
            return new Promise((resolve, reject) => {
                _this._getToken(true).then(token=>{
                    _this.callRoute("POST", "refresh", {}, {refresh:token.refresh}).then(result=>{
                        _this._token = JSON.stringify( result.response.token);
                        localStorage.setItem( btoa(this._baseUrl)+"_token", _this._token);
                        resolve( result.response.token.id);
                    }).catch(reject);
                }).catch(reject);
            });
        };
        this.checkToken = function(){
            const _this = this;
            return new Promise((resolve, reject) => {
                let time = Math.round((new Date()).getTime() / 1000);
                let token = this._token;
                if (typeof token !== "string" || token.length < 1){
                    return reject("not logged in");
                }
                token = JSON.parse( token);
                if (typeof token.valid !== "boolean" || typeof token.time_given !== "number" || typeof token.id !== "string"){
                    return reject("token has invalid format");
                }
                if (!token.valid){
                    return reject("token invalid");
                }
                if (token.time_given < time - 3600){
                    return reject("token expired");
                }
                if (_this._checkedToken){
                    return resolve("token valid");
                }
                _this.callRoute("GET", "check").then(result=>{
                    _this._checkedToken = true;
                    resolve("token valid");
                }).catch(reject);
            });
        };
        this.getUsername = function(){
            return this._username;
        }
        this.afterValid = function(waitForLogin){
            const _this = this;
            return new Promise((resolve, reject) => {
                if (!cov.utils.isBoolean(waitForLogin)&& !cov.utils.isUndefined(waitForLogin)){
                    return reject("waitForLogin must be a boolean");
                }
                _this.checkToken()
                    .then(resolve)
                    .catch((err) => {
                        if (err === "token invalid" || err === "token expired"){
                            _this.refreshToken()
                                .then(resolve)
                                .catch(reject);
                        }else if (typeof waitForLogin === "boolean" && waitForLogin){
                            let buf = {};
                            buf.reject = reject;
                            buf.resolve = resolve;
                            _this._buffer.push(buf);
                        }else{
                            reject("not logged in");
                        }
                    });
            });
        };
    }
    static autoPrepare( base_url, version, forceUpdate = false){
        return new Promise((resolve,reject) => {
                if (!(cov.utils.isString(base_url) && cov.utils.isString(version) && forceUpdate.isBoolean())){
                    return reject("wrong input types, input must be string,string,boolean");
                }
                base_url = base_url.charAt(base_url.length-1) === "/" ? base_url.substring( 0, base_url.length-1) : base_url;
                version = typeof version!=="string"?"latest":version;
                if (forceUpdate === false){
                    let apiStorage = localStorage.getItem(btoa(base_url));
                    let json;
                    if (apiStorage !== null) {
                        json = JSON.parse(apiStorage);
                        let api = new cov.api.rest.Api(json.baseUrl, false, json.version);
                        json.routes.forEach(r => {
                            if (r.route === "dev") {
                                return;
                            }
                            api.addRoute(r.method, r.route, r.name);
                        });
                        api._auth = json.auth;
                        return resolve(api);
                    }
                }
                let route = new cov.api.rest._Route( base_url, "dev", "GET", "dev", version);
                cov.utils.httpRequest( route.method, route.prepareUrl())
                    .then(response => {
                        let json = JSON.parse( response.responseText);
                        let api = new cov.api.rest.Api( base_url, false, version);
                        let u = new URL( base_url);
                        let l = u.pathname.split( "/").length;
                        let auth = false;
                        json.response.routes.forEach(route => {
                            let method = route.method;
                            if (route.url.charAt(0) !== "/"){
                                route.url = "/" + route.url;
                            }
                            let s = route.url.split("/");
                            let url = "";
                            s.forEach( (v,i) => {
                                if (i >= l){
                                    url += "/" + v;
                                }
                            });
                            if (s[l] === "auth"){
                                auth = true;
                            }else if (s[l] !== "dev"){
                                api.addRoute( method, url, s[1]);
                            }
                        });
                        if (auth){
                            api._addAuthFunctions();
                        }
                        localStorage.setItem( btoa(base_url), JSON.stringify(api));
                        resolve(api);
                    })
                    .catch(reject);
        });
    }

    constructor(base_url, auth, version){
        if (!cov.utils.isString(base_url)){
            throw new Error("base_url must be a string");
        }
        if (!cov.utils.isBoolean(auth) && !cov.utils.isUndefined(auth)){
            throw new Error("auth must be a boolean");
        }
        if (!cov.utils.isString(version) && !cov.utils.isUndefined(version)){
            throw new Error("version must be a string");
        }
        if (base_url.charAt(base_url.length-1) === "/"){
            base_url = base_url.substring( 0, base_url.length-1);
        }
        this._baseUrl = base_url;
        this._version=typeof version!=="string"?"latest":version;
        this._routes = [];
        this._auth=typeof auth!=="boolean"?false:auth;
        this.addRoute( "GET", "/dev/", "dev");
        if (this._auth){
            this._addAuthFunctions();
        }
    }

    addRoute( method, route, name){
        if (!cov.utils.isString(method) || !cov.utils.isString(route) || !cov.utils.isString(name)){
            throw new Error("incorrect types, all parameters must be of type string");
        }
        if (route.charAt(route.length-1) === "/"){
            route = route.substring( 0, route.length-1);
        }
        if (route.charAt(0) === "/"){
            route = route.substring(1, route.length);
        }
        this._routes.push( new cov.api.rest._Route( this._baseUrl, route, method, name, this._version));
    }

    _getRoute( method, name, parameters){
        if (!cov.utils.isString(method) || !cov.utils.isString(name)){
            throw new Error("incorrect types, method and name must be of type string");
        }
        if (!cov.utils.isObject(parameters) && !cov.utils.isUndefined(parameters)){
            throw new Error("incorrect type, parameters must be of type object");
        }
        let i;
        for(i = 0; i < this._routes.length; i++){
            if (this._routes[i].getName() === name && this._routes[i].getMethod() === method && this._routes[i].checkArguments(parameters)){
                return this._routes[i];
            }
        }
        return null;
    }

    callRoute( method, name, parameters, url_params, body){
        const _this = this;
        return new Promise( (resolve, reject) => {
            if (!cov.utils.isString(method) || !cov.utils.isString(name)){
                return reject("incorrect types, method and name must be of type string");
            }
            if (!cov.utils.isObject(parameters) && !cov.utils.isUndefined(parameters)){
                return reject("incorrect type, parameters must be of type object");
            }
            if (!cov.utils.isObject(url_params) && !cov.utils.isUndefined(url_params)){
                return reject("incorrect type, url_params must be of type object");
            }
            if (!cov.utils.isObject(body) && !cov.utils.isUndefined(body)){
                return reject("incorrect type, body must be of type object");
            }
            let route = _this._getRoute(method, name, parameters);
            if (route === null) {
                return reject("the route doesn't exist");
            }
            let url = route.prepareUrl(parameters);
            if (url === null) {
                return reject("url couldn't be prepared");
            }
            if (typeof url_params !== "object"){
                url_params = {};
            }
            url_params.http = false;
            url += "?";
            if (typeof body !== "undefined"){
                body = JSON.stringify( body);
            }
            Object.keys(url_params).forEach(value=> url+=value+"="+url_params[value]+"&");
            let headers = {};
            if (_this._auth) {
                _this._getToken()
                    .then( result => {
                        headers.Authorization = "Bearer " + result;
                        return cov.utils.httpRequest( method, url, headers, body);
                    })
                    .then( result => {
                        let json = null;
                        let response = result.responseText;
                        try{
                            json = JSON.parse( response);
                        }catch(e){}
                        if (json !== null && (json.status.api.message === "OK" || json.status.api.message === "CREATED")){
                            return resolve(json);
                        }else if (json !== null){
                            return reject(json);
                        }else{
                            return reject(result.responseText);
                        }
                    })
                    .catch( err => {
                        if (err === "token expired"){
                            _this.refreshToken()
                                .then(r=>_this.callRoute(method, name, parameters, url_params))
                                .then(resolve)
                                .catch(reject);
                        }else{
                            reject(err);
                        }
                    });
            }else{
                cov.utils.httpRequest(method, url, headers, body)
                    .then(result => {
                        let json = null;
                        let response = result.responseText;
                        try{
                            json = JSON.parse( response);
                        }catch(e){}
                        if (json !== null && (json.status.api.message === "OK" || json.status.api.message === "Created")){
                            return resolve(json);
                        }else if (json !== null){
                            return reject(json);
                        }else{
                            return reject(result.responseText);
                        }
                    })
                    .catch(err => reject(err));
            }
        });
    }


};

cov.api.rest._Route = class{

    constructor(base_url, route, method, name, version){
        if (!cov.utils.isString(base_url) || !cov.utils.isString(route) || !cov.utils.isString(method) || !cov.utils.isString(name) || !cov.utils.isString(version)){
            throw new Error( "arguments must be of type string");
        }
        this._base_url = base_url;
        this._url = base_url + "/" + route;
        this._route = route;
        this._method = method;
        this._name = name;
        this._version = version;
    }

    getName(){
        return this._name;
    }

    getMethod(){
        return this._method;
    }

    prepareUrl(parameters){
        let url_arr = this._url.split("/");
        let i, url = "", reg = /^{.*}$/, n;
        if (cov.utils.isUndefined(parameters)){
            parameters = {};
        }
        if (!cov.utils.isObject(parameters)){
            throw new Error( "parameters must be of type object");
        }
        parameters.version = this._version;
        for (i = 0; i < url_arr.length; i++){
            if (reg.test(url_arr[i])){
                n = url_arr[i].substring(1,url_arr[i].length-1);
                if (typeof parameters[n] !== "undefined"){
                    url += parameters[n] + "/";
                }else{
                    return null;
                }
            }else{
                url += url_arr[i] + "/";
            }
        }
        return url;
    }

    checkArguments( parameters){
        let arr,reg,needed,has;
        arr = this._url.split("/");
        reg = /^{.*}$/;
        if (cov.utils.isUndefined(parameters)){
            parameters = {};
        }
        if (!cov.utils.isObject(parameters)){
            throw new Error( "parameters must be of type object");
        }
        parameters.version = this._version;
        needed = arr.filter(value => reg.test(value));
        needed = needed.map(value => value.substring(1,value.length-1));
        has = Object.keys(parameters);
        return needed.length === has.length;
    }

};


cov.api.node.Api = class extends cov.api.rest.Api{

    constructor(url, auth, version){
        super(url, auth, version);
        this.addRoute( "GET", "/node/{node}/{id}", "getNode");
        this.addRoute( "GET", "/node/{node}", "getAllNode");
        this.addRoute( "POST", "/node/{node}", "postNode");
        this.addRoute( "POST", "/node/{node}/{id}", "updateNode");
        this._nodes = [];
    }

    post( nodeName, data){
        const _this = this;
        return new Promise((resolve,reject) => {
            if (!cov.utils.isString(nodeName)){
                return reject( "nodeName must be of type string");
            }
            if (!cov.utils.isObject(data)){
                return reject( "data must be an object");
            }
            if (cov.utils.isString(data.id) || cov.utils.isNumber(data.id)){
                let sendData = {};
                let id = data.id;
                let keys = Object.keys(data);
                for (let i = 0; i < keys.length; i++){
                    if (keys[i] !== "id"){
                        sendData[keys[i]] = data[keys[i]];
                    }
                }
                this.callRoute( "POST", "updateNode", {node: nodeName, id: id}, {}, sendData).then(resolve).catch(reject);
            }else if (cov.utils.isUndefined(data.id)){
                this.callRoute( "POST", "postNode", {node: nodeName}, {}, data).then(resolve).catch(reject);
            }else{
                return reject( "id must be of type string or number");
            }
        });
    }

    getAll( nodeName, fields){
        const _this = this;
        return new Promise((resolve,reject) => {
            if (!cov.utils.isString(fields)){
                return reject( "fields must be of type string");
            }
            if (!cov.utils.isString(nodeName)){
                return reject( "nodeName must be of type string");
            }
            let parameters = {fields: fields};
            _this.callRoute( "GET", "getAllNode", {node: nodeName}, parameters).then(response=>{
                let objects = response.response;
                let node = _this._getNodeObject(nodeName);
                for (let i = 0; i < objects.length; i++){
                    if (!node.checkResponse(objects[i])){
                        return reject("The response is not conform to specs");
                    }
                }
                resolve(objects);
            }).catch(reject);
        });
    }

    get( nodeName, id, fields){
        const _this = this;
        return new Promise((resolve,reject) => {
            if (!cov.utils.isString(fields)){
                return reject( "fields must be of type string");
            }
            if (!cov.utils.isString(nodeName)){
                return reject( "nodeName must be of type string");
            }
            if (!cov.utils.isNumber(id) && !cov.utils.isString(id)){
                return reject( "id must be of type string or number");
            }
            let parameters = {fields: fields};
            _this.callRoute( "GET", "getNode", {node: nodeName,id: id}, parameters).then(response=>{
                let object = response.response;
                let node = _this._getNodeObject(nodeName);
                if (node.checkResponse( object)){
                    resolve(object);
                }else{
                    reject("The response is not conform to specs");
                }
            }).catch(reject);
        });
    }


    addNode( name, fields){
        if (!cov.utils.isObject(fields) && !cov.utils.isUndefined(fields)){
            return reject( "fields must be of type object");
        }
        if (!cov.utils.isString(name)){
            return reject( "name must be of type string");
        }
        let node = new cov.api.node._Node(name)
        this._nodes.push(node);
        if (typeof fields === "object"){
            let keys = Object.keys(fields);
            for (let i = 0; i < keys.length; i++){
                node.addField( keys[i], fields[keys[i]]);
            }
        }
    }

    _getNodeObject( name){
        if (!cov.utils.isString(name)){
            return reject( "name must be of type string");
        }
        for( let i = 0; i < this._nodes.length; i++){
            if (this._nodes[i].getName() === name){
                return this._nodes[i];
            }
        }
        return null;
    }

    addFieldToNode( nodeName, fieldName, fieldType){
        if (!cov.utils.isString(nodeName) || !cov.utils.isString(fieldName) || !cov.utils.isString(fieldType)){
            return reject( "arguments must be of type string");
        }
        let node = this._getNodeObject(nodeName);
        if (node === null){
            return false;
        }
        node.addField( fieldName, fieldType);
    }
};


cov.api.node._Node = class{

    constructor( name){
        if (!cov.utils.isString(name)){
            throw new Error( "name must be of type string");
        }
        this._name = name;
        this._fields = {};
    }

    addField( name, type){
        if (!cov.utils.isString(name) || !cov.utils.isString(type)){
            throw new Error( "arguments must be of type string");
        }
        this._fields[name] = type;
    }

    checkType( object, type){
        if (!cov.utils.isString(type)){
            throw new Error( "type must be of type string");
        }
        let number = ["int","number","double","float"];
        let booleans = ["bool", "boolean"];
        let string = ["string"];
        if (type.substr(-2) === "[]"){
            if (typeof object !== "object"){
                return false;
            }
            if (object.constructor.name !== "Array"){
                return false;
            }
            for (let i = 0; i < object.length; i++){
                if (!this.checkType(object[i], type.substr(0, type.length-2))){
                    return false;
                }
            }
            return true;
        }

        if (number.includes(type)){
            return cov.utils.isNumber(object) || object === null;
        }
        if (string.includes(type)){
            return cov.utils.isString(object) || object === null;
        }
        if (booleans.includes(type)){
            return cov.utils.isBoolean(object) || object === null;
        }
        return true;
    }

    getName(){
        return this._name;
    }

    checkResponse( response){
        if (!cov.utils.isObject(response)){
            return false;
        }
        let keys = Object.keys(response);

        for (let i = 0; i < keys.length; i++){
            if (typeof this._fields[keys[i]] === "string"){
                if (!this.checkType(response[keys[i]], this._fields[keys[i]])){
                    return false;
                }
            }else{
                return false;
            }
        }
        return true;
    }
}