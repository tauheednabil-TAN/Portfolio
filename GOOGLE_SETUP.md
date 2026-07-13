# Google Calendar & Gmail API Integration Setup

To fully power Nabil's automatic scheduling engine in production with Google Calendar events (and automated emails), you need to set up Google OAuth 2.0 credentials. 

Our server is designed to degrade gracefully: **if these credentials are missing, the app will automatically default to an interactive, fully functioning in-app booking approval dashboard** in your admin panel! This lets teammates and recruiters schedule instantly right now without any blockers.

Follow these steps to activate the real Google API connections:

---

## 💻 Step 1: Create a Google Cloud Project & App
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project**, name it `Nabil's Cafe Calendar` (or similar), and select it.
3. In the sidebar, navigate to **APIs & Services > Library**.
4. Search for and **Enable** the following two APIs:
   - **Google Calendar API**
   - **Gmail API**

---

## 🔒 Step 2: Configure Consent Screen & OAuth Client
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Set User Type to **External**, then click **Create**.
3. Fill in the App Name (`Nabil's Café Scheduler`), User support email, and Developer contact information. Click **Save and Continue**.
4. Under **Scopes**, add or select:
   - `https://www.googleapis.com/auth/calendar.events` (Manage calendar events)
   - `https://www.googleapis.com/auth/gmail.send` (Send emails on your behalf)
5. Under **Test users**, add your own email (`tauheednabil@gmail.com`) so you can authorize it during testing. Click **Save**.
6. Navigate to **APIs & Services > Credentials**.
7. Click **+ Create Credentials > OAuth client ID**.
8. Select Application Type: **Web application**.
9. Add the following Authorized Redirect URIs:
   - `https://developers.google.com/oauthplayground` (Used for getting your initial refresh token)
   - Your App URL (e.g. `https://your-domain.com/api/auth/google/callback`)
10. Click **Create**. Copy your **Client ID** and **Client Secret**.

---

## 🔑 Step 3: Fetch your Refresh Token (Google OAuth Playground)
1. Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Click the gear icon (⚙️) on the top right, check **Use own OAuth credentials**, and input your **Client ID** and **Client Secret**.
3. On the left pane under "Step 1: Select & authorize APIs", paste these scopes into the text box:
   ```text
   https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send
   ```
4. Click **Authorize APIs**. Login with your Google account (`tauheednabil@gmail.com`) and grant permissions.
5. In "Step 2: Exchange authorization code for tokens", click **Exchange authorization code for tokens**.
6. Copy the resulting **Refresh Token** from the JSON body.

---

## ⚙️ Step 4: Configure Your Environment Variables
Place these keys inside the **Settings > Secrets** panel in Google AI Studio, or inside your `.env` file when deploying to production:

```env
GOOGLE_CLIENT_ID="your_client_id_here"
GOOGLE_CLIENT_SECRET="your_client_secret_here"
GOOGLE_REFRESH_TOKEN="your_refresh_token_here"
```

Once configured, our server's mail and calendar orchestrators will spin up, automatically sending meeting invites with Google Meet details!
