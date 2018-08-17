<template>
<div class="btn-dropdown">
	<div @click="toggleMenu()" class="dropdown-toggle">
		<span class="loader">
			<svg class="spinner" width="20px" height="20px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
			   <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
			</svg>
		</span>
		<span v-if="selectedOption.name !== undefined">{{ selectedOption.name }}</span>
		<span v-if="selectedOption.name === undefined">{{ placeholderText }}</span>
		<span class="caret"></span>
	</div>

	<ul class="dropdown-menu" v-if="showMenu">
		<li v-for="option in options">
			<a href="javascript:void(0)" @click="updateOption(event,option)">
				{{ option.name }}
			</a>
		</li>
	</ul>
</div>
</template>

<script>
module.exports = {
	data() {
		return {
			selectedOption: {name: ''},
			showMenu: false,
			placeholderText: 'Please select an item',
		}
	},
	props: {
		options: {
			type: [Array, Object]
		},
		selected: '',
		placeholder: [String]
	},

	mounted() {
		this.selectedOption.name = this.selected;
		if (this.placeholder) {
			this.placeholderText = this.placeholder;
		}
	},

	methods: {
		updateOption(event,option) {
			this.$el.classList.add('loader');

			this.selectedOption = option;
			this.showMenu = false;
			//this.$emit('update', this.selectedOption);

			var promise = Promise.resolve();
			let evnt = {};
			evnt.target = this.$el;
			evnt.waitUntil = p => promise = p;
			this.$emit('update', evnt, option);

			promise.then(function(){
				this.$el.classList.remove('loader');
				//console.log('abc');
			}.bind(this));
		},

		toggleMenu() {
			this.showMenu = !this.showMenu;
		}
	}
}
</script>

<style>

.btn-dropdown {
	min-width: 160px;
	height: 40px;
	position: relative;
	margin: 10px 1px;
	display: inline-block;
	vertical-align: middle;
}
.btn-dropdown a:hover {
	text-decoration: none;
}

.dropdown-toggle {
	color: #636b6f;
	min-width: 160px;
	padding: 10px;
	font-weight: 300;
	border: 0;
	background-position: center bottom, center calc(100% - 1px);
	background-color: transparent;
	transition: background 0.1s ease-out,padding 0.4s ease-out;
	box-shadow: none;
	border-radius: 0;
	line-height:20px;
}
.dropdown-toggle:hover {
	background: rgba(255,255,255,.1);
	cursor: pointer;
}

.dropdown-menu {
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 1000;
	float: left;
	min-width: 160px;
	padding: 5px 0;
	margin: 2px 0 0;
	list-style: none;
	font-size: 14px;
	text-align: left;
	background-color: #424358;
	border: 1px solid #1c1f45;
	border-radius: 4px;
	box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
	background-clip: padding-box;
}
.btn-dropdown.loader .dropdown-toggle{
	padding-left: 40px;
}

.dropdown-menu > li > a {
	padding: 10px 30px;
	display: block;
	clear: both;
	font-weight: normal;
	line-height: 1.6;
	color: white;
	white-space: nowrap;
	text-decoration: none;
}
.dropdown-menu > li > a:hover {
	background: #efefef;
	color: #409FCB;
}

.dropdown-menu > li {
	overflow: hidden;
	width: 100%;
	position: relative;
	margin: 0;
}

.btn-dropdown .loader {display:none;}
.btn-dropdown.loader .loader{
	display:block;
	width:30px;
	transform: translateX(-30px);
}
.btn-dropdown.loader .spinner {
	position: absolute;
	animation: dropdown-spinner-rotator 1.4s linear infinite;
	
}
@keyframes dropdown-spinner-rotator {
	0%   {transform: rotate(0deg);}
	100% {transform: rotate(270deg);}
}

.btn-dropdown.loader .path {
	stroke-dasharray: 187;
	stroke-dashoffset: 0;
	transform-origin: center;
	animation:dropdown-spinner-dash 1.4s ease-in-out infinite, dropdown-spinner-colors 5.6s ease-in-out infinite;
}
@keyframes dropdown-spinner-colors {
	0%   { stroke: #4285F4; }
	25%  { stroke: #DE3E35; }
	50%  { stroke: #F7C223; }
	75%  { stroke: #1B9A59; }
	100% { stroke: #4285F4; }
}

@keyframes dropdown-spinner-dash {
	0%   {stroke-dashoffset: 187; }
	50%  {stroke-dashoffset: 46.75;transform:rotate(135deg);}
	100% {stroke-dashoffset: 187;transform:rotate(450deg);}
}

.dropdown-toggle .caret {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 0;
	height: 0;
	margin-left: 10px;
	vertical-align: middle;
	border-top: 4px dashed;
	border-right: 4px solid transparent;
	border-left: 4px solid transparent;
}
</style>
