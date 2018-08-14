
	var _app = function(){
		this._plusdede = document.querySelector('webview.plusdede');
		this._nav = {};
		this._nav.serials = document.querySelector('aside .nav-serials');
		this._nav.films   = document.querySelector('aside .nav-films');
		this._search      = document.querySelector('.search input');
		this._v_player = document.querySelector('.v-player');

		this._login = {};
		this._login.mail    = document.querySelector('.login-form input[name="user"]');
		this._login.pass    = document.querySelector('.login-form input[name="pass"]');
		this._login.captcha = document.querySelector('.login-form input[name="captcha"]');
		this._login.btn     = document.querySelector('.login-form button');
		this._login.btn.addEventListener('click',function(){
			this.do_login();
		}.bind(this));

		this._search.addEventListener('keyup',function(e) {
			e.preventDefault();
			e.stopPropagation();
			this.do_search();
		}.bind(this));

		window.addEventListener('scroll', function(e) {
			//FIXME: controlar también que el reproductor sea visible
			if (!this._v_player.is_squared && window.scrollY > 80) {
				var height = this._v_player.offsetHeight;
				this._v_player.classList.add('squared');
				this._v_player.is_squared = true;
				this._v_player.parentNode.style.marginTop = height + 'px';
			} else if(this._v_player.is_squared && window.scrollY < 81) {
				this._v_player.classList.remove('squared');
				this._v_player.is_squared = false;
				this._v_player.parentNode.style.marginTop = 0;
			}
		}.bind(this));
	};
	_app.prototype.username_set = function(user){
		_vue.username = user;
	};
	_app.prototype.do_login = function(){
		_plusdede.do_login(
			 this._login.mail.value
			,this._login.pass.value
			,this._login.captcha.value
		);
	};
	_app.prototype.do_search = function(){
		var criteria = this._search.value;
		if (!criteria) {return false;}

		clearTimeout(this.delay);
		this.delay = setTimeout(function(){
			if (this._search.getAttribute('data-criteria') == criteria) {return false;}

			/* Establecemos el útimo término de búsqueda, si no ha
			 * cambiado no es necesario buscar de nuevo */
			this._search.setAttribute('data-criteria',criteria);
			_plusdede.do_search(criteria);
		}.bind(this),600);
	};
	_app.prototype.do_episode_set = function(elem){
		var id = false;
		if (!(id = elem.getAttribute('data-id'))) {return false;}
		_plusdede.do_episode_seen(id).then(function(res){
			elem.setAttribute('data-seen',true);
			elem.firstElementChild.classList.add('green');
		});
	};
	_app.prototype.load_login = function(){
		
	};
	_app.prototype.loading = function(){
		_view.classList.add('transition-out');
		_view.classList.remove('transition-in');
	};
	_app.prototype.loaded = function(){
		_view.classList.add('transition-in');
		_view.classList.remove('transition-out');
	};
	_app.prototype.load_films = function(){
		this.loading();
		_vue.menu = 'films';
		this._plusdede.src = 'https://www.plusdede.com/pelis';
	};
	_app.prototype.load_serials_following = function(){
		this.loading();
		_vue.menu = 'serials';
		this._plusdede.src = 'https://www.plusdede.com/series/following';
	};
	_app.prototype.media_info = function(elem){
		if (this._info) {
			this._info.parentNode.removeChild(this._info);
		}

		this._info = document.createElement('DIV');
		this._info.classList.add('info-node');

		var _strong = elem.querySelector('strong');
		var _h2 = document.createElement('H2');
		_h2.innerText = _strong.innerText;
		this._info.appendChild(_h2);
		
		elem.appendChild(this._info);
	};

	var instance = new _app();

	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	if (MutationObserver) {
		// define a new observer
		var obs = new MutationObserver(function(mutations, observer){
			if( mutations[0].addedNodes.length/* || mutations[0].removedNodes.length*/ ){
				var nodeList = Array.prototype.slice.call(document.querySelectorAll('.op-episode-set:not([data-app])'));
				if( nodeList.length ){
					nodeList.forEach(function(v,k){
						v.setAttribute('data-app',true);
						v.addEventListener('click',function(){
							instance.do_episode_set(v);
						});
					});
				}

				var nodeList = Array.prototype.slice.call(document.querySelectorAll('.media-node:not([data-node])'));
				if( nodeList.length ){
					nodeList.forEach(function(v,k){
						v.setAttribute('data-node',true);
						v.addEventListener('click',function(){
							instance.media_info(v);
						});
					});
				}
			}
		});
		// have the observer observe foo for changes in children
		obs.observe( document.body, { childList:true, subtree:true });
	}

	module.exports = instance;
