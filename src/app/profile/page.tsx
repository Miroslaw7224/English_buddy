'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Target, Volume2, BookOpen, Save, ClipboardCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    cefrLevel: user?.cefr_level || 'B1',
    dailyGoal: 30, // minutes
    ttsEnabled: true,
    ttsVoice: 'alloy',
    notifications: true
  });

  // Load user profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('user_profil')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setSettings({
          cefrLevel: profile.cefr_level || 'B1',
          dailyGoal: profile.settings?.dailyGoal || 30,
          ttsEnabled: profile.settings?.ttsEnabled !== false,
          ttsVoice: profile.settings?.ttsVoice || 'alloy',
          notifications: profile.settings?.notifications !== false
        });
      }
    };
    
    loadProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      // Save to database with explicit type casting
      const { error } = await supabase
        .from('user_profil')
        .upsert({
          user_id: user.id,
          cefr_level: settings.cefrLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
          settings: {
            dailyGoal: settings.dailyGoal,
            ttsEnabled: settings.ttsEnabled,
            ttsVoice: settings.ttsVoice,
            notifications: settings.notifications
          }
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Reload profile from database to sync
      const { data: profile } = await supabase
        .from('user_profil')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile saved successfully:', profile);

      // Update user in store with fresh data
      if (profile) {
        setUser({ 
          ...user, 
          cefr_level: profile.cefr_level,
          placement_score: profile.placement_score,
          placement_taken_at: profile.placement_taken_at,
          placement_mode: profile.placement_mode,
          placement_source: profile.placement_source
        });
      }

      toast({
        title: "✅ Ustawienia zapisane",
        description: `Poziom CEFR: ${settings.cefrLevel}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "❌ Błąd zapisu",
        description: "Nie udało się zapisać ustawień",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const ttsVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <TopBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Profil użytkownika
          </h1>
          <p className="text-gray-300">
            Ustaw swój poziom, cele i preferencje nauki
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Informacje o użytkowniku
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm">Email</label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">Nazwa użytkownika</label>
                <Input
                  value={user?.email?.split('@')[0] || ''}
                  disabled
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Learning Settings */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ustawienia nauki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm">Poziom CEFR</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cefrLevels.map((level) => (
                    <Button
                      key={level}
                      variant={settings.cefrLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, cefrLevel: level }))}
                      className={
                        settings.cefrLevel === level
                          ? "bg-blue-600 text-white"
                          : "bg-white/20 border-white/30 text-white hover:bg-white/30"
                      }
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/placement-test')}
                  className="mt-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-400/30 text-white hover:bg-purple-600/30"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Sprawdź swój poziom
                </Button>
              </div>

              <div>
                <label className="text-gray-300 text-sm">Cel dzienny (minuty)</label>
                <Input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings(prev => ({ ...prev, dailyGoal: parseInt(e.target.value) || 0 }))}
                  className="bg-white/10 border-white/20 text-white"
                  min="5"
                  max="120"
                />
              </div>
            </CardContent>
          </Card>

          {/* TTS Settings */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Ustawienia TTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Włącz TTS</span>
                <Button
                  variant={settings.ttsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, ttsEnabled: !prev.ttsEnabled }))}
                  className={
                    settings.ttsEnabled
                      ? "bg-green-600 text-white"
                      : "bg-white/20 border-white/30 text-white hover:bg-white/30"
                  }
                >
                  {settings.ttsEnabled ? 'Włączone' : 'Wyłączone'}
                </Button>
              </div>

              {settings.ttsEnabled && (
                <div>
                  <label className="text-gray-300 text-sm">Głos TTS</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ttsVoices.map((voice) => (
                      <Button
                        key={voice}
                        variant={settings.ttsVoice === voice ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, ttsVoice: voice }))}
                        className={
                          settings.ttsVoice === voice
                            ? "bg-blue-600 text-white"
                            : "bg-white/20 border-white/30 text-white hover:bg-white/30"
                        }
                      >
                        {voice}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                Powiadomienia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Powiadomienia o celach</span>
                <Button
                  variant={settings.notifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                  className={
                    settings.notifications
                      ? "bg-green-600 text-white"
                      : "bg-white/20 border-white/30 text-white hover:bg-white/30"
                  }
                >
                  {settings.notifications ? 'Włączone' : 'Wyłączone'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            Zapisz ustawienia
          </Button>
        </div>
      </div>
    </div>
  );
}
