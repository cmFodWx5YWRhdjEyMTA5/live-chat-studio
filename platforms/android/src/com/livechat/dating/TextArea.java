package com.livechat.dating;

import org.apache.cordova.CallbackContext;

import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Context;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.DialogInterface;

import android.widget.LinearLayout;
import android.widget.EditText;
import android.graphics.Color;
import android.text.Editable;
import android.text.InputType;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.text.method.DigitsKeyListener;
import android.view.Gravity;
import android.view.WindowManager;

public class TextArea extends CordovaPlugin {

	// cordova Actions
	private static final String OPEN_TEXT_VIEW = "openTextView";

	private static final String WHITE_COLOR = "#00000000";
	private static final String BLACK_COLOR = "#FF000000";
	private EditText commentText;
	private boolean inputType;
	private boolean showAutoKeyboard;
	private boolean isAlpha = false;
	
	// Main method for Cordova plugins
	@SuppressLint("NewApi")
	@Override
	public boolean execute(String action, final JSONArray args,
			final CallbackContext callbackContext) throws JSONException {

		if (action.equals(OPEN_TEXT_VIEW)) {

			try {
				String title = args.getString(0);
				String confirmMessage = args.getString(1);
				String cancelMessage = args.getString(2);
				String placeHolderMessage = args.getString(3);
				String bodyMessage = args.getString(4);
				inputType = args.getBoolean(5);
				showAutoKeyboard = args.getBoolean(6);
				isAlpha = args.getBoolean(7);
				
				AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(
						cordova.getActivity(), AlertDialog.THEME_HOLO_LIGHT);
				
				alertDialogBuilder.setPositiveButton(confirmMessage,
						new DialogInterface.OnClickListener() {

							@Override
							public void onClick(DialogInterface arg0, int arg1) {
								String escapeString = escapeText(commentText.getText()
										.toString());
								String jsonString = "{\"status\" : \"success\",\"body\" : \""
										+ escapeString + "\"}";
								callbackContext.success(jsonString);
							}
						});
				alertDialogBuilder.setNegativeButton(cancelMessage,
						new DialogInterface.OnClickListener() {

							@Override
							public void onClick(DialogInterface arg0, int arg1) {
								String escapeString = escapeText(commentText.getText()
										.toString());
								String jsonString = "{\"status\" : \"cancel\",\"body\" : \""
										+ escapeString + "\"}";
								callbackContext.success(jsonString);
							}
						});

				alertDialogBuilder.setTitle(title);

				final AlertDialog createdDialog = alertDialogBuilder.create();
				createdDialog.setView(theDialogView(placeHolderMessage,
						bodyMessage));

				createdDialog.show();

				((AlertDialog) createdDialog).getButton(
						AlertDialog.BUTTON_POSITIVE).setEnabled(false);

				commentText.addTextChangedListener(new TextWatcher() {

					@Override
					public void beforeTextChanged(CharSequence s, int start,
							int count, int after) {
						// TODO Auto-generated method stub

					}

					@Override
					public void onTextChanged(CharSequence s, int start,
							int before, int count) {
						// TODO Auto-generated method stub

					}

					@Override
					public void afterTextChanged(Editable s) {

						if (TextUtils.isEmpty(s)) {

							((AlertDialog) createdDialog).getButton(
									AlertDialog.BUTTON_POSITIVE).setEnabled(
									false);

						} else {

							((AlertDialog) createdDialog).getButton(
									AlertDialog.BUTTON_POSITIVE).setEnabled(
									true);

						}

					}

				});

				if (showAutoKeyboard)
					createdDialog
							.getWindow()
							.setSoftInputMode(
									WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);

			} catch (Exception e) {
				callbackContext.error(e.toString());
			}
		}

		return true;

	}

	private String escapeText(String text) {
		String escapeString = text.replace("\n", " ");
		escapeString = escapeString.replace("\\", "\\\\");
		escapeString = escapeString.replace("\"", "\\\"");
		return escapeString;
	}

	private LinearLayout theDialogView(String placeHolderMessage,
			String bodyMessage) {

		Context context = this.cordova.getActivity().getApplicationContext();

		LinearLayout linear = new LinearLayout(context);
		linear.setOrientation(LinearLayout.VERTICAL);
		LinearLayout.LayoutParams linearLP = new LinearLayout.LayoutParams(
				LinearLayout.LayoutParams.MATCH_PARENT,
				LinearLayout.LayoutParams.MATCH_PARENT);
		linear.setLayoutParams(linearLP);

		// Edit Text
		commentText = new EditText(context);
		LinearLayout.LayoutParams editTextLP = new LinearLayout.LayoutParams(
				LinearLayout.LayoutParams.MATCH_PARENT,
				LinearLayout.LayoutParams.WRAP_CONTENT);
		commentText.setLayoutParams(editTextLP);
		if (inputType)
		{
			commentText.setInputType(InputType.TYPE_CLASS_TEXT);
			if (isAlpha)
				commentText.setKeyListener(DigitsKeyListener.getInstance("�����������������������������abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"));
		}
		else
			commentText.setInputType(InputType.TYPE_CLASS_NUMBER);

		commentText.setSingleLine(false);
		commentText.setHint(placeHolderMessage);
		commentText.setText(bodyMessage);
		commentText.setSelection(bodyMessage.length());
		commentText.setGravity(Gravity.TOP);
		commentText.setBackgroundColor(Color.parseColor(WHITE_COLOR));
		commentText.setHintTextColor(Color.parseColor(BLACK_COLOR));
		commentText.setTextColor(Color.parseColor(BLACK_COLOR));

		// Add to main Linear Layout
		linear.addView(commentText);

		return linear;

	}

}
