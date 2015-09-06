var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 3000;
server.listen(port);

var roomEntryUsers = {}
io.on('connection', function(socket){
  console.log('a user connected');

  var isMaster = false;
  var room = null;
  socket.on('master enter', function(entry) {
    isMaster = true;
    room = entry.room

    socket.join(room)
    console.log('master enter: id:' + socket.id + ' room:' + room);
  });

  socket.on('enter', function(entry) {
    room = entry.room
    socket.join(room)

    entryUsers = roomEntryUsers[room] || {}
    entryUsers[socket.id] = entry.name;

    socket.to(room).emit('entered', {
      count: Object.keys(entryUsers).length,
      users: entryUsers
    });

    roomEntryUsers[room] = entryUsers
    console.log('entry: id:' + socket.id + ' room:' + room + ' name:'+ entry.name);
  });

  socket.on('transition', function(data) {
    socket.broadcast.emit('change route', data);
    console.log('transition: id:' + socket.id + ' room:' + room);
  });

  socket.on('showAnswer', function(data) {
    socket.emit('showAnswer', data);
    socket.broadcast.emit('showAnswer', data);
    console.log('showAnswer: id:' + socket.id + ' room:' + room);
  });

  socket.on('chat message', function(msg) {
    console.log('message: ' + msg);
    // 送った人含めて全員へ
    io.emit('chat message by io.emit: ', msg);

    // 送った人のみ
    socket.emit('chat message by socket.emit: ', msg);
    // 送った人以外
    socket.broadcast.emit('chat message by broadcast: ', msg);

    // 送った人以外
    socket.broadcast.to('room').emit('chat message by broadcast:room ', msg);
  });

  socket.on('disconnect', function() {
    console.log('disconnect');

    entryUsers = roomEntryUsers[room] || {}
    delete entryUsers[socket.id];
    roomEntryUsers[room] = entryUsers

    socket.to(room).emit('entered', {
      count: Object.keys(entryUsers).length,
      users: entryUsers
    });
  });
});
