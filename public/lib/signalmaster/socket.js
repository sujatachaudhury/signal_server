var ClientSocket = function (url) {
    this.url = url;
    this.connection = null;
    this.handlers = {onOpen: null, onMessage: null, onError: null, onClose: null};
    var WebSocket = window.WebSocket || window.MozWebSocket;
    if(!WebSocket)
        throw new Error("This browser does not support Web Sockets. Please update or switch browsers.");
    else
        this.connection = new WebSocket(this.url);
    this.send = function(data = {}) {
        var dataJSON = JSON.stringify(data);
        this.connection.send(dataJSON);
    };

    this.setHandlers = function({onOpen = null, onMessage = null, onError = null, onClose = null}) {
        this.handlers = {onOpen: onOpen, onMessage: onMessage, onError: onError, onClose: onClose};
        this.connection.onopen = onOpen;
        this.connection.onmessage = onMessage;
        this.connection.onerror = onError;
        this.connection.onclose = onClose;
    };
    this.refresh = function () {
        if(!WebSocket)
            throw new Error("This browser does not support Web Sockets. Please update or switch browsers.");
        else
        {
            this.connection = new WebSocket(this.url);
            this.setHandlers(this.handlers);
        }
    };
};

var SignalSocket = function (url) {
    var socket = new ClientSocket(url);
    var appContext = this;
    this.connection = {username: null, room: null, connected: false, authenticated: false};
    var mCallbacks = {};
    socket.setHandlers({
        onOpen: function() {
            appContext.connection.connected = true;
        },
        onClose: function() {
            appContext.connection.connected = false;
            appContext.connection.authenticated = false;
        },
        onMessage: function (messageEvent) {
            var message = JSON.parse(messageEvent.data);
            if(mCallbacks.hasOwnProperty(message.type))
                for(var i=0; i < mCallbacks[message.type].length; i++)
                    mCallbacks[message.type][i](message);
        },
        onError: function(e) {
            throw new Error(e);
        }
    });
	this.connect = function (username, room) {
		socket.send({
			type: "auth",
			username: username,
			room: room
        });
        appContext.connection.authenticated = true;
    };
    this.setCallback = function (type, callback) {
        if(mCallbacks.hasOwnProperty(type))
            mCallbacks[type].push(callback);
        else
            mCallbacks[type] = [ callback ];
    };
	this.refresh = function () {
		socket.refresh();
	};
	this.send = function (message) {
		socket.send(message);
	};
};