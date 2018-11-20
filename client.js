cov = {
    config:{
        log:{
            log:false,
            info:true,
            warn:true,
            error:true
        }
    },
    core:{
        error:function(...message){
            if (cov.config.log.error){
                console.error( ...message);
            }
        },
        info:function(...message){
            if (cov.config.log.info){
                console.info( ...message);
            }
        },
        log:function(...message){
            if (cov.config.log.log){
                console.log( ...message);
            }
        },
        warn:function(...message){
            if (cov.config.log.warn){
                console.warn( ...message);
            }
        }
    },
    api:{
        client:{
            auth:{
                getUsername: function( apiName){
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    if (cov.api.client.auth.isLoggedIn( apiName)){
                        return cov.api.client.intern.apis[apiName].username;
                    }
                    return false;
                },
                isLoggedIn: function(apiName){
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    if (cov.api.client.intern.apis[apiName].loggedIn){
                        cov.core.log( "api [" + apiName + "] is logged in");
                    }else{
                        cov.core.log( "api [" + apiName + "] is not logged in");
                    }
                    return !!cov.api.client.intern.apis[apiName].loggedIn;
                },
                getToken: function( apiName){
                    let token, json;
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return "";
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return "";
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return "";
                    }
                    token = cov.api.client.intern.data.get( apiName, "token");
                    if (token === null){
                        cov.core.log( "api [" + apiName + "] has no token");
                        return "";
                    }
                    json = JSON.parse( token);
                    cov.core.log( "api [" + apiName + "] has valid token");
                    return typeof json.id !== "undefined" ? json.id : "";
                },
                isTokenClientValid: function( apiName) {
                    let token, json, time;
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    if (!cov.api.client.auth.isLoggedIn(apiName)) {
                        return false;
                    }
                    token = cov.api.client.intern.data.get(apiName, "token");
                    if (token === null && token.length > 0) {
                        cov.core.log("api [" + apiName + "] has no token");
                        return false;
                    }
                    json = JSON.parse(token);
                    if (!json.valid){
                        cov.api.client.intern.data.set(apiName, "username", null);
                        cov.api.client.intern.data.set(apiName, "token", null);
                        cov.api.client.intern.data.set(apiName, "loggedIn", "false");
                        return false;
                    }
                    time = Math.round((new Date()).getTime() / 1000);
                    if (json.time_given < time - 3600){
                        cov.api.client.intern.data.set(apiName, "username", null);
                        cov.api.client.intern.data.set(apiName, "token", null);
                        cov.api.client.intern.data.set(apiName, "loggedIn", "false");
                        return false;
                    }
                    return true;
                },
                isTokenValid: function( apiName, callback){
                    let token;
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    if (!cov.api.client.auth.isLoggedIn( apiName)){
                        if (typeof callback === "function"){
                            callback( false);
                        }
                        return false;
                    }
                    if (!cov.api.client.auth.isTokenClientValid( apiName)){
                        if (typeof callback === "function"){
                            callback(false);
                        }
                        return false;
                    }
                    token = cov.api.client.auth.getToken( apiName);
                    if (token !== null && token.length > 0){
                        /**


                        CALL TO SERVER TO VERIFY

                        */
                        if (typeof callback === "function"){
                            callback(true);
                        }
                        return true;
                    }else{
                        cov.api.client.intern.data.set(apiName, "username", null);
                        cov.api.client.intern.data.set(apiName, "token", null);
                        cov.api.client.intern.data.set(apiName, "loggedIn", "false");
                        if (typeof callback === "function"){
                            callback( false);
                            return false;
                        }
                    }
                },
                refreshToken: function( apiName, callback){
                    let token;
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    if (!cov.api.client.auth.isLoggedIn( apiName)){
                        if (typeof callback === "function"){
                            callback( false);
                        }
                        return false;
                    }
                    token = cov.api.client.auth.getToken( apiName);
                    if (token !== null && token.length > 0){
                        /**

                        CALL TO SERVER TO GET TOKEN


                        */
                        if (typeof callback === "function"){
                            callback(false);
                        }
                        return false;
                    }else{
                        cov.api.client.intern.data.set(apiName, "username", null);
                        cov.api.client.intern.data.set(apiName, "token", null);
                        cov.api.client.intern.data.set(apiName, "loggedIn", "false");
                        if (typeof callback === "function"){
                            callback( false);
                            return false;
                        }
                    }
                },
                login: function(apiName,username,password,callback){
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    if (!cov.utils.checkType("username", username, "string") || !cov.utils.checkType("password", password, "string")) {
                        return false;
                    }
                    if (username.length < 1 || password.length < 1){
                        cov.core.error( "username and password must be at least 1 character");
                        return false;
                    }
                    let xHTTP = new XMLHttpRequest();
                    xHTTP.data = {};
                    xHTTP.data.callback = callback;
                    xHTTP.onreadystatechange = function( ){
                        if (this.readyState === 4){
                            let json = JSON.parse(this.responseText);
                            if (json.status.http.code === 200){
                                cov.api.client.intern.data.set(apiName, "username", json.response.username);
                                cov.api.client.intern.data.set(apiName, "token", JSON.stringify(json.response.token));
                                cov.api.client.intern.data.set(apiName, "loggedIn", "true");
                                cov.api.client.intern.apis[apiName].loggedIn = true;
                                cov.api.client.intern.apis[apiName].username = json.response.username;
                                if (typeof this.data.callback === "function"){
                                    cov.core.log( "calling callback for login in api [" + apiName + "]");
                                    this.data.callback( true, json.response.username);
                                }else{
                                    cov.core.log( "no callback for login in api [" + apiName + "]");
                                }
                            }else if (json.status.http.code === 401){
                                cov.api.client.intern.data.set(apiName, "username", null);
                                cov.api.client.intern.data.set(apiName, "token", null);
                                cov.api.client.intern.data.set(apiName, "loggedIn", "false");
                                cov.core.log( "wrong password or username");
                                if (typeof this.data.callback === "function"){
                                    cov.core.log( "calling callback for login in api [" + apiName + "]");
                                    this.data.callback( false, "wrong username or password");
                                }else{
                                    cov.core.log( "no callback for login in api [" + apiName + "]");
                                }
                            }else{
                                cov.core.warn( "unknown error in login for api [" + apiName + "]");
                            }
                        }
                    };
                    xHTTP.open( "POST", cov.api.client.intern.apis[apiName].baseurl + "/auth/login?http=false");
                    xHTTP.setRequestHeader( "Authorization", "Basic " + btoa( username + ":" + password));
                    xHTTP.send();
                    cov.core.log( "Logging in on [" + apiName +"] with username [" + username + "]");
                    return true;
                },
                logout: function(apiName, callback){
                    if (!cov.utils.checkType("apiName", apiName, "string")) {
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                        cov.core.error("api [" + apiName + "] unknown");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid) {
                        cov.core.error("api [" + apiName + "] is invalid, there have been errors while building the specs");
                        return false;
                    }
                    cov.core.log( "Logging out of [" + apiName + "]");
                    cov.api.client.intern.data.set(apiName, "username", null);
                    cov.api.client.intern.data.set(apiName, "token", null);
                    cov.api.client.intern.data.set(apiName, "loggedIn", "false");
                    cov.api.client.intern.apis[apiName].loggedIn = false;
                    if (typeof callback === "function"){
                        callback();
                    }
                    return true;
                }
            },
            config:{
                addApi: function(name,baseUrl,auth=false){
                    if (!cov.utils.checkType( "name", name, "string") || !cov.utils.checkType("baseUrl", baseUrl, "string") || !cov.utils.checkType("auth", auth, "boolean")){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[name] !== "undefined"){
                        cov.api.client.intern.addError( name, "api declared more than once");
                        cov.core.error( "api [" + name + "] already exists");
                        return false;
                    }
                    cov.api.client.intern.apis[name] = {};
                    cov.api.client.intern.apis[name].baseurl = baseUrl;
                    cov.api.client.intern.apis[name].nodes = [];
                    cov.api.client.intern.apis[name].types = [];
                    cov.api.client.intern.apis[name].valid = true;
                    cov.api.client.intern.apis[name].ready = false;
                    cov.api.client.intern.apis[name].auth = auth;
                    cov.api.client.intern.apis[name].errors = [];
                    cov.api.client.intern.apis[name].configs = 0;
                    cov.api.client.intern.apis[name].loggedIn = cov.api.client.intern.data.get( name, "loggedIn") === "true";
                    cov.api.client.intern.apis[name].username = cov.api.client.intern.data.get( name, "username");
                    cov.api.client.intern.apis[name].name = name;
                    cov.api.client.intern.apis[name].num = cov.api.client.intern.apis.length;
                    cov.api.client.intern.apis[cov.api.client.intern.apis[name].num] = cov.api.client.intern.apis[name];
                    cov.core.log("new api [" + name + "]");
                    return true;
                },
                addFieldToNode: function(apiName,nodeName,fieldName,fieldType){
                    if (!cov.utils.checkType( "apiName", apiName, "string")){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        cov.core.error( "api [" + apiName + "] unknown");
                        return false;
                    }
                    if (cov.api.client.intern.apis[apiName].ready){
                        cov.api.client.intern.apis[apiName].valid = false;
                        cov.core.error( "api [" + apiName + "] already compiled, no config changes can be made");
                        return false;
                    }
                    cov.api.client.intern.apis[apiName].configs++;
                    if (!(	cov.utils.checkType( "nodeName", nodeName, "string") &&
                        cov.utils.checkType( "fieldName", fieldName, "string") &&
                        cov.utils.checkType( "fieldType", fieldType, "string")
                    )){
                        cov.api.client.intern.addError( apiName, "arguments passed aren't all strings in addFieldToNode");
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName] === "undefined"){
                        cov.api.client.intern.addError( apiName, "node [" + nodeName + "] unknown");
                        cov.core.error( "node [" + nodeName + "] unknown in api [" + apiName + "]");
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName] !== "undefined"){
                        cov.api.client.intern.addError( apiName, "field [" + fieldName + "] already exists in node [" + nodeName + "]");
                        cov.core.error( "field [" + fieldName + "] already exists in node [" + nodeName + "] in api [" + apiName + "]");
                        return false;
                    }
                    if (!cov.api.client.intern.typeExists( apiName, fieldType)){
                        cov.core.error( "type [" + fieldType + "] unknown in api [" + apiName + "]");
                        cov.api.client.intern.addError( apiName, "type [" + fieldType + "] unknown");
                        return false;
                    }
                    cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName] = {};
                    cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName].type = fieldType;
                    cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName].name = fieldName;
                    cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName].num = cov.api.client.intern.apis[apiName].nodes[nodeName].fields.length;
                    cov.api.client.intern.apis[apiName].nodes[nodeName].fields[cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName].num] = cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName];
                    cov.core.log( "new Field [" + fieldName + "] of type [" + fieldType + "] in node [" + nodeName + "] in api [" + apiName + "]");
                    return true;
                },
                addNode: function(apiName,nodeName){
                    if (!cov.utils.checkType( "apiName", apiName, "string")){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        cov.core.error( "api [" + apiName + "] unknown");
                        return false;
                    }
                    if (cov.api.client.intern.apis[apiName].ready){
                        cov.core.error( "api [" + apiName + "] already compiled, no config changes can be made");
                        cov.api.client.intern.apis[apiName].valid = false;
                        return false;
                    }
                    cov.api.client.intern.apis[apiName].configs++;
                    if (!cov.utils.checkType( "nodeName", nodeName, "string")){
                        cov.api.client.intern.addError( apiName, "nodeName must be of type string in function addNode(apiName,nodeName)");
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName] !== "undefined"){
                        cov.api.client.intern.addError( apiName, "node [" + nodeName + "] already exists");
                        cov.core.error( "node [" + nodeName + "] already exists in api [" + apiName + "]");
                        return false;
                    }
                    cov.api.client.intern.apis[apiName].nodes[nodeName] = {};
                    cov.api.client.intern.apis[apiName].nodes[nodeName].fields = [];
                    cov.api.client.intern.apis[apiName].nodes[nodeName].name = nodeName;
                    cov.api.client.intern.apis[apiName].nodes[nodeName].num = cov.api.client.intern.apis[apiName].nodes.length;
                    cov.api.client.intern.apis[apiName].nodes[cov.api.client.intern.apis[apiName].nodes[nodeName].num] = cov.api.client.intern.apis[apiName].nodes[nodeName];
                    cov.core.log( "new Node [" + nodeName + "] in api [" + apiName + "]");
                    return true;
                },
                compile: function(apiName){
                    if (!cov.utils.checkType( "apiName", apiName, "string")){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        cov.core.error( "api [" + apiName + "] unknown");
                        return false;
                    }
                    if (cov.api.client.intern.apis[apiName].ready){
                        cov.core.warn( "api [" + apiName + "] already compiled");
                        return false;
                    }
                    if (!cov.api.client.intern.apis[apiName].valid){
                        cov.core.error( "api [" + apiName + "] is invalid, errors : ");
                        cov.core.error(cov.api.client.intern.apis[apiName].errors);
                        return false;
                    }
                    let errors = [];
                    cov.api.client.intern.apis[apiName].nodes.forEach( function (value){
                        if (value.fields.length < 1){
                            this[this.length] = "Node [" + value.name + "] has no fields";
                        }
                    }, errors);
                    if (errors.length > 0){
                        cov.core.error( "api [" + apiName + "] is invalid : ");
                        cov.core.error( errors);
                        return false;
                    }
                    cov.api.app = {};
                    cov.api.app[apiName] = {};
                    cov.api.client.intern.apis[apiName].nodes.forEach( function (value){
                        cov.api.app[apiName][value.name] = {};
                        cov.api.app[apiName][value.name].get = function (id, fields, callBack){
                            cov.api.client.node.get( apiName, value.name, id, callBack, fields);
                        };
                        cov.api.app[apiName][value.name].getAll = function( fields, callBack){
                            cov.api.client.node.getAll( apiName, value.name, callBack, fields);
                        }
                    });
                    let xHTTP = new XMLHttpRequest();
                    xHTTP.open ("GET", cov.api.client.intern.apis[apiName].baseurl + "/?http=false");
                    xHTTP.settings = {};
                    xHTTP.settings.apiName = apiName;
                    xHTTP.settings.baseurl = cov.api.client.intern.apis[apiName].baseurl;
                    xHTTP.onreadystatechange = function(){
                        if (this.readyState === 4){
                            if (this.status !== 200){
                                cov.api.client.intern.apis[this.settings.apiName].valid = false;
                                cov.api.client.intern.apis[this.settings.apiName].ready = false;
                                cov.core.error( "api [" + this.settings.apiName + "] has not a valid base url : " + this.settings.baseurl);
                            }else{
                                let json = JSON.parse( this.responseText);
                                if (typeof json.version === "undefined"){
                                    cov.api.client.intern.apis[this.settings.apiName].valid = false;
                                    cov.api.client.intern.apis[this.settings.apiName].ready = false;
                                    cov.core.error( "api [" + this.settings.apiName + "] has not a valid base url : " + this.settings.baseurl);
                                }else{
                                    if (typeof json.status === "undefined" || typeof json.status.http === "undefined" || typeof json.status.http.code === "undefined" || json.status.http.code !== 200){
                                        cov.api.client.intern.apis[this.settings.apiName].valid = false;
                                        cov.api.client.intern.apis[this.settings.apiName].ready = false;
                                        cov.core.error( "api [" + this.settings.apiName + "] has not a valid base url : " + this.settings.baseurl);
                                    }else{
                                        cov.core.info( "api [" + this.settings.apiName + "] works with version [" + json.version + "]");
                                    }
                                }
                            }
                        }
                    };
                    xHTTP.send();
                    cov.core.info( "api [" + apiName + "] compiled with " + cov.api.client.intern.apis[apiName].configs + " configuration statements, and " + cov.api.client.intern.apis[apiName].nodes.length + " nodes");
                    cov.api.client.intern.apis[apiName].ready = true;
                    return true;
                }
            },
            intern:{
                apis: [],
                types: [
                    "int",
                    "string",
                    "bool"
                ],
                data:{
                    get: function(apiName,key) {
                        if (!cov.utils.checkType("apiName", apiName, "string")) {
                            return null;
                        }
                        if (typeof cov.api.client.intern.apis[apiName] === "undefined") {
                            cov.core.error("api [" + apiName + "] unknown");
                            return null;
                        }
                        cov.core.log( "getting from localStorage with key [" + key + "] from api [" + apiName + "]");
                        return cov.utils.data.get("api[" + apiName + "[" + key + "]]");
                    },
                    set: function(apiName,key,value){
                        if (!cov.utils.checkType( "apiName", apiName, "string")){
                            return;
                        }
                        if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                            cov.core.error( "api [" + apiName + "] unknown");
                            return;
                        }
                        cov.core.log( "setting in localStorage with key [" + key + "] from api [" + apiName + "]");
                        cov.utils.data.set( "api[" + apiName + "[" + key + "]]", value);
                    }
                },
                fields:{
                    parse: function(fields_str){
                        cov.core.log( "parsing ", fields_str);
                        let offset = 0;
                        let fields = [];
                        let str, firstC, firstB, firstE, name, char, subFields, i, j, index, m;
                        while (offset < fields_str.length){
                            str = fields_str.substr( offset);
                            firstC = str.indexOf( ',') >= 0 ? str.indexOf( ',') : str.length;
                            firstB = str.indexOf( '{') >= 0 ? str.indexOf( '{') : str.length;
                            firstE = str.indexOf( '}') >= 0 ? str.indexOf( '}') : str.length;
                            name = str.substr( 0, Math.min( firstC, firstB, firstE));
                            char = str.substr( name.length, 1);
                            offset += name.length + 1;
                            subFields = [];
                            if (char === "{"){
                                subFields = cov.api.client.intern.fields.parse( str.substr( name.length+1));
                                i = name.length + 1;
                                j = 0;
                                while (j >= 0 && i < str.length){
                                    if (str.charAt( i) === "{"){
                                        j++;
                                    }
                                    if (str.charAt( i) === "}"){
                                        j--;
                                    }
                                    i++;
                                }
                                offset += i - name.length;
                            }
                            index = fields.length;
                            if (name.length < 2){
                                cov.core.error( "Fields_str isn't of type field, the name [" + name + "] is too short");
                                return null;
                            }
                            m = name.match(/^[a-zA-Z]+[a-zA-Z0-9_-]*[a-zA-Z0-9]+$/g);
                            if (m == null || m.length !== 1){
                                cov.core.error( "The name [" + name + "] is not a valid name for a field");
                                return null;
                            }
                            fields[index] = {};
                            fields[index].name = name;
                            fields[index].subFields = subFields;
                            if (char === "}"){
                                return fields;
                            }
                        }
                        return fields;
                    }
                },
                network:{
                    checkResponse: function(json){
                        return (
                            typeof json === "object" &&
                            typeof json.status === "object" &&
                            typeof json.status.http === "object" &&
                            typeof json.status.http.code === "number" &&
                            typeof json.status.http.message === "string" &&
                            typeof json.status.api === "object" &&
                            typeof json.status.api.code === "number" &&
                            typeof json.status.api.message === "string" &&
                            typeof json.response_time === "number" &&
                            typeof json.version === "string" &&
                            typeof json.response !== "undefined"
                        );
                    },
                    getE: function(apiName,endpoint,callback){
                        let url, xHTTP;
                        if (!cov.utils.checkType( "apiName", apiName, "string")){
                            return false;
                        }
                        if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                            cov.core.error( "api [" + apiName + "] unknown");
                            return false;
                        }
                        if (!cov.api.client.intern.apis[apiName].ready){
                            cov.core.error( "api [" + apiName + "] has not yet complied, please compile before using");
                            return false;
                        }
                        if (!(	cov.utils.checkType( "endpoint", endpoint, "string") &&
                            cov.utils.checkType( "callback", callback, "function")
                        )){
                            return false;
                        }
                        if (!cov.api.client.intern.apis[apiName].valid){
                            cov.core.warn( "api [" + apiName + "] might be unstable, there have been errors while building the specs");
                        }
                        url = cov.api.client.intern.apis[apiName].baseurl + "/" + endpoint;
                        cov.core.log( "getting from api [" + apiName + "] url : " + url);
                        xHTTP = new XMLHttpRequest();
                        xHTTP.data = {};
                        xHTTP.data.apiName = apiName;
                        xHTTP.data.request = "get";
                        xHTTP.data.callback = callback;
                        xHTTP.onreadystatechange = cov.api.client.intern.network.responseHandler;
                        xHTTP.open( "GET", url);
                        if (cov.api.client.intern.apis[apiName].auth){
                            xHTTP.setRequestHeader( "Authorization", "Bearer " + cov.api.client.auth.getToken( apiName));
                        }
                        xHTTP.send();
                    },
                    getN: function(apiName,nodeName,callback,fields,id){
                        let url;
                        if (!cov.utils.checkType( "apiName", apiName, "string")){
                            return false;
                        }
                        if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                            cov.core.error( "api [" + apiName + "] unknown");
                            return false;
                        }
                        if (!cov.api.client.intern.apis[apiName].ready){
                            cov.core.error( "api [" + apiName + "] has not yet complied, please compile before using");
                            return false;
                        }
                        if (!(	cov.utils.checkType( "nodeName", nodeName, "string") &&
                            cov.utils.checkType( "fields", fields, "string") &&
                            cov.utils.checkType( "callback", callback, "function")
                        )){
                            return false;
                        }
                        if (!cov.api.client.intern.apis[apiName].valid){
                            cov.core.warn( "api [" + apiName + "] might be unstable, there have been errors while building the specs");
                        }
                        if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName] === "undefined"){
                            cov.core.error( "node [" + nodeName + "] unknown in api [" + apiName + "]");
                            return false;
                        }
                        if (!cov.api.client.intern.checkFields(apiName, nodeName, fields)){
                            cov.core.error( "fields given doesn't respect the node [" + nodeName + "] from the api [" + apiName + "]");
                            return false
                        }
                        if (typeof id !== "undefined"){
                            if (typeof id !== "string" && typeof id !== "number"){
                                cov.core.error( "id must of of type string or number, " + (typeof id) + " given");
                                return false;
                            }
                            url = nodeName + "/" + id + "?http=false&fields=" + fields;
                        }else{
                            url = nodeName + "?http=false&fields=" + fields;
                        }
                        cov.api.client.intern.network.getE( apiName, url, callback);
                    },
                    responseHandler: function(){
                        if (this.readyState === 4){
                            if (this.status === 200){
                                let json = JSON.parse(this.responseText);
                                if (cov.api.client.intern.network.checkResponse(json)){
                                    cov.core.log( "response from [" + this.data.apiName + "]");
                                    this.data.callback( json.response);
                                }else{
                                    cov.core.error( "communication with api [" + this.data.apiName + "] server gave an unexpected error : " + this.status, json);
                                }
                            }else{
                                cov.core.error( "communication with api [" + this.data.apiName + "] server gave an unexpected error : " + this.status, this.responseText);
                            }
                        }
                    }
                },
                addError: function(apiName, error){
                    if (typeof apiName !== "string" || typeof error !== "string"){
                        cov.core.error( "error, apiName and error must be of type string");
                        return;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        cov.core.error( "api [" + apiName + "] doesn't exist");
                        return;
                    }
                    cov.core.log( "adding error in [" + apiName + "]");
                    cov.api.client.intern.apis[apiName].errors[cov.api.client.intern.apis[apiName].errors.length] = error;
                    cov.api.client.intern.apis[apiName].valid = false;
                },
                checkFields: function(apiName,nodeName,fields){
                    let errors, field;
                    if (!cov.utils.checkType( "apiName", apiName, "string") ||
                        !cov.utils.checkType( "nodeName", nodeName, "string") ||
                        !cov.utils.checkType( "fields", fields, "string")
                    ){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        cov.core.error( "api [" + apiName + "] unknown");
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName] === "undefined"){
                        cov.core.error( "node [" + nodeName +"] unknown in api [" + apiName + "]");
                        return false;
                    }
                    field = {
                        name: 'main',
                        subFields: cov.api.client.intern.fields.parse( fields)
                    };

                    if (field.subFields == null){
                        cov.core.error( "error while parsing fields");
                        return false;
                    }
                    errors = [];
                    cov.core.log( "checking fields for node [" + nodeName + "] in api [" + apiName + "]");
                    field.subFields.forEach( function(value){
                        if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName].fields[value.name] === "undefined"){
                            this[this.length] = "field [" + value.name + "] doesn't exist in node [" + nodeName + "] in api [ " + apiName + "]";
                        }else if (value.subFields.length > 0){
                            if (cov.api.client.intern.isSubType( apiName, nodeName, value.name)){



                            }else{
                                this[this.length] = "field [" + value.name +"] in node [ " + nodeName + "] in api [" + apiName + "] has no subFields";
                            }
                        }else if (cov.api.client.intern.isSubType( apiName, nodeName, value.name)){
                            this[this.length] = "field [" + value.name +"] in node [ " + nodeName + "] in api [" + apiName + "] has subFields, but none given";
                        }
                    }, errors);
                    if (errors.length > 0){
                        cov.core.error( "unknown fields :");
                        cov.core.error( errors);
                        return false;
                    }

                    return true;
                },
                isSubType: function(apiName,nodeName,fieldName){
                    let type;
                    if (!cov.utils.checkType( "apiName", apiName, "string") ||
                        !cov.utils.checkType( "nodeName", nodeName, "string") ||
                        !cov.utils.checkType( "fieldName", fieldName, "string")
                    ){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        cov.core.error( "api [" + apiName + "] unknown");
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName] === "undefined"){
                        cov.core.error( "node [" + nodeName +"] unknown in api [" + apiName + "]");
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName] === "undefined"){
                        cov.core.error( "field [" + fieldName + "] unkown in node [" + nodeName + "] in api [" + apiName + "]" );
                        return false;
                    }
                    cov.core.log( "isSubType(" + apiName + "," + nodeName + "," + fieldName + ")");
                    type = cov.api.client.intern.apis[apiName].nodes[nodeName].fields[fieldName].type;
                    if (type.substr(-2) === "[]"){
                        type = type.substr(0, type.length - 2);
                    }
                    return (typeof cov.api.client.intern.apis[apiName].nodes[type] !== "undefined" || typeof cov.api.client.intern.apis[apiName].types[type] !== "undefined");
                },
                typeExists: function(apiName,type){
                    if (typeof apiName !== "string" || typeof type !== "string"){
                        return false;
                    }
                    if (typeof cov.api.client.intern.apis[apiName] === "undefined"){
                        return false;
                    }
                    if (type.substr(-2) === "[]"){
                        type = type.substr(0, type.length - 2);
                    }
                    cov.core.log( "checking type in api [" + apiName + "]");
                    if (cov.api.client.intern.types.includes(type)){
                        return true;
                    }
                    return (typeof cov.api.client.intern.apis[apiName].nodes[type] !== "undefined" || typeof cov.api.client.intern.apis[apiName].types[type] !== "undefined");
                }
            },
            node:{
                get: function(apiName,nodeName,id,callback,fields){
                    return cov.api.client.intern.network.getN(apiName,nodeName,callback,fields,id);
                },
                getAll: function(apiName,nodeName,callback,fields){
                    return cov.api.client.intern.network.getN( apiName, nodeName, callback, fields);
                }
            }
        }
    },
    utils:{
        data:{
            get: function(key){
                if (typeof Storage !== "undefined"){
                    let a = localStorage.getItem( "CoV_Store[" + btoa(key) + "]");
                    return a === null ? null : atob(a);
                }
            },
            set: function(key,value){
                if (typeof Storage !== "undefined"){
                    localStorage.setItem( "CoV_Store[" + btoa(key) + "]", btoa(value));
                }
            },
            remove: function(key){
                if (typeof Storage !== "undefined"){
                    localStorage.removeItem( "CoV_Store[" + btoa(key) + "]");
                }
            }
        },
        checkType: function (name,variable,type){
            if (typeof variable !== type){
                cov.core.error( name + " must be of type " + type + ", " + (typeof variable) + " given");
                return false;
            }
            return true;
        }
    }
};