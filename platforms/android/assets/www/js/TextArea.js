// constructor
function TextArea() {

}

TextArea.prototype.openTextView = function(titleString, confirmButtonString, cancelButtonString, placeHolderString, bodyText, inputType, showAutoKeyboard, isAlpha, successCallback, errorCallback) {
  cordova.exec(successCallback, errorCallback, "TextArea", "openTextView", [titleString, confirmButtonString, cancelButtonString, placeHolderString, bodyText, inputType, showAutoKeyboard, isAlpha]);
}

TextArea.install = function () {
  if (!window.plugins) {
    window.plugins = {};
  }

  window.plugins.textarea = new TextArea();
  return window.plugins.textarea;
};

cordova.addConstructor(TextArea.install);