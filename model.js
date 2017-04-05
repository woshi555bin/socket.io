let mongoose = require('mongoose');
mongoose.Promise = Promise;
//连接数据库
mongoose.connect('mongodb://127.0.0.1/chat');
//定义模型骨架
let MessageSchema = new mongoose.Schema({
  username:String,
  content:String,
  createAt:{type:Date,default:Date.now}
});
//定义并导出模型
exports.Message = mongoose.model('Message',MessageSchema);
