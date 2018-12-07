if(typeof cov=== "undefined"){cov={};}if(typeof cov.api==="undefined"){cov.api={};}


cov.api.rest={};
cov.api.node={};


if(typeof cov.utils==="undefined"){cov.utils={}}
if(typeof cov.utils.httpRequest==="undefined"){cov.utils.httpRequest=(method,url,headers,body)=>new Promise((r,e)=>{const xhr=new XMLHttpRequest();xhr.open(method,url,!0);xhr.onload=()=>{cov.utils.httpRequest.requests[xhr.requestId]=1;r(xhr)};xhr.onerror=()=>{cov.utils.httpRequest.requests[xhr.requestId]=2;e(xhr)};xhr.requestId=btoa(JSON.stringify({time:Date.now(),url:url,headers:headers,method:method,body:body}));if(typeof headers==="object"){Object.keys(headers).forEach(v=>xhr.setRequestHeader(v,headers[v]))}if(typeof body!=="undefined"){xhr.send(body)}else{xhr.send()}cov.utils.httpRequest.requests[xhr.requestId]=0;setTimeout(()=>{let keys=Object.keys(cov.utils.httpRequest.requests);let liefi=cov.utils.httpRequest.requests[xhr.requestId]<1;if(liefi!==cov.utils.httpRequest.liefi){let done=!1;cov.utils.httpRequest.callbacks.forEach(callback=>{if(typeof callback==="function"){callback(liefi);done=!0}});if(!done&&liefi){alert("WARNING, LIE-FI detected (a very slow connection)")}}cov.utils.httpRequest.liefi=liefi},20000)});cov.utils.httpRequest.requests={};cov.utils.httpRequest.liefi=!1;cov.utils.httpRequest.callbacks=[];cov.utils.httpRequest.onLiefi=function(callback){cov.utils.httpRequest.callbacks.push(callback)}}

if(typeof cov.utils.isNumber==="undefined"){cov.utils.isNumber=object=>typeof object==="number";}
if(typeof cov.utils.isString==="undefined"){cov.utils.isString=object=>(typeof object==="string")||(object instanceof String);}
if(typeof cov.utils.isBoolean==="undefined"){cov.utils.isBoolean=object=>typeof object==="boolean";}
if(typeof cov.utils.isUndefined==="undefined"){cov.utils.isUndefined=object=>typeof object==="undefined";}
if(typeof cov.utils.isObject==="undefined"){cov.utils.isObject=object=>typeof object==="object";}



cov.api.rest.Api = class{

    addAuthFunctions(){
        this.addRoute( "POST", "/auth/login/",  "login");
        this.addRoute( "GET",  "/auth/logout/", "logout");
        this.addRoute( "GET",  "/auth/token/",  "check");
        this.addRoute( "POST", "/auth/token/",  "refresh");
        this.checkedToken = false;
        this.auth = true;
        this.token = localStorage.getItem(btoa(this.baseUrl) + "_token");
        this.username = this.token === null ? null : JSON.parse(this.token).username;
        this.buffer = [];
        this.getToken = function(c=false){
            return new Promise((resolve, reject) => {
                let token = this.token;
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
                let route = _this.getRoute("POST", "login");
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
                            localStorage.setItem( btoa(this.baseUrl)+"_token", JSON.stringify(json.response.token));
                            this.token = JSON.stringify(json.response.token);
                            this.username = json.response.token.username;
                            while (_this.buffer.length > 0){
                                _this.buffer.shift().resolve("logged in");
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
                    this.token = null;
                    this.username = null;
                    localStorage.removeItem( btoa(this.baseUrl)+"_token");
                    resolve(r);
                }).catch(reject);
            });
        };
        this.refreshToken = function(){
            const _this = this;
            return new Promise((resolve, reject) => {
                _this.getToken(true).then(token=>{
                    _this.callRoute("POST", "refresh", {}, {refresh:token.refresh}).then(result=>{
                        _this.token = JSON.stringify( result.response.token);
                        localStorage.setItem( btoa(this.baseUrl)+"_token", _this.token);
                        resolve( result.response.token.id);
                    }).catch(reject);
                }).catch(reject);
            });
        };
        this.checkToken = function(){
            const _this = this;
            return new Promise((resolve, reject) => {
                let time = Math.round((new Date()).getTime() / 1000);
                let token = this.token;
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
                if (_this.checkedToken){
                    return resolve("token valid");
                }
                _this.callRoute("GET", "check").then(result=>{
                    _this.checkedToken = true;
                    resolve("token valid");
                }).catch(reject);
            });
        };
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
                            _this.buffer.push(buf);
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
                        api.auth = json.auth;
                        return resolve(api);
                    }
                }
                let route = new cov.api.rest.Route( base_url, "dev", "GET", "dev", version);
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
                            api.addAuthFunctions();
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
        this.baseUrl = base_url;
        this.version=typeof version!=="string"?"latest":version;
        this.routes = [];
        this.auth=typeof auth!=="boolean"?false:auth;
        this.addRoute( "GET", "/dev/", "dev");
        if (this.auth){
            this.addAuthFunctions();
        }
    }

    getBaseUrl(){
        return this.baseUrl;
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
        this.routes.push( new cov.api.rest.Route( this.baseUrl, route, method, name, this.version));
    }

    getRoute( method, name, parameters){
        if (!cov.utils.isString(method) || !cov.utils.isString(name)){
            throw new Error("incorrect types, method and name must be of type string");
        }
        if (!cov.utils.isObject(parameters) && !cov.utils.isUndefined(parameters)){
            throw new Error("incorrect type, parameters must be of type object");
        }
        let i;
        for(i = 0; i < this.routes.length; i++){
            if (this.routes[i].name === name && this.routes[i].method === method && this.routes[i].checkArguments(parameters)){
                return this.routes[i];
            }
        }
        return null;
    }

    callRoute( method, name, parameters, url_params){
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
            let route = _this.getRoute(method, name, parameters);
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
            Object.keys(url_params).forEach(value=> url+=value+"="+url_params[value]+"&");
            let headers = {};
            if (_this.auth) {
                _this.getToken()
                    .then( result => {
                        headers.Authorization = "Bearer " + result;
                        return cov.utils.httpRequest( method, url, headers);
                    })
                    .then( result => {
                        let json = null;
                        try{
                            json = JSON.parse( result.responseText);
                        }catch(e){}
                        if (json !== null && (json.status.api.message === "OK" || json.status.api.message === "Created")){
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
                cov.utils.httpRequest(method, url, headers)
                    .then(result => {
                        let json = null;
                        try{
                            json = JSON.parse( result.responseText);
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

cov.api.rest.Route = class{

    constructor(base_url, route, method, name, version){
        if (!cov.utils.isString(base_url) || !cov.utils.isString(route) || !cov.utils.isString(method) || !cov.utils.isString(name) || !cov.utils.isString(version)){
            throw new Error( "arguments must be of type string");
        }
        this.base_url = base_url;
        this.url = base_url + "/" + route;
        this.route = route;
        this.method = method;
        this.name = name;
        this.version = version;
    }

    prepareUrl(parameters){
        let url_arr = this.url.split("/");
        let i, url = "", reg = /^{.*}$/, n;
        if (cov.utils.isUndefined(parameters)){
            parameters = {};
        }
        if (!cov.utils.isObject(parameters)){
            throw new Error( "parameters must be of type object");
        }
        parameters.version = this.version;
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
        arr = this.url.split("/");
        reg = /^{.*}$/;
        if (cov.utils.isUndefined(parameters)){
            parameters = {};
        }
        if (!cov.utils.isObject(parameters)){
            throw new Error( "parameters must be of type object");
        }
        parameters.version = this.version;
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
        this.nodes = [];
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
                let node = _this.getNodeObject(nodeName);
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
                let node = _this.getNodeObject(nodeName);
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
        let node = new cov.api.node.Node(name)
        this.nodes.push(node);
        if (typeof fields === "object"){
            let keys = Object.keys(fields);
            for (let i = 0; i < keys.length; i++){
                node.addField( keys[i], fields[keys[i]]);
            }
        }
    }

    getNodeObject( name){
        if (!cov.utils.isString(name)){
            return reject( "name must be of type string");
        }
        for( let i = 0; i < this.nodes.length; i++){
            if (this.nodes[i].name === name){
                return this.nodes[i];
            }
        }
        return null;
    }

    addFieldToNode( nodeName, fieldName, fieldType){
        if (!cov.utils.isString(nodeName) || !cov.utils.isString(fieldName) || !cov.utils.isString(fieldType)){
            return reject( "arguments must be of type string");
        }
        let node = this.getNodeObject(nodeName);
        if (node === null){
            return false;
        }
        node.addField( fieldName, fieldType);
    }
};


cov.api.node.Node = class{

    constructor( name){
        if (!cov.utils.isString(name)){
            throw new Error( "name must be of type string");
        }
        this.name = name;
        this.fields = {};
    }

    addField( name, type){
        if (!cov.utils.isString(name) || !cov.utils.isString(type)){
            throw new Error( "arguments must be of type string");
        }
        this.fields[name] = type;
    }

    checkType( object, type){
        if (!cov.utils.isString(type)){
            throw new Error( "type must be of type string");
        }
        let number = ["int","number","double","float"];
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
        return true;
    }

    checkResponse( response){
        if (!cov.utils.isObject(response)){
            return false;
        }
        let keys = Object.keys(response);

        for (let i = 0; i < keys.length; i++){
            if (typeof this.fields[keys[i]] === "string"){
                if (!this.checkType(response[keys[i]], this.fields[keys[i]])){
                    return false;
                }
            }else{
                return false;
            }
        }
        return true;
    }
}