var Device = function() {};

Device.prototype.getDevice = function(successCallback, errorCallback) {
        return cordova.exec(successCallback, errorCallback, 'Device', 'getDevice', []);
 };

 var device = new Device();
 