import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, getProfile as fetchFirebaseProfile, updateProfile as updateFirebaseProfile, writeAdminLog } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile as updateAuthProfile, sendPasswordResetEmail } from 'firebase/auth';
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

  // Compute RBAC states dynamically
  const resolvedRole = profile?.role || (profile?.is_admin ? 'admin' : 'customer');
  const isSuperAdmin = resolvedRole === 'super_admin';
  const isAdmin = resolvedRole === 'super_admin' || resolvedRole === 'admin' || profile?.is_admin || false;
  const isManager = isAdmin || resolvedRole === 'manager';
  const isStaff = isManager || resolvedRole === 'staff';

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
              role: 'customer',
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

  // Handle redirect login results on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast.success('Logged in with Google!');
        }
      })
      .catch((error) => {
        console.error("Redirect login error:", error);
        toast.error(error.message || 'Redirect login failed.');
      });
  }, []);

  // ─── Admin Inactivity Auto-Logout ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !isStaff) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await signOut();
        toast('Session expired due to inactivity. Please sign in again.', {
          icon: '⚠️',
          duration: 6000,
        });
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, isStaff]);

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
        role: 'customer',
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
      if (!profileResult.error) {
        setProfile(profileResult.data);
        const resolvedRole = profileResult.data?.role || (profileResult.data?.is_admin ? 'admin' : 'customer');
        if (['super_admin', 'admin', 'manager', 'staff'].includes(resolvedRole)) {
          await writeAdminLog('admin_login', result.user.uid, { email: result.user.email });
        }
      }
      toast.success(`Welcome back!`);
      return { user: result.user, profile: profileResult.data };
    } catch (error) {
      await writeAdminLog('failed_login_attempt', null, { email, error: error.message });
      const errorMessage = (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')
        ? 'Invalid user or password'
        : error.message;
      toast.error(errorMessage);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      const { data } = await fetchFirebaseProfile(result.user.uid);
      let profileData = data;

      if (!data) {
        profileData = {
          email: result.user.email,
          full_name: result.user.displayName,
          is_admin: false,
          role: 'customer',
          created_at: new Date()
        };
        await updateFirebaseProfile(result.user.uid, profileData);
      }
      
      setProfile(profileData);
      const resolvedRole = profileData?.role || (profileData?.is_admin ? 'admin' : 'customer');
      if (['super_admin', 'admin', 'manager', 'staff'].includes(resolvedRole)) {
        await writeAdminLog('admin_login', result.user.uid, { email: result.user.email, provider: 'google' });
      }
      toast.success('Logged in with Google!');
      return { user: result.user, profile: profileData };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        toast.loading('Popup blocked or closed. Trying redirect login instead...');
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          toast.error(redirectError.message);
          throw redirectError;
        }
      }
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    if (user) {
      const resolvedRole = profile?.role || (profile?.is_admin ? 'admin' : 'customer');
      if (['super_admin', 'admin', 'manager', 'staff'].includes(resolvedRole)) {
        await writeAdminLog('admin_logout', user.uid, { email: user.email });
      }
    }
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
    role: resolvedRole,
    isSuperAdmin,
    isAdmin,
    isManager,
    isStaff,
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
