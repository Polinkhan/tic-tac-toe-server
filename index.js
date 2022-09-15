const { Server } = require("socket.io");
let port = process.env.PORT || 8000;
const io = new Server(port, { cors: { origin: "*" } });

let inputMatrix = [
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
];

const Data = {
  Users: {},
  inGameUserId: [],
  inGameUser: {},
  spectingUserId: [],
  spectingUser: {},
};

const Default = { mark: null, clickable: false, point: 0 };

const setFalsyValue = () => {
  const randBool = Math.random() < 0.5;
  Data.inGameUser[Data.inGameUserId[0]].clickable = randBool;
  Data.inGameUser[Data.inGameUserId[0]].mark = "X";
  Data.inGameUser[Data.inGameUserId[1]].clickable = !randBool;
  Data.inGameUser[Data.inGameUserId[1]].mark = "O";
};

const setEmptyMatrix = () => {
  inputMatrix = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
};

const deleteUser = (id) => {
  delete Data.Users[id];
  if (Data.inGameUser[id]) {
    delete Data.inGameUser[id];
    const inGameUserId = Data.inGameUserId.filter((uid) => uid !== id);
    Data.inGameUserId = inGameUserId;
    if (Data.inGameUserId.length !== 0) Data.inGameUser[Data.inGameUserId[0]] = { ...Default };
    setEmptyMatrix();
  }
  if (Data.spectingUser[id]) {
    delete Data.spectingUser[id];
    const spectingUserId = Data.spectingUserId.filter((uid) => uid !== id);
    Data.spectingUserId = spectingUserId;
  }
};

const entryNewUser = (id) => {
  if (Data.inGameUserId.length < 2) {
    Data.inGameUserId.push(id);
    Data.inGameUser[id] = { ...Default };
    if (Data.inGameUserId.length === 2) setFalsyValue();
  } else {
    Data.spectingUserId.push(id);
    Data.spectingUser[id] = { ...Default };
  }
};

const whoWin = () => {
  if (inputMatrix[0][0] && inputMatrix[0][1] && inputMatrix[0][2] && inputMatrix[0][0] === inputMatrix[0][1] && inputMatrix[0][0] === inputMatrix[0][2]) return inputMatrix[0][0];
  if (inputMatrix[1][0] && inputMatrix[1][1] && inputMatrix[1][2] && inputMatrix[1][0] === inputMatrix[1][1] && inputMatrix[1][0] === inputMatrix[1][2]) return inputMatrix[1][0];
  if (inputMatrix[2][0] && inputMatrix[2][1] && inputMatrix[2][2] && inputMatrix[2][0] === inputMatrix[2][1] && inputMatrix[2][0] === inputMatrix[2][2]) return inputMatrix[2][0];
  if (inputMatrix[0][0] && inputMatrix[1][0] && inputMatrix[2][0] && inputMatrix[0][0] === inputMatrix[1][0] && inputMatrix[0][0] === inputMatrix[2][0]) return inputMatrix[0][0];
  if (inputMatrix[0][1] && inputMatrix[1][1] && inputMatrix[2][1] && inputMatrix[0][1] === inputMatrix[1][1] && inputMatrix[0][1] === inputMatrix[2][1]) return inputMatrix[0][1];
  if (inputMatrix[0][2] && inputMatrix[1][2] && inputMatrix[2][2] && inputMatrix[0][2] === inputMatrix[1][2] && inputMatrix[0][2] === inputMatrix[2][2]) return inputMatrix[0][2];
  if (inputMatrix[0][0] && inputMatrix[1][1] && inputMatrix[2][2] && inputMatrix[0][0] === inputMatrix[1][1] && inputMatrix[0][0] === inputMatrix[2][2]) return inputMatrix[0][0];
  if (inputMatrix[0][2] && inputMatrix[1][1] && inputMatrix[2][0] && inputMatrix[0][2] === inputMatrix[1][1] && inputMatrix[0][2] === inputMatrix[2][0]) return inputMatrix[0][2];
};

io.on("connection", (socket) => {
  socket.on("requestCurrentData", () => {
    socket.emit("getCurrentData", inputMatrix, socket.id);
  });

  socket.on("requestJoin", (name) => {
    Data.Users[socket.id] = name;
    entryNewUser(socket.id);
    socket.broadcast.emit("updateData", Data);
    socket.emit("updateData", Data);
  });

  socket.on("requstJoinInGame", (id) => {
    delete Data.spectingUser[id];
    const spectingUserId = Data.spectingUserId.filter((uid) => uid !== id);
    Data.spectingUserId = spectingUserId;
    entryNewUser(id);
    socket.broadcast.emit("updateData", Data);
    socket.emit("updateData", Data);
  });

  socket.on("toggleUserClick", () => {
    Data.inGameUserId.map((id) => {
      Data.inGameUser[id].clickable = !Data.inGameUser[id].clickable;
      return 0;
    });
    socket.broadcast.emit("updateData", Data);
    socket.emit("updateData", Data);
  });

  socket.on("updateMatrix", (newMatrix) => {
    inputMatrix = [...newMatrix];
    const win = whoWin();
    // console.log(win);
    if (win) {
      const id = Data.inGameUserId.filter((id) => Data.inGameUser[id].mark === win);
      Data.inGameUser[id].point++;
      setFalsyValue();
      setEmptyMatrix();
      socket.emit("win", Data.Users[id]);
      socket.broadcast.emit("win");
      socket.emit("updateData", Data);
      socket.broadcast.emit("updateData", Data);
      socket.emit("getUpdateMatrix", inputMatrix);
    }
    socket.broadcast.emit("getUpdateMatrix", inputMatrix);
  });

  socket.on("disconnect", () => {
    deleteUser(socket.id);
    console.log(Data);
    socket.broadcast.emit("updateData", Data);
    socket.broadcast.emit("getUpdateMatrix", inputMatrix);
  });
});
