// /src/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({

    apiKey: 'AIzaSyAtTmQDb7J7ElDrm3ZSucKBn6ASKSinwEI',
    authDomain: 'me-project-b5213.firebaseapp.com',
    databaseURL: 'https://me-project-b5213-default-rtdb.firebaseio.com',
    projectId: 'me-project-b5213',
    storageBucket: 'me-project-b5213.firebasestorage.app',
    messagingSenderId: '814833106361',
    appId: '1:814833106361:web:7d23f6b3f7654c6a424a68',
    measurementId: 'G-0HX30CDTED',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/img/undraw_posting_photo.svg' // تعديل المسار حسب مشروعك
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
