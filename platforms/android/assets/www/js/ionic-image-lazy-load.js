angular.module('ionic-img-lazy-load', []);
angular.module('ionic-img-lazy-load').directive('scroller', function ($rootScope, $timeout) {
	return {
		restrict : 'A',
		link : function ($scope, $element) {
			var scrollTimeoutId = 0;
			$scope.invoke = function () {
				$rootScope.$broadcast('scrollEvent');
			};
			$element.bind('scroll', function () {
				$timeout.cancel(scrollTimeoutId);
				scrollTimeoutId = $timeout($scope.invoke, 50);
			});
		}
	};
});
angular.module('ionic-img-lazy-load').directive('imageLazySrc', function ($document) {
	return {
		restrict : 'A',
		link : function ($scope, $element, $attributes) {
			var deregistration = $scope.$on('scrollEvent', function () {
					console.log('scroll');
					if (isInView()) {
						$element[0].src = $attributes.imageLazySrc;
						deregistration();
					}
				});
			function isInView() {
				var clientHeight = $document[0].documentElement.clientHeight;
				var clientWidth = $document[0].documentElement.clientWidth;
				var imageRect = $element[0].getBoundingClientRect();
				  return  (imageRect.top >= 0 && imageRect.bottom <= clientHeight) && (imageRect.left >= 0 && imageRect.right <= clientWidth);
			}
			$element.on('$destroy', function () {
				deregistration();
			});
			if (isInView()) {
				$element[0].src = $attributes.imageLazySrc;
				deregistration();
			}
		}
	};
});
