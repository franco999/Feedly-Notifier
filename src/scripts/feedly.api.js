"use strict";

var FeedlyApiClient = function (accessToken, useSecureConnection) {

    this.accessToken = accessToken;
    this.useSecureConnection = useSecureConnection;

    var apiUrl = "http://cloud.feedly.com/v3/";
    var secureApiUrl = "https://cloud.feedly.com/v3/";

    this.getMethodUrl = function (methodName, parameters, useSecureConnection) {
        if (methodName === undefined) {
            return "";
        }
        var methodUrl = (useSecureConnection ? secureApiUrl : apiUrl) + methodName;

        var queryString;
        if (parameters) {
            queryString = "?";
            for (var parameterName in parameters) {
                queryString += parameterName + "=" + parameters[parameterName] + "&";
            }
            queryString = queryString.replace(/&$/, "");
        }

        if (queryString) {
            methodUrl += queryString;
        }

        return methodUrl;
    };

    this.request = function (methodName, settings) {
        var url = this.getMethodUrl(methodName, settings.parameters, this.useSecureConnection);
        var verb = settings.method || "GET";

        // For bypassing the cache
        if (verb === "GET"){
            url += ((/\?/).test(url) ? "&" : "?") + "ck=" + (new Date()).getTime();
        }

        var request = new XMLHttpRequest();
        request.open(verb, url, true);

        if (this.accessToken) {
            request.setRequestHeader("Authorization", "OAuth " + this.accessToken);
        }

        request.onload = function (e) {
            var json;
            try {
                json = JSON.parse(e.target.response);
            } catch (exception) {
                json = {
                    parsingError: exception.message,
                    response: e.target.response
                }
            }
            if (json && !json.errorCode) {
                if (typeof settings.onSuccess === "function") {
                    settings.onSuccess(json);
                }
            } else if (json && json.errorCode === 401) {
                if (typeof settings.onAuthorizationRequired === "function") {
                    settings.onAuthorizationRequired(settings.accessToken);
                }
            } else {
                if (typeof settings.onError === "function") {
                    settings.onError(json);
                }
            }
        };

        var body;
        if (settings.body) {
            body = JSON.stringify(settings.body);
        }
        request.send(body);
    };
};