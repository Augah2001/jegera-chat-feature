"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express = require("express");
const client_1 = require("@prisma/client");
const cors = require("cors");
// import { Message } from "@prisma/client"
const prisma = new client_1.PrismaClient();
const app = express();
app.use(cors({
    origin: "http://localhost:3000"
}));
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});
io.on("connection", (socket) => {
    socket.on("joinChat", (myUsers) => {
        const users = [myUsers[0].id, myUsers[1].id];
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
            .then((messages) => {
            // console.log(messages);
            socket.emit("chatMessages", messages);
        })
            .catch((error) => {
            console.error("Error fetching chat messages:", error);
        });
        // console.log(users);
        const chatId = getChatId(users[0], users[1]);
        prisma.chat
            .findFirst({
            where: {
                id: chatId,
            },
        })
            .then((chat) => {
            if (!chat) {
                return prisma.chat
                    .create({ data: { id: chatId, users: { connect: [{ id: myUsers[0].id }, { id: myUsers[1].id }] } } })
                    .then((createdChat) => console.log(createdChat))
                    .catch((e) => console.log(e.message));
            }
            return;
        });
        // Fetch existing messages for the chat
        socket.join(chatId);
    });
    socket.on("message", (data) => {
        const { sender, receiver, body } = data;
        console.log(data);
        receiver;
        body;
        sender;
        prisma.chat
            .findFirst({
            where: { id: getChatId(sender, receiver) },
        })
            .then((chat) => {
            // console.log(chat);
        });
        const message = {
            senderId: sender,
            receiverId: receiver,
            body,
            chatId: getChatId(sender, receiver),
            sentByMe: true,
        };
        prisma.message
            .create({ data: message })
            .then(() => {
            io.to(getChatId(sender, receiver)).emit("message", message);
        })
            .catch((error) => {
            console.error("Error saving message:", error);
        });
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
function getChatId(user1, user2) {
    // Generate a unique ID for the chat by concatenating the user IDs
    return [user1, user2].sort().join("-");
}
server.listen(10000, () => {
    console.log(`Server listening`);
});
