/**
 * View manipula o DOM
 */
 var chatAppView = (function () {
    var messageInput, messageList, appendToList, sendMessage, nickInput,
    disconnectBt, connectedUsersList, appendToConnectedUsersList, listBottom;
    /**
     * Coloca a mensagem na lista
     */
     appendToList = function (user, newMessage) {
        var nick = document.createElement("b");
        var newLine = document.createElement("li");

        nick.appendChild(document.createTextNode(user));
        newLine.appendChild(nick);
        newLine.appendChild(document.createTextNode(newMessage));
        messageList.appendChild(newLine);
        listBottom.scrollIntoView(true);
    };
    /**
     * Coloca o usuario conectado na lista de usuarios conectados
     *   no futuro pode se usar o appendToList acima
     */
     appendToConnectedUsersList = function (nick) {
        var newLine = document.createElement("li");
        var newConnectedUserNick = document.createTextNode(nick);

        newLine.appendChild(newConnectedUserNick);
        connectedUsersList.appendChild(newLine);
    };
    return {
        init : function () {
            messageInput = document.getElementById("newMessage");
            messageList  = document.getElementById("message-list");
            nickInput    = document.getElementById("newNick");
            disconnectBt = document.getElementById("disconnect");
            connectedUsersList = document.getElementById("connected-users");
            listBottom = document.getElementById("message-list-bottom");
        },
        /**
         * Limpa o input
         */
        clearInput : function () {
            messageInput.value = "";
        },

        clearNick : function () {
            nickInput.value = "";
        },

        hideNickInput : function () {
            nickInput.className = "hidden";
        },

        showNickInput : function () {
            nickInput.className = "visible";
        },

        hideMessageInput : function () {
            messageInput.className = "hidden";
        },

        showMessageInput : function () {
            messageInput.className = "visible";
        },

        showDisconnectBt : function () {
            disconnectBt.className = "visible";
        },

        hideDisconnectBt : function () {
            disconnectBt.className = "hidden";
        },

        clearConnectedUsersList : function () {
            connectedUsersList.innerHTML = "";
        },

        appendMessage : function (user, newMessage) {
            appendToList(user, newMessage);
        },

        appendUser : function (nick) {
            appendToConnectedUsersList(nick);
        },

        getMessageText : function () {
            return messageInput.value;
        },

        getMessageInput : function () {
            return messageInput;
        },

        getNickInput : function () {
            return nickInput;
        },

        getNickname : function () {
            return nickInput.value;
        },
        getDisconnectBt : function () {
            return disconnectBt;
        }
    };
})();
/**
 * Controle
 */
 var chatApp = (function () {

    var view, nick, socket, postMessage, updateChat, nickAvailable,
    serverUrl, registerNick, unregisterNick, nickNotAvailable,
    connect, disconnect, registerListeners, unregisterListeners;
    /**
     * Regista os listeners para os eventos
     */
    registerListeners = function () {
        view.getMessageInput().addEventListener("keyup", postMessage, false);
        view.getNickInput().addEventListener("keyup", registerNick, false);
        view.getDisconnectBt().addEventListener("click", unregisterNick, false);
    };
    /**
     * Conecta o socket ao servidor
     */
    connect = function () {
        socket = io.connect(serverUrl);
        socket.on("news", updateChat);
        socket.on("users", updateUsers);
    };
    /**
     * Disconecta do servidor
     */
    disconnect = function () {
        socket.disconnect();
    };
    /**
     * Envia a nova mensagem ao servidor
     */
    postMessage = function (event) {
        if (event.keyCode === 13 && view.getMessageText() !== "") {
                socket.emit("new-message", {
                    "user":nick,
                    "date":new Date(),
                    "text":view.getMessageText()
                });
                console.log("Emited new message");

                view.clearInput();
            }
        };
    /**
     * Atualiza a janela do chat com mensagens recebidas
     */
    updateChat = function (data) {
        var msg = "";

        if(data.user == "sys") {
            view.appendMessage("", data.text);
        } else {
            view.appendMessage(data.user+":", " "+data.text);
        }
        console.log("Recieved new message");
        console.log(data);
    };
    /**
     * Atualiza a lista de usuários conectados (não terminado)
     */
    updateUsers = function (users) {
        view.clearConnectedUsersList();
        for (var user in users) {
            view.appendUser(user);
        }
    };
    /**
     * Função que será executada se o nick estiver disponível
     */
    nickAvailable = function () {
        view.hideNickInput();
        view.showMessageInput();
        view.showDisconnectBt();
    };
    /**
     * Função que será executada se o nick não estiver disponível
     */
    nickNotAvailable = function () {
        view.appendMessage("","O nick desejado não está disponível");
    };
    /**
     * Registra o nick do usuário no servidor
     */
    registerNick = function (event) {
        nick = view.getNickname();
        if (event.keyCode === 13 && nick !== "") {
            socket.emit("user-connected", nick, function (available, userList) {
                if(available) {
                    nickAvailable();
                }
                else {
                    nickNotAvailable();
                }
            });
        }
    };
    /**
     * Disconecta o usuario
     */
    unregisterNick = function(event) {
        nick = view.getNickname();
        socket.emit("user-disconnected", nick);
        view.hideMessageInput();
        view.hideDisconnectBt();
        view.clearNick();
        view.clearInput();
        view.showNickInput();
        view.clearConnectedUsersList();
        //disconnect();/*TO-DO: Usar outra forma de terminar a app*/P
    };
    return {
        init : function () {
            nick = "";
            serverUrl = "http://localhost:8080";
            view = chatAppView;

            view.init();
            registerListeners();
            connect();
        }
    };
})();
window.onload = function () {
    chatApp.init();
};
