# Plan V1

1) Cel wersji V1

Uruchomić PWA na iPadzie z ekranem czatu.

Użytkownik wpisuje wiadomość → backend wysyła ją do modelu (OpenAI) → wraca odpowiedź nauczyciela.

Minimalna pamięć rozmowy w ramach sesji.

Bez audio; tylko tekst.

Działa jako „apka z ikony” (Add to Home Screen).

2) Struktura projektu (monorepo)
/english-agent/
  /frontend/     (React PWA)
  /backend/      (FastAPI)
  /ops/          (deploy, konfiguracje)

3) Frontend (PWA) – zakres V1

Ekrany i UI

Ekran czatu: lista wiadomości (uczeń vs. nauczyciel), pole input, przycisk Wyślij.

Pasek nagłówka: tytuł „English Tutor”.

Stan ładowania podczas oczekiwania na odpowiedź.

Obsługa błędów (baner przy timeoucie lub 5xx).

PWA

manifest (nazwa, ikony 512/192 px, orientacja, start_url).

service worker cache’ujący statyczne pliki (UI dostępny offline; rozmowa wymaga sieci).

Metatagi iOS (full screen po dodaniu do ekranu domowego).

Logika

Bufor konwersacji w pamięci (np. w stanie frontu); limit (np. 10–15 ostatnich wymian) przed wysyłką do backendu.

Timeout żądania (np. 30 s) i ponawianie (1 raz).

Proste ograniczenie spamu: blokada przycisku Wyślij, dopóki nie wróci odpowiedź.

Konfiguracja

Zmienna środowiskowa VITE_API_BASE_URL (adres backendu).

Prostą walidację długości wiadomości (np. 1–800 znaków).

4) Backend (FastAPI) – zakres V1

Endpointy

POST /chat – przyjmuje: wiadomość użytkownika oraz skróconą historię (lista naprzemiennych ról). Zwraca: odpowiedź nauczyciela + uproszczoną historię (opcjonalnie).

Agent (prompt, koncepcja)

Rola: prywatny nauczyciel angielskiego, uprzejmy, krótko i jasno tłumaczy, podsuwa słowa/zwroty, poprawia błędy w przyjazny sposób, dopytuje.

Język odpowiedzi: angielski + jeśli trzeba krótkie polskie wyjaśnienia (jedno–dwa zdania).

Ograniczenia długości odpowiedzi (np. 2–5 zdań + ewentualnie lista punktów).

Bezpieczeństwo

OPENAI_API_KEY wyłącznie po stronie backendu (ENV/secret manager).

CORS tylko z domeny frontendu.

Prosta kontrola nadużyć: limit długości wejścia, przepustowość (np. rate limit na IP/user_id).

Logi tylko techniczne (bez wrażliwych treści).

Stabilność

Timeouty do zewnętrznego API i czytelne kody błędów:

408/504 dla timeout,

429 dla limitów,

502/503/500 dla reszty.

5) Dane i prywatność (V1)

Brak rejestracji użytkownika — anonimowy user_id generowany w przeglądarce i dołączany do żądań (pozwala mierzyć podstawowe statystyki).

Nie zapisujemy treści rozmów w bazie (V1). Tylko krótkie metryki techniczne (czas odpowiedzi, status).

Brak audio, brak plików — minimalny footprint.

6) Deployment tanio

Frontend

Hosting statyczny: Netlify / Cloudflare Pages / DO App Platform (static) — darmowe plany OK.

Domenka opcjonalna (może być subdomena provider’a).

Backend

Startowo: Render Free / Railway Free (może „usypiać” po bezczynności).

Alternatywnie tani Droplet DO (mały, zawsze-on) + uvicorn/gunicorn + pm2/systemd + Caddy/Nginx.

Konfiguracja prod

Zmienne środowiskowe: OPENAI_API_KEY, ALLOW_ORIGIN (frontend URL).

HTTPS: zapewnia provider frontu i/lub reverse proxy dla backendu.

7) Testy na iPadzie mini 5 (checklista)

Otwórz URL w Safari → sprawdź, czy UI ładuje się szybko.

Dodaj do ekranu domowego → uruchom z ikony (pełny ekran).

Wyślij 2–3 krótkie wiadomości → odpowiedzi przychodzą < kilka sekund.

Odłącz internet → PWA wstaje (UI), ale wysłanie wiadomości pokazuje czytelny błąd „wymaga internetu”.

Odśwież aplikację z ikonki → konwersacja lokalna wciąż widoczna (z cache’u frontu).

8) UX wytyczne (V1)

Krótkie placeholdery („Napisz po angielsku…”) i podpowiedzi („Zapytaj o small talk, podróże, pracę”).

Duży przycisk „Wyślij”, stany: aktywny/disabled podczas oczekiwania.

Ogranicz wysokość historii (wirtualizacja listy niepotrzebna w V1, ale ogranicz liczbę dymków).

Prosty temat kolorystyczny, wysoki kontrast, czytelna typografia.

9) Monitoring i jakość

Logi po stronie backendu: czasy odpowiedzi, błędy 4xx/5xx, liczba zapytań.

Brak storage treści rozmów (V1); ewentualnie zliczanie długości inputu/outputu (telemetria bez treści).

Alert: jeśli 5xx > X% w 10 minut — sprawdzenie klucza, limitów, łączności.

10) Kryteria „V1 zaliczona”

Aplikacja dodaje się do ekranu domowego i uruchamia w pełnym ekranie.

Użytkownik pisze i dostaje sensowne, krótkie odpowiedzi nauczyciela.

Błędy sieci są czytelnie komunikowane.

Czas do pierwszej odpowiedzi (P50) < ~3–5 s.

Brak wycieków klucza w froncie.