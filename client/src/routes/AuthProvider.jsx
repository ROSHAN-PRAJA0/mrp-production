import React, { createContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase"; // Verified path

export const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
  userName: null,
});

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    role: null,
    loading: true,
    userName: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setState({ user: null, role: null, loading: false, userName: null });
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setState({
            user: currentUser,
            role: data.role || "admin",
            loading: false,
            userName: data.name || "User",
          });
        } else {
          setState({ user: currentUser, role: "admin", loading: false, userName: "Admin" });
        }
      } catch (e) {
        console.error("Auth Error:", e);
        setState({ user: currentUser, role: null, loading: false, userName: null });
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};