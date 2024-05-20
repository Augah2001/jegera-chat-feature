"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var express_1 = require("express");
var client_1 = require("@prisma/client");
// import { Message } from "@prisma/client"
var prisma = new client_1.PrismaClient();
var app = express_1();
var server = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
var PORT = 8000;
io.on("connection", function (socket) {
    socket.on("joinChat", function (myUsers) {
        var users = [myUsers[0].id, myUsers[1].id];
        console.log(myUsers);
        prisma.message
            .findMany({
            where: {
                OR: [
                    { senderId: users[0], receiverId: users[1] },
                    { senderId: users[1], receiverId: users[0] },
                ],
            },
            orderBy: { time: "asc" }, // Sort messages chronologically
        })
            .then(function (messages) {
            // console.log(messages);
            socket.emit("chatMessages", messages);
        })
            .catch(function (error) {
            console.error("Error fetching chat messages:", error);
        });
        // console.log(users);
        var chatId = getChatId(users[0], users[1]);
        prisma.chat
            .findFirst({
            where: {
                id: chatId,
            },
        })
            .then(function (chat) {
            if (!chat) {
                return prisma.chat
                    .create({ data: { id: chatId, users: { connect: [{ id: myUsers[0].id }, { id: myUsers[1].id }] } } })
                    .then(function (createdChat) { return console.log(createdChat); })
                    .catch(function (e) { return console.log(e.message); });
            }
            return;
        });
        // Fetch existing messages for the chat
        socket.join(chatId);
    });
    socket.on("message", function (data) {
        var sender = data.sender, receiver = data.receiver, body = data.body;
        console.log(data);
        receiver;
        body;
        sender;
        prisma.chat
            .findFirst({
            where: { id: getChatId(sender, receiver) },
        })
            .then(function (chat) {
            // console.log(chat);
        });
        var message = {
            senderId: sender,
            receiverId: receiver,
            body: body,
            chatId: getChatId(sender, receiver),
            sentByMe: true,
        };
        prisma.message
            .create({ data: message })
            .then(function () {
            io.to(getChatId(sender, receiver)).emit("message", message);
        })
            .catch(function (error) {
            console.error("Error saving message:", error);
        });
    });
    socket.on("disconnect", function () {
        console.log("Client disconnected:", socket.id);
    });
});
function getChatId(user1, user2) {
    // Generate a unique ID for the chat by concatenating the user IDs
    return [user1, user2].sort().join("-");
}
server.listen(PORT, function () {
    console.log("Server listening on port ".concat(PORT));
});
