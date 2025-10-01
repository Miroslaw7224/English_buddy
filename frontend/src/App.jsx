import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
    const [messages, setMessages] = useState([])  // Lista wiadomości
    const [input, setInput] = useState('')        // Tekst w polu input
    const [loading, setLoading] = useState(false) // Czy czekamy na odpowiedź
    const messagesEndRef = useRef(null)
    const [error, setError] = useState(null)

    const sendMessage = async () => {
      if (!input.trim()) return  // Jeśli puste, nie rób nic
      setError(null)  // Wyczyść poprzedni błąd
      // Dodaj wiadomość użytkownika
      const userMessage = { role: 'user', content: input }
      setMessages([...messages, userMessage])
      setInput('')  // Wyczyść pole
      setLoading(true)  // Pokaż "Czekaj..."
      
      try {
        // Wyślij do backendu
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input,
            history: messages.slice(-10)  // Ostatnie 10 wiadomości
          })
        })
        
        const data = await response.json()
        
        // Dodaj odpowiedź nauczyciela
        const assistantMessage = { role: 'assistant', content: data.response }
        setMessages(prev => [...prev, assistantMessage])
        
      } catch (error) {
        console.error('Błąd:', error)
        setError('Nie udało się wysłać wiadomości. Sprawdź połączenie.')
      } finally {
        setLoading(false)
      }
    }
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
      <div className="app">
        <h1>English Buddy</h1>
        <div className="subtitle">Learn & chat in English</div>
  
        {error && <div className="error">{error}</div>}
  
        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`msg ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <small>{msg.role === 'user' ? 'Ty' : 'Nick'}</small>
              <div>{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
  
        <div className="inputRow">
          <input
            type="text"
            value={input}
            placeholder="Napisz coś..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading) sendMessage() }}
          />
          <button
            className="btn"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? 'Czekaj…' : 'Wyślij'}
          </button>
        </div>
      </div>
    )
  }

export default App   // Eksportuj komponent
