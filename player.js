
	var _player = function(){
		this._stream   = false;
		this._video    = document.querySelector('.v-player video');
		this._controls = document.querySelector('.v-player .controls');
		this._close    = document.querySelector('.v-player .controls .close');
		this._progress = document.querySelector('.v-player .controls .progress');

		this._video.addEventListener('loadedmetadata', function() {
			this._video.parentNode.classList.add('visible');
			this._progress.setAttribute('max', this._video.duration);
			this._progress.setAttribute('value', 0);
			this._video.play();
			document.body.scrollTop = 0;
			_vue.ribbon = '';
		}.bind(this));

		this._video.addEventListener('timeupdate', function() {
			// For mobile browsers, ensure that the progress element's max attribute is set
			if (!this._progress.getAttribute('max')) {this._progress.setAttribute('max', this._video.duration);}
			this._progress.value = this._video.currentTime;
			//progressBar.style.width = Math.floor((video.currentTime / video.duration) * 100) + '%';
		}.bind(this));

		this._controls.addEventListener('mouseenter', function() {
			this._video.parentNode.classList.remove('controlsoff');
		}.bind(this));
		this._controls.addEventListener('mouseleave', function() {
			this._video.parentNode.classList.add('controlsoff');
		}.bind(this));

		this._controls.addEventListener('click', function() {
			if (this._video.paused) {this._video.play();}
			else {this._video.pause();}
		}.bind(this));

		this._close.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			//this._video.setAttribute('src','#');
			this._video.parentNode.classList.remove('visible');
			this._video.pause();
		}.bind(this));
	};


	var instance = new _player();
	

	var wplayer = document.querySelector('webview.player');
	wplayer.addEventListener('did-finish-load', (e) => {
		if (wplayer.src.match(/streamcloud/)) {
			wplayer.getWebContents().executeJavaScript(`
				var btn = document.querySelector('input#btn_download');
				var bounds = btn.getBoundingClientRect();
				document.body.scrollTop = bounds.top - 40;
				Promise.resolve({
					 'left':bounds.left
					,'top':0
					,'width':bounds.width
					,'height':bounds.height
				});
			`).then((res) => {
				/* Tenemos que esperar a que el botón se ponga azul */
				console.log('btn');
				return wplayer.getWebContents().executeJavaScript(`
					new Promise(function(resolve, reject) {
						var start = Date.now() / 1000;
						var elem = false
						var timeout = 10;
						var checkExist = setInterval(function() {
							if (elem = document.querySelector('input#btn_download.blue')){
								clearInterval(checkExist);
								/* INI-Positioning the button */
								document.body.scrollTop = 0;
								var bounds = elem.getBoundingClientRect();
								document.body.scrollLeft = bounds.left;
								document.body.scrollTop  = bounds.top;
								/* END-Positioning the button */
								resolve({
									 'left':0
									,'top':0
									,'width':bounds.width
									,'height':bounds.height
								});
							} else if (timeout && ((Date.now() / 1000) - start) >= timeout){
								clearInterval(checkExist);
								reject('timeout');
							}
						},100);
					});
				`);
			}).then((res) => {
				return new Promise(function(resolve, reject) {
					function handler(event) {
						/* Removes the listeners */
						wplayer.removeEventListener('did-navigate', handler);
						resolve('navigated'); // works just fine
					}
					wplayer.addEventListener('did-navigate', handler);
					wplayer.sendInputEvent({type:'mouseDown', x:res.left + 20, y: res.top + 10, button:'left', clickCount: 1});
					wplayer.sendInputEvent({type:'mouseUp'  , x:res.left + 22, y: res.top + 12, button:'left', clickCount: 1});
				});
			}).then((res) => {
				/* Search for the video item */
				console.log('search for video');
				return wplayer.getWebContents().executeJavaScript(`
					new Promise(function(resolve, reject) {
						var start = Date.now() / 1000;
						var video = false
						var timeout = 10;
						var checkExist = setInterval(function() {
							if (video = document.querySelector('video')){
								clearInterval(checkExist);
								jwplayer('mediaplayer').play();
								video.addEventListener('canplay',function() {
									video.pause();
									document.body.appendChild(video);
									video.style.position = 'absolute';
									video.style.top    = 0;
									video.style.left   = 0;
									video.style.width  = '100%';
									video.style.height = '100%';
									document.body.background = 'black';
									Array.prototype.slice.call(document.body.children).forEach(function(v,k){
										if (v !== video) {document.body.removeChild(v);}
									});

									resolve({
										 'width':video.videoWidth
										,'height':video.videoHeight
										,'src':video.src
									});
								});
							} else if (timeout && ((Date.now() / 1000) - start) >= timeout){
								clearInterval(checkExist);
								reject('timeout');
							}
						},100);
					});
				`);
			}).then((res) => {
				var player = document.querySelector('video.v-player');
				player.src = res.src;
			}).catch(console.log);
		}
		if (wplayer.src.match(/openload/)) {
			wplayer.getWebContents().executeJavaScript(`
				var video  = document.querySelector('video.vjs-tech');
				var bounds = video.getBoundingClientRect();
				document.body.scrollTop = bounds.top;
				Promise.resolve({
					 'left':bounds.left
					,'top':0
					,'width':bounds.width
					,'height':bounds.height
				});
			`).then((res) => {
				/* El primer click va para la publicidad */
				wplayer.sendInputEvent({type:'mouseDown', x:res.left + 20, y: res.top + 20, button:'left', clickCount: 1});
				wplayer.sendInputEvent({type:'mouseUp'  , x:res.left + 22, y: res.top + 22, button:'left', clickCount: 1});

				setTimeout(() => {
					wplayer.sendInputEvent({type:'mouseDown', x:res.left + 20, y: res.top + 20, button:'left', clickCount: 1});
					wplayer.sendInputEvent({type:'mouseUp'  , x:res.left + 22, y: res.top + 22, button:'left', clickCount: 1});

					wplayer.getWebContents().executeJavaScript(`
						new Promise(function(resolve, reject) {
							var video = document.querySelector('video.vjs-tech');
							video.pause();
							video.addEventListener('canplay',function() {
								document.body.appendChild(video);
								video.style.position = 'absolute';
								video.style.top    = 0;
								video.style.left   = 0;
								video.style.width  = '100%';
								video.style.height = '100%';
								document.body.background = 'black';
								Array.prototype.slice.call(document.body.children).forEach(function(v,k){
									if (v !== video) {document.body.removeChild(v);}
								});

								resolve({
									 'width':video.videoWidth
									,'height':video.videoHeight
									,'src':video.src
								});
							});
						});
					`).then(function(res){
						var player = document.querySelector('video.v-player');
						player.src = res.src;
					});
				},200);
			}).catch((error) => console.log(error));
		}
	});

	module.exports = wplayer;
