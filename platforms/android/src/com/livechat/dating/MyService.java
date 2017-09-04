package com.livechat.dating;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.preference.PreferenceManager;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import com.livechat.dating.R;
import com.red_folder.phonegap.plugin.backgroundservice.BackgroundService;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;

public class MyService extends BackgroundService {

	private String profileId = "";
	private int user_id = 0;
	private boolean chat_sound = true;
	private JSONObject messagesToSend;
	private Bitmap photo = null;
	private String statusBarMessage = "";
	private static int NOTIFICATION_ID = 999;
	private android.app.NotificationManager mManager = null;

	@Override
	protected JSONObject initialiseLatestResult() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected JSONObject doWork() {

		JSONObject result = new JSONObject();

		try {

			String msg = this.getMessage();

			if (msg.trim().length() > 1) {
				result.put("message", msg);
				NotificationManager(this.statusBarMessage);
			}

		} catch (JSONException e) {
			e.printStackTrace();
		} catch (IOException e) {

			e.printStackTrace();
		}

		return result;
	}

	@Override
	protected JSONObject getConfig() {
		JSONObject result = new JSONObject();

		try {
			result.put("profileId", this.profileId);
			result.put("user_id", this.user_id);
			result.put("chat_sound", this.chat_sound);

			//store profile id in cashe
			SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this.getApplicationContext());
			SharedPreferences.Editor editor = sharedPref.edit();
			editor.putString("profile_id", this.profileId);
			editor.commit();

		} catch (JSONException e) {
		}

		return result;
	}

	@Override
	protected void setConfig(JSONObject config) {
		try {

			if (config.has("profileId"))
				this.profileId = config.getString("profileId");

			if (config.has("user_id"))
				this.user_id = config.getInt("user_id");

			if (config.has("chat_sound"))
				this.chat_sound = config.getBoolean("chat_sound");

			if (config.has("messagesToSend"))
				this.messagesToSend = config.getJSONObject("messagesToSend");

		} catch (JSONException e) {
			e.printStackTrace();
		}

		try {
			insertDB();
			updateChatStatus();
		} catch (JSONException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}

	}

	protected void updateChatStatus() throws IOException {

		if (this.user_id <= 0)
			return;

		String stateUrl = "http://kazanlachani.com/ify/chat/seen.php?user_id="
				+ this.user_id + "&send_to=" + this.profileId;
		executeUrl(stateUrl);

	}

	protected void insertDB() throws JSONException, IOException {

		if (this.messagesToSend == null)
			return;

		// read from json javascript object
		String user_id = this.messagesToSend.getString("user_id");
		String send_to = this.messagesToSend.getString("send_to");

		String username = this.messagesToSend.getString("username");
		String message = this.messagesToSend.getString("message");
		int state = this.messagesToSend.getInt("state");
		int versionCode = this.messagesToSend.getInt("versionCode");

		// insert data
		String url = "http://kazanlachani.com/ify/chat/insert.php?username="
				+ username + "&message=" + message + "&user_id=" + user_id
				+ "&send_to=" + send_to + "&state=" + state + "&versionCode="
				+ versionCode;

		try {
			executeUrl(url);
			this.messagesToSend = null;

		} catch (IOException e) {
			e.printStackTrace();
		}

	}


	protected String getMessage() throws IOException, JSONException {

		//read profile id in cashe of does not exist
		if (this.profileId == "") {
			SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this.getApplicationContext());
			this.profileId = sharedPref.getString("profile_id", "");
			Log.d("profile id", this.profileId );
		}

		// read user message
		String readMessageUrl = "https://ifymessages.herokuapp.com/load.php?user_id="
				+ this.profileId;

		this.statusBarMessage = executeUrl(readMessageUrl);

		/*
		// get user photo
		String jsonUrl = "http://ify.apphb.com/IfyService.svc/getSenderId?id="
				+ this.profileId;

		int senderId = Integer.parseInt(executeUrl(jsonUrl));

		if (senderId > 0) {
			String imageUrl = "http://kazanlachani.com/ify/services/imageNotify.php?id="
					+ senderId;

			imageUrl = executeUrl(imageUrl);

			// get bitmap
			if ((senderId > 0) && (imageUrl.length() > 0))
				this.photo = imageSource(imageUrl);
		}
		*/

		return this.statusBarMessage;

	}

	@SuppressLint("NewApi")
	protected void NotificationManager(String msg) throws IOException,
			JSONException {

		if (msg != null) {
			addNotification(msg);
		}

	}

	protected Bitmap imageSource(String param) throws IOException {

		InputStream in;

		URL url = new URL(param);
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		connection.setDoInput(true);
		connection.connect();
		in = connection.getInputStream();
		Bitmap myBitmap = BitmapFactory.decodeStream(in);
		return myBitmap;

	}

	private void addNotification(String msg) throws IOException, JSONException {

		NotificationCompat.Builder builder = new NotificationCompat.Builder(
				this).setSmallIcon(R.drawable.ic_launcher)
				.setLargeIcon(this.photo).setContentTitle("New Message")
				.setContentText(msg);

		if (!isActivityRunning()) {
			Intent notificationIntent = new Intent(this, Livechat.class);
			PendingIntent contentIntent = PendingIntent.getActivity(this, 0,
					notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
			builder.setContentIntent(contentIntent);

		} else {
			PendingIntent contentIntent = PendingIntent.getActivity(
					getApplicationContext(), 0, new Intent(this, Livechat.class), 0);
			builder.setContentIntent(contentIntent);
		}

		// Add as notification
		mManager = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

		Notification notification = builder.build();

		notification.ledARGB = 0x00FF00;
		notification.flags |= Notification.FLAG_SHOW_LIGHTS;

		notification.ledOnMS = 100; 
		notification.ledOffMS = 100; 

		//notification.defaults |= Notification.DEFAULT_LIGHTS;
		
		if (chat_sound)
			notification.defaults |= Notification.DEFAULT_SOUND;

		mManager.notify(NOTIFICATION_ID, notification);
	}

	protected Boolean isActivityRunning() {
		ActivityManager activityManager = (ActivityManager) getBaseContext()
				.getSystemService(Context.ACTIVITY_SERVICE);
		List<ActivityManager.RunningTaskInfo> tasks = activityManager
				.getRunningTasks(Integer.MAX_VALUE);

		for (ActivityManager.RunningTaskInfo task : tasks) {
			if (Livechat.class.getCanonicalName().equalsIgnoreCase(
					task.baseActivity.getClassName()))
				return true;
		}

		return false;
	}

	public static String executeUrl(String url) throws IOException {

		if (url.isEmpty())
			return "";

		BufferedReader inputStream = null;

		URL jsonUrl = new URL(url);

		URLConnection dc = jsonUrl.openConnection();

		dc.setConnectTimeout(5000);
		dc.setReadTimeout(5000);

		inputStream = new BufferedReader(new InputStreamReader(
				dc.getInputStream()));

		// read the JSON results into a string
		String jsonResult = inputStream.readLine();

		if ((jsonResult != null) && (jsonResult.length() > 0)) {
			jsonResult = jsonResult.replace("\"", "");
			return jsonResult;
		} else
			return "";

	}

}
