import { useState } from "react";
import TopBar from "./components/layout/TopBar";
import ChatPage from "./components/pages/ChatPage";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import WordsPage from "./components/pages/WordsPage";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { WordsProvider } from "./contexts/WordsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ui/Toast";


function AppContent() {
  const [wordsOpen, setWordsOpen] = useState(false);
  const { user, loading, error, handleLogin, handleLogout, getUsername } = useAuthContext();
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-mountain1.jpg')" }}  // plik z /public
    >
      {/* przyciemnienie, żeby UI nie był na białym */}
      <div className="min-h-screen bg-black/35">
        <TopBar 
          user={user}
          loading={loading}
          onLogin={handleLogin}
          onLogout={() => { handleLogout(); setWordsOpen(false); }}
          wordsOpen={wordsOpen}
          onToggleWords={() => setWordsOpen(v => !v)}
          getUsername={getUsername}
        />
        {error && <div className="mx-auto max-w-6xl px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        <section className="px-4 pt-8 pb-4 text-center">
          <div className="flex justify-center mb-0">
            <img 
              src="/title.png" 
              alt="English Buddy" 
              className="h-16 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
          <p style={{fontSize: '2rem', margin: 0}} className="font-bold tracking-tight 
                        drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex justify-center">
            Learn & chat in English
          </p>
        </section>

        <main className="px-4 pb-8">
          <Routes>
            <Route path="/" element={<ChatPage user={user} />} />
            <Route path="/words" element={<WordsPage user={user} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <WordsProvider>
            <BrowserRouter>
              <AppContent />
              <ToastContainer />
            </BrowserRouter>
          </WordsProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
