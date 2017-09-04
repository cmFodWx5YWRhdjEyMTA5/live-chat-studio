var livechat = angular.module('livechat', ['ionic']);

livechat.run(function ($rootScope, $ionicPlatform, $ionicHistory, $window) {

	$ionicPlatform.ready(function () {

		ionic.Platform.isFullScreen = false;
		cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		cordova.plugins.Keyboard.disableScroll(true);

		if (window.StatusBar) {
			StatusBar.styleDefault();	
		}

	});

	$ionicPlatform.registerBackButtonAction(function (e) {
		
		$rootScope.chatMoreDetails = false;
		
		//check app state
		if (!$rootScope.appState) {
			var home = new Home();
			home.goHome(function () {}, function () {});
		} else {
			if ($rootScope.backButtonPressedOnceToExit) {

				var home = new Home();
				home.goHome(function () {}, function () {});
			} else if ($ionicHistory.backView()) { 
				$ionicHistory.goBack(); 
			} else {
				$rootScope.backButtonPressedOnceToExit = true;
				var toast = new Toast();
				toast.showShortCenter("Press back button again to exit", function (a) {}, function (b) {});
				setTimeout(function () {
					$rootScope.backButtonPressedOnceToExit = false;
				}, 2000);
			}
			e.preventDefault();
			return false;
		}

	}, 101);

});

livechat.filter("reverse", function () {
	return function (items) {
		return items.slice().reverse();
	};
});

livechat.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
	
	$stateProvider

	.state('menu', {
		url : "/menu",
		abstract : true,
		templateUrl : "views/menu.html"
	})

	.state('menu.home', {
		
		url : "/home",
		views : {
			'menuContent' : {
				templateUrl : "views/home.html",
				controller : "HomeCtrl"
			}
		}
	})

	.state('menu.profile', {
		cache: false,
		url : "/profile",
		views : {
			'menuContent' : {
				templateUrl : "views/myProfile.html",
				controller : "myProfileCtrl"
			}
		}
	})

	.state('menu.nearby', {
		
		url : "/nearby",
		views : {
			'menuContent' : {
				templateUrl : "views/nearby.html",
				controller : "NearbyCtrl"
			}
		}
	})
	
	.state('menu.chats', {
		cache: false,
		url : "/chats",
		views : {
			'menuContent' : {
				templateUrl : "views/chats.html",
				controller : "ChatsCtrl"
			}
		}
	})

	.state('menu.messages', {
		cache: false,
		url : "/messages",
		views : {
			'menuContent' : {
				templateUrl : "views/messages.html",
				controller : "MessagesCtrl"
			}
		}
	})

	.state('menu.favorite', {
		cache: false,
		url : "/favorite",
		views : {
			'menuContent' : {
				templateUrl : "views/favorites.html",
				controller : "FavoriteCtrl"
			}
		}
	})

	.state('menu.visitors', {
		cache: false,
		url : "/visitors",
		views : {
			'menuContent' : {
				templateUrl : "views/visitors.html",
				controller : "VisitorsCtrl"
			}
		}
	})

	.state('menu.populars', {
		cache: false,
		url : "/populars",
		views : {
			'menuContent' : {
				templateUrl : "views/populars.html",
				controller : "PopularsCtrl"
			}
		}
	})
	
	
	.state('menu.VIP', {
		cache: false,
		url : "/VIP",
		views : {
			'menuContent' : {
				templateUrl : "views/VIP.html",
				controller : "VIPCtrl"
			}
		}
	})

	.state('menu.history', {
		cache: false,
		url : "/history",
		views : {
			'menuContent' : {
				templateUrl : "views/history.html",
				controller : "HistoryCtrl"
			}
		}
	})
	
	
	.state('menu.likes', {
		cache: false,
		url : "/likes",
		views : {
			'menuContent' : {
				templateUrl : "views/likes.html",
				controller : "LikesCtrl"
			}
		}
	})

	.state('menu.settings', {
		url : "/settings",
		views : {
			'menuContent' : {
				templateUrl : "views/settings.html",
				controller : "SettingsCtrl"
			}
		}
	})

	.state('menu.online', {
		cache: false,
		url : "/online",
		views : {
			'menuContent' : {
				templateUrl : "views/online.html",
				controller : "OnlineCtrl"
			}
		}
	})
	
	.state('menu.about', {
		url : "/about",
		views : {
			'menuContent' : {
				templateUrl : "views/about.html",
				controller : "AboutCtrl"
			}
		}
	});

	$urlRouterProvider.otherwise("/menu/home");
})
