/**
 * Controle de usuários conectados
 */
var users = (function () {
    var users = {};
    return {
        isConnected : function (nick) {
            if(users[nick]) {
                return true;
            }
            else {
                return false;
            }
        },

        connect : function (nick) {
            users[nick] = true;
        },

        disconnect : function (nick) {
            delete users[nick];
        },

        getConnectedUsers : function () {
            return users;
        }
    }

})();
/**
 * Servidor trata das requisições e respostas
 */
var chatApp = (function () {
    var server, io, sHandler, pHandler, userList, emitMessage, registerUser,
      unregisterUser, messageIsValid;
    /**
     * Trata das requisições ao servidor
     */
    sHandler = function (req, res) {
        res.writeHead(200, {"Content-Type" : "text/plain"});
        res.end();
    }
    /**
     * Envia a mensagem a todos os clientes conectados
     */
    emitMessage = function (socket, data) {
        var msg;

        msg = data.user + ": "+data.text;
        io.sockets.in("main-room").emit("news", data);
        console.log(new Date(), ": chatAppServer: new message: emited: "+msg);
    }
    /**
     * Registra o usuário no servidor
     */
    registerUser = function (socket, nick, callback) {
        if(userList.isConnected(nick) || nick == "sys") {
            callback(false);
        }
        else {
            userList.connect(nick);
            socket.join("main-room");
            callback(true);
            console.log(new Date, "User: "+nick+" connected");
            emitMessage(socket, {"user":"sys", "date":new Date(),"text":nick+" entrou no chat!"});
            io.sockets.in("main-room").emit("users", users.getConnectedUsers());
        }
    }
    /**
     * Remove o usuário
     */
    unregisterUser = function (socket, nick) {
        userList.disconnect(nick);
        emitMessage(socket, {"user":"sys", "date":new Date(),"text":nick+" saiu do chat! :("});
        socket.leave("main-room");
        io.sockets.in("main-room").emit("users", users.getConnectedUsers());
    }
    /**
     * Verifica se a mensagem enviada pelo cliente é valida
     *   a mensagem deve ser do tipo "object"
     */
    messageIsValid = function (data) {
        if(typeof data === "object") {
            return true;
        } else {
            console.log(new Date(), ": chatAppServer: O Cliente enviou uma nova"
              +" mensagem no formato incorreto");
            return false;
        }
    }
    /**
     * Trata das mensagens emitidas pelo cliente
     */
    pHandler = function(socket) {
        socket.on("new-message", function (data) {
            if(messageIsValid(data)) {
                emitMessage (socket, data);
            }
        });
        socket.on("user-connected", function (nick, callback) {
            registerUser(socket, nick, callback);
        });
        socket.on("user-disconnected", function (nick) {
            unregisterUser(socket, nick);
        });
    }
    return {
        init : function () {
            server    = require("http").createServer(sHandler);
            io        = require("socket.io").listen(server);
            userList  = users;
            io.sockets.on("connection", pHandler);
            server.listen(8080);

            console.log(new Date(), ": chatAppServer: Started. Listening on "
              +"port 8080");
        }
    }
})();
chatApp.init();