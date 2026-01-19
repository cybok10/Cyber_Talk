module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a specific chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Handle new messages
    socket.on('message', (data) => {
      // Broadcast to everyone in the room except sender (sender adds locally)
      socket.to(data.roomId).emit('message', data);
    });

    // Handle reactions
    socket.on('reaction', (data) => {
      socket.to(data.roomId).emit('reaction', data);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('typing', data);
    });
    
    // Handle soft deletion of messages
    socket.on('delete', (data) => {
      socket.to(data.roomId).emit('delete', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};