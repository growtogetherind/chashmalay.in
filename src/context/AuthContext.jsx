import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, getProfile as fetchFirebaseProfile, updateProfile as updateFirebaseProfile } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfileLoading(true);
        await fetchProfile(currentUser.uid);
        setProfileLoading(false);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await fetchFirebaseProfile(userId);
    if (!error) setProfile(data);
  };

  const signUp = async (email, password, fullName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateAuthProfile(result.user, { displayName: fullName });
      
      const profileData = {
        email,
        full_name: fullName,
        is_admin: false,
        created_at: new Date()
      };
      
      await updateFirebaseProfile(result.user.uid, profileData);
      setProfile(profileData);
      
      toast.success('Account created successfully!');
      return { user: result.user, profile: profileData };
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profileResult = await fetchFirebaseProfile(result.user.uid);
      if (!profileResult.error) setProfile(profileResult.data);
      toast.success(`Welcome back!`);
      return { user: result.user, profile: profileResult.data };
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const { data } = await fetchFirebaseProfile(result.user.uid);
      let profileData = data;

      if (!data) {
        profileData = {
          email: result.user.email,
          full_name: result.user.displayName,
          is_admin: false,
          created_at: new Date()
        };
        await updateFirebaseProfile(result.user.uid, profileData);
      }
      
      setProfile(profileData);
      toast.success('Logged in with Google!');
      return { user: result.user, profile: profileData };
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    toast.success('Logged out successfully.');
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const { error } = await updateFirebaseProfile(user.uid, updates);
    if (error) throw error;
    setProfile(prev => ({ ...prev, ...updates }));
    toast.success('Profile updated!');
  };

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    isAdmin: profile?.is_admin || false,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    fetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
