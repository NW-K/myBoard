//업데이트 시험용 ㅋ

var express = require('express')
	, http = require('http')
	, path = require('path');
var bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, static = require('serve-static')
	// , errorHandler = require('errorhandler');
var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');
var ejs = require('ejs');
// var mongoose = require('mongoose');
var database;
// var UserSchema, UserModel;

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/public', static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(expressSession({
		secret : 'my key',
		resave : true,
		saveUninitialized : true
}));

var MongoClient = require('mongodb').MongoClient;
var myDB, dbcollection, URL,finder;




function connectDB(){
	
	console.log('데이터베이스 연결을 시도');
	URL = 'mongodb://localhost:27017/create';
	MongoClient.connect(URL, function(err, db){
		if(err){
			console.log(err);
		} else {
			myDB = db.db('create');
			dbcollection = myDB.collection('users');
			console.log('데이터베이스에 연결되었습니다');
		}
		finder = dbcollection.find();
	})
}


//---------------------------게시글 추가 설정 ----------------------------------------
var createContent = function(db,content, writer, title, date, callback){
	console.log('createContent 호출됨 ,' + content + '/' + writer + '/' + title + '/' + date);

	var user = {"content": content, "writer": writer, "title":title, "date":date };
	dbcollection.insertOne(user, function(err){
		if(err) {
			callback(err,null);
			return;
		}
		console.log("게시글 하나 추가함");
		callback(null, user);
		return;
	})
}



var LetsUpdate = function(db, content, writer, title, date, queryId, callback){
	console.log('LetsUpdate 함수 호출됨' + content + '/' + writer + '/' + title + '/' + date);

	var user = {"content": content, "writer":  writer, "title": title, "date": date};
	// update:{$set: {"content": content, "writer":  writer, "title": title, "date": date}}},
	console.log(queryId)
	dbcollection.updateOne({"date": queryId },{$set:user},function(err){
		if(err){
			console.log('수정중 오류');
			callback(err, null);
			return;
		}
		console.log('수정???');
		callback(null, dbcollection);
	})
}


//--------------------------------------- 글쓰기 창 ---------------------------------------------------
app.post('/process/create', function(req, res){
	console.log('/process/create 호출됨');
	var paramContent = req.body.content;
	var paramWriter = req.body.writer;
	var paramTitle = req.body.title;
	var paramDate = Number(new Date());

	MongoClient.connect(URL, function(err, db){
		if(db){
			createContent(db, paramContent, paramWriter, paramTitle, paramDate, function(err,result){
				if(err){throw err;}

				if(result){
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<h2> 게시글 추가 성공 </h2>');
					res.write('content:'+paramContent+'<br>writer:' + paramWriter + '<br>title:'+paramTitle+'<br>Date:' + paramDate);
					res.write('<form action="/" method="post">');
					res.write('   <input type="submit" value="게시판으로">')
					res.write('</form>');

					res.write('<a href="/public/write.html">');
					res.write('   <input type="submit" value="새로쓰기">')
					res.write('</a>');

					res.write('<a href="/process/update/?id=' + paramDate + '">');
					res.write('   <input type="submit" value="수정하기">')
					res.write('</a>');

					res.write('<a href="/delete/?id=' + paramDate + '">');
					res.write('   <input type="submit" value="삭제하기">')
					res.write('</a>');
					res.end();
				} else {
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<h2> 글쓰기 실패 </h2>');
					res.end();
				}
			})
		} else {
			res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
			res.write('데이터베이스에 연결하지 못했다');
			res.end();
		}
	})
});



//---------------------------------------------홈페이지(게시판)--------------------------------------------------
app.get('/', function(req, res){
	console.log('/ 호출됨');

	MongoClient.connect(URL, function(err, db){
		dbcollection.find({}).toArray(function(err, results){
			if(err){
				console.error('게시판 조회 중 오류' + err.stack);
				return
			}
			if(results){
				res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
				res.write('<table border="1">');
				res.write('  <tr><th width="50px">No.</th><th width="500px">title</th><th width="100px">writer</th><th width="100px">date</th></tr>');

				for( var i = 0; i<results.length; i++){
					curContent = results[i].content;
					curWriter = results[i].writer;
					curTitle = results[i].title;
					curDate = results[i].date;
					
					
					res.write('  <tr><td>' + i + '</td><td><a href="/contents/?id='+ curDate +'">'+ curTitle +'<a></td><td>'+curWriter+'</td><td>'+curDate+'</td></tr>');
				}

				res.write('</table>');
				res.write('<a href="/public/write.html">');
				res.write('   <input type="submit" value="글쓰기">')
				res.write('</a>');
				

				res.write('<div>');
				res.write('  <ul style="width: 900px; justify-content:center; list-style: none; text-decoration:none; display:flex; flex-direction: row;">')
				var maxPage = parseInt(i/3);
				var offset = 3;

				for ( j = 0; j <= maxPage; j++ ){
					
					res.write('     <li>[<b><a href="/process/board/?page='+ j +'">'+ j +'</a></b>]</li>')
					// if(j <= offset || j > maxPage-offset || (j >= page-(offset-1) && j <= page + (offset-1))){
						// if(j != page){ 	
						// 	res.write('<li> [<a href="/posts?page=' + j + '">j </a>] </li>') 
						// } else { 	
							
						// } 	
					// }
					if (j > j + offset) {
						res.write('    <li>....</li>')
					}
				}
				res.write('</ul>')
				res.write('</div>') 
				res.end();
			} else {
				res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
				res.write('글쓰기 리스트 조회 실패');
				res.end();
			}
		});
	});
}); 
app.post('/', function(req, res){
	console.log('/ 호출됨');

	MongoClient.connect(URL, function(err, db){
		dbcollection.find({}).toArray(function(err, results){
			if(err){
				console.error('게시판 조회 중 오류' + err.stack);
				return
			}
			if(results){
				res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
				res.write('<table border="1">');
				res.write('  <tr><th width="50px">No.</th><th width="500px">title</th><th width="100px">writer</th><th width="100px">date</th></tr>');

				for( var i = 0; i<results.length; i++){
					var curContent = results[i].content;
					var curWriter = results[i].writer;
					var curTitle = results[i].title;
					var curDate = results[i].date;
					
					
					res.write('  <tr><td>' + i + '</td><td><a href="/contents/?id='+ curDate +'">'+ curTitle +'<a></td><td>'+curWriter+'</td><td>'+curDate+'</td></tr>');
				}

				res.write('</table>');
				res.write('<a href="/public/write.html">');
				res.write('   <input type="submit" value="글쓰기">')
				res.write('</a>');
				

				res.write('<div>');
				res.write('  <ul style="width: 900px; justify-content:center; list-style: none; text-decoration:none; display:flex; flex-direction: row;">')
				var maxPage = parseInt(i/3);
				var offset = 3;

				for ( j = 0; j <= maxPage; j++ ){
					
					res.write('     <li>[<b><a href="/?page='+ j +'">'+ j +'</a></b>]</li>')
					// if(j <= offset || j > maxPage-offset || (j >= page-(offset-1) && j <= page + (offset-1))){
						// if(j != page){ 	
						// 	res.write('<li> [<a href="/posts?page=' + j + '">j </a>] </li>') 
						// } else { 	
							
						// } 	
					// }
					if (j > j + offset) {
						res.write('    <li>....</li>')
					}
				}
				res.write('</ul>')
				res.write('</div>') 
				res.end();
			} else {
				res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
				res.write('글쓰기 리스트 조회 실패');
				res.end();
			}
		});
	});
}); 


// // app.get('/', function(req,res){
// // 	var page = req.query.page;
// // })





//------------------------------------컨텐츠 조회 창 ------------------------------------------

app.get('/contents/', function(req,res){
	var queryId = Number(req.query.id);
	console.log('게시판에서 타이틀 클릭함');
	MongoClient.connect(URL, function(err, db){
			dbcollection.find({"date":queryId}).toArray(function(err, results){
				if(err){
					console.error('컨텐츠 조회 중 오류' + err.stack);
					return
				}
				if(results){
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<table border="1">');
					res.write('  <tr><th>No.</th><td>' + results[0].date + '</td><th>작성자</th><td>' + results[0].writer + '</td></tr>');
					res.write('  <tr><th>title</th><td colspan="3">'+ results[0].title +'</td></tr>')
					res.write('  <tr height="300px"><th>Content</th><td colspan="3">'+ results[0].content +'</td></tr>');
					res.write('</table>');

					res.write('<a href="/public/write.html">');
					res.write('   <input type="submit" value="글쓰기">')
					res.write('</a>');

					res.write('<a href="/process/update/?id=' + queryId + '">');
					res.write('   <input type="submit" value="수정하기">')
					res.write('</a>');

					res.write('<a href="/delete/?id=' + queryId + '">');
					res.write('   <input type="submit" value="삭제하기">')
					res.write('</a>');
					
					
					res.end();
					} else {
						res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
						res.write('글쓰기 리스트 조회 실패');
						res.end();
					}
			});

	});
});

//---------------------------------------- 삭제 창 -----------------------------------

app.get('/delete/', function(req,res){
	var queryId = Number(req.query.id);
	console.log(queryId)
	
	MongoClient.connect(URL, function(err,db){
		if(err){console.log('delete err' + err.stack)}
		if(db){
			dbcollection.deleteOne({"date": queryId}, function(err, result){
				if(err){console.log('deleteone err')};
				if(result){
					console.log('게시글 삭제함');
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<h1>게시글이 삭제되었습니다<h1>');
					res.write('<a href="/">');
					res.write('	<input type="submit" value="홈으로">');
					res.write('</a>');
					res.end();
				} else {
					console.log('게시글 삭제 실패');
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<h1>게시글을 삭제하지 못했습니다<h1>');
					res.end();
				}
			});
		} else {
			console.log('데이터베이스에 연결하지 못했습니다');
			res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
			res.write('<h1>데이터베이스에 연결하지 못했습니다<h1>');
			res.end();
			
		}
	});
});




//---------------------------- 업데이트 창 ------------------------------------------
app.get('/process/update/', function(req,res){
	var queryId = Number(req.query.id);
	console.log('/process/update 로 접속함')
	MongoClient.connect(URL, function(err, db){
			dbcollection.find({"date":queryId}).toArray(function(err, results){
				if(err){
					console.error('컨텐츠 조회 중 오류' + err.stack);
					return
				}
				if(results){
					console.log('수정하는 창으로 접속함');
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<form action="/process/updated/?id='+queryId+'" method="post">');
					res.write('  <table border="1">')
					res.write('    <tr><th>No.</th><td>'+results[0].date+'</td></tr>')
					res.write('    <tr><th>작성자</th><td><input type="text" value="'+results[0].writer+'" name="writer" style="border:none;"></td></tr>')
					res.write('    <tr><th>title</th><td colspan="3"><input type="text" value="'+results[0].title+'" name="title" style="border:none;"></td></tr>')
					res.write('    <tr><th height="300px">Content</th><td colspan="3"><input type="text" value="'+results[0].content+'" name="content" style="border:none; height:300px;"></td></tr>');
					res.write('  </table>');
					res.write('  <a href="/process/updated/?id='+queryId+'">')
					res.write('    <input type="submit" value="확인">');
					res.write('  </a>')
					res.write('</form>');					
					res.end();
					// 
				} else {
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('글쓰기 리스트 조회 실패');
					res.end();
				}
			})
	});
});



//------------------------------ 업데이트 후 --------------------------------------------

app.post('/process/updated/', function(req, res){
	console.log('/process/updated 로 접속함');
	var queryId = Number(req.query.id)
	MongoClient.connect(URL, function(err, db){
		var nowContent = req.body.content;
		var nowWriter = req.body.writer;
		var nowTitle = req.body.title;
		var nowDate = Number(new Date());
		if(db){

			LetsUpdate(db, nowContent, nowWriter, nowTitle, nowDate, queryId, function(err,result){
				if(err){throw err;}

				if(result){
					console.log(':::0000000000000', result.modifiedCount)
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<table border="1">');
					res.write('  <tr><th>No.</th><td>' + nowDate + '</td><th>작성자</th><td>' + nowWriter + '</td></tr>');
					res.write('  <tr><th>title</th><td colspan="3">'+ nowTitle +'</td></tr>')
					res.write('  <tr height="300px"><th>Content</th><td colspan="3">'+ nowContent +'</td></tr>');
					res.write('</table>');
					res.write('<a href="/public/write.html">');
					res.write('   <input type="submit" value="글쓰기">')
					res.write('</a>');

					res.write('<a href="/">');
					res.write('   <input type="submit" value="게시판으로">')
					res.write('</a>');
					res.end();
					}
			})
			
		}
	})
});

var errorHandle = expressErrorHandler({
	static : {
		'404' : '../test111/public/404.html'
	}
});

app.use(expressErrorHandler.httpError(404));
// app.use(errorHandler);

http.createServer(app).listen(3000, function(){
	console.log('Express server starts at 3000');

	connectDB();
});
