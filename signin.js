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
			signincollection = myDB.collection('signin');
			console.log('데이터베이스에 연결되었습니다');
		}
		finder = dbcollection.find();
	})
}

//-------------------------------- 로그인 창 ---------------------------------------------------

var authUser = function(db, id, password, callback){
	console.log('authUser 호출됨');

	var login = {"id":id , "password" : password}
	signincollection.find(login).toArray(function(err,doc){
		if(err){
			console.log('authuser 실행 중 오류');
			callback(err, null);
			return;
		}
		if(doc.length > 0){
			console.log('매치하는 정보가 있음')
			console.log(doc);
			callback(null, doc);
			return;
		}
	})
}

app.post('/login', function(req,res){
	console.log('/login 호출함');
	console.log(req.body)
	paramId = req.body.id;
	paramPW = req.body.password;

	MongoClient.connect(URL, function(err, db){
		if(db){
			authUser(db, paramId, paramPW, function(err, result){
				if(err){
					console.log('로그인중 오류');
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('로그인 중 오류발생');
					res.end();
				}
				if(result){
					console.log('로그인 완료');
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('로그인 성공');

					res.write('<a href="/">');
					res.write('   <input type="submit" value="홈으로">')
					res.write('</a>');

					res.end();
				}
			})
		} else {
			console.log('데이터베이스에 연결하지 못함');
			res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
			res.write('데이터베이스에 연결하지 못함');
			res.end();
		}
	})


})

// -------------------------------회원가입 창 ---------------------------------------
var signIn = function(db,id, password, name, nickname, phone, date, callback){
	console.log('signin 호출됨 ,' + id+ '/' + password + '/' +name+ '/' + nickname + '/' + phone);

	var register = {"id":id, "password":password, "name":name, "nicknam":nickname, "phone":phone, "date":date};
	signincollection.insertOne(register, function(err){
		if(err) {
			callback(err,null);
			return;
		}
		console.log("사용자 추가 완료");
		callback(null, register);
		return;
	})
}

app.post('/signin', function(req, res){
	console.log('/signin 호출됨');
	console.log(req.body)
	var paramId = req.body.id;
	var paramPassword = req.body.password;
	var paramName = req.body.name;
	var paramNickname = req.body.nickname;
	var paramPhone = req.body.phone;
	var paramDate = Number(new Date());


	MongoClient.connect(URL, function(err, db){
		if(db){
			signIn(db, paramId, paramPassword, paramName, paramNickname, paramPhone, paramDate, function(err,result){
				if(err){throw err;}

				if(result){
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<h2> 회원가입 성공 </h2>');
					res.write('Id:' + paramId + '<br>Password:' + paramPassword + '<br>Name:' + paramName + '<br>Nickname:' + paramNickname + '<br>Phone : ' + paramPhone + '<br>Date : ' + paramDate + '<br><br>');

					res.write('<a href="/public/login.html">');
					res.write('   <input type="submit" value=" 로그인하기">')
					res.write('</a><br><br>');
					res.end();
				} else {
					res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
					res.write('<h2>회원가입 실패 </h2>');
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


var showPage = function(page, callback){
	MongoClient.connect(URL, function(err, db){
		if(err){
			throw err;
			callback(err, null)
			return
		}
		if(db){
			console.log( page + '페이지를 클릭해 쇼페이지 함수 실행')
			var options = {
    			"sort" : [['date',1]],
    			"skip": (page-1)*5,
    			"limit": 5
			}
			
			dbcollection.find({}, options).toArray(function(err,results){
				console.log('페이징 콜백함수로 보내야댐')
				callback(null, results)
			})

		} else {
			console.log('데이터베이스에 연결하지못함');
			return;
		}
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
					res.write('content:'+paramContent+'<br>writer:' + paramWriter + '<br>title:'+paramTitle+'<br>Date:' + paramDate + '<br><br>');
					res.write('<a href="/">');
					res.write('   <input type="submit" value="게시판으로">')
					res.write('</a>');

					res.write('<a href="/public/write.html">');
					res.write('   <input type="submit" value="새로쓰기">')
					res.write('</a><br><br>');

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
var limit = 5;
var totalCount, maxPage, offset, totalCount2;
app.get('/', function(req, res){
	console.log('/ 호출됨');

	var queryId = 1;	
	MongoClient.connect(URL, function(err, db){
		if(err){throw err;}
		if(db){
			dbcollection.find({}).toArray(function(err, result){
				if(err){throw err}
				if(result){
					var totalCount = Number(result.length);
					var maxPage = Math.ceil(totalCount/limit);
					var offset = 3;
					showPage(queryId, function(err, result){
						if(err){
							console.log('페이징 콜백오류');
							res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
							res.write('페이징 콜백오류');
							res.end();
						}
						if(result){
							console.log('페이징 콜백함수로 들어옴');
							res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
							res.write('<table border="1">');
							res.write('  <tr><th width="50px">No.</th><th width="500px">title</th><th width="100px">writer</th><th width="100px">date</th></tr>');

								for( var i = 0; i<result.length; i++){
									curContent = result[i].content;
									curWriter = result[i].writer;
									curTitle = result[i].title;
									curDate = result[i].date;
									
									
									res.write('  <tr><td>' + Number(i+1) + '</td><td><a href="/contents/?id='+ curDate +'">'+ curTitle +'<a></td><td>'+curWriter+'</td><td>'+curDate+'</td></tr>');
								}

								res.write('</table>');
								res.write('<a href="/public/write.html">');
								res.write('   <input type="submit" value="글쓰기">')
								res.write('</a>');



								res.write('<div>');
								res.write('  <ul style="width: 900px; justify-content:center; list-style: none; text-decoration:none; display:flex; flex-direction: row;">')
								if(queryId == 1){
									res.write('<li><< prev...</li>')
								} else {
									res.write('<li><a href="/board/?page='+Number(queryId-1)+'"><< prev</a>...</li>')
								}
								

								for ( j = 1; j <= maxPage; j++ ){
									if(j<=offset || j>maxPage-offset || (j>=queryId-(offset-1) && j<=queryId+(offset-1))){
										if(j != queryId){
											res.write('     <li>[<a href="/board/?page='+ j +'">'+ j +'</a>]</li>')
										} else {
											res.write('     <li>[<b>' + j + '</b>]</li>')
										} 
									} else if(j == offset+1 || j == maxPage-offset){
										res.write('<li>...</li>')
									}
								}
								if(queryId == maxPage){
									res.write('<li>...next >></li>')
								} else {
									res.write('<li>...<a href="/board/?page='+ Number(queryId+1) +'">next >></a></li>')
								}
								res.write('</ul>')
								res.write('</div>') 
								res.end();
						}
					});
				}
			})
		}
	})
});


app.get('/board/', function(req, res){
	console.log('/board 호출됨');

	var queryId = Number(req.query.page);
	
	MongoClient.connect(URL, function(err, db){
		if(err){throw err;}
		if(db){
			dbcollection.find({}).toArray(function(err, result){
				if(err){throw err}
				if(result){
					var totalCount = Number(result.length);
					var maxPage = Math.ceil(totalCount/limit);
					var offset = 3;
					showPage(queryId, function(err, result){
						if(err){
							console.log('페이징 콜백오류');
							res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
							res.write('페이징 콜백오류');
							res.end();
						}
						if(result){
							console.log('페이징 콜백함수로 들어옴');
							res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
							res.write('<table border="1">');
							res.write('  <tr><th width="50px">No.</th><th width="500px">title</th><th width="100px">writer</th><th width="100px">date</th></tr>');

								for( var i = 0; i<result.length; i++){
									curContent = result[i].content;
									curWriter = result[i].writer;
									curTitle = result[i].title;
									curDate = result[i].date;
									
									
									res.write('  <tr><td>' + Number(i+1) + '</td><td><a href="/contents/?id='+ curDate +'">'+ curTitle +'<a></td><td>'+curWriter+'</td><td>'+curDate+'</td></tr>');
								}

								res.write('</table>');
								res.write('<a href="/public/write.html">');
								res.write('   <input type="submit" value="글쓰기">')
								res.write('</a>');



								res.write('<div>');
								res.write('  <ul style="width: 900px; justify-content:center; list-style: none; text-decoration:none; display:flex; flex-direction: row;">')
							
								if(queryId == 1){
									res.write('<li><< prev...</li>')
								} else {
									res.write('<li><a href="/board/?page='+Number(queryId-1)+'"><< prev</a>...</li>')
								}

								for ( j = 1; j <= maxPage; j++ ){
									if(j<=offset || j>maxPage-offset || (j>=queryId-(offset-1) && j<=queryId+(offset-1))){
										if(j != queryId){
											res.write('     <li>[<a href="/board/?page='+ j +'">'+ j +'</a>]</li>')
										} else {
											res.write('     <li>[<b>' + j + '</b>]</li>')
										} 
									} else if(j == offset+1 || j == maxPage-offset){
										res.write('<li>...</li>')
									}
								}

								if(queryId == maxPage){
									res.write('<li>...next >></li>')
								} else {
									res.write('<li>...<a href="/board/?page='+ Number(queryId+1) +'">next >></a></li>')
								}
								res.write('</ul>')
								res.write('</div>') 
								res.end();
						}
					});
				}
			})
		}
	})
})




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
