# Firebase Google Authentication Troubleshooting Guide

## Current Error: `auth/operation-not-allowed`

This error means Google Sign-in is not enabled in your Firebase project.

## Fix Steps:

### 1. Enable Google Authentication in Firebase Console

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `safeyatri-5d204`
3. **Navigate**: Authentication → Sign-in method
4. **Enable Google**:
   - Click on "Google" provider
   - Toggle "Enable" to ON
   - Enter support email (required)
   - Click "Save"

### 2. Verify Configuration

Your current Firebase config in `src/lib/firebase.ts`:

```
Project ID: safeyatri-5d204
Auth Domain: safeyatri-5d204.firebaseapp.com
```

### 3. Test Authentication

Once enabled, the Google Sign-in button should work without errors.

## Common Issues:

### Issue 1: Authorized Domains
**Solution**: Add `localhost` to authorized domains in Firebase Console

### Issue 2: Project Support Email Missing
**Solution**: Add a valid email in Google provider settings

### Issue 3: Wrong Project
**Solution**: Verify you're in the correct Firebase project (`safeyatri-5d204`)

## Development vs Production:

### Development (localhost):
- Domain: `localhost:3000`
- Already configured in Firebase

### Production:
- Add your production domain to authorized domains
- Update environment variables if needed

## After Enabling Google Auth:

1. ✅ Users can sign in with Google accounts
2. ✅ Admin profiles automatically created in Firestore
3. ✅ No more fake credentials needed
4. ✅ Secure authentication flow

## Test Steps:

1. Enable Google Auth in Firebase Console
2. Refresh your application
3. Click "Sign in with Google"
4. Select your Google account
5. Should redirect to dashboard successfully

## Contact Support:

If issues persist after enabling Google Auth:
1. Check browser console for additional errors
2. Verify Firebase project permissions
3. Ensure billing is enabled (if required)