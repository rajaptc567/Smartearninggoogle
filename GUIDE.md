# How to Run This App in GitHub Codespaces (Step-by-Step Guide)

Welcome! This guide will walk you through setting up and running the SmartEarning application in a GitHub Codespace. You don't need any prior coding experience to follow these steps.

A Codespace is a development environment that runs in your web browser. We will use it to run a simple local server so you can view and interact with the application.

---

### Step 1: Create a Free Firebase Project

The application needs a database and user authentication system to work. We will use Google's Firebase, which is free for projects of this size.

1.  **Go to the Firebase Website:** Open a new tab and navigate to the [Firebase Console](https://console.firebase.google.com/). You may need to sign in with your Google account.
2.  **Add a Project:** Click on **"Add project"**, give it a name (like "My-Smart-Earning-App"), and click **Continue**. You can disable Google Analytics if you wish, then click **"Create project"**.
3.  **Enable Authentication:**
    *   Once your project is ready, go to the **Build > Authentication** section from the left menu.
    *   Click **"Get started"**.
    *   In the list of providers, click on **"Email/Password"** and **Enable** it. Click **Save**.
4.  **Create a Firestore Database:**
    *   From the left menu, go to **Build > Firestore Database**.
    *   Click **"Create database"**.
    *   Select **"Start in test mode"**. This is important as it allows the app to save data. Click **Next**.
    *   Choose a location for your database (the default is usually fine) and click **"Enable"**.
5.  **Get Your Firebase Keys:**
    *   Click the **Gear icon** (⚙️) next to "Project Overview" in the top-left and select **"Project settings"**.
    *   Under the "General" tab, scroll down to the "Your apps" section.
    *   Click the web icon that looks like this: **`</>`**.
    *   Give your web app a nickname (e.g., "SmartEarning Web App") and click **"Register app"**.
    *   Firebase will now show you your configuration keys. It will be a block of code that starts with `const firebaseConfig = { ... };`. **Keep this page open!**

---

### Step 2: Open This Project in Codespaces

1.  Go to the main page of this project's repository on GitHub.
2.  Click the green **"< > Code"** button.
3.  Go to the **"Codespaces"** tab.
4.  Click **"Create codespace on main"**. This will open a new browser tab with a complete development environment. It may take a minute or two to set up.

---

### Step 3: Add Your Firebase Keys to the App

Now, we'll connect the app to the Firebase project you just created.

1.  In the Codespace, look at the file explorer on the left-hand side.
2.  Find and open the folder named `firebase`.
3.  Click on the file named `config.ts`.
4.  You will see a placeholder `firebaseConfig` object.
5.  Go back to your Firebase project settings page from Step 1. Copy your unique keys and paste them over the placeholder values in `firebase/config.ts`.

    **It should look like this when you're done (but with your own keys):**
    ```typescript
    const firebaseConfig = {
      apiKey: "AIzaSyABC...xyz", // PASTE YOURS HERE
      authDomain: "my-smart-earning-app.firebaseapp.com", // PASTE YOURS HERE
      projectId: "my-smart-earning-app", // PASTE YOURS HERE
      storageBucket: "my-smart-earning-app.appspot.com", // PASTE YOURS HERE
      messagingSenderId: "1234567890", // PASTE YOURS HERE
      appId: "1:12345:web:abcd..." // PASTE YOURS HERE
    };
    ```
6.  Save the `firebase/config.ts` file (you can press `Ctrl + S` or `Cmd + S`).

---

### Step 4: Start the Application

This is the final step where we run two simple commands. A "Terminal" window should already be open at the bottom of your Codespace. If not, you can open one by clicking the menu icon (☰) in the top-left and choosing **Terminal > New Terminal**.

1.  **First Command (Installation):** This command installs all the necessary tools for the development server. You only need to run this once.
    *   Click inside the terminal window.
    *   Type the following command and press **Enter**:
        ```bash
        npm install
        ```
    *   Wait for it to finish. You will see a lot of text, which is normal.

2.  **Second Command (Start the Server):** This command starts the local web server.
    *   Once the first command is done, type the following command and press **Enter**:
        ```bash
        npm run dev
        ```

---

### Step 5: View Your Live App!

After running `npm run dev`, you will see a message in the terminal that says the server is running. GitHub Codespaces will automatically show a pop-up message in the bottom-right corner telling you that your app is available on a new port.

*   Click the **"Open in Browser"** button on that pop-up.

A new browser tab will open, and you will see the SmartEarning homepage.

**Congratulations!** The application is now running and is fully connected to your personal Firebase database. You can register new users, log in, and all the data will be saved in your own project.
