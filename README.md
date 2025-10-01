


# Stwórz nowe środowisko conda dla projektu
conda create -n english_agent python=3.11 -y
# Aktywuj środowisko
conda activate english_agent
# Zainstaluj zależności
cd backend
pip install -r requirements.txt

# Uruchom serwer backendu
cd backend
conda activate english_agent
uvicorn main:app --reload --port 8000

# Uruchom server fontendu
cd frontend
npm run build # przebuduj frontend
npm run dev # Uruchom frontend

Wszyskto działa kozacko