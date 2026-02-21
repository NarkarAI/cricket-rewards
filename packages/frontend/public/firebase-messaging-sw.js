/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC5yslLWyJ-MSy_KaAZeGnltTSaGRRPAas",
  authDomain: "cricket-rewards-b1910.firebaseapp.com",
  projectId: "cricket-rewards-b1910",
  messagingSenderId: "833631781919",
  appId: "1:833631781919:web:29370d7738348496c6812a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "RewardsByFan";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };
  self.registration.showNotification(title, options);
});
