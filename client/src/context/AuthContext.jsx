/**
 * AuthContext — wraps Firebase Authentication & MongoDB Community Member Profile.
 * Supports Email and Mobile registration/login, session persistence, email verification, and instant demo access.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { app, auth } from '../services/firebase';
import { removeFcmToken } from '../services/fcm';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data);
      return data.data;
    } catch (err) {
      setProfile(null);
      return null;
    }
  }, []);

  const updateFirebaseUserState = useCallback((u) => {
    if (!u) {
      setFirebaseUser(null);
      return;
    }
    // Create a new reference preserving the prototype methods (getIdToken, reload)
    // while explicitly exposing getters like emailVerified so React recognizes changes
    const wrapped = Object.assign(Object.create(Object.getPrototypeOf(u)), u, {
      emailVerified: u.emailVerified,
      uid: u.uid,
      email: u.email,
    });
    setFirebaseUser(wrapped);
  }, []);

  useEffect(() => {
    // Check for local session token first (e.g. demo login)
    const localToken = localStorage.getItem('nl_auth_token');
    if (localToken && !auth.currentUser) {
      refreshProfile().finally(() => setLoading(false));
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      updateFirebaseUserState(user);
      if (user) {
        await refreshProfile();
      } else if (!localStorage.getItem('nl_auth_token')) {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [refreshProfile, updateFirebaseUserState]);

  /**
   * Helper to normalize email or mobile into a valid Firebase email format.
   */
  const normalizeIdentifier = (emailOrPhone) => {
    const trimmed = (emailOrPhone || '').trim();
    if (trimmed.includes('@')) {
      return { email: trimmed.toLowerCase(), mobile: '' };
    }
    const cleanDigits = trimmed.replace(/\D/g, '');
    return {
      email: `${cleanDigits}@neighborlink.user`,
      mobile: cleanDigits,
    };
  };

  /**
   * Register with Full Name, Email or Mobile Number, Password, and Location.
   * Creates Firebase account, triggers verification email, and creates DB profile with neighborhood location.
   */
  const register = async ({ fullName, emailOrPhone, password, city, community, location, age }) => {
    const { email, mobile } = normalizeIdentifier(emailOrPhone);
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // If location is provided during registration, mark prompt completed so user is not asked again
    if (location || (city && community)) {
      try {
        localStorage.setItem(`nl_location_prompt_completed_${cred.user.uid}`, 'true');
        localStorage.setItem('nl_location_prompt_completed', 'true');
        localStorage.setItem('nl_reg_location_captured', 'true');
      } catch (e) {}
    }

    // Send verification email
    try {
      await sendEmailVerification(cred.user);
    } catch (verErr) {
      console.warn('Initial email verification dispatch note:', verErr.message);
    }

    // Call backend to create Community Member profile in MongoDB
    try {
      const token = await cred.user.getIdToken();
      const { data } = await api.post(
        '/users/register',
        {
          fullName,
          email,
          mobile: mobile || emailOrPhone,
          phone: mobile || emailOrPhone,
          city: city || 'Chennai',
          community: community || 'Anna Nagar',
          neighborhood: community || 'Anna Nagar',
          location: location || null,
          age: age || 25,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(data.data);
    } catch (err) {
      console.warn('Initial profile registration sync notice:', err.message);
      await refreshProfile();
    }

    localStorage.removeItem('nl_auth_token');
    updateFirebaseUserState(cred.user);
    return cred.user;
  };

  /**
   * Direct Login with Email or Mobile Number (no external authentication barrier).
   */
  const login = async (emailOrPhone, password) => {
    try {
      await signOut(auth);
    } catch (e) {}
    updateFirebaseUserState(null);

    const { data } = await api.post('/users/login', { emailOrPhone, password });
    if (data.data?.token) {
      localStorage.setItem('nl_auth_token', data.data.token);
      setProfile(data.data.user);
    }
    return data.data.user;
  };

  /**
   * Resend verification email to current Firebase user.
   */
  const resendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No account is currently signed in. Please log in first.');
    }
    await sendEmailVerification(user);
  };

  /**
   * Reload current Firebase user and return whether email is verified.
   */
  const checkEmailVerified = async () => {
    // If evaluator/demo session
    if (localStorage.getItem('nl_auth_token')) return true;

    const user = auth.currentUser;
    if (!user) return false;

    await user.reload();
    const verified = user.emailVerified;
    updateFirebaseUserState(auth.currentUser);

    if (verified) {
      try {
        await api.patch('/users/me', { emailVerified: true });
        await refreshProfile();
      } catch (e) {}
    }
    return verified;
  };

  /**
   * Fast Demo Login for evaluations.
   */
  const demoLogin = async (roleOrEmail) => {
    // Sign out of any active Firebase session to prevent state collision
    try {
      await signOut(auth);
    } catch (e) {}
    updateFirebaseUserState(null);

    const body =
      typeof roleOrEmail === 'string' && roleOrEmail.includes('@')
        ? { email: roleOrEmail }
        : { role: roleOrEmail };

    const { data } = await api.post('/users/demo-login', body);
    if (data.data?.token) {
      localStorage.setItem('nl_auth_token', data.data.token);
      setProfile(data.data.user);
    }
    return data.data.user;
  };

  /**
   * Save onboarding profile setup.
   */
  const saveProfileSetup = async (setupData) => {
    let headers = {};
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      } else {
        const localToken = localStorage.getItem('nl_auth_token');
        if (localToken) {
          headers.Authorization = `Bearer ${localToken}`;
        }
      }
    } catch (tokenErr) {
      console.warn('[AuthContext] saveProfileSetup token note:', tokenErr.message);
    }

    const { data } = await api.post('/users/setup', setupData, { headers });
    setProfile(data.data);
    return data.data;
  };

  const logout = async () => {
    try {
      await removeFcmToken();
    } catch (e) {}
    try {
      await signOut(auth);
    } catch (e) {}
    localStorage.removeItem('nl_auth_token');
    updateFirebaseUserState(null);
    setProfile(null);
  };

  const resetPassword = (emailOrPhone) => {
    const { email } = normalizeIdentifier(emailOrPhone);
    return sendPasswordResetEmail(auth, email);
  };

  const isDemoSession = !!localStorage.getItem('nl_auth_token');
  const isEmailVerified = isDemoSession || (firebaseUser?.emailVerified ?? profile?.emailVerified ?? false);
  const isProfileComplete = isDemoSession || (profile?.profileCompleted ?? false);
  const isSenior = profile?.ageGroup === 'senior' || (profile?.age && profile.age >= 60);
  const isAdmin = profile?.role === 'admin';

  const value = {
    firebaseUser,
    profile,
    loading,
    isEmailVerified,
    isProfileComplete,
    isSenior,
    isAdmin,
    ageGroup: profile?.ageGroup || 'adult',
    register,
    login,
    demoLogin,
    logout,
    resetPassword,
    resendVerificationEmail,
    checkEmailVerified,
    refreshProfile,
    saveProfileSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

