import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  MessageCircle,
  BookMarked,
  Headphones,
  Pencil,
  RotateCw,
  Play,
  CheckCircle2,
} from "lucide-react";

interface TodayPlanItem {
  id: string;
  kind: "lesson" | "srs";
  title: string;
  subtitle?: string;
  durationMin: number;
  points: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  status: "todo" | "done";
  cta?: "Start" | "Review";
}

interface TodayPlanProps {
  items?: TodayPlanItem[];
  onItemClick?: (item: TodayPlanItem) => void;
}

export default function TodayPlan({ items = [], onItemClick }: TodayPlanProps) {
  const { done, total, minutes, points, lessons, srs } = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === "done").length;
    const minutes = items.reduce((sum, i) => sum + (i.durationMin || 0), 0);
    const points = items.reduce((sum, i) => sum + (i.points || 0), 0);
    const lessons = items.filter((i) => i.kind === "lesson");
    const srs = items.filter((i) => i.kind === "srs");
    return { done, total, minutes, points, lessons, srs };
  }, [items]);

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5" />
          📋 Plan na dziś
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-gray-300 text-sm">
            Postęp: {done} / {total} ukończono
          </p>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
            {percent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Lessons */}
          {lessons.length > 0 && (
            <Section title={`Lekcje (${lessons.length})`}>
              <div className="space-y-3">
                {lessons.map((i) => (
                  <PlanRow key={i.id} item={i} onClick={onItemClick} />
                ))}
              </div>
            </Section>
          )}

          {/* SRS */}
          {srs.length > 0 && (
            <Section title={`Powtórki SRS (${srs.length})`}>
              <div className="space-y-3">
                {srs.map((i) => (
                  <PlanRow key={i.id} item={i} onClick={onItemClick} />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-300">
              <span>⏱️</span>
              <span>Czas: {minutes} min</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <span>🏅</span>
              <span>Punkty: {items.filter(i=>i.status==='done').reduce((s,i)=>s+i.points,0)} / {points}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-white">{title}</div>
      {children}
    </div>
  );
}

function PlanRow({ item, onClick }: { item: TodayPlanItem; onClick?: (item: TodayPlanItem) => void }) {
  const isDone = item.status === "done";
  const Icon = pickIcon(item);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors ${
        isDone 
          ? "bg-green-500/20 border-green-500/30" 
          : "bg-white/5 border-white/20 hover:bg-white/10"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${isDone ? "bg-green-500/20" : "bg-blue-500/20"}`}>
          {isDone ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Icon className="h-4 w-4 text-blue-400" />}
        </div>
        <div className="min-w-0">
          <div className={`truncate text-sm font-medium ${isDone ? "text-white" : "text-gray-300"}`}>{item.title}</div>
          {item.subtitle && (
            <div className="truncate text-xs text-gray-400">{item.subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.difficulty && (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
            {item.difficulty === 'beginner' ? 'początkujący' : item.difficulty === 'intermediate' ? 'średniozaawansowany' : 'zaawansowany'}
          </Badge>
        )}
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">{item.durationMin} min</Badge>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">+{item.points} pkt</Badge>
        {isDone ? (
          <Badge variant="secondary" className="bg-green-500/20 text-green-300 text-xs">
            Zrobione
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onClick?.(item)}
            className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30 gap-1"
          >
            <Play className="h-3 w-3" /> {item.cta === 'Review' ? 'Powtórz' : 'Start'}
          </Button>
        )}
      </div>
    </div>
  );
}

function pickIcon(item: TodayPlanItem) {
  if (item.kind === "srs") return RotateCw;
  // crude mapping by title keywords; replace with explicit type if you prefer
  const t = item.title.toLowerCase();
  if (t.includes("chat")) return MessageCircle;
  if (t.includes("flash")) return BookMarked;
  if (t.includes("listen")) return Headphones;
  if (t.includes("write")) return Pencil;
  return MessageCircle;
}

/* ----------------------
 * Example usage (remove)
 * ----------------------

import TodayPlan from "./TodayPlan";

const mock = [
  { id: "1", kind: "lesson", title: "Chat – Daily conversation", subtitle: "Practice everyday English", durationMin: 5, points: 10, difficulty: "beginner", status: "done" },
  { id: "2", kind: "lesson", title: "Flashcards", subtitle: "Learn 10 new words", durationMin: 10, points: 15, difficulty: "beginner", status: "todo" },
  { id: "3", kind: "srs", title: "hello → cześć", subtitle: "Word review", durationMin: 5, points: 10, status: "todo", cta: "Review" },
  { id: "4", kind: "srs", title: "goodbye → do widzenia", subtitle: "Word review", durationMin: 5, points: 10, status: "todo", cta: "Review" },
];

export default function Dashboard() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <TodayPlan items={mock} onItemClick={(i)=>console.log("go to:", i)} />
    </main>
  );
}
*/
