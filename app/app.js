const { VK, Keyboard  } = require('vk-io');
// import { SessionManager } from '@vk-io/session';
// import { SceneManager, StepScene } from '@vk-io/scenes';
const mysql = require('mysql2');
require('dotenv').config();
const forever = require('forever-monitor');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	database: 'botdb'
  });

const vk = new VK({
	token: process.env.TOKEN
});

// const sessionManager = new SessionManager();
// const sceneManager = new SceneManager();

// vk.updates.on('message', sessionManager.middleware);


// vk.updates.on('message', sceneManager.middleware);
// vk.updates.on('message', sceneManager.middlewareIntercept); // Default scene entry handler


// sceneManager.addScene([
// 	new StepScene('signup', [
// 		(context) => {
// 			if (context.scene.step.firstTime || !context.text) {
// 				return context.send('What\'s your name?');
// 			}

// 			context.scene.state.firstName = context.text;

// 			return context.scene.step.next();
// 		},
// 		(context) => {
// 			if (context.scene.step.firstTime || !context.text) {
// 				return context.send('How old are you?');
// 			}

// 			context.scene.state.age = Number(context.text);

// 			return context.scene.step.next();
// 		},
// 		async (context) => {
// 			const { firstName, age } = context.scene.state;

// 			await context.send(`👤 ${firstName} ${age} ages`);

// 			return context.scene.step.next(); // Automatic exit, since this is the last scene
// 		}
// 	])
// ]);


//функция=обертка для прослушивания сообщений
const hearCommand = (name, conditions, handle) => {
	if (typeof handle !== 'function') {
		handle = conditions;
		conditions = [`/${name}`];
	}

	if (!Array.isArray(conditions)) {
		conditions = [conditions];
	}

	vk.updates.hear(
		[
			(text, { state }) => (
				state.command === name
			),
			...conditions
		],
		handle
	);
};

hearCommand('Мероприятия', ['Мероприятия', 'мероприятия', '/activity'], async (context) => {
	pool.getConnection(function(err, connection) {
		if(err) {
		  console.log(err);
		}
		connection.query(
			'SELECT * FROM `activity`',
			function(err, results, fields) {
			context.send("Список мероприятий:");
			  results.forEach(element => {
				  context.send({
					  message: `${element.title} 
					 
						Чтобы узнать подробнее, введи (без кавычек): 
						"Узнать подробнее ${element.id}"
					  `,
					  keyboard: Keyboard.keyboard([
						[
							Keyboard.textButton({
								label: 'Узнать подробнее',
								payload: {
									command: 'getActivityInfo',
									item: element.id,
								}
							})
						],
					  ]).inline() 
				  });
			  });
			}
		  );
	  });
	
	
	
	

	
});

hearCommand('Узнать подробнее', ['Узнать подробнее', /[Узнать подробнее]\s\d+/ ], async(context) => {
	const msg = context.message.payload;
	
	let str = context.message.text;
	let id = str.match(/\d+/);
	let data 
	if(msg) {
		data= JSON.parse(msg);
	}
	if(!id) {
		if(data) {
			id = data.item;

		} else {
			return context.send("Укажи данные в формате Узнать подробнее [ID]");
		}
	}

	pool.getConnection(function(err, connection) {
		if(err) {
		  console.log(err);
		}
		connection.query(
			'SELECT * FROM `activity` WHERE `id`=?',
			[id],
			function(err, results, fields) {
			 
			context.send("Подробнее о мероприятии:");
			context.send(results[0].description);
			}
		  );
	
	  });

	
})

hearCommand('Начать', ['Начать', '/start', '/help', 'начать', 'Помощь', 'помощь'], async(context) => {
	await context.send("Привет! Вот список моих команд:");
	await context.send({
		message: `
			Мероприятия (/activity) - Список мероприятий колледжа
			Помощь (/help) - Список команд
		`,
		keyboard: Keyboard.builder()
			.textButton({
				label: 'Помощь',
				payload: {
					command: '/help'
				}
			})
			.textButton({
				label: 'Мероприятия',
				payload: {
					command: 'Мероприятия'
				}
			})
			.row()
	});
})

hearCommand('.+', [/(^)\/.+/], async(context) => {
	await context.send("Я не знаю такой команды");
})

vk.updates.start().catch(console.error);