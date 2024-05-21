import { createServer } from "http";
import { Socket} from "socket.io";
import * as  express from "express";
import { Chat, Message, PrismaClient } from "@prisma/client";
import * as cors from 'cors'

// import { Message } from "@prisma/client"

const prisma = new PrismaClient();

const app = express();
app.use(cors({
  origin: "http://localhost:3000"
}));
const server = createServer(app);

// type MessageType = {
//   body: string,
//   time: Date,
//   sentByMe: true
// }

interface User {
  id: number
}

import * as ios from 'socket.io'
const io = new ios.Server({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true
    },
})

  
  
// const io = new SocketIOServer(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   },
// });





io.on("connection", (socket: Socket) => {
 

  socket.on("joinChat", (myUsers: [User, User]) => {
    const users = [myUsers[0].id, myUsers[1].id]

    console.log(myUsers)
    prisma.message
      .findMany<Message>({
        where: {
          OR: [
            { senderId: users[0], receiverId: users[1] },
            { senderId: users[1], receiverId: users[0] },
          ],
        },
        orderBy: { time: "asc" }, // Sort messages chronologically
      })
      .then((messages: Message) => {
        // console.log(messages);
        socket.emit("chatMessages", messages );
      })
      .catch((error: Error) => {
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
            .create<Chat>({ data: { id: chatId, users: {connect: [{id: myUsers[0].id}, {id: myUsers[1].id}]} } })
            .then((createdChat) => console.log(createdChat))
            .catch((e: Error) => console.log(e.message));
        }
        return; 
      });

    // Fetch existing messages for the chat

    socket.join(chatId);
  });

  socket.on("message", (data) => {
    const { sender, receiver, body } = data;
    console.log(data)
    receiver
    body
    sender
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
      .create<Message>({ data: message })
      .then(() => {
        io.to(getChatId(sender, receiver)).emit("message", message);
        
      })
      .catch((error: Error) => {
        console.error("Error saving message:", error);
      });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

function getChatId(user1: number, user2: number) {
  // Generate a unique ID for the chat by concatenating the user IDs
  return [user1, user2].sort().join("-");
}

server.listen(10000, () => {
  console.log(`Server listening`);
});
