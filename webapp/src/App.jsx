import {useState} from 'react'; 
import Login from './pages/Login';
import Dashboard from './pages/DashBoard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('spotify_access_token'));

  const logout = () => {
    console.log("Token expired. Logging out...");
    localStorage.removeItem('spotify_access_token'); 
    setToken(null); 
  };

  if (!token) {
    return <Login onAuth={(newToken) => {
      localStorage.setItem('spotify_access_token', newToken);
      setToken(newToken);
    }} />;
  }

  return <Dashboard token={token} onLogout={logout} />;
}