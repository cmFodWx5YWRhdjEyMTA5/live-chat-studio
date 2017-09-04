'use strict';



// All this does is allow the message
// to be sent when you tap return
livechat.directive('input', function($timeout) {
  return {
    restrict: 'E',
    scope: {
      'returnClose': '=',
      'onReturn': '&',
      'onFocus': '&',
      'onBlur': '&'
    },
    link: function(scope, element, attr) {
      element.bind('focus', function(e) {
        if (scope.onFocus) {
          $timeout(function() {
            scope.onFocus();
          });
        }
      });
      element.bind('blur', function(e) {
        if (scope.onBlur) {
          $timeout(function() {
            scope.onBlur();
          });
        }
      });
      element.bind('keydown', function(e) {
        if (e.which == 13) {
          if (scope.returnClose) element[0].blur();
          if (scope.onReturn) {
            $timeout(function() {
              scope.onReturn();
            });
          }
        }
      });
    }
  }
})



livechat.directive('ngkeydown', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			scope.keydown();
		});
	};

})

livechat.directive('autoFocus', function ($timeout) {
	return {
		restrict : 'AC',
		scope : {
			'onBlur' : '&'
		},
		link : function (_scope, _element) {
			_element.bind('blur', function (e) {
				if (_scope.onBlur) {
					_element[0].focus();
				}
			});

		}
	};
});


livechat.directive('centerimage', function($window) {
	
	return {
        restrict: 'ACE',
        link: function($scope, element, attrs, ctrl) {
            element.bind('load', function() {	
				var w = angular.element($window);
				if (element[0].width > element[0].height)
				   element[0].style.marginTop = (w.height() - element[0].height) / 2 + 'px'
			   
				else if (element[0].height < 400)
				   element[0].style.marginTop = (w.height() - element[0].height) / 2  + 'px'
            });
        }
		
    };
	
});

livechat.directive('galleryimage', function($window) {
	
	return {
        restrict: 'ACE',
        link: function($scope, element, attrs, ctrl) {
            element.bind('load', function() {	
				var w = angular.element($window);
				if (element[0].height <= 50)
				   element[0].style.marginTop =  (element[0].width - element[0].height) / 2 + 'px'
            });
        }
		
    };
	
});

livechat.directive('ngCache', function () {

	return {
		restrict : 'A',
		link : function (scope, el, attrs) {

			attrs.$observe('ngSrc', function (src) {

				ImgCache.isCached(src, function (path, success) {
					if (success) {
						//alert("success");
						ImgCache.useCachedFile(el);
					} else {
						//alert("added");
						ImgCache.cacheFile(src, function () {
							ImgCache.useCachedFile(el);
						});
					}
				});

			});
		}
	};
});

livechat.directive('imageonload', function ($ionicLoading) {
	return {
		restrict : 'A',
		link : function (scope, element, attrs) {
			element.bind('load', function () {
				scope.imgLoadIsDone(attrs.imageonload);
			});
		}
	};
});

livechat.directive('resize', function ($window) {
	return function (scope, element) {

		var w = angular.element($window);
		scope.getWindowDimensions = function () {
			return {
				'h' : w.height(),
				'w' : w.width()
			};
		};
		scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
			scope.windowHeight = newValue.h;
			scope.windowWidth = newValue.w;

			scope.style = function () {
				return {
					'height' : (newValue.h)  + 'px',
					'max-width' : (newValue.w) + 'px'
				};
			};

		}, true);

		w.bind('resize', function () {
			scope.$apply();
		});
	}
});
