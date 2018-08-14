// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

	var webview = document.querySelector('webview.plusdede');
	var tmp = false;
	if (!(tmp = localStorage.getItem('webview-src'))) {
		tmp = 'https://www.plusdede.com/series/following';
	}
	webview.src = tmp;

	window._plusdede = {
		'frame_hide': function(){
			webview.classList.add('background');
		},
		'frame_show': function(){
			webview.classList.remove('background');
		},
		'do_login': function(mail,pass,captcha){
			//FIXME: comprobar que el src es correcto
			webview.getWebContents().executeJavaScript(`
				var _mail = document.querySelector('input[name="email"]');
				var _pass = document.querySelector('input[name="password"]');
				var _captcha = document.querySelector('input[name="captcha"]');
				var _form = document.querySelector('form[action="https://www.plusdede.com/login"]');

				_mail.value = "${mail}";
				_pass.value = "${pass}";
				_captcha.value = "${captcha}";
				_form.submit();
			`).then((res) => {
				//console.log(res);
			}).catch((error) => console.log(error));
		},
		'do_search': function(criteria){
			criteria = encodeURIComponent(criteria);

			webview.getWebContents().executeJavaScript(`
				new Promise(function(resolve, reject) {
					var _url = 'https://www.plusdede.com/search/ac/${criteria}';
					var req = new XMLHttpRequest();
					req.open('GET', _url, false);
					req.send(null);
					if (req.status == 200){
						resolve(req.responseText);
					}
				});
			`).then((res) => {
				if (res) {
					var _media = [];
					res = JSON.parse(res);
					res.forEach(function(v,k){
						_media.push({
							 'src':v.file_medium
							,'name':v.value
							,'url':v.url
							//,'year':_year.innerText
							//,'rate':_rate.innerText
						});
					});

					var content = _fs.readFileSync('templates/serials.html', 'utf8');
					_view.innerHTML = _mustache.render(content, {'media':_media});
				}
			}).catch((error) => console.log(error));
		},
		'do_episode_seen': function(ep){
			return new Promise(function(resolve, reject) {
				webview.getWebContents().executeJavaScript(`
					new Promise(function(resolve, reject) {
						var _meta = document.querySelector('meta[name="_token"]');
						var _url = 'https://www.plusdede.com/set/episode/${ep}/seen';
						var req = new XMLHttpRequest();
						req.open('POST', _url, false);
						req.setRequestHeader('x-requested-with', 'XMLHttpRequest');
						req.setRequestHeader('authority', 'www.plusdede.com');
						req.setRequestHeader('x-csrf-token', _meta.getAttribute('content'));
						req.send('');
						if (req.status == 200){
							resolve(req.responseText);
						} else {
							reject(req.status);
						}
					});
				`).then((res) => {
					resolve(res);
				}).catch((error) => {
					console.log(error);
					reject(error);
				});
			});
		},
		'parse_login': function(){
			document.querySelector('#vue').classList.add('login');

			webview.getWebContents().executeJavaScript(`
				new Promise(function(resolve, reject) {
					var _captcha = document.querySelector('form .captcha img[alt=captcha]');
					if (!_captcha) {
						resolve({});
						return false;
					}
					var _error   = document.querySelector('.alert.alert-danger');
					_captcha.addEventListener('load',function(){
						/* Exfiltrate captcha */
						var canvas = document.createElement('CANVAS');
						canvas.width  = _captcha.naturalWidth;
						canvas.height = _captcha.naturalHeight;
						var ctx = canvas.getContext('2d');
						ctx.drawImage(_captcha,0,0);

						var error = false;
						if (_error) {error = _error.innerHTML;}

						resolve({
							 'error':error
							,'src':canvas.toDataURL()
						});
					});
				});
			`).then((res) => {
				if (res.src) {
					var _target = document.querySelector('.login .captcha');
					var img = document.createElement('IMG');
					img.src = res.src;
					_target.innerHTML = '';
					_target.appendChild(img);

					if (res.error) {
						var _error = document.querySelector('.login .error');
						_error.innerHTML = res.error;
					}
				}else{
					webview.src = webview.src;
					document.body.classList.remove('login');
				}
			}).catch((error) => console.log(error));
		},
		'parse_titles': function(){
			webview.getWebContents().executeJavaScript(`
				new Promise(function(resolve, reject) {
					var _user  = document.querySelector('span.username');
					var _media = [];
					var _containers = document.querySelectorAll('.media-container');
					Array.prototype.slice.call(_containers).forEach(function(v,k){
						var _image = v.querySelector('.media-cover img[data-src],.media-cover-img[src]');
						var _name  = v.querySelector('.media-title');
						var _url   = v.querySelector('a[data-original-title]');
						var _year  = v.querySelector('.media-info .year');
						var _rate  = v.querySelector('.media-info .value');
						_media.push({
							 'src':_image.getAttribute('data-src') || _image.getAttribute('src')
							,'name':_name.innerHTML
							,'url':_url.getAttribute('href')
							,'year':_year.innerText
							,'rate':_rate.innerText
						});
					});

					resolve({
						 'username':_user.innerHTML.toString().replace(/<.*$/,'')
						,'media':_media
					});
				});
			`).then((res) => {
				window._app.username_set(res.username);
				//var content = _fs.readFileSync('templates/serials.html', 'utf8');
				//_view.innerHTML = _mustache.render(content, res);
				_app.loaded();
				_vue.view = 'titles';
				_vue.titles = res.media;
			}).catch((error) => console.log(error));
		},
		'parse_media': function(){
			webview.getWebContents().executeJavaScript(`
				new Promise(function(resolve, reject) {
					var _image  = document.querySelector('.medium-avatar-container > img');
					var _name   = document.querySelector('.content h1.big-title');
					var _genres = document.querySelector('genre-container > ul > li');
					var _links  = document.querySelector('button.btn.btn-primary[data-toggle="modal"]');
					var _description = document.querySelector('.plot.expandable');
					var _seasons = [];

					var tmp = document.querySelectorAll('.episode-container');
					if (tmp) {
						var ep_season = false;
						var ep_url    = false;
						var ep_num    = false;
						var ep_name   = false;
						Array.prototype.slice.call(tmp).forEach(function(v,k){
							ep_season = v.getAttribute('data-season');
							var eps = v.querySelectorAll('li:not(season-header)');
							Array.prototype.slice.call(eps).forEach(function(b,l){
								ep_url    = b.querySelector('a');
								if (!ep_url) {return false;}
								ep_num    = b.querySelector('.num');
								ep_name   = b.querySelector('.name');

								if (!_seasons[ep_season]) {
									_seasons[ep_season] = {
										 'season':ep_season
										,'episodes':[]
									};
								}
								_seasons[ep_season]['episodes'].push({
									 'season':ep_season
									,'id':ep_url.getAttribute('data-id')
									,'url':'https://www.plusdede.com' + ep_url.getAttribute('data-href')
									,'num':ep_num.innerHTML
									,'name':ep_name.innerHTML.toString().replace(/<span.*>/,"").trim()
									,'seen':ep_url.classList.contains('seen')
								});
							});
						});
						tmp = [];
						for (a in _seasons) {
							tmp.push(_seasons[a]);
						}
						_seasons = tmp;
					}


					resolve({
						 'src':_image.src
						,'name':_name.innerHTML
						,'description':_description.innerText
						,'seasons':_seasons
						,'links':_links ? 'https://www.plusdede.com' + _links.getAttribute('data-href') : false
					});
				});
			`).then((res) => {
				/* Si es una serie, marcamos la temporada por la que vamos */
				var found = false;
				res.seasons.forEach(function(v,k){
					if (!v.season || v.season == 0) {return false;}
					v.episodes.forEach(function(b,l){
						if (!b.seen && !found) {
							found = true;
							res.seasons[k].active = true;
						}
					});
				});

				if (res.links) {
					/* Cargamos los links en el webview */
					webview.src = res.links;
				}

				_vue.view = 'media';
				_vue.media.src         = res.src;
				_vue.media.name        = res.name;
				_vue.media.seasons     = res.seasons;
				_vue.media.links       = res.links;
				_vue.media.description = res.description;
			}).catch((error) => console.log(error));
		},
		'parse_links': function(){
			webview.getWebContents().executeJavaScript(`
				new Promise(function(resolve, reject) {
					var _image = document.querySelector('.popup-aportes img');
					var _description = document.querySelector('.popup-aportes .episode-plot');
					var _links = [];

					var tmp = document.querySelectorAll('a[data-v]');
					if (tmp) {
						var ln_portal  = false;
						var ln_lang    = false;
						var ln_quality = false;
						Array.prototype.slice.call(tmp).forEach(function(v,k){
							ln_portal  = v.querySelector('.host > img');
							ln_lang    = v.querySelector('.language > img');
							ln_quality = v.querySelector('.textquality');

							ln_portal = ln_portal.getAttribute('src').replace(/^.*\\/([^\.]+)\.png$/,'$1');
							if (ln_portal != 'openload'
							 && ln_portal != 'streamcloud') {return false;}
							ln_lang = ln_lang.getAttribute('src').replace(/^.*\\/([^\.]+)\.png$/,'$1');

							_links.push({
								 'id':v.getAttribute('data-id')
								,'url':v.getAttribute('href')
								,'portal':ln_portal
								,'lang':ln_lang
								,'quality':ln_quality.innerText
							});
						});
					}
					

					if (_image) {
						resolve({
							 'src':_image.src
							,'description':_description ? _description.innerText : false
							,'servers':_links
						});
						return true;
					}
					resolve({
						 'servers':_links
					});
				});
			`).then((res) => {
				//FIXME: un poco hacky
				if (res.description) {
					var parent = document.querySelector('.navigate[data-href="' + webview.src + '"]');
					var description = parent.querySelector('.episode-description');
					if (description) {
						description.innerHTML = '<div><img src="' + res.src + '"></div><p>' + res.description + '</p>';
					}
				}

				_vue.media.servers = res.servers;


				//var content = _fs.readFileSync('templates/serials.html', 'utf8');
				//_view.innerHTML = _mustache.render(content, res);
			}).catch((error) => console.log(error));
		},
		'parse_link': function(){
			webview.getWebContents().executeJavaScript(`
				new Promise(function(resolve, reject) {
					var _url = document.querySelector('.visit-buttons > a[target="_blank"]');

					resolve({
						 'url':'https://www.plusdede.com' + _url.getAttribute('href')
					});
				});
			`).then((res) => {
				wplayer.src = res.url;
				_vue.ribbon = '<strong>Loading...</strong>';
			}).catch((error) => console.log(error));
		}
	};


	webview.addEventListener('dom-ready', () => {
_plusdede.frame_show();
		//alert(!!webview.src.match(/plusdede\.com\/series\/following/));
		switch (true) {
			case !!webview.src.match(/plusdede\.com\/series\/following/):
			case !!webview.src.match(/plusdede\.com\/pelis/):
				localStorage.setItem('webview-src',webview.src);
				_plusdede.frame_hide();
				_plusdede.parse_titles();
				break;
			case !!webview.src.match(/plusdede.com\/serie\/[^\/]+$/):
			case !!webview.src.match(/plusdede.com\/peli\/[^\/]+$/):
				localStorage.setItem('webview-src',webview.src);
				_plusdede.frame_hide();
				_plusdede.parse_media();
				break;
			case !!webview.src.match(/plusdede.com\/aportes\/[^\/]+\/[^\/]+$/):
				_plusdede.frame_hide();
				_plusdede.parse_links();
				break;
			case !!webview.src.match(/plusdede.com\/login/):
				_plusdede.frame_hide();
				_plusdede.parse_login();
				break;
			case !!webview.src.match(/plusdede.com\/aportes\/[^\/]+$/):
				_plusdede.frame_hide();
				_plusdede.parse_link();
			default:
				_plusdede.frame_show();
				//alert(webview.src);
		}
	});
	webview.addEventListener('did-navigate-in-page', (e) => {
		//alert(e.url);
setTimeout(() => {//FIXME: muy muy feo
		if (e.url.match(/plusdede.com\/serie\/[^\/]+$/)) {
			_plusdede.parse_media();
		}
},500);
	});

	webview.addEventListener('new-window', (e) => {
		if (e.url.match(/https:\/\/www.plusdede.com\/aportes\/[^\/]+$/)) {
			webview.src = e.url;
		}
		if (e.url.match(/https:\/\/www.plusdede.com\/link\/[^\/]+\//)) {
			wplayer.classList.remove('playing');
			wplayer.src = e.url;
		}
	});

	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
	if (MutationObserver) {
		// define a new observer
		var obs = new MutationObserver(function(mutations, observer){
			if( mutations[0].addedNodes.length/* || mutations[0].removedNodes.length*/ ){
				var nodeList = Array.prototype.slice.call(document.querySelectorAll('.navigate:not([data-navigate])'));
				if( nodeList.length ){
					nodeList.forEach(function(v,k){
						v.setAttribute('data-navigate',true);
						v.addEventListener('click',function(){
							var url = v.getAttribute('data-href');
							webview.src = url;
						});
					});
				}
			}
		});
		// have the observer observe foo for changes in children
		obs.observe( document.body, { childList:true, subtree:true });
	}
