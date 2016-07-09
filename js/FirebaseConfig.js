var firebase = require('firebase/app');
require('firebase/database');

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDosAeyw32PzHFHD7PH5K-pylroHTwCCFY',
  authDomain: 'toomanychefs.firebaseapp.com',
  databaseURL: 'https://toomanychefs.firebaseio.com',
  storageBucket: 'project-7129828134166850974.appspot.com',
};

var app = firebase.initializeApp(FIREBASE_CONFIG);

module.exports = app;
