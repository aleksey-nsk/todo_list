$(function() {
	
	// Пространство имён: 
	//
	// Пространство имён нужно для того, чтобы не засорять приложение
	// глобальными переменными, и избежать множества связанных с ними
	// проблем, таких как перезапись переменных и т.д.
	// Также пространство имён позволяет структурировать наше 
	// приложение так, чтобы было удобно манипулировать его сущностями.
	//
	// Глобальные переменные вредны. Поэтому хорошая практика - делать
	// одну глобальную переменную, которая будет являться
	// пространством имён для нашего приложения.
	//
	// Создадим глобальный объект App, который и будет являться
	// нашим пространством имён. Все остальные объекты будут дочерними 
	// для нашего главного объекта App:
	window.App = {

		// Для наших моделей, коллекций и видов
		// создадим подпространства имён, для того чтобы было
		// удобно управлять этими сущностями. 
		// Подпространства это ни что иное как дочерние объекты
		// нашего пространства имён App: 
		Models: {},
		Collections: {},
		Views: {}

	};

	// Хорошей практикой является одна глобальная функция. Но так как
	// проект маленький и всего один хэлпер, то можно во избежание большой 
	// вложенности и для простоты его использования, забить 
	// этот хэлпер во вторую глобальную переменную. В данном
	// случае в этом нет ничего страшного.
	//
	// Напишем хэлпер шаблона. Получится функция, в которую
	// в качестве аргумента будет передаваться id шаблона: 
	window.template = function(id){
		return _.template( $('#' + id).html() );
	};

	// Класс модель отдельной задачи:
	App.Models.Task = Backbone.Model.extend({				
		validate: function(attrs) {  // передаём в функцию атрибуты модели
			console.log('Внутри метода валидации!');

			// Метод $.trim() удалит все пробелы в начале и в конце строки:
			if ( ! $.trim(attrs.title) ) {
				console.log('Имя задачи должно быть валидным!');

				return 'Имя задачи должно быть валидным!';  
				// - когда мы возвращаем строку из метода валидации,
				// это означает что валидация не прошла.
			}			
		}		
	});

	// Класс вид отдельной задачи:
	App.Views.Task = Backbone.View.extend({		
		// Добавим инициализацию:
		initialize: function() {
			// Мы хотим, чтобы при изменении модели, этот вид
			// заново отрендерил DOM:
			this.model.on('change', this.render, this); // 3-им параметром указываем контекст 

			// Опишем вызов обработчика события разрушения модели:
			this.model.on('destroy', this.remove, this);
		},

		tagName: 'li',  // корневой элемент единичной задачи, так как говорим о списке задач

		// В начале скрипта мы написали хэлпер шаблона.
		// Теперь в нашем виде отдельной задачи
		// мы можем вызывать этот хэлпер и просто передавать
		// в него строку нужного айдишника: 
		template: template('taskTemplate'),

		// Функция render нужна нам для наполнения нашего элемента html кодом.
		// Функция render будет наполнять корневой элемент тайтлом конкретной задачи:
		render: function() {
			var template = this.template( this.model.toJSON() ); 			
			this.$el.html( template );
			return this;  // возвращаем this для цепочных вызовов 
		},  

		// Реализуем прослушку событий.
		// Все события в Виде(View) помещаются в events:
		events: {
			// Пишем событие и функцию, которая будет вызываться на это событие:
			'click .edit': 'editTask', 			
			'click .delete': 'destroy'

			// Все события относятся к корневому элементу tagName: 'li' 
			// Т.е. каждый раз выборка будет проходить только по этому корневому элементу,
			// а не по всему DOM-дереву как в jQuery 
		},

		// Напишем обработчик события, которое будет происходить
		// при клике по кнопке delete:
		destroy: function() {
			this.model.destroy();
			console.log( tasksCollection );
		},

		// Сам обработчик, который будет удалять корневой элемент
		// из документа:
		remove: function() {
			this.$el.remove();
		},

		editTask: function() {			
			var newTaskTitle = prompt( 'Как переименуем задачу?', this.model.get('title') );
			this.model.set( 'title', newTaskTitle, {validate:true} ); 			
			console.log( this.model.get('title') );  // выводим новый заголовок в консоль
		} 
	});
	
	// Класс коллекция:
	App.Collections.Task = Backbone.Collection.extend({ 		
		model: App.Models.Task    // задали модель по умолчанию
	});
	
	// Нам теперь нужно создать такой вид, который будет  
	// рендерить сразу весь список.
	// Класс вид коллекции: 	
	App.Views.Tasks = Backbone.View.extend({
		tagName: 'ul',  // у нас будет маркированный список 

		// Надо поставить прослушку события изменения нашей коллекции.
		// Как только в коллекцию с задачами добавляется новая, мы
		// должны тут же отрендерить html дополнительной задачей
		// и в DOM-дереве: 
		initialize: function() {
			this.collection.on('add', this.addOne, this);
		},

		render: function(){
			this.collection.each( this.addOne, this );
			return this;
		},

		addOne: function(task) {
			// Создать новый дочерний вид:
			var taskView = new App.Views.Task({ model: task });
			
			// Добавить его в корневой элемент ul:
			this.$el.append( taskView.render().el );
		} 
	});

	// Класс вид добавления задачи:
	App.Views.AddTask = Backbone.View.extend({ 
		// Привяжем айдишник к виду. То есть теперь корневой элемент
		// нашего вида - это наша форма addTask:
		el: '#addTask',

		events: {
			'submit' : 'submit' 
		},

		initialize: function() {
			console.log( this.el.innerHTML );
		},

		// e - это объект события: 
		submit: function(e) {
			e.preventDefault();  // отменить действие по умолчанию 

			// Забьём в переменную newTaskTitle значение поля, в которое
			// вводится новая задача: 
			var newTaskTitle = $(e.currentTarget).find('input[type=text]').val(); 
			console.log(newTaskTitle);
			console.log('Форма отправлена!');

			// Создадим новый экземпляр модели Task, и в качестве атрибута title
			// добавим newTaskTitle: 
			var newTask = new App.Models.Task({ title: newTaskTitle });
			this.collection.add(newTask);
			console.log( this.collection.toJSON() );
		}
	});

	// Создадим экземпляр класса коллекции.
	// Наша коллекция будет состоять из 3 моделей:
	var tasksCollection = new App.Collections.Task([
		{
			title: 'Настроить на ноуте локальный веб-сервер',
			priority: 4    // 'priority' - приоритет  
		},
		{
			title: 'Выложить готовый сайт на хостинг',
			priority: 3
		},
		{
			title: 'Установить плагины для Sublime Text',
			priority: 5
		}	
	]);
	
	// Создадим экземпляр вида коллекции, и передадим
	// в этот экземпляр нашу коллекцию: 
	var tasksView = new App.Views.Tasks({ collection: tasksCollection });
	
	$('.tasks').html( tasksView.render().el );

	// Создадим экземпляр вида AddTask, и передадим
	// в этот экземпляр коллекцию уже существующих задач:	
	var addTaskView = new App.Views.AddTask({ collection: tasksCollection });	
});  
