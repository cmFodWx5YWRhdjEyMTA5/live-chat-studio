'use strict';

//@#
livechat.factory('Chat', function ($rootScope) {

	/* how to get angular html element
	   var $notificationDiv = angular.element(document.querySelector('.notification'));
	*/

	var socket = null;
	initBaseUrl();
	
	function initBaseUrl() {
		
		$.ajax({
			url : 'http://kazanlachani.com/ify/services/getBaseUrl.php',
			type : 'POST',
			dataType : 'json',
			data : null,
			cashe : false,
			success : function (_data) {
				
				var data = JSON.parse(JSON.stringify(_data[0]));
				var socket_chat_url = JSON.parse(JSON.stringify(data)).socket_chat_url;
				
				if (typeof(socket_chat_url) === 'undefined')
					return false;
				
				socket = io.connect(socket_chat_url, {
						'forceNew' : true,
						'reconnect' : true,
						'reconnection delay' : 500,
						'max reconnection attempts' : 10
					});
				
				socket.on('connect', function () {
					//console.log("connected");
					if ($rootScope.profile != null)
						var new_socket = baseChat.join($rootScope.profile);
				});
				
				socket.on('disconnect', function () {
					//
				});
				
			},
			
			error : function (err) {
				return "error";
			}
			
		});
		
	}
	
	var baseChat = {

		join : function (user) {
			socket.emit('join', user);
			return socket;
		},
		
		send_group_message: function (msg) {
			socket.emit('send_group_message', msg);				
		},
		
		sendMessage : function (msg) {		
			socket.emit('send_message', msg);
		},

		typing : function (msg) {

			socket.emit('typing', msg);
		},

		stopTyping : function (msg) {
			socket.emit('stop_typing', msg);
		},

		seen : function (msg) {
			socket.emit('seen', msg);
		}
	};

	return baseChat;
})

livechat.factory('system', function ($rootScope, Chat, $ionicPopup, $ionicActionSheet, 
								$ionicSlideBoxDelegate, $ionicLoading, $timeout, $compile, $q, 
								$window, $ionicModal, $ionicScrollDelegate, $ionicPopover) {

	$.ajaxSetup({
		async : false
	});

	return {

		/* chat service variable*/
		chat_url : "",
		chat_photo_url : '',
		limitedMessage : 10,

		/* service variable*/
		main_url : '',
		photo_url : '',
		baseUrl : '',

		//private
		profile : null,
		user_Id : 0,
		myService : null,
		latitude : 0,
		longitude : 0,
		map : null,
		map_status : false,

		cashed_nearby : [],
		cashed_people : [],
		cashed_messages : [],
		cashed_chat_messages : [],
		cashed_favorites : [],
		cashed_visitors : [],
		cashed_populars : [],
		cashed_vip_users : [],
		my_history : [],
		cashed_likes: [],
		cashed_online_users : [],

		userLocation : null,
		cashed_rand_users : [],
		messagesToSend : null,
		myTimer : 0,
		socket : null,

		/* setting variable*/
		setting : null,		
		oldVersion : 3,
		versionCode : 4,
		DeviceReady: false,
		admob_android_key: 'ca-app-pub-2108590561691007/2608963975',
		interstitial: 'ca-app-pub-2108590561691007/4085697175',
		
		init : function () {
			
			this.initBaseUrl();
			
			$rootScope.profile = null;

			this.initScope();
			this.initAdsCounters();
			
			$rootScope.payPalCounter = 0;
			$rootScope.maxPayPalCounter = 5;
			
			$rootScope.appState = false;		
			$rootScope.freeChatUsers = [];
			$rootScope.refreshAdAfterSendSomeMessages = 0;
			$rootScope.groupChatMessages = [];
			
			this.profile = $.parseJSON(localStorage.getItem('profile'));
			var result = this.populars();

			result.then(function (populars) {

				$rootScope.populars = populars;

			});

			if (this.profile) {

				$rootScope.chatMoreDetails = false;
				$rootScope.isChatView = false;
				$rootScope.appState = true;
				$rootScope.profile = this.profile;
				$rootScope.randUsers = [];
				$rootScope.online_user_count = 0;
				$rootScope.cashed_vip_users_count = 0;
				$rootScope.seen = false;
				$rootScope.hasSocketMessage = false;

				this.initSettings();
				this.messages();
				this.favorites();
				this.visitors();
				this.onlineUsers();
				this.myHistory();
				this.likes();
				this.vipUsers();
				this.startTimer();
				if (this.profile.isPayment <= 0)
					this.check_freeChatUsers();

			}

			return true;
		},
		
		initAdsCounters: function () {
		
			$rootScope.chatCounter = 0;
			$rootScope.maxChatCounter = 5;
	
			$rootScope.ViewProfileCounter = 0;
			$rootScope.MaxViewProfileCounter = 5;
			
			$rootScope.viewFrontEnd = 0
			$rootScope.MaxViewFrontEnd = 5;
		},
			
		homeMoreMenuEvents: function ($scope) {
			
			var mainObject = this;
			
			$ionicPopover.fromTemplateUrl('views/home_more.html', {
				scope: $scope,
			}).then(function(popover) {
				$scope.popover = popover;
			});
			
			
			$scope.send_feedback = function (user) {

				window.plugins.textarea.openTextView('From: ' + mainObject.profile.username, 'Send', "Cancel", 'Type in your feedback?', "", true, true, false,
				function (data) {
				
					$scope.popover.hide();
					
					if (typeof data === "undefined")
						return false;
					var res = JSON.parse(data);
					if (res.body == "")
						return false;
					if (res.status == "cancel")
						return false;
					if (res.body.length <= 30) {
						var message = 'Feedback from: ' + mainObject.profile.username + '<br/> Message: <br/>' + res.body; 
						mainObject.sendFeedBack(message);
						$('#homeMenu').trigger("click");
						mainObject.showInterstitialAd();
					}
				}, function () {
					alert("error");
				});

			};
			
			
			$scope.share = function () {
		
				var share = new Share();
				
				share.show({
					subject : 'The new way to find someone Live Chat - Meet New people',
					text : 'https://play.google.com/store/apps/details?id=com.livechat.dating'
				},
					function () {
					$scope.popover.hide();
				},
					function () {			
					mainObject.showToAst("Share failed");
				} 
				);
				
			}
			
			$scope.rate_app = function () {
				window.open('market://details?id=com.livechat.dating', '_system');
				$scope.popover.hide();
			}
			
			
		},
		
		sendFeedBack: function (message) {
			
			var mainObject = this;
			
			mainObject.new_showLoading();
			var result = sendMyFeedBack();
			
			result.then(function (res) {				
				mainObject.showToAst(res);
				cordova.plugin.pDialog.dismiss();
			})
			
			function sendMyFeedBack() {
				
				var d = $q.defer();

				var data = {					
					username : message,
					method : "sendFeedBack"
				}
				
				mainObject.request('user.php', data, this, function (_data, mainObject) {
					d.resolve(_data);

				});

				return d.promise;
				
			}
			
		},
		
		initBaseUrl : function () {
			
			var _mainObject = this;
			
			$.ajax({
				url : 'http://kazanlachani.com/ify/services/getBaseUrl.php',
				type : 'POST',
				dataType : 'json',
				data : null,
				cashe : false,
				success : function (_data) {
					
					var data = JSON.parse(JSON.stringify(_data[0]));
					
					_mainObject.chat_url = JSON.parse(JSON.stringify(data)).chat_url;
					_mainObject.chat_photo_url = JSON.parse(JSON.stringify(data)).chat_photo_url;
					_mainObject.main_url = JSON.parse(JSON.stringify(data)).main_url;
					_mainObject.photo_url = JSON.parse(JSON.stringify(data)).photo_url;
					_mainObject.baseUrl = JSON.parse(JSON.stringify(data)).baseUrl;
					$rootScope.payment_value = JSON.parse(JSON.stringify(data)).payment_value;
					
					//version of app
					_mainObject.pack_state = JSON.parse(JSON.stringify(data)).pack_state;
					_mainObject.pack_name = JSON.parse(JSON.stringify(data)).pack_name;
					
				},
				
				error : function (err) {
					return "error";
				}
				
			});
			
		},
		
		
		payPalDialog : function () {

			var mainObject = this;
			
			$rootScope.pay_pal = function () {

				var pay_pal_id = '9Q2PE62GP663W';
				var my_notify_url = 'http://kazanlachani.com/ify/services/paypal.php?user_id=' + mainObject.profile.id;

				var STARTURL = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=' + pay_pal_id + "&notify_url=" + my_notify_url;

				window.open(STARTURL, '_blank', 'location=no,enableViewportScale=yes');

				var result = mainObject.alert("Live Chat Super Powers", "Thank you if you paid via PayPal. Live Chat will activate your super account now.");
				$rootScope.paypal.hide();

				result.then(function (result) {

					if (result) {

						mainObject.new_showLoading();
						$timeout(function () {

							var result_paypal = mainObject.refreshPayPalProfile();

							result_paypal.then(function (res) {

								if (res) {

									cordova.plugin.pDialog.dismiss();

									if ($rootScope.profile.isPayment > 0) {
										mainObject.showToAst("Thanks, your profile has been successfully activated!");
										$window.location.reload(true);
									} else {
										mainObject.showToAst("Sorry, your payment was not successful!");
										mainObject.setNagativePayPal();
									}

								}

							});

						}, 10000);

					}

				});

			}

			$rootScope.closePaymentModal = function () {

				$rootScope.paypal.hide();
			}

			if (mainObject.profile.isPayment <= 0) {
				$ionicModal.fromTemplateUrl('views/paypal.html', function (modal) {

					$rootScope.paypal = modal;
					$rootScope.paypal.show();
				}, {
					scope : $rootScope,
					animation : 'fade-in'
				});
			}
		},

		setNagativePayPal : function () {

			var d = $q.defer();

			var data = {
				id : this.profile.id,
				method : 'setNagativePayPal'
			}

			this.request("user.php", data, this, function (_data, mainObject) {

				d.resolve(true);
			})

			return d.promise;

		},

		checkForPayPal : function (user) {

			var mainObject = this;
			var result = true;
			
			//can`t chat with vip user
			if ((user.isPayment > 0) && (mainObject.profile.isPayment <= 0)) {
				mainObject.payPalDialog();
				return false;
			}
			
			if (mainObject.profile.isPayment <= 0) {
				var hasUser = mainObject.check_freeChatUsers(user.id);
				
				// user chat limit max 5
				if (!hasUser) {
					if ($rootScope.payPalCounter >= $rootScope.maxPayPalCounter) {
						mainObject.payPalDialog();
						result = false;
					}
				}
				
			}

			return result;
		},
		
		
		check_freeChatUsers : function (user_id) {

			if ($rootScope.freeChatUsers.length > 0) {
				var hasCashedUser = false;
				for (var i in $rootScope.freeChatUsers) {
					if (user_id == $rootScope.freeChatUsers[i])
						hasCashedUser = true;
				}
				return hasCashedUser;

			}

			var data = {
				user_id : this.profile.id,
				method : "freeChatUsers"
			}

			var hasUser = false;
			this.chatRequest(data, this, function (_data, mainObject) {

				var users = $.parseJSON(JSON.stringify(_data));
				$rootScope.payPalCounter = users.length;
				for (var i in users) {

					var user = users[i];
					$rootScope.freeChatUsers.push(user.send_to);
				}

			});

			return hasUser;
		},
		
		refreshPayPalProfile : function () {

			var d = $q.defer();

			var data = {
				id : this.profile.id,
				method : 'getUserById'
			}

			var result = true;
			var user = null;

			this.request("user.php", data, this, function (_data, mainObject) {

				result = (_data.length > 0) ? true : false;

				if (result) {

					var _data = $.parseJSON(JSON.stringify(_data));

					user = _data[0];

					if (user.username.length > 15)
						user.username = user.username.substring(0, 15).toLowerCase();

					if (user.action != null)
						user.action = user.action.replace(/<[^>]+>[^<]*<[^>]+>|<[^\/]+\/>/ig, "");
					else
						user.action = "";

					user = mainObject.replaceImage(user);

					mainObject.profile = user;
					$rootScope.profile = user;
					$rootScope.profile.user_active = (user.isPayment > 0) ? " - Active" : " - Demo";

					localStorage.setItem('profile', JSON.stringify(user));

					d.resolve(true);

				}
			})

			return d.promise;

		},
		
		InitAdMob: function (mode) {
			
			if (admob) {
																
				admob.setOptions({
					publisherId : this.admob_android_key,
					interstitialAdId: this.interstitial,					
					bannerAtTop : false,
					offsetTopBar : false,
					overlap : false,				
					autoShowInterstitial: false
			
				});
				
			}
			
			if (mode)
				admob.createBannerView();												
			else
				admob.requestInterstitialAd();	
			
						
		},
		
		onResume: function () {
			admob.requestInterstitialAd();			
		},
		
		showInterstitialAd: function () {
			
			var mainObject = this;
			var d = $q.defer();
			
			admob.showInterstitialAd(function () {	
			
				$timeout(function () {						
					mainObject.InitAdMob(false);									
				}, 3000);
				d.resolve(true);
						
			}, function () {
				alert("error ads!")
			});	

			return d.promise;			
			
		},
		
		set_viewFrontEnd: function () {
			$rootScope.viewFrontEnd++;						
			if ($rootScope.viewFrontEnd == $rootScope.MaxViewFrontEnd){		
				this.initAdsCounters();
				this.showInterstitialAd();				
			}	
		},
		
		checkRandUser : function (user) {

			user.shortName = user.username;
			if (user.shortName.length > 7)
				user.shortName = user.shortName.substring(0, 7).toLowerCase() + ', ' + user.age;
			else
				user.shortName = user.username + ', ' + user.age;

			return user;

		},

		initSettings : function () {

			//cashed
			this.setting = localStorage.getItem('Settings');

			if (this.setting != null) {

				this.setting = JSON.parse(this.setting);
				$rootScope.setting = this.setting;

			} else {
				
				/* default value */
				var _man = (this.profile.gender == 'Man') ? false : true;
				var _woman = (this.profile.gender == 'Man') ? true : false;

				var _settings = {

					man : _man,
					woman : _woman,
					photo : true,
					sound : true,
					distance : 500,
					age_from : 18,
					age_to : 40,
					location : false
				}

				localStorage.setItem('Settings', JSON.stringify(_settings));
				this.setting = _settings;
				$rootScope.setting = this.setting;
			}

		},

		request : function (_file, _data, mainObject, results) {

			$.ajax({
				url : this.baseUrl + '/' + _file,
				type : 'POST',
				dataType : 'json',
				data : _data,
				cashe : false,
				success : function (data) {
					results(data, mainObject);
				},

				error : function (err) {
					return "error";
				}

			});

		},

		chatRequest : function (_data, mainObject, results) {

			$.ajax({
				url : this.chat_url,
				type : 'POST',
				dataType : 'json',
				data : _data,
				cashe : false,
				success : function (data) {
					results(data, mainObject);
				},

				error : function (err) {
					return "error";
				}

			});

		},

		update : function (user_info) {

			if (!user_info.email)
				return false;

			if (!user_info.age.age)
				return false;

			if (!user_info.gender.name)
				return false;

			var params = {

				id : this.profile.id,
				email : user_info.email,
				age : user_info.age.age,
				gender : user_info.gender.name,
				descr : user_info.descr,

				method : "update"
			}

			var result = true;
			var user = null;

			this.request('user.php', params, this, function (_data, mainObject) {

				result = (_data.length > 0) ? true : false;

				if (result) {

					var _data = $.parseJSON(JSON.stringify(_data));
					user = _data[0];

					if (user.action != null)
						user.action = user.action.replace(/<[^>]+>[^<]*<[^>]+>|<[^\/]+\/>/ig, "");
					else
						user.action = "";

					user = mainObject.replaceImage(user);

					if (user.username.length > 15)
						user.username = user.username.substring(0, 15).toLowerCase();

					localStorage.setItem('profile', JSON.stringify(user));

				}

			});

			this.profile = user;

			return user;

		},

		facebookRegister : function () {

			var _mainObject = this;
			
			FB.init({
				appId : "464797650545482",
				nativeInterface : CDV.FB,
				useCachedDialogs : false
			});

			var d = $q.defer();

			function me(response) {
				// user has auth'd your app and is logged into Facebook
				FB.api('/me', 'get', { access_token: response.authResponse.accessToken, fields: 'id,name,gender, email, birthday,about' }, function(res) {
					var user = _mainObject.make_user_profile_by_Social(res, 3);
					d.resolve(user);
					
				});
			}

			FB.Event.subscribe('auth.login', function (response) {
				//
			});

			FB.Event.subscribe('auth.logout', function (response) {
				//
			});

			FB.Event.subscribe('auth.sessionChange', function (response) {
				//
			});

			FB.Event.subscribe('auth.statusChange', function (response) {
				//
			});

			FB.login(
				function (response) {

				if (response.authResponse) {
					me(response);
				} else {
					alert("error");
				}

			},{ scope: 'public_profile' });

			return d.promise;

		},

		registerByGoogle : function () {

			var _mainObject = this;
			var d = $q.defer();
			
			window.plugins.googleplus.login(
				{},
				function (obj) {
						
				  // obj.imageUrl;
				  var resp  = {
						name: obj.displayName,
						email: obj.email,
						ThumbName: obj.imageUrl						
				  }
				  
				  var user = _mainObject.make_user_profile_by_Social(resp, 2);
				  d.resolve(user);
				},
				function (msg) {
				    //
				}
			);
			
			return d.promise;
		},

	
		make_user_profile_by_Social : function (resp, social_type) {

			this.new_showLoading();
			
			var _email = (resp.email != null) ? resp.email : "";

			var data = {
				username : resp.name,
				password : "",
				email : _email,
				method : 'getUserByName'
			};
			
			var user = null;
			this.request('user.php', data, this, function (_data, mainObject) {

				var result = (_data.length > 0) ? true : false;
				if (result){
					
					var _data = $.parseJSON(JSON.stringify(_data));
					user = _data[0];
					
					if ((user.username == resp.name) && (user.email == resp.email)) {
						user = mainObject.replaceImage(user);
						
						if ((social_type == 2) && (typeof resp.ThumbName != "undefined")){
							user.ThumbName = resp.ThumbName;
							user.ImageName = resp.ThumbName;
						}
							
						if (user.username.length > 15)
							user.username = user.username.substring(0, 15).toLowerCase();
						
						localStorage.setItem('profile', JSON.stringify(user));
					}
				}
				else 
				{

					var reg_email = (resp.email != null) ? resp.email : "info@kazanlachani.com";
					
					var _age = 18;
					var _descr = "";
					var _gender = 'Man';
					var _face_data = "";
					
					if (social_type == 3) _face_data = resp.id;
					
					if ((social_type == 2) && (typeof resp.ThumbName != "undefined"))
						_face_data = resp.ThumbName;
					else if (social_type == 2)
						_face_data = mainObject.main_url + 'images/man_icon.png';
						
					var data = {
						username : resp.name,
						password : mainObject.randomstring(10),
						email : reg_email,
						registration_type : social_type,
						faceUserName : _face_data
					};
					
					user = mainObject.register(data);
					
					if (social_type == 3) {
						
						if(typeof resp.birthday != "undefined") 
							_age = mainObject.get_user_facebook_birthday(resp);
						
						
						if(typeof resp.about != "undefined") 
							_descr = resp.about;
						
						user = mainObject.replaceImage(user);
						
					}
								
					if(typeof resp.gender != "undefined") 
						_gender = (resp.gender == 'male') ? "Man" : "Woman";
					
					// info data
					var update_data = {
						email : reg_email,

						age : {
							age : _age
						},
						gender : {
							name : _gender
						},

						descr : _descr

					}
					
					//update user profile
					user = mainObject.update(update_data);
					
					if ((social_type == 2) && (typeof resp.ThumbName != "undefined")){
						user.ThumbName = resp.ThumbName;
						user.ImageName = resp.ThumbName;
					}
					else if (social_type == 2){
						user.ThumbName = mainObject.main_url + 'images/man_icon.png';
						user.ImageName = mainObject.main_url + 'images/man_icon.png';	
					}
						
					
					if (user.username.length > 15)
						user.username = user.username.substring(0, 15).toLowerCase();
					
					localStorage.setItem('profile', JSON.stringify(user));		
					
				}
					
			});
			
			return user;

		},

		login : function (login) {

			var data = {
				username : login.username,
				password : login.password,
				registration_type : 1,
				method : "SignIn"
			};

			var result = true;
			var user = null;
			var d = $q.defer();
			this.request('user.php', data, this, function (_data, mainObject) {

				result = (_data.length > 0) ? true : false;

				if (result) {

					var _data = $.parseJSON(JSON.stringify(_data));
					user = _data[0];

					if (user.action != null)
						user.action = user.action.replace(/<[^>]+>[^<]*<[^>]+>|<[^\/]+\/>/ig, "");
					else
						user.action = "";

					user = mainObject.replaceImage(user);
					d.resolve(user);

					if (user.username.length > 15)
						user.username = user.username.substring(0, 15).toLowerCase();

					user.user_active = (user.isPayment > 0) ? " - Active" : " - Demo";
					
					$rootScope.isAdmin = user.admin > 0;
					
					localStorage.setItem('profile', JSON.stringify(user));

				} else
					d.resolve(user);

			});

			this.profile = user;

			return d.promise;

		},

		register : function (register) {

			if (!register.username)
				return false;

			if (!register.password)
				return false;

			if (!register.email)
				return false;

			if (register.registration_type == 1) {
				if ((!register.gender) || (register.gender.gender == ""))
					return false;

				if ((!register.age) || (register.age.age == ""))
					return false;
			}

			var data = {
				username : register.username,
				password : register.password,
				email : register.email,
				registration_type : register.registration_type,
				faceUserName : register.faceUserName,
				method : "insert"
			};

			var user = null;

			this.request('user.php', data, this, function (_data, mainObject) {

				if (_data == 1) {
					mainObject.showToAst("Sorry username already taken.Please choose another!");
					return false;

				} else {
					var result = (_data.length > 0) ? true : false;
					if (result) {

						var _data = $.parseJSON(JSON.stringify(_data));
						user = _data[0];
						user = mainObject.replaceImage(user);

						if (user.username.length > 15)
							user.username = user.username.substring(0, 15).toLowerCase();

						localStorage.setItem('profile', JSON.stringify(user));

					}
				}

			});

			this.profile = user;

			return user;

		},

		logOut : function (state) {

			localStorage.removeItem('profile');
			localStorage.removeItem('AppRate');

			if (state)
				localStorage.removeItem('my_history');
			
			/*
			window.plugins.googleplus.logout(
				function (msg) {
					//
				},
				function (msg) {
				  //
				}
			);
			
			window.plugins.googleplus.disconnect(
				function (msg) {
					//
				},
				function (msg) {
				  //
				}
			);
			*/
		},

		getRandUser : function ($scope) {

			var mainObject = this;
			this.new_showLoading();
			var result = this.randomUser();

			result.then(function (user) {
			
				user = mainObject.checkRandUser(user);
				$scope.user = user;
				
				var result = mainObject.userProfileImages(user.id);
			
				result.then(function (images) {	
				
					$scope.images = images;		
					$scope.currentIndex = 0;
					$scope.imgLoadIsDone = function () {
						$timeout(function () {
							cordova.plugin.pDialog.dismiss();
							$ionicScrollDelegate.scrollTop();
						});
					}
				});				
				
			})

		},

		randomUser : function () {

			var mainObject = this;
			var d = $q.defer();

			// if not cashed make request
			var _gender = (this.profile.gender == 'Man') ? "Woman" : "Man";

			var data = {
				gender : _gender,
				method : 'random_users'
			}

			var _users = [];
			this.request('user.php', data, this, function (_data, mainObject) {

				var users = JSON.parse(JSON.stringify(_data));

				for (var i in users) {
					var _user = users[i];
					_user = mainObject.user_check(_user);
					_user = mainObject.checkRandUser(_user);
					_users.push(_user);
				}

				mainObject.cashed_rand_users = _users;

				d.resolve(mainObject.cashed_rand_users[0]);
			});

			return d.promise;

		},
		
		user_check : function (user) {

			if (user.action != null)
				user.action = user.action.replace(/<[^>]+>[^<]*<[^>]+>|<[^\/]+\/>/ig, "");
			else
				user.action = "";

			var _gender = (user.gender == 'Man') ? "Male" : "Female";
			user.gender = _gender;

			if (user.username.length > 15)
				user.username = user.username.substring(0, 15).toLowerCase();

			user = this.replaceImage(user);

			return user;

		},

		search : function (searchType) {

			this.cashed_messages = [];
			this.cashed_chat_messages = [];
			this.cashed_favorites = [];
			this.cashed_visitors = [];
			this.cashed_populars = [];
			this.cashed_online_users = [];
			this.cashed_likes = [];

			var mainObject = this;
			var d = $q.defer();
			
			if (!searchType) {
				if (mainObject.cashed_people.length > 0) {
					d.resolve(mainObject.cashed_people);
					return d.promise;
				}
			} else {
				if (mainObject.cashed_nearby.length > 0) {
					d.resolve(mainObject.cashed_nearby);
					return d.promise;
				}
			}

			$timeout(function () {
				
				var result = mainObject.do_userSearch(searchType);
				
				result.then( function (users) {
					
					var res = (searchType) ? mainObject.cashed_nearby = users : mainObject.cashed_people = users;					
					d.resolve(users);
				})

			}, 2000);

			return d.promise;

		},

		do_userSearch : function (searchType) {

			var d = $q.defer();
			var _man_gender = (this.setting.man) ? "Man" : "";
			var _woman_gender = (this.setting.woman) ? "Woman" : "";
			var photo = (!this.setting.photo) ? "" : true;

			var _age_from = (this.setting.age_from != null) ? this.setting.age_from : "";
			var _age_to = (this.setting.age_to != null) ? this.setting.age_to : "";

			if ((!_man_gender) && this.profile.gender == 'Man') {

				_woman_gender = 'Woman';
				photo = (this.setting.photo) ? true : "";

			}

			if ((!_woman_gender) && this.profile.gender == 'Woman') {

				_man_gender = 'Man';
				photo = (this.setting.photo) ? true : "";
			}

			var _method = (searchType) ? "nearbySearch" : "peopleSearch";

			var params = {
				id : this.profile.id,
				man_gender : _man_gender,
				woman_gender : _woman_gender,
				with_image : photo,
				age_from : _age_from,
				age_to : _age_to,
				distance : this.setting.distance,
				method : _method
			}

			var users = [];

			this.request("user.php", params, this, function (_data, mainObject) {

				users = JSON.parse(JSON.stringify(_data));
				users = mainObject.ImageCtrl(users, true);
				d.resolve(users);
			})

			return d.promise;
		},

		populars : function () {

			var d = $q.defer();

			var mainObject = this;

			if (this.cashed_populars.length > 0) {
				d.resolve(this.cashed_populars);
				return d.promise;
			}

			$timeout(function () {

				var params = {
					method : 'most_popular'
				}

				var populars = [];

				mainObject.request("user.php", params, mainObject, function (_data, mainObject) {

					$rootScope.popular_count = _data.length;
					populars = JSON.parse(JSON.stringify(_data));
					populars = mainObject.ImageCtrl(populars, true);
					mainObject.cashed_populars = populars;
					d.resolve(populars);

				})
			}, 500);

			return d.promise;

		},

		vipUsers : function () {

			var d = $q.defer();

			var mainObject = this;
			
			if (mainObject.cashed_vip_users.length > 0) {
				d.resolve(mainObject.cashed_vip_users);
				return d.promise;
			}

			$timeout(function () {

				var _man_gender = "";
				var _woman_gender = "";

				if (mainObject.profile.gender == 'Woman')
					_man_gender = "Man";
				else
					_woman_gender = "Woman";

				var params = {
					man_gender : _man_gender,
					woman_gender : _woman_gender,
					method : 'vipUsers'
				}

				var vip_users = [];

				mainObject.request("user.php", params, mainObject, function (_data, mainObject) {
					
					vip_users = JSON.parse(JSON.stringify(_data));
					vip_users = mainObject.ImageCtrl(vip_users, true);
					mainObject.cashed_vip_users = vip_users;					
					$rootScope.cashed_vip_users_count  = vip_users.length;
					
					d.resolve(vip_users);

				})
			}, 500);

			return d.promise;

		},
		messages : function () {

			var d = $q.defer();

			if (this.cashed_messages.length > 0) {
				d.resolve(this.cashed_messages);
				return d.promise;
			}

			var data = {
				id : this.profile.id,
				method : "userChats"
			}

			var messages = [];
			this.request("user.php", data, this, function (_data, mainObject) {

				messages = JSON.parse(JSON.stringify(_data));

				for (var i in messages) {
					var message = messages[i];
					messages[i] = message;

				}

				messages = mainObject.ImageCtrl(messages, false);
				mainObject.cashed_messages = messages;
				d.resolve(messages);

			})

			$rootScope.messages_count = messages.length;
			return d.promise;

		},

		DeleteChatMessage : function (user_id) {

			var data = {
				state : 0,
				user_id : this.profile.id,
				send_to : user_id,
				method : "updateState"
			}

			this.chatRequest(data, this, function (_data, mainObject) {
				mainObject.cashed_messages = [];
			});

		},
		
		DeleteChatAllMessage : function (_userIds) {

			var data = {
				state : 0,
				user_id : this.profile.id,
				userIds : _userIds,
				method : "updateMessagesState"
			}

			this.chatRequest(data, this, function (_data, mainObject) {				
				mainObject.cashed_messages = [];
			});

		},

		send_photo : function ($scope, user_id) {

			var mainObject = this;
			// Retrieve image file location from specified source
			navigator.camera.getPicture(uploadPhoto, function (message) {
				//
			}, {
				quality : 50,
				destinationType : navigator.camera.DestinationType.FILE_URI,
				sourceType : navigator.camera.PictureSourceType.PHOTOLIBRARY
			});

			function uploadPhoto(imageURI) {
				var options = new FileUploadOptions();
				options.fileKey = "file";
				options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
				options.mimeType = "image/jpeg";

				var params = new Object();

				params.id = user_id;
				params.username = mainObject.profile.username;
				options.params = params;

				options.chunkedMode = true;

				var ft = new FileTransfer();
				mainObject.new_showLoading();

				$timeout(function () {
					ft.upload(imageURI, mainObject.chat_photo_url, win, fail, options);
                }, 500);

			}

			function win(r) {

				cordova.plugin.pDialog.dismiss();
                var text = 'New photo notification...';
                var image = JSON.parse(r.response);
                var message = {
                    user_id : mainObject.profile.id,
                    send_to : user_id,
                    username : mainObject.profile.username,
                    date : mainObject.timeNow(true),
                    message : text,
                    ImageName : mainObject.main_url + image.ImageName,
                    ThumbsName : mainObject.main_url + image.ThumbsName,
                    ChatImageName : mainObject.main_url + image.ImageName,
                    ChatThumbsName : mainObject.main_url + image.ThumbsName,
                    code : 2,
                    state : 1,
                    status : 0
                }
                mainObject.do_send_message($scope, message, $ionicScrollDelegate);
			}

			function fail(error) {
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);
				mainObject.showToAst("Error while uploading photo!");
			}

		},

		chatMessages : function (limitedMessage) {

			if (limitedMessage)
				this.limitedMessage += this.limitedMessage;
			else
				this.limitedMessage = 10;

			var data = {
				user_id : this.profile.id,
				send_to : this.user_Id,
				limitedMessage : this.limitedMessage,
				method : 'limit_load'
			}

			var chatMessages = [];
			var d = $q.defer();
			var user = null;

			this.chatRequest(data, this, function (_data, mainObject) {

				chatMessages = JSON.parse(JSON.stringify(_data));

				for (var i in chatMessages) {

					var chat = chatMessages[i];

					if ((!user) && (chat.user_id != mainObject.profile.id))
						user = mainObject.userProfile(chat.user_id);

					var curr_user = (chat.user_id == mainObject.profile.id) ? mainObject.profile : user;

					var _ImageName = (chat.ImageName != "") ? chat.ImageName : "";
					var _ThumbsName = (chat.ThumbsName != "") ? chat.ThumbsName : "";

					var new_chat = {
						id : chat.id,
						user_id : chat.user_id,
						send_to : chat.send_to,
						username : chat.username,
						date : chat.date,
						message : chat.message,
						code : chat.code,
						ImageName : curr_user.ImageName,
						ThumbName : curr_user.ThumbName,
						ChatImageName : _ImageName,
						ChatThumbsName : _ThumbsName,
						status : chat.status,

					}

					chatMessages[i] = new_chat;
					mainObject.cashed_chat_messages[i] = new_chat;
				}

				d.resolve(chatMessages);

			})

			return d.promise;

		},

		send_message : function (message) {

			var text = message.message;
			text = text.replace(/^\s+|\s+$/g, "");
			var data = {
				username : this.profile.username,
				message : text,
				user_id : this.profile.id,
				send_to : this.user_Id,
				ImageName : message.ImageName,
				ThumbsName : message.ThumbsName,
				code : message.code,
				method : 'insert'
			}

			var d = $q.defer();
			this.chatRequest(data, this, function (_data, mainObject) {
				d.resolve(true);
			})

			return d.promise;

		},

		send_notify_message : function (message) {

			var d = $q.defer();

			var _message;

			if (message.code == 0)
				_message = message.message;
			else if (message.code == 1)
				_message = 'Emoji notification';
			else if (message.code == 2)
				_message = 'Photo notification';

			$.ajax({
				url : 'http://ifymessages.herokuapp.com/insert.php?user_id=' + this.profile.id + '&send_to=' + this.user_Id + '&username=' + this.profile.username + '&message=' + _message + '&state=' + message.state + '&versionCode=' + message.versionCode + '',
				type : 'POST',
				success : function (res) {					
					d.resolve(true);
				}
			});

			return d.promise;

		},

		add_favorite : function ($scope, user_id) {

			this.cashed_favorites = [];

			var data = {
				user_id : this.profile.id,
				send_to : user_id,
				method : 'insert'
			}

			this.request("favorites.php", data, this, function (_data, mainObject) {

				$timeout(function () {

					$rootScope.favorites_count++;
					$scope.isAddFavorite = false;
					$scope.isRemoveFavorite = true;
				}, 500);

			})

		},

		remove_favorite : function ($scope, user_id) {

			this.cashed_favorites = [];
			var data = {
				user_id : this.profile.id,
				send_to : user_id,
				method : 'removeFavorite'
			}

			this.request("favorites.php", data, this, function (_data, mainObject) {
				$rootScope.favorites_count--;
				$scope.isAddFavorite = true;
				$scope.isRemoveFavorite = false;
			})

		},

		favorites : function () {

			var d = $q.defer();

			if (this.cashed_favorites.length > 0) {
				d.resolve(this.cashed_favorites);
				return d.promise;
			}

			var data = {
				user_id : this.profile.id,
				method : 'load'
			}

			var favorites = [];

			this.request("favorites.php", data, this, function (_data, mainObject) {
				favorites = JSON.parse(JSON.stringify(_data));
				favorites = mainObject.ImageCtrl(favorites, false);
				mainObject.cashed_favorites = favorites;
				d.resolve(favorites);

			})
			$rootScope.favorites_count = favorites.length;
			return d.promise;

		},

		check_visitor : function (user_id) {

			var data = {
				user_id : user_id,
				send_to : this.profile.id,
				method : 'check_visitor'
			}

			var result;

			this.request("visitors.php", data, this, function (_data, mainObject) {

				if (_data > 0)
					result = false;
				else
					result = true;

			});

			return result;

		},

		remove_visitors : function () {
			this.cashed_visitors = [];
			var data = {
				user_id : this.profile.id,
				method : 'remove_visitors'
			}

			this.request("visitors.php", data, this, function (_data, mainObject) {
				//
			});

		},

		add_visitor : function (user_id) {

			this.cashed_visitors = [];
			this.new_showLoading();
			var data = {
				user_id : user_id,
				send_to : this.profile.id,
				method : 'insert'
			}

			this.request("visitors.php", data, this, function (_data, mainObject) {

				cordova.plugin.pDialog.dismiss();
			});

		},

		visitors : function () {

			var d = $q.defer();

			if (this.cashed_visitors.length > 0) {
				d.resolve(this.cashed_visitors);
				return d.promise;
			}

			var data = {
				user_id : this.profile.id,
				method : 'load'
			}

			var visitors = [];

			this.request("visitors.php", data, this, function (_data, mainObject) {
				visitors = JSON.parse(JSON.stringify(_data));
				visitors = mainObject.ImageCtrl(visitors, false);
				mainObject.cashed_visitors = visitors;
				d.resolve(visitors);

			})

			$rootScope.visitors_count = visitors.length;

			return d.promise;

		},

		ImageCtrl : function (_objects, hasSplitName) {

			for (var i in _objects) {

				var _object = _objects[i];

				_object.p_gender = (_object.gender == 'Man') ? 'm' : 'f';

				if ((hasSplitName) && (_object.username != null)) {
					if (_object.username.length > 15)
						_object.username = _object.username.substring(0, 15).toLowerCase();
					
					_object.shortName = _object.username.substring(0, 7).toLowerCase().trim();
					if (_object.username.length > 7)
							_object.shortName += '...';
						
					_object.shortName = _object.shortName.replace("-", '');
				}

				if (_object.action != null)
					_object.action = _object.action.replace(/<[^>]+>[^<]*<[^>]+>|<[^\/]+\/>/ig, "");
				else
					_object.action = "";

				if (_object.registration_type == 3) {
					
					 if (_object.ThumbName != null)
					 {
						_object.ImageName = this.main_url + _object.ThumbName;
						_object.ThumbName = this.main_url + _object.ThumbName;
					 }
					 else
					 {
						_object.ImageName = "https://graph.facebook.com/" + _object.faceUserName + "/picture?width=320&height=480";
						_object.ThumbName = "https://graph.facebook.com/" + _object.faceUserName + "/picture?type=small";
					 }
					
				} 
				
				else if (_object.registration_type == 2) {
					
					 if (_object.ThumbName != null)
					 {
						_object.ImageName = this.main_url + _object.ThumbName;
						_object.ThumbName = this.main_url + _object.ThumbName;
					 }
					 else
					 {
						_object.ImageName =  _object.faceUserName;
						_object.ThumbName = _object.faceUserName;
					 }
					
				} 
				
				else if (_object.ThumbName != null) {
					_object.ImageName = this.main_url + _object.ImageName;
					_object.ThumbName = this.main_url + _object.ThumbName;
				} else {
					var _gender = (_object.gender == 'Man') ? 'images/man_icon.png' : 'images/female_icon.png';

					_object.ImageName = this.main_url + _gender;
					_object.ThumbName = this.main_url + _gender;

				}

				_objects[i] = _object;
			}

			return _objects;
		},

		replaceImage : function (_object) {

			if (_object.registration_type == 3) {
				_object.ImageName = "https://graph.facebook.com/" + _object.faceUserName + "/picture?type=large";
				_object.ThumbName = "https://graph.facebook.com/" + _object.faceUserName + "/picture?type=small";
			} else if (_object.ThumbName != null) {
				_object.ThumbName = this.main_url + _object.ThumbName;
				_object.ImageName = this.main_url + _object.ImageName;
			} 
			
			else if (_object.registration_type == 2) {
					
				 if (_object.ThumbName != null)
				 {
					_object.ImageName = this.main_url + _object.ThumbName;
					_object.ThumbName = this.main_url + _object.ThumbName;
				 }
				 else
				 {
					_object.ImageName =  _object.faceUserName;
					_object.ThumbName = _object.faceUserName;
				 }
				
			} 
			
			else {
				var _gender = (_object.gender == 'Man') ? 'images/man_icon.png' : 'images/female_icon.png';

				_object.ThumbName = this.main_url + _gender;
				_object.ImageName = this.main_url + _gender;

			}

			return _object;
		},

		bool : function (b) {
			return !(/^(false|0)$/i).test(b) && !!b;
		},

		alert : function (title, message) {

			var d = $q.defer();

			var alertPopup = $ionicPopup.alert({
					title : title,
					template : message
				});

			alertPopup.then(function (res) {
				d.resolve(true);
			});

			return d.promise;

		},

		searchPopup : function (_title, _subTitle, type) {
			var myPopup = $ionicPopup.show({
					template : '<input type="' + type + '" ng-model="data.text">',
					title : _title,
					subTitle : _subTitle,
					scope : $rootScope,
					buttons : [{
							text : 'Cancel'
						}, {
							text : '<b>OK</b>',
							type : 'button-positive',
							onTap : function (e) {
								if (!$rootScope.data.text) {
									//don't allow the user to close unless he enters wifi password
									e.preventDefault();
								} else {
									return $rootScope.data.text;
								}
							}
						},
					]
				});

			return myPopup;
		},

		confirm : function (text) {

			var confirmPopup = $ionicPopup.confirm({
					title : "Confirm",
					template : text
				});

			return confirmPopup;

		},

		nativeConfirm : function (title, descr, result) {

			var confirm = new Confirm();

			confirm.openConfirm(title, descr, "Cancel", "", "OK", function (data) {

				if (typeof data === "undefined") {
					alert("Error data is undefined report as a bug");
					result(false);
				}

				var res = JSON.parse(data);

				if (res.body == "") {
					alert("Error response body is empty report as a bug");
					result(false);
				}

				if (res.body == "cancel") {
					result(false);
				}

				if (res.body == "confirm") {
					result(true);
				}

			}, function () {
				alert("Error while show confirm button.See xml file or report as a bug!");
			});

		},

		searchByName : function (username) {

			var data = {
				id : this.profile.id,
				with_name : username,
				method : "allUsersByName"
			}

			var d = $q.defer();
			var users = [];
			this.request("user.php", data, this, function (_data, mainObject) {

				users = JSON.parse(JSON.stringify(_data));

				if (users.length > 0) {

					users = mainObject.ImageCtrl(users, true);

					d.resolve(users);

				} else
					d.resolve(null);

			})

			return d.promise;

		},

		userProfile : function (id) {

			var data = {
				id : id,
				method : 'getUserById'
			}

			var result = true;
			var user = null;

			this.request("user.php", data, this, function (_data, mainObject) {

				result = (_data.length > 0) ? true : false;

				if (result) {

					var _data = $.parseJSON(JSON.stringify(_data));
					user = _data[0];

					if (user.username.length > 15)
						user.username = user.username.substring(0, 15).toLowerCase();

					if (user.action != null)
						user.action = user.action.replace(/<[^>]+>[^<]*<[^>]+>|<[^\/]+\/>/ig, "");
					else
						user.action = "";

					user = mainObject.replaceImage(user);

				}
			})

			return user;

		},

		userProfileImages : function (id) {

			var params = {
				id : id,
				method : "userImages"
			}

			var result = true;
			var userImages = [];
			var d = $q.defer();

			this.request("user.php", params, this, function (_data, mainObject) {

				var images = JSON.parse(JSON.stringify(_data));

				if (images.length > 0) {
					$.each(images, function (index, image) {
						image = mainObject.replaceImage(image);
						userImages.push(image);
					});

				}

				d.resolve(userImages);

			})

			return d.promise;

		},

		initHistory : function (user) {

			//add to history
			if (this.my_history == null) {
				this.my_history = [];
				this.addHistory(user);
			} else {
				var hasFound = false;

				for (var i in this.my_history) {
					var _user = this.my_history[i];
					if (_user.id == user.id) {
						hasFound = true;
						break;
					}
				}

				if (!hasFound)
					this.addHistory(user);
			}

		},

		addHistory : function (user) {

			this.my_history.push(user);
			localStorage.setItem('my_history', JSON.stringify(this.my_history));
			$rootScope.history_count++;
		},

		myHistory : function () {

			var d = $q.defer();
			this.my_history = $.parseJSON(localStorage.getItem('my_history'));

			var users = [];
			$rootScope.history_count = 0;

			if (typeof this.my_history === "undefined")
				return false;
			if (typeof this.my_history == null)
				return false;

			for (var i in this.my_history) {
				var user = this.my_history[i];
				users.push(user);
			}

			d.resolve(users);
			$rootScope.history_count = users.length;
			return d.promise;
		},

		startTimer : function () {
			var mainObject = this;
			this.myTimer = setInterval(function () {
					var r = mainObject.appRate();

				}, 120000);
		},

		stopTimer : function () {
			clearInterval(this.myTimer);
		},

		appRate : function () {

			var mainObject = this;

			var appRate = localStorage.getItem('AppRate');

			if (!appRate) {

				mainObject.stopTimer();

				var title = "Rate Live Chat";
				var descr = "If you enjoy using Live Chat, would you mind taking a moment to rate it? It won’t take more than a minute. Thanks for your support!";

				var confirm = new Confirm();

				confirm.openConfirm(title, descr, "No, Thanks", "Remind Me Later", "Rate It Now", function (data) {

					if (typeof data === "undefined")
						return false;

					var res = JSON.parse(data);

					if (res.body == "")
						return false;

					if (res.body == "cancel") {

						mainObject.stopTimer();
						localStorage.setItem('AppRate');
						return false;
					}

					if (res.body == "other") {
						mainObject.startTimer();
						return false;
					}

					if (res.body == "confirm") {

						window.open('market://details?id=com.livechat.dating', '_system');
						mainObject.stopTimer();
						localStorage.setItem('AppRate');
						return true;
					}

				}, function () {
					alert("Error while rate this app!");

				});

			} else
				mainObject.stopTimer();

		},

		onlineUsers : function () {

			var d = $q.defer();

			if (this.cashed_online_users.length > 0) {
				d.resolve(this.cashed_online_users);
				return d.promise;
			}

			var _man_gender = ""
				var _woman_gender = "";

			if (this.profile.gender == 'Woman')
				_man_gender = "Man";
			else
				_woman_gender = "Woman";

			var data = {
				man_gender : _man_gender,
				woman_gender : _woman_gender,
				method : 'onlineUsers'
			}

			var online_users = [];

			this.request('user.php', data, this, function (_data, mainObject) {

				online_users = JSON.parse(JSON.stringify(_data));
				online_users = mainObject.ImageCtrl(online_users, true);
				mainObject.cashed_online_users = online_users;
				d.resolve(online_users);

			});

			$rootScope.online_user_count = online_users.length;
			return d.promise;

		},
		
		
		likes : function () {

			var d = $q.defer();

			if (this.cashed_likes.length > 0) {
				d.resolve(this.cashed_likes);
				return d.promise;
			}
			
			var data = {
				user_id : this.profile.id,
				method : 'load'
			}

			var likes = [];

			this.request('likes.php', data, this, function (_data, mainObject) {
				likes = JSON.parse(JSON.stringify(_data));
				likes = mainObject.ImageCtrl(likes, false);
				mainObject.cashed_likes= likes;
				d.resolve(likes);

			})

			$rootScope.likesCount = likes.length;

			return d.promise;

		},
		
		remove_likes : function () {
			this.cashed_likes = [];
			var data = {
				user_id : this.profile.id,
				method : 'remove_likes'
			}

			this.request("likes.php", data, this, function (_data, mainObject) {
				//
			});

		},

		add_like : function (user_id) {

			this.cashed_likes = [];
			this.new_showLoading();
			var data = {
				user_id : user_id,
				send_to : this.profile.id,
				method : 'insert'
			}

			this.request("likes.php", data, this, function (_data, mainObject) {
				cordova.plugin.pDialog.dismiss();
			});

		},
		
		check_likes : function (user_id) {

			var data = {
				user_id : user_id,
				send_to : this.profile.id,
				method : 'check_likes'
			}

			var result;

			this.request("likes.php", data, this, function (_data, mainObject) {

				if (_data > 0)
					result = false;
				else
					result = true;

			});

			return result;

		},
		
		userImages : function (user) {

			var mainObject = this;
			
			mainObject.new_showLoading();
			
			if (this.profile != null)
				$rootScope.canDelete = (this.profile.id == user.id) ? true : false;
			
			$timeout(function () {
						
				var result = mainObject.userProfileImages(user.id);
			
				result.then(function (images) {	
				
					$rootScope.images = images;		
					cordova.plugin.pDialog.dismiss();
					
					$rootScope.closeViewMoreModal = function () {
						$rootScope.viewMore.hide();
						$rootScope.viewMore.remove();
					}
			
					$ionicModal.fromTemplateUrl('views/view_more.html', function (modal) {

						$rootScope.viewMore = modal;
						$rootScope.viewMore.show();
					}, {
						scope : $rootScope,
						animation : 'fade-in'
					});
					
				});
						
			}, 100);

		},

		viewProfile : function (user) {
			var mainObject = this;

			//user history
			if (user.id != this.profile.id)
				mainObject.initHistory(user);

			$rootScope.closeViewMoreModal = function () {
				$rootScope.viewMore.hide();
			}

			$rootScope.view_more = function () {

				mainObject.new_showLoading();

				if (user.registration_type == 3) {

					$rootScope.images =
						[{
							ThumbName : "https://graph.facebook.com/" + user.faceUserName + "/picture?type=small",
							ImageName : "https://graph.facebook.com/" + user.faceUserName + "/picture?type=large"
						}
					];

					$timeout(function () {
						cordova.plugin.pDialog.dismiss();
					}, 500);

				}

				mainObject.userImages(user);
			}
			
			
			//my images
			if (user.id == this.profile.id)
			{
				mainObject.new_showLoading();
				
				$rootScope.canDelete = false;
				var result = mainObject.userProfileImages(user.id);

				result.then(function (images) {
					if (images.length > 0)
					{
						$rootScope.canDelete = true;
						$rootScope.myImages = images;	
					}
					else {
						
						
						$rootScope.emptyPhoto = function () {
					
							mainObject.showToAst("In the bottom left, tap the camera button and choose to take a photo, or choose an existing photo from your library.");
						}
						
						$rootScope.emptyPhoto();
						
						var myImages = [];
						myImages.push(user);
						$rootScope.myImages = myImages;
						
					}
					
					cordova.plugin.pDialog.dismiss();
					
				});
				
				
			}
			

			$rootScope.removePhoto = function (image) {

				if (mainObject.profile.id == image.UserID) //self
				{
					mainObject.nativeConfirm("Confirmation", "Remove photo?", function (res) {

						if (res) {

							$timeout(function () {

								mainObject.removeUserImage(image.id, true);
								mainObject.reloadProfile();								
								$window.history.back();

							}, 100);

						}

					});

				}

			}

			$rootScope.make_profile_photo = function (image) {

				if (image.UserID == mainObject.profile.id) {

					mainObject.nativeConfirm("Confirmation", "Make profile photo?", function (res) {

						if (res) {

							$timeout(function () {

								var data = {
									id : mainObject.profile.id,
									imageId : image.id,
									method : 'make_profile_Img'
								}

								mainObject.request("user.php", data, mainObject, function (_data, mainObject) {

									mainObject.profile.ThumbName = image.ThumbName;
									mainObject.profile.ImageName = image.ImageName;
									localStorage.setItem('profile', JSON.stringify(mainObject.profile));									
									$window.history.back();
								});

							}, 100);

						}

					});
				}
			}

		},

		showUserModalForm : function ($scope, canUpdateScope) {

			var mainObject = this;

			$scope.setProfileThumb = function (user) {
			
			    if (mainObject.profile.id != user.id) {
					
					if (mainObject.check_likes(user.id))
					{
										
						var result = mainObject.setThumb($scope);
						
						result.then(function (data) {
							$scope.user.thumb = data;
							mainObject.showToAst("Thanks for your voting!");
							mainObject.add_like(user.id);							
						});
					}
					else
						mainObject.showToAst("Sorry, you have already liked this user!");
						
					
				}
				
			}
			
			
			$scope.removeUser = function (user) {
			
			    var str = "You can report inappropriate profiles, contains nudity or pornographic photos." //"Are you sure you want to delete this user?"
				mainObject.nativeConfirm("Report user", str, function (res) {

					if (res) {

						var data = {
							id : user.id,
							reportState: 0,
							method : 'updateState'
						}

						mainObject.request("user.php", data, mainObject, function (_data, mainObject) {
							mainObject.showToAst("Thanks for reporting");
						})

					}

				});
			}
		
			//add user to favorite list
			$scope.addFavorite = function (user) {

				mainObject.nativeConfirm("Confirmation", "Add to favorites?", function (res) {

					if (res) {

						$timeout(function () {
							mainObject.add_favorite($scope, user.id);

						}, 100);

					}

				});

			}

			//remove from favorite list
			$scope.RemoveFavorite = function (user) {

				mainObject.nativeConfirm("Confirmation", "Remove from favorites?", function (res) {

					if (res) {

						$timeout(function () {
							mainObject.remove_favorite($scope, user.id);
						}, 100);

					}

				});

			}

			
			$scope.onHold = function (user) {
					
				mainObject.nativeConfirm("Confirmation", "Delete conversation?", function (res) {

					if (res) {
						mainObject.DeleteChatMessage(user.id);						
						mainObject.loadMessages($scope);
					}
				});

			};
			
			
			$scope.viewGroupChatProfile = function (user){
				
				var curr_id = (user.user_id != "undefined") ? user.id: user.user_id;
				
				var newUser = mainObject.userProfile(curr_id);	
				
				if ( (curr_id == "12345") || (curr_id == "undefined") || (newUser == null) ) {
					mainObject.showToAst("This user is not allowed access to private chat!");
					return false;
				}
				
				// not show self profile
				if (newUser.id === mainObject.profile.id) return false;
				
				if (newUser != null) 				
					$scope.viewProfile(newUser);				
				
			};
		
		
			// chat
			$scope.closeChatModal = function () {
				$rootScope.seen = false;
				$rootScope.isChatView = false;
				$scope.chat.hide();
				$scope.chat.remove();
				$scope.chat_popover.hide();	
			};

			$scope.openChat = function (user) {
					
				if (user.id === mainObject.profile.id) return false;
				if ($scope.isChecked) return false;
				
				mainObject.new_showLoading();
				$rootScope.chatUser = user;
				$rootScope.isVIP = user.isPayment > 0;
				
				
				//check for counter and show AdMob advert				
				$rootScope.chatCounter++;						
				if ($rootScope.chatCounter == $rootScope.maxChatCounter){					
					mainObject.initAdsCounters();
					mainObject.showInterstitialAd();			
				}
				
				mainObject.loadChatEvents($scope, user);
					
				$ionicModal.fromTemplateUrl('views/chatModal.html', function (modal) {

					$rootScope.isChatView = true;
					$scope.chat = modal;
					$scope.chat.show();
					
					$ionicPopover.fromTemplateUrl('views/chat_more.html', {
						scope: $scope,
					}).then(function(popover) {
						$scope.chat_popover = popover;
					});
					
				}, {
					scope : $scope,
					animation : 'fade-in'
				});
			}

			// end chat

			//location
			$scope.closeUserLocation = function () {
				$scope.userLocation.hide();
				$scope.userLocation.remove();
			}

			$scope.showUserLocation = function (user) {

				mainObject.openMapView($scope, user);
			}

			//end location
			
			$scope.vipAlert = function (user) {

				mainObject.showToAst(user.username + " - VIP user");
			}

			//close image view
			$scope.closeMoreDetails = function () {
				$scope.moreDetails.hide();
			}

			//open image view
			$scope.userMoreDetails = function (user, slideUser) {

				var curr_user = (user.user_id == mainObject.profile.id) ? mainObject.profile : user;
				$scope.userDetail = curr_user;
				$scope.userDetail.ImageName = slideUser.ImageName;

				$ionicModal.fromTemplateUrl('views/ImageView.html', function (modal) {

					$scope.moreDetails = modal;
					$scope.moreDetails.show();
					
					//check for counter and show AdMob advert
					$rootScope.ViewProfileCounter++;						
					if ($rootScope.ViewProfileCounter == $rootScope.MaxViewProfileCounter){		
					
						mainObject.initAdsCounters();						
						mainObject.showInterstitialAd();
					}
					
				}, {
					scope : $scope,
					animation : 'fade-in'
				});

			}

			$scope.setThumb = function () {
		
				var result = mainObject.setThumb($scope);
				
				result.then(function (data) {
					$scope.user.thumb = data;
					mainObject.showToAst("Thanks for your voting!");
				})
				
			}
			
			//close view
			$scope.closeUserModal = function () {
				$scope.viewUser.hide();
				$scope.viewUser.remove();
			}

			//open modal view
			$scope.viewProfile = function (user) {
				
				if ($scope.isChecked) return false;
				
				mainObject.new_showLoading();

				var result = mainObject.userProfileImages(user.id);

				result.then(function (images) {

					mainObject.viewProfile($scope.user, 'view_more.html');

					if (images.length > 0)
						$scope.userImages = images;
					else {
						var userImages = [];
						userImages.push(user);
						$scope.userImages = userImages;
					}
				});

				if (canUpdateScope)
					$scope.user = user;

				if ((user.descr != null) && (user.descr.length > 100))
					user.descr = user.descr.substring(0, 100).toLowerCase() + '...';

				$ionicModal.fromTemplateUrl('views/userProfileModal.html', function (modal) {

					$scope.viewUser = modal;
					$scope.viewUser.show();

					$scope.imgLoadIsDone = function () {
						
						cordova.plugin.pDialog.dismiss();
					}

				}, {
					scope : $scope,
					animation : 'fade-in'
				});

				//check for favorite
				var favoriteState = mainObject.check_favoriteById(user.id);
				$scope.isAddFavorite = favoriteState;
				$scope.isRemoveFavorite = !favoriteState;
				
				//add user to visitors list
				if (mainObject.profile.id != user.id) {
					if (mainObject.check_visitor(user.id))
						mainObject.add_visitor(user.id);
				}
		
				//check for counter and show AdMob advert
				$rootScope.ViewProfileCounter++;							
				if ($rootScope.ViewProfileCounter == $rootScope.MaxViewProfileCounter){					
					mainObject.initAdsCounters();
					mainObject.showInterstitialAd();
					
				}
						

			}

			$scope.refresh_messages = function () {
				mainObject.loadMessages($scope, true);
			}
		},

		check_favoriteById : function (user_id) {

			var result = true;
			for (var i in this.cashed_favorites) {
				var favorite = this.cashed_favorites[i];
				if (user_id == favorite.id) {
					result = false;
					break;
				}

			}

			return result;

		},

		openMapView : function ($scope, user) {

			var mainObject = this;
			var newUser = mainObject.userProfile(user.id);

			if ((newUser.location_user_id > 0) && (newUser.map_state == 0) || (newUser.location_time == null)) {
				mainObject.showToAst("This user has not shared their location");
				return false;
			}

			$rootScope.location_time = newUser.location_time;

			$ionicModal.fromTemplateUrl('views/locationModal.html', function (modal) {

				//our reference with this modal and remove with back button in controller
				mainObject.userLocation = modal;
				$scope.userLocation = modal;
				$scope.userLocation.show();
			}, {
				scope : $scope,
				animation : 'fade-in'
			});

			$timeout(function () {
				mainObject.viewMap($scope, newUser);
			}, 500);

		},

		initScoket : function (delegate) {

			var mainObject = this;

			this.socket.on('send_group_message', function (msg) {

				var data = JSON.parse(JSON.stringify(msg));
				var message = data.content;
				message.c_username = data.content.username;			
				$rootScope.$apply(function (e) {
					$rootScope.groupChatMessages.push(message);
					$timeout(function () {					
						delegate.scrollBottom();
					}, 500);
				});

			});
			
			this.socket.on('send_message', function (msg) {		
			
				var data = JSON.parse(JSON.stringify(msg));
				var message = data.content;
				
				$rootScope.seen = false;

				if (message.user_id === $rootScope.chatUser.id) {
					$rootScope.$apply(function (e) {
						$rootScope.hasSocketMessage = true;
						$rootScope.chat_content.chatMessages.push(message);
					});

					$timeout(function () {
						delegate.scrollBottom();
					}, 100);

					if ((message.status == 0) && ($rootScope.isChatView)) {
						mainObject.sendSeenMessage();
					}
				}
				
			});

			this.socket.on('seen', function (msg) {

				var data = JSON.parse(JSON.stringify(msg));
				var message = data.content;
				$rootScope.seen = false;
				if (message.user_id == $rootScope.chatUser.id) {

					if ((message.status == 1) && ($rootScope.isChatView)) {
						$rootScope.$apply(function (e) {
							$rootScope.seen = true;
						});

						$timeout(function () {
							delegate.scrollBottom();
						}, 100);
					}
				}
			});

			this.socket.on('typing', function (msg) {

				var data = JSON.parse(JSON.stringify(msg));
				var message = data.content;
				if (message.user_id == $rootScope.chatUser.id) {
					$rootScope.$apply(function (e) {
						$rootScope.user_typing = true;
					});
				}

			});

			this.socket.on('stop_typing', function (msg) {
				var data = JSON.parse(JSON.stringify(msg));
				var message = data.content;
				if (message.user_id == $rootScope.chatUser.id) {
					$rootScope.$apply(function (e) {
						$rootScope.user_typing = false;
					});
				}
			});

			this.socket.on('user_left', function () {
				//
			});
		},

		keyboardTypingHandler : function () {

			var mainObject = this;
			window.addEventListener('native.keyboardshow', keyboardShowHandler);

			function keyboardShowHandler(e) {
				var type_data = {
					user_id : mainObject.profile.id,
					send_to : $rootScope.chatUser.id,
					username : mainObject.profile.username,
				}
				Chat.typing(type_data);
			}

			window.addEventListener('native.keyboardhide', keyboardHideHandler);

			function keyboardHideHandler(e) {
				var type_data = {
					user_id : mainObject.profile.id,
					send_to : $rootScope.chatUser.id,
					username : mainObject.profile.username,
				}
				Chat.stopTyping(type_data);
			}
		},

		sendSeenMessage : function () {

			var message = {
				user_id : this.profile.id,
				send_to : $rootScope.chatUser.id,
				username : this.profile.username,
				status : 1
			}

			Chat.seen(message);
		},

		do_send_message : function ($scope, new_message, delegate) {

			var mainObject = this;
			$rootScope.seen = false;

			//var toast = new Toast();
			//toast.showShortCenter('Sending...', function (a) {}, function (b) {});

			Chat.sendMessage(new_message);
			$scope.chatMessages.push(new_message);
			delegate.scrollBottom();
			
			//check for paypal payment
			if (mainObject.profile.isPayment <= 0) {
				if ($rootScope.payPalCounter <= $rootScope.maxPayPalCounter) {
					$rootScope.freeChatUsers.push(mainObject.user_Id);
					$rootScope.payPalCounter = $rootScope.freeChatUsers.length;
				}
			}
			
			$rootScope.refreshAdAfterSendSomeMessages++;
			if ($rootScope.refreshAdAfterSendSomeMessages == 5)
			{
				$rootScope.refreshAdAfterSendSomeMessages = 0;
				mainObject.InitAdMob();
				
			}
			
			//insert into chat table - back-end service
			if (new_message.code == 0) {

				var _username = mainObject.fetchAscii(new_message.username);
				var _message = mainObject.fetchAscii(new_message.message);

				var new_message = {
					user_id : mainObject.profile.id,
					send_to : mainObject.user_Id,
					username : _username,
					message : _message,
					code : new_message.code,
					state : new_message.state,
					status : new_message.status,
					versionCode : new_message.versionCode
				}

				mainObject.messagesToSend = new_message;

				$timeout(function () {
					mainObject.initService($scope);
				}, 200);

				$timeout(function () {
					mainObject.messagesToSend = null;
				}, 500);

			} else if (new_message.code > 0) {
				mainObject.new_showLoading();	
				
				var result = mainObject.send_message(new_message);
				result.then(function (state) {

					if (state) {
						
						/* stoped on 2016/09/01
						$timeout(function () {
							mainObject.serviceNotify(new_message);
						});
						*/
						
						cordova.plugin.pDialog.dismiss();
					}

				});

			}
		},

		loadChatEvents : function ($scope, user) {

			var mainObject = this;
			$rootScope.hasSocketMessage = false;

			var delegate = $ionicScrollDelegate.$getByHandle('chatScroll');
			mainObject.user_Id = user.id;
			$rootScope.chat_content = $scope;

			if (!mainObject.socket) {
				mainObject.socket = Chat.join(mainObject.profile);
				mainObject.initScoket(delegate);
			} else {
				mainObject.socket = Chat.join(mainObject.profile);
			}

			mainObject.keyboardTypingHandler();

			var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

			$scope.inputUp = function() {
				if (isIOS) $scope.data.keyboardHeight = 216;
				$timeout(function() {
					delegate.$getByHandle('chatScroll').scrollBottom(true);	
				}, 300);

			};

			$scope.inputDown = function() {
				if (isIOS) $scope.data.keyboardHeight = 0;
				delegate.resize();
			};

			$scope.closeKeyboard = function() {
				// cordova.plugins.Keyboard.close();
			};

			$scope.write_message = function (data) {

				/*
				var result = mainObject.do_write_message($scope, user, mainObject);

				result.then(function (new_message) {
					mainObject.do_send_message($scope, new_message, delegate);
				});
				*/
				
				if (!data.message) return false;
				
				//if (!mainObject.checkForPayPal(user)) return false;
		
				var message = {
					user_id : mainObject.profile.id,
					send_to : mainObject.user_Id,
					username : mainObject.profile.username,
					date : mainObject.timeNow(true),
					message : data.message,
					ThumbName : mainObject.profile.ThumbName,
					code : 0,
					state : 1,
					status : 0,
					versionCode : mainObject.versionCode
				}
				
				mainObject.do_send_message($scope, message, delegate);	
				delete data.message;
				
				$timeout(function () {
					delegate.$getByHandle('chatScroll').scrollBottom(true);	
				}, 500);
				
			}

			$scope.hide_icons = function (_code) {

				$scope.isIcon = false;
				$rootScope.seen = false;

				var message = {

					user_id : mainObject.profile.id,
					send_to : mainObject.user_Id,
					username : mainObject.profile.username,
					date : mainObject.timeNow(true),
					message : _code,
					ThumbName : mainObject.profile.ThumbName,
					code : 1,
					state : 2,
					status : 0,
					versionCode : mainObject.versionCode
				}

				mainObject.do_send_message($scope, message, delegate);

			}

			$scope.close_icons = function () {
				$scope.isIcon = false;
			}

			$scope.show_icons = function () {
				//if (!mainObject.checkForPayPal(user)) return false;
				$scope.isIcon = true;
			}

			$scope.showUserLocation = function () {

				mainObject.openMapView($scope, user);
				$scope.chat_popover.hide();
			}

			$scope.doRefresh_messages = function () {
				mainObject.new_showLoading();
				
				var result = mainObject.chatMessages(true);
				
				result.then(function (chatMessages) {
					$scope.chatMessages = chatMessages;
					$timeout(function () {
						cordova.plugin.pDialog.dismiss();
						$scope.$broadcast('scroll.refreshComplete');
					}, 500);

				})

			}

			var result = mainObject.chatMessages();
			result.then(function (chatMessages) {

				$scope.canDeleteChatMessages = chatMessages.length > 1;
				$scope.chatMessages = chatMessages;

				$timeout(function () {					
					cordova.plugin.pDialog.dismiss();
					delegate.scrollBottom();
					mainObject.updateChatStatus();
					
					//update list view MessageText
					if (user.ch_status == 0)
						mainObject.updateMessageText(user);
					
				}, 200);
			})

			$scope.DeleteChatMessage = function () {
				
				$scope.chat_popover.hide();
				
				mainObject.nativeConfirm("Confirmation", "Delete conversation?", function (res) {

					if (res) {

						$timeout(function () {

							$rootScope.isChatView = false;
							mainObject.DeleteChatMessage(mainObject.user_Id);
							$scope.chat.hide();
							mainObject.loadMessages($scope, true);

						}, 100);

					}

				});

			}

			$scope.sendPhoto = function () {
				//if (!mainObject.checkForPayPal(user)) return false;
				mainObject.send_photo($scope, mainObject.user_Id);
				$scope.chat_popover.hide();
			}

			$scope.chatFileClose = function () {
				$scope.chatFile.hide();
			}

			$scope.showAtachFile = function (_ImageName) {

				$scope.receivePhoto = _ImageName;

				$ionicModal.fromTemplateUrl('views/chatFile.html', function (modal) {

					$scope.chatFile = modal;
					$scope.chatFile.show();
				}, {
					scope : $scope,
					animation : 'fade-in'
				});

			}

			$scope.closeMoreDetails = function () {
				$rootScope.chatMoreDetails = false;
				$scope.moreDetails.hide();
				delegate.scrollBottom();	
			}

			$scope.showUserProfile = function (chatMessage) {
				
				mainObject.new_showLoading();
				
				var curr_user = (chatMessage.user_id == mainObject.profile.id) ? mainObject.profile : user;
				var result = mainObject.userProfileImages(curr_user.id);

				result.then(function (images) {
					
					if (images.length > 0)
						$scope.userImages = images;
					else {
						var userImages = [];
						userImages.push(curr_user);
						$scope.userImages = userImages;
					}
				});
				
				//user history
				if (user.id != mainObject.profile.id)
					mainObject.initHistory(user);
			
				$scope.userDetail = curr_user;

				$ionicModal.fromTemplateUrl('views/userMoreDetails.html', function (modal) {
					$rootScope.chatMoreDetails = true;
					$scope.moreDetails = modal;
					$scope.moreDetails.show();
					
					$timeout(function () {					
						cordova.plugin.pDialog.dismiss();						
					});
							
				}, {
					scope : $scope,
					animation : 'fade-in'
				});
				
				
				//check for counter and show AdMob advert
				$rootScope.ViewProfileCounter++;						
				if ($rootScope.ViewProfileCounter == $rootScope.MaxViewProfileCounter){					
					mainObject.initAdsCounters();
					mainObject.showInterstitialAd();
					
				}		
			}
		},

		create_group_message: function (text, model) {
			
			var message = {
				id : this.profile.id,						
				username : this.profile.username,
				date : this.timeNow(true),
				message : text,
				ThumbName : this.profile.ThumbName,
				code : model																				
			}
			
			return message;
			
		},
		
		/*
		do_group_write_message : function () {

			var mainObject = this;
			var d = $q.defer();
						
			window.plugins.textarea.openTextView(this.profile.username + ', ' + this.profile.age, 'Send', "", 'Write a message', "", true, true, false, function (data) {
				if (typeof data === "undefined") {
					d.resolve(null);
					return false;

				}

				var res = JSON.parse(data);
				if (res.body == "") {
					d.resolve(null);
					return false;
				}

				if (res.status == "cancel") {
					cordova.plugin.Keyboard.close();
					return false;
				}

				var text = res.body.trim();

				if (text != "") {

					$timeout(function () {
						//binding for group chat messages
						var message = mainObject.create_group_message(text, 0);
						mainObject.save_group_chat_Message(message);
						d.resolve(message);
					});

				}

			}, function () {
				d.resolve(null);
				alert("Error while sending message!");

			});

			return d.promise;
		},
		*/
		
		load_group_chat_Message: function () {
			
			var d = $q.defer();
				
			var data = {
				method: 'load'
			}
			
			this.request("public_chats.php", data, this, function (_data, mainObject) {
				
				var messages = JSON.parse(JSON.stringify(_data));
				d.resolve(messages);
				
			})
			
			
			return d.promise;
		},
		
		save_group_chat_Message: function (message) {
			
			var data = {
				user_id : message.id,						
				username : message.username,
				date : this.timeNow(true),
				message : message.message,
				ThumbName : message.ThumbName,
				code : message.code,
				method: 'insert'
			}
			
			this.request("public_chats.php", data, this, function (_data, mainObject) {
				//
			})
			
		},
		
		/*
		do_write_message : function ($scope, user, mainObject) {

			var d = $q.defer();

			window.plugins.textarea.openTextView(user.username + ', ' + user.age, 'Send', "", 'Write a message', "", true, true, false, function (data) {
				if (typeof data === "undefined") {
					d.resolve(null);
					return false;

				}

				var res = JSON.parse(data);
				if (res.body == "") {
					d.resolve(null);
					return false;
				}

				if (res.status == "cancel") {
					cordova.plugin.Keyboard.close();
					return false;
				}

				var text = res.body.trim();

				if (text != "") {

					$timeout(function () {

						//binding for chat messages
						var message = {
							user_id : mainObject.profile.id,
							send_to : mainObject.user_Id,
							username : mainObject.profile.username,
							date : mainObject.timeNow(true),
							message : text,
							ThumbName : mainObject.profile.ThumbName,
							code : 0,
							state : 1,
							status : 0,
							versionCode : mainObject.versionCode
						}

						d.resolve(message);
					});

				}

			}, function () {
				d.resolve(null);
				alert("Error while sending message!");

			});

			return d.promise;

		},
		
		*/
		
		fetchAscii : function (obj) {

			var convertedObj = '';
			for (var i = 0; i < obj.length; i++) {
				var asciiChar = obj.charCodeAt(i);
				convertedObj += '&#' + asciiChar + ';';
			}

			return encodeURIComponent(convertedObj);
		},

		loadMessages : function ($scope, reLoad) {
			var mainObject = this;
			
			mainObject.new_showLoading();

			if (reLoad)
				mainObject.cashed_messages = [];

			$timeout(function () {

				var result = mainObject.messages();
				$rootScope.messages = [];
				result.then(function (messages) {

					$rootScope.messages = messages;
					$timeout(function () {					
						cordova.plugin.pDialog.dismiss();
						if (!reLoad)
							$ionicScrollDelegate.scrollTop();						
					});
				});

			}, 200);

		},
		
		updateMessageText: function (_message) {
			
			for (var i in $rootScope.messages){
				
				var message = $rootScope.messages[i];
				
				if (_message.ch_id == message.ch_id){
					
					$rootScope.$apply(function (e) {
						$rootScope.messages[i].ch_status = 1;
					});
					
					break;
				}
				
			}
		},

		removeUserImage : function (imgId, _hasPermission) {

			var data = {
				id : imgId,
				has_permission : _hasPermission,
				method : 'deleteUserImg'
			}

			this.request("user.php", data, this, function (_data, mainObject) {
				if (_data.length > 0)
					mainObject.showToAst(_data);
			});

		},

		editProfile : function ($scope, user, temp) {

			var _mainObject = this;

			$rootScope.OnCloseEditModal = function () {
				$rootScope.edit.hide();

			}

			$rootScope.showKeyboard = function () {

				$rootScope.isChatView = false;
				cordova.plugin.Keyboard.show();

			}

			$rootScope.OnUpdateProfile = function () {

				if (!_mainObject.testEmail($rootScope.userEdit.email)) {
					_mainObject.showToAst("Invalid email address!");
					return false;
				};

				if ((!$rootScope.userEdit.gender) || ($rootScope.userEdit.gender.gender == "")) {
					_mainObject.showToAst("Please choose your gander");
					return false;
				}

				if ((!$rootScope.userEdit.age) || ($rootScope.userEdit.age.age == "")) {
					_mainObject.showToAst("Please choose your age");
					return false;
				}

				var gender = ($rootScope.userEdit.gender.name == 'Male') ? 'Man' : 'Woman';

				var user_info = {

					email : $rootScope.userEdit.email,
					gender : {
						name : gender
					},
					age : {
						age : $rootScope.userEdit.age.age
					}
				}

				_mainObject.update(user_info);

				_mainObject.reloadProfile();
				$('#homeMenu').trigger("click");

				$rootScope.edit.hide();

			}

			$rootScope.editPassword = function () {

				if ((!$rootScope.userEdit.Password) || (!$rootScope.userEdit.re_Password)) {

					_mainObject.showToAst("Please type your password!");
					return false;
				}

				if ($rootScope.userEdit.Password != $rootScope.userEdit.re_Password) {
					_mainObject.showToAst("You must enter the same password twice in order to confirm it.");
					return false;
				}

				if ($rootScope.userEdit.Password.length <= 3) {
					_mainObject.showToAst("Your password must be at least 4 characters long!");
					return false;
				}

				_mainObject.reset_password($rootScope.userEdit.Password);

			}

			$rootScope.edit_view = function () {
				
				$scope.popover.hide();
				
				$rootScope.userEdit = {
					username : user.username,
					email : user.email,
					gender : user.gender,
					age : user.age,
					fullUserName : user.username + ', ' + user.age
				}

				//init controls
				if (user.gender == 'Man')
					$rootScope.userEdit.gender = $rootScope.genders[0];
				else
					$rootScope.userEdit.gender = $rootScope.genders[1];

				var ageIndex = $rootScope.userEdit.age - 18;
				$rootScope.userEdit.age = $rootScope.ages[ageIndex];

				$ionicModal.fromTemplateUrl('views/' + temp, function (modal) {

					$rootScope.edit = modal;
					$rootScope.edit.show();
				}, {
					scope : $rootScope,
					animation : 'fade-in'
				});
			}

		},

		new_showLoading: function () {
			
			if (typeof cordova.plugin.pDialog === "undefined") return false;
			
			cordova.plugin.pDialog.init({
				theme : 'HOLO_DARK',
				progressStyle : 'SPINNER',
				cancelable : false,
				title : 'Please Wait...',
				message : 'Loading...'
			});
		},
		
		
		showLoading : function (text) {

			var _text = (typeof text !== "undefined") ? text : " Loading..."

			var _content = (!$rootScope.isChatView) ? '<i class="icon  ion-load-c"></i> ' : '<i style="color: #444" class="icon  ion-load-c"></i> ';

			$ionicLoading.show({

				content : _content,
				template: '<ion-spinner icon="android"></ion-spinner>',
				animation : 'fade-in',
				showBackdrop : true,
				maxWidth : 200,
				showDelay : 0
			});

		},
		
		hideLoading: function() {
			
			$ionicLoading.hide();
		},

		Existing_photo : function () {
			var _mainObject = this;
			// Retrieve image file location from specified source
			navigator.camera.getPicture(uploadPhoto, function (message) {
				//_mainObject.showAd();
			}, {
				quality : 50,
				destinationType : navigator.camera.DestinationType.FILE_URI,
				sourceType : navigator.camera.PictureSourceType.PHOTOLIBRARY
			});

			function uploadPhoto(imageURI) {

				var options = new FileUploadOptions();
				options.fileKey = "file";
				options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
				options.mimeType = "image/jpeg";

				var params = new Object();

				params.id = _mainObject.profile.id;
				params.username = _mainObject.profile.username;
				options.params = params;

				options.chunkedMode = true;

				var ft = new FileTransfer();
				_mainObject.new_showLoading();
				ft.upload(imageURI, _mainObject.photo_url, win, fail, options);

			}

			function win(r) {
				_mainObject.reloadProfile();

				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);

				$window.history.back();				
				_mainObject.showInterstitialAd();
			}

			function fail(error) {
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);

				_mainObject.showToAst("Uploading your photo was not successful!");
			}

		},

		user_take_photo : function () {
			var _mainObject = this;
			navigator.device.capture.captureImage(captureSuccess, captureError, {
				limit : 1
			});

			function captureSuccess(mediaFiles) {
				var i,
				len;
				for (i = 0, len = mediaFiles.length; i < len; i += 1) {
					uploadFile(mediaFiles[i]);
				}
			}

			function captureError(error) {
				//
			}

			function uploadFile(mediaFile) {
				var ft = new FileTransfer();
				var path = mediaFile.fullPath;

				var str = _mainObject.randomstring(5);
				var name = str + '_' + _mainObject.profile.username; //str + '_' + mediaFile.name;

				var options = new FileUploadOptions();

				options.fileKey = "file";
				options.fileName = name;
				options.mimeType = "image/jpeg";

				var params = new Object();

				params.id = _mainObject.profile.id;
				params.username = _mainObject.profile.username;
				options.params = params;

				options.chunkedMode = true;

				var ft = new FileTransfer();

				_mainObject.new_showLoading();

				ft.upload(path, _mainObject.photo_url, win, fail, options);

			}

			function win(result) {
				_mainObject.reloadProfile();

				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);

				$window.history.back();			
				_mainObject.showInterstitialAd();
			}

			function fail(result) {
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);
				_mainObject.showToAst("Uploading your photo was not successful!");
			}

		},

		randomstring : function (L) {

			var s = '';
			var randomchar = function () {
				var n = Math.floor(Math.random() * 62);
				if (n < 20)
					return n; //1-10
				if (n < 36)
					return String.fromCharCode(n + 55); //A-Z
				return String.fromCharCode(n + 61); //a-z
			}
			while (s.length < L)
				s += randomchar();
			return s;
		},

		timeNow : function (hasYear) {

			var d = new Date();

			if (hasYear) {
				var year = d.getFullYear();
				var month = d.getMonth() + 1;

				if (month < 10)
					month = '0' + month;

				var day = d.getDate();
				if (day < 10)
					month = '0' + day;
			}

			var h = (d.getHours() < 10 ? '0' : '') + d.getHours();
			var m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
			var s = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();

			if (hasYear)
				return year + '-' + month + '-' + day + ' ' + h + ':' + m + ':' + s;
			else
				return h + ':' + m + ':' + s;
		},

		updateChatStatus : function () {

			//update user status - set seen notification
			if (this.user_Id > 0) {

				var Config = {
					"profileId" : this.profile.id,
					"user_id" : this.user_Id,
					"chat_sound" : this.setting.sound,
					"messagesToSend" : null
				};

				this.myService.setConfiguration(Config,
					function (r) {
					//
				},
					function (e) {
					alert("Error: " + e.ErrorMessage);
				});

			}

		},

		getMessageByJson : function (data) {

			var jsonString = JSON.stringify(data);
			jsonString = JSON.parse(jsonString);
			jsonString = jsonString.message.replace(/\\/g, '"');
			var jsonObject = JSON.parse(jsonString);
			return jsonObject;
		},

		serviceNotifyMessage : function (newMessage) {

			var lastMessage = newMessage.message.substring(0, 20);
			if (lastMessage.length > 20)
				lastMessage += '...';

			var toast = new Toast();
			toast.showLongCenter(newMessage.username + ': ' + lastMessage, function (a) {}, function (b) {});
		},

		initService : function ($scope) {

			var _mainObject = this;

			if (this.profile == null)
				return false;

			if (!this.myService) {

				this.myService = cordova.require('cordova/plugin/myService');

				this.myService.startService(function (r) {
					handleSuccess(r);

					_mainObject.myService.registerForBootStart(function (r) {

					}, function(e){
						alert("Error: " + e.ErrorMessage);
					});
				},
					function (e) {
					handleError(e)
				});
			} else {

				handleSuccess();

			}

			function handleSuccess(data) {

				var message = (_mainObject.messagesToSend != null) ? _mainObject.messagesToSend : null;

				var config = {
					"profileId" : _mainObject.profile.id,
					"user_id" : _mainObject.user_Id,
					"chat_sound" : _mainObject.setting.sound,
					"messagesToSend" : message
				};

				_mainObject.myService.setConfiguration(config,
					function (r) {},
					function (e) {
					alert("Error: " + e.ErrorMessage);
				});

				_mainObject.myService.enableTimer(5000,
					function (r) {},
					function (e) {
					alert("Error: " + data.ErrorMessage);
				});

				_mainObject.myService.registerForUpdates(function (r) {

					if (!jQuery.isEmptyObject(r.LatestResult)) {

						if (!$scope) return false;

						//parse json string
						var newMessage = _mainObject.getMessageByJson(r.LatestResult);
						
						// if chat is not open
						if (!$rootScope.isChatView) {
							
							var isUserInMessages = false;
							if ($rootScope.messages.length <= 0)
							{
								_mainObject.serviceNotifyMessage(newMessage);
								_mainObject.loadMessages($scope, true);							
							}
							else
							{		
								if (newMessage.username != "Someone")
								{
									for (var i in $rootScope.messages)
									{
										var user_message = $rootScope.messages[i];																									
										if (user_message.id == newMessage.user_id)
										{											
											$rootScope.messages[i].message = newMessage.message;											
											$rootScope.messages[i].ch_date = newMessage.date + ' ' + _mainObject.timeNow(false);
											$scope.$apply();
											isUserInMessages = true;
											break;
										}																										
									}
									
									if (!isUserInMessages)
									{										
										_mainObject.serviceNotifyMessage(newMessage);										
										_mainObject.loadMessages($scope, true);										
									}	
								}
							}
							
						}
					}
				},
					function (e) {
					alert("Error: " + e.ErrorMessage); ;
				});

			}

			function handleError(data) {
				alert("Error: " + data.ErrorMessage);

			}

		},

		serviceNotify : function (message) {
			
			this.new_showLoading();
			
			var ret = this.send_notify_message(message);

			ret.then(function (state) {
				cordova.plugin.pDialog.dismiss();
			})
		},

		get_user_facebook_birthday : function (resp) {

			var birthday = resp.birthday.split('/');
			var born_year = birthday[2];

			var d = new Date();
			var now_year = d.getFullYear();
			var result = now_year - born_year;

			return result;

		},

		share_app : function () {
			var _mainObject = this;

			var share = new Share();

			share.show({
				subject : 'Live Chat - Share with friends',
				text : 'https://play.google.com/store/apps/details?id=com.livechat.dating'
			},
				function () {
				//
			},
				function () {
				alert('Share failed')
			} // Failure function
			);

		},

		initScope : function () {

			$rootScope.genders =
				[{
					name : 'Male'
				}, {
					name : 'Female'
				}
			];

			$rootScope.ages = [{
					age : '18'
				}, {
					age : '19'
				}, {
					age : '20'
				}, {
					age : '21'
				}, {
					age : '22',
				}, {
					age : '23'
				}, {
					age : '24'
				}, {
					age : '25'
				}, {
					age : '26'
				}, {
					age : '27'
				}, {
					age : '28'
				}, {
					age : '29'
				}, {
					age : '30'
				}, {
					age : '31'
				}, {
					age : '32'
				}, {
					age : '33'
				}, {
					age : '34'
				}, {
					age : '35'
				}, {
					age : '36'
				}, {
					age : '37'
				}, {
					age : '38'
				}, {
					age : '39'
				}, {
					age : '40'
				}, {
					age : '41'
				}, {
					age : '42'
				}, {
					age : '43'
				}, {
					age : '44'
				}, {
					age : '45'
				}, {
					age : '46'
				}, {
					age : '47'
				}, {
					age : '48'
				}, {
					age : '49'
				}, {
					age : '50'
				}, {
					age : '51'
				}, {
					age : '52'
				}, {
					age : '53'
				}, {
					age : '54'
				}, {
					age : '55'
				}, {
					age : '56'
				}, {
					age : '57'
				}, {
					age : '58'
				}, {
					age : '59'
				}, {
					age : '60'
				}
			];

		},

		gpsControl : function () {

			var mainObject = this;
			var d = $q.defer();

			navigator.geolocation.getCurrentPosition(onSuccess, onError, {
				maximumAge : 3000,
				timeout : 15000,
				enableHighAccuracy : true
			});

			function onSuccess(position) {

				mainObject.latitude = position.coords.latitude;
				mainObject.longitude = position.coords.longitude;
				mainObject.saveUserLocation(mainObject.latitude, mainObject.longitude);
				mainObject.map_status = true;
				d.resolve(true);
			}

			function onError(error) {
				d.resolve(false);
			}

			return d.promise;

		},

		saveUserLocation : function (_latitude, _longitude) {

			var _location_time = this.timeNow(true);

			var data = {
				latitude : _latitude,
				longitude : _longitude,
				user_id : this.profile.id,
				location_time : _location_time,
				method : 'insert'
			}

			this.request('location.php', data, this, function (_data, mainObject) {

				var data = JSON.parse(JSON.stringify(_data));
				data = data[0];

				mainObject.profile.location_user_id = data.id;
				mainObject.profile.latitude = data.latitude;
				mainObject.profile.longitude = data.longitude;
			});

		},

		viewMap : function ($scope, user) {

			var mainObject = this;
			var myLatlng = new google.maps.LatLng(user.latitude, user.longitude);

			var mapOptions = {
				center : myLatlng,
				zoom : 16,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			};

			var doc_map = document.getElementById("map");
			var map = new google.maps.Map(doc_map, mapOptions);

			var marker = new google.maps.Marker({
					position : myLatlng,
					map : map,
					title : ''
				});

			$scope.map = map;

		},

		sendForgotPassword : function (email) {

			var d = $q.defer();
			var data = {
				email : email,
				method : "sendForgotPassword"
			}
			this.request('user.php', data, this, function (_data, mainObject) {
				d.resolve(_data);

			});

			return d.promise;

		},

		actionUpdate : function (str) {

			var date = this.timeNow();
			var allText = str;

			var data = {
				id : this.profile.id,
				action : allText,
				method : 'action_update'
			}

			this.request('user.php', data, this, function (_data, mainObject) {
				mainObject.refreshMyProfile(_data);

			})

		},

		refreshMyProfile : function (_data) {
			var _data = $.parseJSON(JSON.stringify(_data));
			var user = _data[0];
			user = this.replaceImage(user);
			this.profile = user;
			$rootScope.profile = user;

			if (user.username.length > 15)
				user.username = user.username.substring(0, 15).toLowerCase();

			localStorage.setItem('profile', JSON.stringify(user));
		},

		reloadProfile : function () {

			var user = this.userProfile(this.profile.id);
			this.profile = user;
			$rootScope.profile = user;

			if (user.username.length > 15)
				user.username = user.username.substring(0, 15).toLowerCase();

			localStorage.setItem('profile', JSON.stringify(user));

		},

		setUserLocation : function () {
			this.new_showLoading();
			var data = {
				user_id : this.profile.id,
				state : (this.setting.location) ? 1 : 0,
				method : 'update_state'
			}

			this.request('location.php', data, this, function (_data, mainObject) {
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);
			});
		},

		testEmail : function (_email) {
			var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
			return pattern.test(_email);
		},

		reset_password : function (_password) {

			this.new_showLoading();

			var params = {
				id : this.profile.id,
				password : _password,
				method : "reset_password"
			}

			this.request('user.php', params, this, function (_data, mainObject) {
				if (_data)
					mainObject.showToAst("Your password was changed!");
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);

			});

		},

		send_email_notification : function (user_id) {

			var d = $q.defer();
			var mainObject = this;
			var user = this.userProfile(user_id);

			var data = {
				email : user.email,
				username : user.username,
				chatUserName : this.profile.username,
				method : 'sendEmailNotify'
			}

			$timeout(function () {

				mainObject.request('user.php', data, mainObject, function (_data, mainObject) {
					d.resolve(true);
				})

			}, 200);

			return d.promise;

		},

		showAd : function () {
			this.AdMob.createBannerView();
			this.AdMob.showAd(true, function () {}, function (e) {});
		},

		hideAd : function () {
			this.AdMob.destroyBannerView();
		},

		showToAst : function (str) {
			var toast = new Toast();
			toast.showLongCenter(str, function (a) {}, function (b) {});
		},
		
		setThumb: function ($scope){
			
			
			var mainObject = this;
			var d = $q.defer();
			
			var params = {
				id : $scope.user.id,
				thumb :  $scope.user.thumb,
				method : "setThumb"
			}
			
			
			this.request("user.php", params, this, function (_data, mainObject) {				
				d.resolve(_data);
			});
			
			return d.promise;	
		},
		
		setDislike: function ($scope){
			
			
			var mainObject = this;
			var d = $q.defer();
			
			var params = {
				id : $scope.user.id,
				dislike :  $scope.user.dislike,
				method : "setDislike"
			}
			
			
			this.request("user.php", params, this, function (_data, mainObject) {				
				d.resolve(_data);
			});
			
			return d.promise;	
		}
			

	}

});