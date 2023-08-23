const mongoose = require("mongoose");
const Document = require("./Document");

mongoose
  .connect("mongodb://localhost/google-docs-replica")
  .then(() => console.log("Connected!"));

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (docId) => {
    const doc = await findDocument(docId);
    socket.join(docId);
    socket.emit("load-documents", doc.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(docId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(docId, { data });
    });
  });

  // console.log("connected");
});

async function findDocument(id) {
  if (id == null) return;
  const doc = await Document.findById(id);
  if (doc) return doc;
  return await Document.create({ _id: id, data: defaultValue });
}
