'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let messaging: ReturnType<typeof getMessaging>;

export function initializeFirebase() {
  if (typeof window !== 'undefined' && getApps().length === 0) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    // Optional: Handle incoming messages while the app is in the foreground
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can display a custom in-app notification here
      // For example, using the existing toast system
    });
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('This browser does not support desktop notification');
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Notification permission granted.');
    // Get the token
    try {
      const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // TODO: Send this token to your server and store it.
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  }

  return permission;
}

// Ensure this file is created and placed in your `public` directory
// public/firebase-messaging-sw.js
/*
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png", // Make sure you have an icon in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

*/