import { useWordsContext } from "../../contexts/WordsContext";
import { Loading, LoadingButton } from "../ui/Loading";

export default function WordsPage() {
  const { words, loading, form, setForm, error, onAdd, onUpdate, onDelete } = useWordsContext();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Słówka</h1>

      <form onSubmit={onAdd} className="grid gap-2 mb-6">
        <input className="border rounded p-2" placeholder="term (np. apple)"
               value={form.term} required
               onChange={(e)=>setForm({...form, term:e.target.value})}/>
        <input className="border rounded p-2" placeholder="translation (np. jabłko)"
               value={form.translation}
               onChange={(e)=>setForm({...form, translation:e.target.value})}/>
        <input className="border rounded p-2" placeholder="example (np. I eat an apple.)"
               value={form.example}
               onChange={(e)=>setForm({...form, example:e.target.value})}/>
        <LoadingButton 
          loading={loading}
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
          onClick={onAdd}
        >
          Dodaj
        </LoadingButton>
      </form>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      {loading ? <Loading text="Ładowanie słówek..." /> : (
        <ul className="grid gap-3">
          {words.map((w) => (
            <li key={w.id} className="border rounded p-3">
              <div className="font-semibold">{w.term}</div>
              <div className="text-sm opacity-80">{w.translation}</div>
              <div className="text-sm italic opacity-80">{w.example}</div>
              <div className="mt-2 flex gap-2">
                <button className="border rounded px-2 py-1"
                        onClick={() => onUpdate(w.id, { term: prompt("Nowe słówko:", w.term) ?? w.term })}>
                  Edytuj
                </button>
                <button className="border rounded px-2 py-1"
                        onClick={() => onDelete(w.id)}>
                  Usuń
                </button>
              </div>
            </li>
          ))}
          {words.length === 0 && <div>Brak wpisów. Dodaj pierwsze słówko 👆</div>}
        </ul>
      )}
    </div>
  );
}
