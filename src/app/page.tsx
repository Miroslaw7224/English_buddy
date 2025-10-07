import { TopBar } from '@/components/layout/TopBar';
import { LevelRedirect } from '@/components/LevelRedirect';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <LevelRedirect />
      <TopBar />
      <section className="px-4 -mt-40 pb-4 text-center">
        <div className="flex justify-center mb-1">
          <Image 
            src="/title.svg" 
            alt="English Agent" 
            width={600}
            height={600}
            className="w-full max-w-2xl drop-shadow-[0_16px_32px_rgba(0,0,0,0.9)]"
            style={{
              imageRendering: 'pixelated'
            }}
            quality={100}
            priority
          />
        </div>
        
        {/* Zakładki */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto -mt-32">
          <Link href="/dashboard" className="group">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 h-32 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-2">Dashboard</h3>
              <p className="text-gray-300">Lekcja dnia + streak</p>
            </div>
          </Link>
          
          <Link href="/chat" className="group">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 h-32 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-2">Chat & Learn English</h3>
              <p className="text-gray-300">Ucz się angielskiegoz AI</p>
            </div>
          </Link>
          
          <Link href="/flashcards" className="group">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 h-32 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-2">FISZKI</h3>
              <p className="text-gray-300">Mini zadania</p>
            </div>
          </Link>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 h-32 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-2">ZADANIA</h3>
            <p className="text-gray-300">Zadania</p>
          </div>
          
          <Link href="/chat-voice" className="group">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 h-32 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-2">Chat głosowy</h3>
              <p className="text-gray-300">Rozmowa głosowa z AI</p>
            </div>
          </Link>
          
          <Link href="/words" className="group">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 h-32 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-2">Słownik</h3>
              <p className="text-gray-300">Trudniejsze słówka</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
