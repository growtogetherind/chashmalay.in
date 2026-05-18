import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, getProfile as fetchFirebaseProfile, updateProfile as updateFirebaseProfile } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, updateProfile as updateAuthProfile, sendPasswordResetEmail } from 'firebase/auth';
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
        try {
          // Check for existing profile
          const { data, error } = await fetchFirebaseProfile(currentUser.uid);
          
          if (error) {
            console.error("Error fetching profile during auth sync:", error);
          } else if (!data) {
            // Create missing profile for both normal and Google users
            const profileData = {
              email: currentUser.email,
              full_name: currentUser.displayName || 'Customer',
              is_admin: false,
              created_at: new Date()
            };
            await updateFirebaseProfile(currentUser.uid, profileData);
            setProfile(profileData);
          } else {
            // Profile exists, set it
            setProfile(data);
            
            // Optional: If it's a Google user, ensure display name/email is up to date
            if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
               if (!data.full_name && currentUser.displayName) {
                 await updateFirebaseProfile(currentUser.uid, { full_name: currentUser.displayName });
                 setProfile(prev => ({ ...prev, full_name: currentUser.displayName }));
               }
            }
          }
        } catch (err) {
          console.error("Auth sync error:", err);
        } finally {
          setProfileLoading(false);
        }
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
      const errorMessage = (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')
        ? 'Invalid user or password'
        : error.message;
      toast.error(errorMessage);
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

  const resetPassword = async (email) => {
    try {
      // 1. Check if user exists in Firestore profiles
      const q = query(collection(db, "profiles"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No account found with this email address.');
      }

      // 2. If exists, send reset email
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
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
    fetchProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
