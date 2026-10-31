"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const defaultOptions = ["吃火锅", "吃烧烤", "吃日料"];
const optionColors = [
  "bg-pop-pink/20 border-pop-pink",
  "bg-pop-yellow/20 border-pop-yellow",
  "bg-pop-cyan/20 border-pop-cyan",
  "bg-pop-green/20 border-pop-green",
  "bg-pop-purple/20 border-pop-purple",
];

export function DiceScreen() {
  const [options, setOptions] = useState<string[]>(defaultOptions);
  const [input, setInput] = useState("");
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rollCount, setRollCount] = useState(0);
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);
  const confettiId = useRef(0);

  function addOption() {
    const val = input.trim();
    if (!val || options.length >= 8) return;
    setOptions([...options, val]);
    setInput("");
  }

  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx));
  }

  function roll() {
    if (options.length < 2 || rolling) return;
    setRolling(true);
    setResult(null);
    setTimeout(() => {
      const pick = options[Math.floor(Math.random() * options.length)];
      setResult(pick);
      setRollCount((c) => c + 1);
      setRolling(false);
      // confetti
      const colors = ["#ff6b9d", "#ffd93d", "#6bcfff", "#34d399", "#8b5cf6"];
      const pieces = Array.from({ length: 30 }, () => ({
        id: confettiId.current++,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(pieces);
      setTimeout(() => setConfetti([]), 3000);
    }, 1200);
  }

  return (
    <main className="min-h-screen px-6 py-16">
      {confetti.map((c) => (
        <div key={c.id} className="confetti" style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s` }} />
      ))}
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-ink-900 rounded-full text-sm font-medium" style={{ boxShadow: "3px 3px 0 #1a1a2e" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            回家
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="text-7xl mb-4 inline-block">🎲</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3"><span className="gradient-rainbow">决策骰子</span></h1>
          <p className="text-ink-600 text-lg">纠结到爆？让命运帮你选吧！</p>
        </div>

        <div className="card-pop-yellow p-8 mb-8 text-center relative overflow-hidden">
          <div className="py-6">
            {rolling ? (
              <div className="text-6xl mb-4 dice-rolling inline-block">🎲</div>
            ) : result ? (
              <div className="dice-result">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-ink-900 text-2xl font-bold mb-2">就决定是你了！</p>
                <p className="text-3xl font-bold gradient-rainbow">{result}</p>
              </div>
            ) : (
              <>
                <div className="text-6xl mb-4 opacity-60">🎲</div>
                <p className="text-ink-600 mb-6">添加选项，然后让骰子帮你选！</p>
              </>
            )}
            <button
              className="btn-pop btn-pop-pink px-10 py-4 font-bold text-lg"
              onClick={roll}
              disabled={rolling || options.length < 2}
            >
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M16 8h.01M8 8h.01M8 16h.01M16 16h.01M12 12h.01" /></svg>
                {rolling ? "掷骰子中..." : result ? "再来一次！" : "开始掷骰子！"}
              </span>
            </button>
          </div>
        </div>

        <div className="card-pop p-6 mb-8">
          <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <span>📝</span> 你的选项
            <span className="text-sm font-normal text-ink-500">({options.length}/8)</span>
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="输入一个选项..."
              className="flex-1 input-pop px-4 py-3 font-medium"
              maxLength={30}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addOption()}
              disabled={options.length >= 8}
            />
            <button className="btn-pop btn-pop-green px-5 py-3 font-bold" onClick={addOption} disabled={!input.trim() || options.length >= 8}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            </button>
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${optionColors[i % optionColors.length]}`}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-white border-2 border-ink-900 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <span className="font-medium text-ink-900">{opt}</span>
                </div>
                <button className="p-1.5 text-ink-500 hover:text-pop-red transition-colors" onClick={() => removeOption(i)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card-pop-cyan p-6">
          <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2"><span>💡</span> 骰子的正确打开方式</h3>
          <ul className="space-y-2 text-sm text-ink-700">
            <li className="flex items-start gap-2"><span>🎯</span><span>当两个选项差不多时，用骰子帮你打破僵局</span></li>
            <li className="flex items-start gap-2"><span>🤔</span><span>看到结果的瞬间，你是失望还是开心？那就是你的真实想法</span></li>
            <li className="flex items-start gap-2"><span>😜</span><span>小事情随便选，大事还是要认真分析哦（用 AI 那个）</span></li>
          </ul>
          <div className="mt-4 pt-4 border-t-2 border-ink-100">
            <Link href="/" className="inline-flex items-center gap-1 text-pop-purple font-semibold text-sm hover:underline">
              有重大决策？去用 AI 深度分析 →
            </Link>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-ink-500">
          <p>已掷 <span className="font-bold text-ink-900">{rollCount}</span> 次骰子</p>
        </div>
      </div>
    </main>
  );
}
