var express = require('express');
var WebSocketServer = require('ws').Server;
var app = express();
app.use(express.static('public'));
 
var server = app.listen(8000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});

var wss = new WebSocketServer({port: 8001});

var mClientList = [];
var mClientListChangeHandler = {
    get: function (target, property) {
        return target[property];
    },
    set: function (target, property, value, receiver) {
        target[property] = value;
        broadcast({
            type: "update.clients",
            data: target.map(v => { return {username: v.username, room: v.room}})
        }, mClientList);
        return true;
    }
};

var clientList = new Proxy(mClientList, mClientListChangeHandler);

 wss.on('connection', function (connection) {
    var clientIndex = -1;
    connection.on('message', function (messageText) {
        var message = JSON.parse(messageText);
        if(message.type === "auth") {
            clientIndex = clientList.push({username: message.username, room: message.room, connection: connection}) - 1;
            console.log("Client connected: " + message.username);
        }
        else if(clientIndex !== -1) {
            if(message.type === "message" && clientList[clientIndex].room !== null) {
                broadcast(message.data, clientList.filter( (v, i) => {
                    return v.username === message.recepient && v.room === clientList[clientIndex].room; 
                }));
            }
            else if(message.type === "broadcast" && clientList[clientIndex].room !== null) {
                broadcast(message.data, clientList.filter( (v, i) => {
                    return v.room === clientList[clientIndex].room && i !== clientIndex; 
                }));
            }
        }
    });
    connection.on('close', function () {
        clientList.splice(clientIndex, 1);
        broadcast({
            tag: "update.clients",
            data: clientList.map(v => { return {username: v.username, room: v.room}})
        }, clientList);
    });
 });

 function broadcast(message, receivers) {
     console.log(receivers);
    for(var i=0; i < receivers.length; i++) {
        if(receivers[i].connection)
            receivers[i].connection.send(JSON.stringify(message));
    }
 }