'use strict';

livechat.controller('MainCtrl', function ($scope, $rootScope, $q, $ionicLoading, $location, $window, 
	$ionicPopover, $ionicSideMenuDelegate, 
	$ionicScrollDelegate, $ionicSlideBoxDelegate, system, $timeout) {

	$scope.on_exit = false;

	$scope.$on('$stateChangeStart', function (event, next, current) {

		if (!system.profile)
			return $location.path('/home');

	});

	$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
		//
	});

	ionic.Platform.ready(function () {

		document.addEventListener('deviceready', onDeviceReady, false);

		function onDeviceReady() {
			
			navigator.splashscreen.hide();
			system.InitAdMob(false);	
			document.addEventListener("menubutton", onMenuKeyDown, false);
			document.addEventListener("backbutton", onBackKeyDown, true);
			
			$scope.on_exit = true;
			$scope.isLogin = false;
			
			var device = new Device();
			device.getDevice(function (data) 
			{
				var res = JSON.parse(data);				
				if (res.body <= "19")
					$('head').append('<link rel="stylesheet" type="text/css" href="css/old_emj.css">');
				else	
					$('head').append('<link rel="stylesheet" type="text/css" href="css/new_emj.css">');
				
			}, function () {});
			
			
			var delegate = $ionicScrollDelegate.$getByHandle('chatScroll');
			
			window.addEventListener('native.keyboardshow', keyboardShowHandler);

			function keyboardShowHandler(e){			
				admob.showBannerAd(false, function () {}, function () {}); 
				$timeout(function() {
					delegate.$getByHandle('chatScroll').scrollBottom(true);					
				}, 100);	
			}
			
			
			window.addEventListener('native.keyboardhide', keyboardHideHandler);

			function keyboardHideHandler(e){			
				admob.showBannerAd(true, function () {}, function () {}); 
				$timeout(function() {
					delegate.$getByHandle('chatScroll').scrollBottom(true);						
				}, 100);	
			
			}
			
			startApp();
		}

		function onMenuKeyDown() {
			if (system.DeviceReady) {
				var menu = $ionicSideMenuDelegate.$getByHandle('mainMenu');
				menu.toggleLeft();
			}
		}

		function onBackKeyDown() {

			//banner fixes
			if (!$rootScope.isBannerVisible){
				$rootScope.isBannerVisible = true;
				system.InitAdMob(true);
				$('#homeMenu').trigger("click");
			}
			
			$rootScope.seen = false;

			if (typeof $rootScope.isChatView != "undefined") {
				if (($rootScope.isChatView) && (!$rootScope.chatMoreDetails)) {

					$timeout(function () {
						$rootScope.isChatView = false;
					}, 100);

				}
			}

			if (system.userLocation != null) {
				system.userLocation.remove();
				system.userLocation = null;
			}
		}

	});

	$scope.on_run_app = function () {
		$timeout(function () {
			$window.location.reload(true);
		}, 100);

	}

	$scope.user = system.init();
	
	function startApp() {

		if (system.profile) {
						
			system.DeviceReady = true;
			system.initService($scope);
			$scope.isLogin = true;
			$scope.on_exit = false;
			$scope.isAdmin = system.profile.admin > 0;
			$scope.fisrtTimeAd = true;
			system.InitAdMob(true);	
			
			system.new_showLoading();
			//admob addEventListener 			
			document.addEventListener(admob.events.onAdLoaded, function (e) { 					
				
				if ($scope.fisrtTimeAd == true)
				{
					
					var res = system.showInterstitialAd();
					res.then(function (state) {						
						if (state == true)
						{
							$scope.fisrtTimeAd = false;	
							cordova.plugin.pDialog.dismiss();							
						}
						else
							cordova.plugin.pDialog.dismiss();	
					});
		
				}
				
			});
			
			
			$timeout(function () {
					
				cordova.plugin.pDialog.dismiss();
				
				if (system.pack_state > 0)
				{
					var c = confirm("New version is available please download?");
					if (c)
						window.open('market://details?id=' + system.pack_name, '_system');
				}
				
			}, 5000);
			
			//handle menu more events
			system.homeMoreMenuEvents($scope);
			
			var menu = $ionicSideMenuDelegate.$getByHandle('mainMenu');
			
			$scope.toggleLeft = function () {
				menu.toggleLeft();
			}
		}
	}

})

livechat.controller('HomeCtrl', function ($scope, $ionicModal, $timeout, $ionicLoading, $window, system, $stateParams, $ionicScrollDelegate) {
		
	if (system.profile == null) {
		
		$ionicModal.fromTemplateUrl('views/init.html', function (modal) {

			$scope.init = modal;
			$scope.init.show();
		}, {
			scope : $scope,
			animation : 'fade-in'
		});

		$scope.showLogin = function () {

			$ionicModal.fromTemplateUrl('views/login.html', function (modal) {

				$scope.login = modal;
				$scope.login.show();
			}, {
				scope : $scope,
				animation : 'fade-in'
			});

		}

		$scope.closeLogin = function () {
			$scope.login.hide();
		}

		$scope.login_press = function () {
			
			system.showToAst("Please wait...");
			
			$timeout(function () {
				var result = system.login($scope.login);
				result.then(function (user) {
					if (!user)
						system.showToAst("Login error!");
					else {
						system.showToAst("Login successful, Please wait...");
						$scope.login.hide();
						$window.location.reload(true);
					}

				})

			}, 1000);

		}

		$scope.closeRegister = function () {
			$scope.register.hide();
		}

		// register
		$scope.showRegister = function () {

			$ionicModal.fromTemplateUrl('views/registerUser.html', function (modal) {

				$scope.register = modal;
				$scope.register.show();
			}, {
				scope : $scope,
				animation : 'fade-in'
			});

		}

		$scope.register_press = function () {

			if (!$scope.register.username) {
				system.showToAst("Please type your username");
				return false;
			}

			if ($scope.register.username.length <= 3) {
				system.showToAst("Your username must be at least 4 characters long!");
				return false;
			}

			if ((!$scope.register.password) || (!$scope.register.re_password)) {
				system.showToAst("Please type your password!");
				return false;
			}

			if ($scope.register.password != $scope.register.re_password) {
				system.showToAst("You must enter the same password twice in order to confirm it.");
				return false;
			}

			if ($scope.register.password.length <= 3) {
				system.showToAst("Your password must be at least 4 characters long!");
				return false;
			}

			if ((!$scope.register.gender) || ($scope.register.gender.gender == "")) {
				system.showToAst("Please choose your gander!");
				return false;
			}

			if ((!$scope.register.age) || ($scope.register.age.age == "")) {
				system.showToAst("Please choose your age!");
				return false;
			}

			if (!$scope.register.email) {
				system.showToAst("Enter your email address!");
				return false;
			}

			if (!system.testEmail($scope.register.email)) {
				system.showToAst("Invalid email address!");
				return false;
			};

			$scope.register.registration_type = 1;

			var user = system.register($scope.register);

			if (!user)
				system.showToAst("Registration Error, An error occurred during your registration. Please try again!");
			else {

				var _gender = ($scope.register.gender.name == 'Male') ? "Man" : "Woman";
				$scope.register.gender.name = _gender;

				var user = system.update($scope.register);
				if (user)
					$window.location.reload(true);

			}

		}

		$scope.closeForgotPaasword = function () {
			$scope.lostPass.hide();
		}

		//showForgotPass
		$scope.showForgotPass = function () {

			$ionicModal.fromTemplateUrl('views/lostPass.html', function (modal) {

				$scope.lostPass = modal;
				$scope.lostPass.show();
			}, {
				scope : $scope,
				animation : 'fade-in'
			});

		}

		$scope.forgotPassword = function (_email) {

			if (!_email) {
				system.showToAst("Enter your email address!");
				return false;
			}

			if (!system.testEmail(_email)) {
				system.showToAst("Invalid email address!");
				return false;
			};

			system.new_showLoading();

			var result = system.sendForgotPassword(_email);
			result.then(function (data) {

				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);

				system.showToAst(data);

			})

		}

		// facebook login
		$scope.facebookRegister = function () {
			
			var result = system.facebookRegister();

			result.then(function (user) {
				if (!user)
					system.showToAst("Login error!");
				else 
					$window.location.reload(true);
				
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);
			});

		}

		// gmail login
		$scope.gmailRegister = function () {
			
			var result = system.registerByGoogle();
			
			result.then(function (user) {
				if (!user)
					system.showToAst("Login error!");
				else 
					$window.location.reload(true);

				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 500);
			});

		}

	} else {
	
		$scope.users = [];

		initPeople();

		function initPeople() {

			$scope.limit = 40;
			
			$scope.isPeopleInfinite = true;
			system.showLoading();
			var result = system.search(false);
			$scope.users = [];
			$scope.maxUsers = 0;
			result.then(function (users) {

				$scope.users = users;			
				$scope.maxUsers = users.length;
				
				$timeout(function () {
					system.hideLoading();
					$ionicScrollDelegate.scrollTop();
					$scope.$broadcast('scroll.refreshComplete');					
				}, 500);
				
			})
		}
		
		$scope.refresh_people = function () {
			system.cashed_people = [];
			initPeople();
			$ionicScrollDelegate.scrollTop();

			$timeout(function () {
				$scope.$broadcast('scroll.refreshComplete');
			}, 200);

		}
		
		system.showUserModalForm($scope, true);
			
	}

})

livechat.controller('NearbyCtrl', function ($scope, $window, system, $timeout, $ionicLoading, $ionicScrollDelegate) {

	$scope.users = [];
	nearby();

	if (!system.map_status) {
		system.new_showLoading();
		var res = system.gpsControl();

		res.then(function (state) {

			$timeout(function () {
				cordova.plugin.pDialog.dismiss();
			}, 500);

			if (!state) {
				var toast = new Toast();
				toast.showLongCenter("Your location was not detected by google loader, please enable gps or network location or try again.", function (a) {}, function (b) {});
			} else {
				nearby();
			}
		})
	}

	function nearby() {
		$scope.limit = 80;
		$scope.isNearInfinite = true;

		system.new_showLoading();
		var result = system.search(true);
		$scope.users = [];
		$scope.maxUsers = 0;
		result.then(function (users) {
			$scope.users = users;
			$scope.maxUsers = users.length;
			$timeout(function () {				
				cordova.plugin.pDialog.dismiss();
			}, 500);

		})
	}

	$scope.loadMore = function () {

		if ($scope.limit >= $scope.maxUsers)
			return false;

		system.new_showLoading();
		$timeout(function () {
			$scope.limit += 80;
			$scope.$broadcast('scroll.infiniteScrollComplete');
			if ($scope.limit > 80)
				cordova.plugin.pDialog.dismiss();
		}, 500);
	}

	$scope.refresh_people = function () {
		system.cashed_nearby = [];
		nearby();
		$ionicScrollDelegate.scrollTop();

		$timeout(function () {
			$scope.$broadcast('scroll.refreshComplete');
		}, 200);

	}

	$scope.search = function () {

		window.plugins.textarea.openTextView('Search', 'OK', "Cancel", 'Search for people', "", true, true, false,
			function (data) {
			if (typeof data === "undefined")
				return false;
			var res = JSON.parse(data);
			if (res.body == "")
				return false;

			if (res.status == "cancel") {
				cordova.plugin.Keyboard.close();
				return false;
			}

			system.new_showLoading();
			var result = system.searchByName(res.body);
			$scope.users = [];
			result.then(function (users) {

				$scope.users = users;
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
				}, 100);

				$scope.maxUsers = users.length;
			});

		}, function () {
			alert("error");
		});

	}

	system.showUserModalForm($scope, true);

})


livechat.controller('ChatsCtrl', function ($scope, $rootScope, Chat, $ionicScrollDelegate, $timeout, $window, system) {
   
   admob.destroyBannerView();
   
   $scope.data = {};
   system.showUserModalForm($scope, true);
   
    if (!system.socket) {
		system.socket = Chat.join(system.profile);
		system.initScoket($ionicScrollDelegate);
		//system.showInterstitialAd();
	} else {
		system.socket = Chat.join(system.profile);
	}
	
	system.new_showLoading();
	var res = system.load_group_chat_Message();
			
	res.then(function (messages) {	
		$rootScope.groupChatMessages = messages;
		
		$timeout(function () {							
			cordova.plugin.pDialog.dismiss();
			$timeout(function () {					
				$ionicScrollDelegate.scrollBottom();
			}, 200);
								
		}, 200);	
					
	})
		
	$scope.show_icons =  function () {
		$scope.isIcon = true;
	}  
	
	$scope.close_icons =  function () {
		$scope.isIcon = false;
	}  
	
	$scope.closeChatModal = function () {
		system.InitAdMob(true);
		$('#homeMenu').trigger("click");
	}
	
	$scope.hide_icons = function (_code) {
		$scope.isIcon = false;
		var message = system.create_group_message(_code, 1);
		system.save_group_chat_Message(message);
		Chat.send_group_message(message);		
	}
	
	
	var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

	$scope.inputUp = function() {
		if (isIOS) $scope.data.keyboardHeight = 216;
		$timeout(function() {
			$ionicScrollDelegate.scrollBottom(true);
		}, 300);

	};

	$scope.inputDown = function() {
		if (isIOS) $scope.data.keyboardHeight = 0;
		$ionicScrollDelegate.resize();
	};

	$scope.closeKeyboard = function() {
		// cordova.plugins.Keyboard.close();
	};
	
	$scope.write_message = function (data) {		
		
		/*
		var result = system.do_group_write_message();		
		
		result.then(function (message) {	
			Chat.send_group_message(message);								
		})
		*/
		if (!data.message) return false;
		
		var message = system.create_group_message(data.message, 0);
		system.save_group_chat_Message(message);
		Chat.send_group_message(message);			
	
		delete data.message;		
		
		$timeout(function () {
			$ionicScrollDelegate.scrollBottom(true);	
		}, 500);
		
	}
	
	$scope.setUserName = function (message) {
		
		$scope.data.message = message.c_username + ' ';
	}
	
	
})

livechat.controller('MessagesCtrl', function ($scope, $ionicLoading, $timeout, $window, system) {

	system.loadMessages($scope, false);
	system.showUserModalForm($scope, true);
	
	$scope.canChecked = function () {
		if (!$scope.isChecked)
			$scope.isChecked = true;
		else
			$scope.isChecked = false;
	}

	$scope.onItemDelete = function (message) {

		system.DeleteChatMessage(message.id);
		system.loadMessages($scope);
	}

	$scope.remove_messages = function () {

		system.nativeConfirm("Confirmation", "Delete all conversations", function (res) {

			if (res) {
				system.new_showLoading();
				
				var userIds = "";
				var mask  = "";
				
				$timeout(function () {
					
					for (var i in $scope.messages) {
						
						var user = $scope.messages[i];
						
						mask = ($scope.messages.length > 0) ? ',': '';
						userIds += user.id + mask;
					}
					
					userIds = userIds.slice(0, -1);		
					
					system.DeleteChatAllMessage(userIds);

					cordova.plugin.pDialog.dismiss();
					system.loadMessages($scope);

				}, 100);

			}

		});

	}
	
	$scope.refresh_messages = function () {
		
		system.loadMessages($scope, true);

		$timeout(function () {			
			$scope.$broadcast('scroll.refreshComplete');
		}, 500);

	}


})

livechat.controller('FavoriteCtrl', function ($scope, $timeout, $ionicScrollDelegate, $ionicLoading, $window, system) {

	loadFavorites();

	function loadFavorites() {

		system.new_showLoading();
		$timeout(function () {
			var result = system.favorites();

			result.then(function (favorites) {
				$scope.favorites = favorites;
				$timeout(function () {
					cordova.plugin.pDialog.dismiss();
					$ionicScrollDelegate.scrollTop();
				}, 500);
			})
		}, 100);
	}

	$scope.canChecked = function () {
		if (!$scope.isChecked)
			$scope.isChecked = true;
		else
			$scope.isChecked = false;
	}

	$scope.onItemDelete = function (message) {

		system.nativeConfirm("Confirmation", "Remove from favorite?", function (res) {

			if (res) {

				$timeout(function () {
					system.remove_favorite($scope, message.id);
					system.cashed_favorites = [];
					$timeout(function () {
						loadFavorites();
					}, 200);

				}, 100);

			}

		});

	}

	system.showUserModalForm($scope, true);

})

livechat.controller('VisitorsCtrl', function ($scope, $timeout, $ionicScrollDelegate, $ionicLoading, $window, system) {

	system.new_showLoading();
	$timeout(function () {
		var result = system.visitors();
		result.then(function (visitors) {
			$scope.visitors = visitors;
			$timeout(function () {
				cordova.plugin.pDialog.dismiss();
				$ionicScrollDelegate.scrollTop();
			}, 500);
		})
	}, 200);

	$scope.remove_visitors = function () {

		system.nativeConfirm("Confirmation", "Delete all visitors", function (res) {

			if (res) {

				$timeout(function () {

					system.remove_visitors();
					$scope.visitors = [];
					system.cashed_visitors = [];
					system.visitors();
					$ionicScrollDelegate.scrollTop();

				}, 100);

			}

		});

	}

	system.showUserModalForm($scope, true);

})

livechat.controller('myProfileCtrl', function ($scope, $ionicModal, $ionicPopover, $window, system, $timeout) {

	
	$scope.user = system.profile;
	
	$ionicPopover.fromTemplateUrl('views/profile_more.html', {
		scope: $scope,
	}).then(function(popover) {
		$scope.popover = popover;
	});

		
	system.viewProfile($scope.user);
	system.editProfile($scope, $scope.user, 'edit.html');
	
	
	$scope.Existing_photo = function () {
		system.Existing_photo();
		$scope.popover.hide();
	}

	$scope.user_take_photo = function () {
		system.user_take_photo();
		$scope.popover.hide();
	}

	$scope.setState = function (user) {

		window.plugins.textarea.openTextView('Status', 'OK', "Cancel", 'What are you up to?', "", true, true, false,
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
				system.actionUpdate(res.body);
				$('#homeMenu').trigger("click");
			}
		}, function () {
			alert("error");
		});

	}
	
	$scope.closeMoreDetails = function () {
		$scope.moreDetails.hide();
	}

	$scope.userMoreDetails = function (user) {

		$ionicModal.fromTemplateUrl('views/userMoreDetails.html', function (modal) {

			$scope.moreDetails = modal;
			$scope.moreDetails.show();
		}, {
			scope : $scope,
			animation : 'fade-in'
		});

	}

})

livechat.controller('SettingsCtrl', function ($scope, $window, system, $ionicHistory) {

	$scope.popover.hide();
	
	$scope.type_distance = function () {

		window.plugins.textarea.openTextView('Filter by distance', 'OK', "Cancel", 'Type radius distance?', "", false, true, true,
			function (data) {
			if (typeof data === "undefined")
				return false;
			var res = JSON.parse(data);
			if (res.body == "")
				return false;
			if (res.status == "cancel")
				return false;
			$scope.setting.distance = res.body;
		}, function () {
			alert("error");
		});

	}

	$scope.type_age_from = function () {

		window.plugins.textarea.openTextView('Min - 18, Max - 60', 'OK', "Cancel", 'Type age from?', "", false, true, true,
			function (data) {
			if (typeof data === "undefined")
				return false;
			var res = JSON.parse(data);
			if (res.body == "")
				return false;
			if (res.status == "cancel")
				return false;
			$scope.setting.age_from = res.body;
		}, function () {
			alert("error");
		});

	}

	$scope.type_age_to = function () {

		window.plugins.textarea.openTextView('Min - 18, Max - 60', 'OK', "Cancel", 'Type age to?', "", false, true, true,
			function (data) {
			if (typeof data === "undefined")
				return false;
			var res = JSON.parse(data);
			if (res.body == "")
				return false;
			if (res.status == "cancel")
				return false;
			$scope.setting.age_to = res.body;
		}, function () {
			alert("error");
		});

	}

	$scope.done = function () {

		var _man = $scope.setting.man;
		var _woman = $scope.setting.woman;
		var _photo = $scope.setting.photo;
		var _sound = $scope.setting.sound;
		var _distance = $scope.setting.distance;
		var _age_from = $scope.setting.age_from;
		var _age_to = $scope.setting.age_to;
		var _location = $scope.setting.location;

		if (_age_from < 18) {
			_age_from = 18;
			system.alert("Error", "Age must be between 18 - 60");
			return false;
		}

		if (_age_to > 60) {
			_age_to = 60;
			system.alert("Error", "Age must be between 18 - 60");
			return false;
		}

		if (_age_from > _age_to) {
			_age_from = 18;
			system.alert("Error", "Age must be between 18 - 60");
			return false;
		}

		if (_age_to < _age_from) {
			_age_to = 60;
			system.alert("Error", "Age must be between 18 - 60");
			return false;
		}

		var Settings = {

			man : _man,
			woman : _woman,
			photo : _photo,
			sound : _sound,
			distance : _distance,
			age_from : _age_from,
			age_to : _age_to,
			location : _location
		}

		system.cashed_nearby = [];
		system.cashed_people = [];
		system.cashed_chat_messages = [];
		system.cashed_favorites = [];
		system.cashed_visitors = [];
		system.cashed_populars = []

		$ionicHistory.clearCache();

		localStorage.setItem('Settings', JSON.stringify(Settings));
		system.setUserLocation();
		system.setting = Settings;
		system.initService();

		$window.history.back();
	}

})

livechat.controller('PopularsCtrl', function ($scope, $window, system, $ionicLoading, $timeout, $ionicModal, $ionicScrollDelegate) {

	$scope.limit = 0;
	$scope.isPopularInfinite = true;
	system.new_showLoading();
	var result = system.populars();

	result.then(function (populars) {

		$scope.populars = populars;		
		$timeout(function () {
			cordova.plugin.pDialog.dismiss();
		}, 500);

		$scope.maxUsers = populars.length;
	});

	$scope.loadMore = function () {

		if ($scope.limit >= $scope.maxUsers)
			return false;

		system.new_showLoading();

		$timeout(function () {
			$scope.limit += 80;
			$scope.$broadcast('scroll.infiniteScrollComplete');
			if ($scope.limit > 80)
				cordova.plugin.pDialog.dismiss();
		}, 500);

	}

	system.showUserModalForm($scope, true);

});


livechat.controller('VIPCtrl', function ($scope, $window, system, $ionicLoading, $timeout, $ionicModal, $ionicScrollDelegate) {

	$scope.limit = 0;
	$scope.isVIPInfinite = true;
		
	loadVipUsers();
		
	function loadVipUsers() {
		system.new_showLoading();
		
		var result = system.vipUsers();

		result.then(function (vipUsers) {
					
			$scope.vipUsers = vipUsers;		
			$timeout(function () {
				cordova.plugin.pDialog.dismiss();
			}, 500);

			$scope.maxUsers = vipUsers.length;
		});
	}

	$scope.loadMore = function () {
		
		if ($scope.limit >= $scope.maxUsers)
			return false;

		system.new_showLoading();

		$timeout(function () {
			$scope.limit += 80;
			$scope.$broadcast('scroll.infiniteScrollComplete');
			if ($scope.limit > 80)
				cordova.plugin.pDialog.dismiss();
		}, 500);

	}

	$scope.getVip = function () {
		
		system.payPalDialog();
	}
	
	
	$scope.refresh_vip_users = function () {
		
		system.cashed_vip_users = [];
		loadVipUsers();
		$ionicScrollDelegate.scrollTop();

		$timeout(function () {
			$scope.$broadcast('scroll.refreshComplete');
		}, 200);
	}
	
	system.showUserModalForm($scope, true);

});


livechat.controller('HistoryCtrl', function ($scope, $window, system, $ionicLoading, $timeout, $ionicModal, $ionicScrollDelegate) {

	system.new_showLoading();

	$timeout(function () {
		var result = system.myHistory();
		result.then(function (users) {
			$scope.history = users;
			$timeout(function () {
				cordova.plugin.pDialog.dismiss();
			}, 500);
		});
	}, 100);

	$scope.remove = function () {

		system.nativeConfirm("Confirmation", "Clear history?", function (res) {

			if (res) {

				$timeout(function () {

					system.my_history = [];
					$scope.history = [];
					localStorage.removeItem('my_history');
					system.myHistory();
					$ionicScrollDelegate.scrollTop();

				}, 100);

			}

		});

	}

	system.showUserModalForm($scope, true);

});


livechat.controller('LikesCtrl', function ($scope, $window, system, $ionicLoading, $timeout, $ionicModal, $ionicScrollDelegate) {
	
	system.new_showLoading();

	$timeout(function () {
		var result = system.likes();
		result.then(function (users) {
			$scope.likes = users;
			$timeout(function () {
				cordova.plugin.pDialog.dismiss();
			}, 500);			
		});
	}, 100);

	
	$scope.remove_likes = function () {

		system.nativeConfirm("Confirmation", "Delete all likes?", function (res) {

			if (res) {

				$timeout(function () {

					system.remove_likes();
					$scope.likes = [];
					system.cashed_likes = [];
					system.likes();
					$ionicScrollDelegate.scrollTop();

				}, 100);

			}

		});

	}

	system.showUserModalForm($scope, true);

});

livechat.controller('OnlineCtrl', function ($scope, $window, system, $ionicLoading, $timeout, $ionicModal, $ionicScrollDelegate) {

	loadOnline();

	function loadOnline() {

		system.new_showLoading();

		var result = system.onlineUsers();

		result.then(function (users) {

			$scope.users = users;
			$timeout(function () {
				cordova.plugin.pDialog.dismiss();
				$ionicScrollDelegate.scrollTop();
			}, 500);
		});

	}

	$scope.refresh_online = function () {
		system.cashed_online_users = [];
		loadOnline();

		$timeout(function () {
			cordova.plugin.pDialog.dismiss();
			$scope.$broadcast('scroll.refreshComplete');
		}, 500);

	}

	system.showUserModalForm($scope, true);

});



livechat.controller('AboutCtrl', function ($scope, $window, system, $timeout) {
	
	//system.showInterstitialAd();		
	
	$scope.rate_app = function () {
		window.open('market://details?id=com.livechat.dating', '_system');
	}

	$scope.exit_app = function () {

		system.nativeConfirm("Confirmation", "Are you sure you want to exit?", function (res) {

			if (res) {

                $timeout(function () {
                    system.logOut(false);
                    navigator.app.exitApp();
                }, 100);

            }

		});

	}

	$scope.deactive_app = function () {

		system.nativeConfirm("Warning", "Are you sure you want to deactivate your account?", function (res) {

			if (res) {
				$timeout(function () {
					system.logOut(true);
					$window.location.reload(true);
				}, 100);

			}

		});
	}
	
});
