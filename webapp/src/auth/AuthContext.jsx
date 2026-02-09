import {createContext, useContext, useState} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  function login(newToken) {
    localStorage.setItem('spotify_access_token', newToken);
    setToken(newToken);
  }

  function logout() {
    console.log("Token expired. Logging out...");
    localStorage.removeItem('spotify_access_token');
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{token, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
