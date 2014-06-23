$(function(){
	var FRAME_COUNT = 50,								//动画模拟：每秒帧数
		FRAME_INTERVAL_MILLSEC = 1000/FRAME_COUNT,		//动画模拟：每帧间隔毫秒数

		// CONDUIT_INTERVAL_MILLSEC = 2000,	//水管出现间隔秒数
		// CONDUIT_MOVE_MAX_MILLSEC = 6000,	//水管运动最大毫秒数
		// BIRD_FLIGHT_MAX_MILLSEC = 2800,		//自由落体最大毫秒数
		// BIRD_MAX_HEIGHT_MILLSEC = 1500,		//提升持续毫秒数
		// BIRD_MAX_HEIGHT = 90,				//提升高度

		// CONDUIT_INTERVAL_MILLSEC = 2400,	//水管出现间隔秒数
		// CONDUIT_MOVE_MAX_MILLSEC = 6000,	//水管运动最大毫秒数
		// BIRD_FLIGHT_MAX_MILLSEC = 3200,		//自由落体最大毫秒数【用于确定加速度】
		// BIRD_MAX_HEIGHT_MILLSEC = 1800,		//提升持续毫秒数【用于确定初始速度】
		// BIRD_MAX_HEIGHT = 80,				//提升高度

		CONDUIT_INTERVAL_MILLSEC = 3000,	//水管出现间隔秒数
		CONDUIT_MOVE_MAX_MILLSEC = 8000,	//水管运动最大毫秒数
		BIRD_FLIGHT_MAX_MILLSEC = 4000,		//自由落体最大毫秒数【用于确定加速度】
		BIRD_MAX_HEIGHT_MILLSEC = 1800,		//提升持续毫秒数【用于确定初始速度】
		BIRD_MAX_HEIGHT = 80,				//提升高度

		PANEL_WIDTH = 500,					//主区域面板宽度【必须与CSS同步】
		PANEL_HEIGHT = 420,					//主区域面板高度【必须与CSS同步】

		CONDUIT_WIDTH = 32,					//水管宽度【必须与CSS同步】
		CONDUIT_LEFT_DEFAULT = PANEL_WIDTH - CONDUIT_WIDTH,//水库起始位置
		CONDUIT_VELOCITY = PANEL_WIDTH*FRAME_INTERVAL_MILLSEC/CONDUIT_MOVE_MAX_MILLSEC;

		GALLERY_HEIGHT = 120,				//通道高度【必须与CSS同步】
		GALLERY_MIN_TOP = 48, 				//通道最高位置
		GALLERY_MAX_TOP = PANEL_HEIGHT - GALLERY_HEIGHT - GALLERY_MIN_TOP,//通道最低位置

		BIRD_WIDTH = 16,						//鸟的自身宽度【必须与CSS同步】
		BIRD_HEIGHT = 16,						//鸟的自身高度【必须与CSS同步】
		BIRD_POSITION_LEFT = 120,				//鸟的水平位置：左侧坐标
		BIRD_POSITION_RIGHT = BIRD_POSITION_LEFT+BIRD_WIDTH,//鸟的水平位置：右侧坐标
		BIRD_INITIAL_VELOCITY = 0,				//鸟的飞行初速度
		BIRD_ACCELERATED_SPEED = 0,				//自由落体加速度（与主区域的高度有关）

		BIRD_MAX_TOP = PANEL_HEIGHT - BIRD_HEIGHT,

		$bird = $('#bird'),
		$score = $('#score'),
		$main = $('#main');

	BIRD_ACCELERATED_SPEED = 2*PANEL_HEIGHT*FRAME_COUNT*FRAME_COUNT/BIRD_FLIGHT_MAX_MILLSEC/BIRD_FLIGHT_MAX_MILLSEC;
	BIRD_INITIAL_VELOCITY = (-0.5)*BIRD_ACCELERATED_SPEED*BIRD_MAX_HEIGHT_MILLSEC/FRAME_COUNT-BIRD_MAX_HEIGHT*FRAME_COUNT/BIRD_MAX_HEIGHT_MILLSEC;

	var game = {
		intervalArray : [],
		second: 0, 				//秒数
		bStart: false,			//开始标记

		fnBirdFlight: function(){	//鸟飞行模拟（即自由落体运动）
			var flag = setInterval(function(){
				var top = $bird.position().top, //获取当前位置
					second = game.second+1,
					height = BIRD_INITIAL_VELOCITY+BIRD_ACCELERATED_SPEED*(0.5+second),
					newTop = top + height;

				if(newTop<0){
					newTop = 0;
				}else if(newTop>BIRD_MAX_TOP){
					newTop = BIRD_MAX_TOP;
					game.fnStop();
				}

				$bird.css('top', newTop);
				game.second = second;
			}, FRAME_INTERVAL_MILLSEC);
			game.intervalArray.push(flag);
		},

		fnSecond2Zero: function(){//秒数清零（即玩家执行点击模拟）
			game.second = 0;
		},

		//函数：碰撞检测
		fnCrashCheck : function(conduitLeft, galleryTop, $conduit){
			var conduitRight = conduitLeft+CONDUIT_WIDTH;
			if(BIRD_POSITION_RIGHT>=conduitLeft 
				&& BIRD_POSITION_LEFT<conduitRight){
				var top = $bird.position().top;
				if(galleryTop<top && (galleryTop+GALLERY_HEIGHT)>(top+BIRD_HEIGHT)){
					return;
				}else{
					game.fnStop();
				}
			}else if(BIRD_POSITION_LEFT>conduitRight){
				if(!$conduit.data('bPass')){
					game.fnScorePlusOne();
					$conduit.data('bPass', true);
				}
			}
		},

		//函数：管道创建
		fnConduitCreate : function(){
			var $conduit = null,
				galleryTop = parseInt(Math.random() * (GALLERY_MIN_TOP - GALLERY_MAX_TOP + 1) + GALLERY_MAX_TOP),
				conduitTemplate = '<div class="conduit" style="left:'+CONDUIT_LEFT_DEFAULT+'px;"><div class="gallery" style="top:'+galleryTop+'px;"></div></div>';

			//HTML构建
			$conduit = $(conduitTemplate).appendTo($main);

			//执行移动
			game.fnConduitMove($conduit, galleryTop);
		},


		//函数：管道移动
		fnConduitMove : function($conduit, galleryTop){
			var flag = setInterval(function(){
				var left = $conduit.position().left, //获取当前位置
					newLeft = left - CONDUIT_VELOCITY;

				if(newLeft<0){
					clearInterval(flag);
					$conduit.remove();
				}else{
					game.fnCrashCheck(newLeft, galleryTop, $conduit);
					$conduit.css('left', newLeft);
				}
			}, FRAME_INTERVAL_MILLSEC);
			game.intervalArray.push(flag);
		},

		//函数：计算分数
		fnScorePlusOne : function(){
			var val = $score.html()-(-1);
			$score.html(val);
		},

		//函数：开始游戏
		fnStart : function(){
			//生成管道
			var flag = setInterval(game.fnConduitCreate, CONDUIT_INTERVAL_MILLSEC);
			game.intervalArray.push(flag);
			game.fnBirdFlight();
		},

		//函数：结束游戏
		fnStop : function(){
			while(game.intervalArray.length>0){
				clearInterval(game.intervalArray.pop());
			}
		}

	};

	/**
	 * 玩家操作监听：空格键点击
	 */
	$(document.body).bind('keyup', function(event) {  
		if(event.keyCode==32){
			if(game.bStart){
				game.fnSecond2Zero();
			}else{
				game.fnStart();
				game.bStart = true;
			}
		}
    });


	//通道：可上下移动, 伸缩
	//道具：隐身/飞行/自动模式, 加速, 减速, 跳跃幅度, 水管出现速度
	//http://tieba.baidu.com/p/2125117856#!/l/p1
	//使用软件制作动图

    window.game = game;
});