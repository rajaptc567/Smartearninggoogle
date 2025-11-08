# SmartEarning Admin Panel (Serverless with Firebase)

This project is a comprehensive admin dashboard for the SmartEarning platform, now re-architected to be completely serverless using Google's Firebase. This means you get a powerful, real-time database and user authentication without needing to run or manage your own backend server.

The entire application runs directly in the browser and connects to your Firebase project in the cloud.

## Features

-   **Real-time Cloud Database:** All data is stored and synced in real-time with Firestore.
-   **Secure User Accounts:** Full registration and login functionality powered by Firebase Authentication.
-   **No Backend Maintenance:** No need to run `npm`, `node.js`, or any server commands.
-   **Scalable & Production-Ready:** Ready to be deployed and used by real users.

## How to Get Started (No Code Experience Needed)

To get your own live version of this application running, you just need to create a free Firebase project and copy its configuration into the app. Follow these simple steps:

### Step 1: Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click on **"Add project"** and give your project a name (e.g., "My SmartEarning App").
3.  Follow the on-screen instructions to create the project. You can disable Google Analytics if you wish.

### Step 2: Set Up Firebase Services

Once your project is created, you need to enable the two services we'll use:

1.  **Authentication (for user logins):**
    -   In the left-hand menu, go to **Build > Authentication**.
    -   Click **"Get started"**.
    -   Under "Sign-in providers", select **"Email/Password"** and enable it. Click **Save**.

2.  **Firestore (for the database):**
    -   In the left-hand menu, go to **Build > Firestore Database**.
    -   Click **"Create database"**.
    -   Choose to start in **"Test mode"** (this allows the app to write data). You can change security rules later.
    -   Select a location for your database and click **"Enable"**.

### Step 3: Get Your Firebase Configuration

Now, you'll get the special keys that connect your app to your new Firebase backend.

1.  In the top-left of the Firebase Console, click the **gear icon** next to "Project Overview" and select **"Project settings"**.
2.  Under the "General" tab, scroll down to the "Your apps" section.
3.  Click the web icon **`</>`** to create a new web app.
4.  Give your app a nickname (e.g., "SmartEarning Web") and click **"Register app"**.
5.  Firebase will show you a `firebaseConfig` object. It looks like this:

    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "..."
    };
    ```
    **This is what you need. Keep this page open!**

### Step 4: Add Configuration to the App

1.  In this project's code, open the file `firebase/config.ts`.
2.  You will see a placeholder `firebaseConfig` object.
3.  **Copy** your unique configuration values from the Firebase setup page and **paste** them over the placeholder values in `firebase/config.ts`.
4.  Save the `firebase/config.ts` file.

### That's It!

Your application is now fully configured and connected to your live backend. You can open `index.html` and it will work. Anyone you share it with will be able to register and use the app, and all data will be saved to your personal Firebase database.

_Note: The old `server` folder is no longer used by the frontend but is kept for reference._