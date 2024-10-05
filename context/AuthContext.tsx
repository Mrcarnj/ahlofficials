import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH } from "../config/FirebaseConfig";


interface AuthProps {
    user?: User;
    initialized?: boolean;
}

const AuthContext = createContext<AuthProps>({});

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children}: PropsWithChildren) => {
    const [user, setUser] = useState<User | undefined>();
    const [initialized, setInitialized] = useState<boolean>(false);

    useEffect(() => {
        onAuthStateChanged(FIREBASE_AUTH, (user) => {
            console.log('onAuthStateChanged', user);
            setUser(user);
            setInitialized(true);
        });
    },[]);

    return (
        <AuthContext.Provider value={{user, initialized}}>
            {children}
        </AuthContext.Provider>
    );
};