package com.livechat.dating;

import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

public class Device extends CordovaPlugin {

    private static final String LOG_TAG = "DevicePlugin";

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("getDevice".equals(action)) {
            String sdkversion = android.os.Build.VERSION.SDK;

            String jsonString = "{\"status\" : \"success\",\"body\" : \""
                    + sdkversion + "\"}";
            callbackContext.success(jsonString);
            return true;
        }
        Log.e(LOG_TAG, "Called invalid action: "+action);
        return false;
    }
}