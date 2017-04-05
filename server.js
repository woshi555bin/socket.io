/**
 * http 响应页面和样式
 * websocket用来收发消息
 **/
let express = require('express');
let path = require('path');
let Message = require('./model').Message;
let app = express();
//把public目录作为静态文件根目录
app.use(express.static(path.join(__dirname,'public')));
app.get('/',function(req,res){
  res.sendFile(path.resolve('./index.html'))
    console.log(path.resolve('./index.html'))
});
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sockets = {};
io.on('connection',function(socket){
  //缓存此用户的用户名 每个客户端都有一份
   let username;
   let currentRoom;
   //服务器监听此客户端发过来的消息
   socket.on('message',function(msg){
     //如果用户名已经赋过值了
     if(username){
       // @李四 xxxx
       var regex = /^@([^ ]+) (.+)/;
       var result = msg.match(regex);
       if(result){//如果匹配上就是私聊
          var toUser = result[1];//取得私聊对方的用户名
          var content = result[2];//取得私聊的内容
          var toSocket = sockets[toUser];
          //如果能从sockets中取得对方的socket对象
          if(toSocket){
            toSocket.send({
              username,content:content,createAt:new Date().toLocaleString()});
          }else{
            socket.send({
              username:'系统',content:'你要私聊的对象不在线',createAt:new Date().toLocaleString()});
          }
       }else{
         let message = {
           username,content:msg,createAt:new Date().toLocaleString()};
         Message.create(message,function(err,message){
           if(currentRoom){
             //向某个房间内广播
             io.in(currentRoom).emit('message',message);
           }else{
             //向所有客户端广播
             io.emit('message',message);
           }

         });
       }
     }else{
       //把这个用户的第一次消息当作用户名
       username = msg;
       //让用户名和socket对象建立关联
       sockets[username] = socket;
       //服务器进行广播，用户名为系统，内容，消息的发布时间
       io.emit('message',{username:'系统',content:`欢迎${username}加入聊天室`,createAt:new Date().toLocaleString()});
     }
   });
   //监听客户端发送的获取历史消息事件
   socket.on('getAllMessages',function(){
     //查询所有数据，按创建时间倒序排列，取前10条
     Message.find().sort({createAt:-1}).limit(10).exec(function(err,messages){
        //再对数组进行倒序
        messages.reverse();
        //向此请求的某个客户端发回消息数组
        socket.emit('allMessages',messages);
       socket.send({
         username:'系统',content:'请输入用户名',createAt:new Date().toLocaleString()});
     });
   });
   //监听客户端想加入房间的事件
   socket.on('join',function(roomName){
      if(currentRoom){
        socket.leave(currentRoom);
      }
      socket.join(roomName);
     currentRoom = roomName
   });
   // socket.on('disconnect',function(){
   //   console.log('disconnect');
   //   delete sockets[username];
   // });
   socket.on('delete',function(id){
      Message.remove({_id:id},function(err,result){
        io.emit('deleted',id);
      });
   });
});
server.listen(9000);

/**
 * 1.实现匿名聊天
 *    1. 给按钮绑定点击事件
 *    2. 当用户点击按钮的时候，取得输入内容，并发送给服务器
 *    3. 服务器收到客户端的消息后广播给所有的用户
 *    4. 所有的用户收到消息后要把此消息添加到列表中
 * 2.具名聊天
 *    1. 当用户第一次的访问的时候，服务器端提醒用户输入用户名
 *    2. 用户的第一次输入内容会被服务器当成他的用户名
 *    3. 以后用户再次发送聊天内容的话会认为是此用户发的消息
 *
 */

