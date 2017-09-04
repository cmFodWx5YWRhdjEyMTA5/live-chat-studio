package com.livechat.dating;

import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.pm.Signature;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.apache.cordova.*;

public class Livechat extends CordovaActivity
{
	
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setRequestedOrientation (ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        super.init();
        loadUrl(launchUrl);
        
        /*
			try {
	
				PackageInfo info = getPackageManager().getPackageInfo(
						this.getPackageName(), PackageManager.GET_SIGNATURES);
	
				for (Signature signature : info.signatures) {
	
					MessageDigest md = MessageDigest.getInstance("SHA");
					md.update(signature.toByteArray());
					Log.d("====Hash Key===",
							Base64.encodeToString(md.digest(), Base64.DEFAULT));
	
				}
	
			} catch (NameNotFoundException e) {
	
				e.printStackTrace();
	
			} catch (NoSuchAlgorithmException ex) {
	
				ex.printStackTrace();
	
			}
		
         */
       
    }
}
