import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config/FirebaseConfig";
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AuthUser extends User {
    role?: string;
}

interface AuthProps {
    user?: AuthUser;
    initialized?: boolean;
}

const AuthContext = createContext<AuthProps>({});

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children}: PropsWithChildren) => {
    const [user, setUser] = useState<AuthUser | undefined>();
    const [initialized, setInitialized] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (firebaseUser) => {
            console.log("Auth state changed. User:", firebaseUser ? firebaseUser.uid : "null");
            if (firebaseUser) {
                const userDocRef = collection(FIRESTORE_DB, 'roster');
                const userQuery = query(userDocRef, where('uid', '==', firebaseUser.uid));
                const userSnapshot = await getDocs(userQuery);
                
                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    console.log("User data from Firestore:", userData);
                    const authUser: AuthUser = {
                        ...firebaseUser,
                        role: userData.role || ''
                    };
                    console.log("Setting user with role:", authUser.role);
                    setUser(authUser);
                } else {
                    console.log("No user data found in Firestore");
                    setUser(firebaseUser);
                }
            } else {
                console.log("Setting user to undefined");
                setUser(undefined);
            }
            setInitialized(true);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{user, initialized}}>
            {children}
        </AuthContext.Provider>
    );
};
