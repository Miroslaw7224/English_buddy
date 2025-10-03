import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
  } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";



export default function TopBar({
  user,              // obiekt zalogowanego lub null
  loading,           // bool z ChatPage (żeby zablokować przycisk)
  onLogin,           // (username, password) => void
  onLogout,          // () => void
  wordsOpen,         // bool – czy panel "Słówka" otwarty
  onToggleWords,     // () => void – przełącz panel "Słówka"
  getUsername,       // (user) => string – funkcja do wyciągnięcia username
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
    return (
        <header className="sticky top-0 z-50 border-b bg-black/40 backdrop-blur text-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <img src="/icon-192.png" alt="English Buddy" style={{width: '40px', height: '40px'}}/>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Nauka</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="h-8 rounded-xl bg-background/90 text-foreground shadow-none
             hover:bg-background data-[state=open]:bg-background"
            style={{ boxShadow: 'inset 0 0 0 1px hsl(220,14%,95%)', fontSize: '16px' }}>Wkrótce</div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Ćwiczenia</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="h-8 rounded-xl bg-background/90 text-foreground
             shadow-none
             [box-shadow:inset_0_0_0_1px_hsl(220,14%,95%)]
             hover:bg-background data-[state=open]:bg-background">Wkrótce</div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Biblioteka</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="h-8 rounded-xl bg-background/90 text-foreground
             shadow-none
             [box-shadow:inset_0_0_0_1px_hsl(220,14%,95%)]
             hover:bg-background data-[state=open]:bg-background">Wkrótce</div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Profil</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="h-8 rounded-xl bg-background/90 text-foreground
             shadow-none
             [box-shadow:inset_0_0_0_1px_hsl(220,14%,95%)]
             hover:bg-background data-[state=open]:bg-background">Wkrótce</div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
  
          <div className="flex items-center gap-2">
          {!user && (
            <div className="flex items-center gap-2">
              <Input className="h-8 w-[180px]" placeholder="Nazwa użytkownika"
                    value={username} onChange={e=>setUsername(e.target.value)} />
              <Input className="h-8 w-[160px]" placeholder="Hasło" type="password"
                    value={password} onChange={e=>setPassword(e.target.value)} />
              <Button size="sm" disabled={loading || !username || !password}
                      onClick={() => onLogin(username, password)}>
                Zaloguj / Załóż
              </Button>
            </div>
          )}
          {user && (
            <div className="flex items-center" style={{ gap: '16px' }}>
              <div className="h-8 rounded-xl bg-background/90 text-foreground font-bold
             shadow-none
             [box-shadow:inset_0_0_0_1px_hsl(220,14%,95%)]
             hover:bg-background data-[state=open]:bg-background px-3 py-1"
                  style={{ fontSize: '16px', fontWeight: '700' }}
                  title="Zalogowany jako">
                Zalogowany jako {getUsername(user)}
              </div>
              <Link to="/" className="text-white hover:text-gray-300 px-3 py-1 rounded">
                Chat
              </Link>
              <Button size="sm"
                      variant={wordsOpen ? "default" : "secondary"}
                      onClick={() => navigate("/words")}>
                Słówka
              </Button>

              <Button size="sm" variant="outline" onClick={onLogout}>
                Wyloguj
              </Button>
            </div>
          )}
          </div>
        </div>
      </header>
    );
  }
  