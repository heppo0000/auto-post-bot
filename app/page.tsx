"use client";

import { Zap, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<{ isConnected: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="z-10 w-full max-w-md glass rounded-2xl p-8 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">X 自動投稿くん</span>
          </h1>

          <p className="text-muted-foreground text-sm">
            AIによる高品質なツイート作成と自動スケジュールで、アカウントを成長させましょう。
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {!loading && status?.isConnected ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
              <CheckCircle className="text-green-400 w-5 h-5" />
              <span className="text-green-100 font-medium">アカウント接続済み</span>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-center flex flex-col items-center gap-2">
              <AlertCircle className="text-zinc-500 w-5 h-5" />
              <p className="text-sm text-zinc-400">APIキーを設定して、アカウントを接続してください。</p>
            </div>
          )}

          {!status?.isConnected && (
            <a
              href="/api/auth/twitter/login"
              className="block w-full text-center py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-indigo-500/20"
            >
              X アカウントを連携する
            </a>
          )}

          {status?.isConnected && (
            <button
              onClick={async () => {
                if (!confirm("ログアウトしますか？")) return;
                try {
                  await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
                  alert("ログアウトしました。");
                  window.location.href = window.location.href; // Hard reload
                } catch (e) {
                  alert("ログアウトに失敗しました");
                }
              }}
              className="w-full text-center py-2 px-4 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
            >
              ログアウト（接続解除）
            </button>
          )}

          {status?.isConnected && <ConfigForm />}
        </div>
      </div>
    </main>
  );
}

function ConfigForm() {
  const [config, setConfig] = useState({ time: '', topic: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/schedule').then(res => res.json()).then(data => {
      // Convert cron to simple time if possible, or just show raw string for MVP
      // data.time is likely '0 9 * * *'
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await fetch('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    alert('スケジュールを保存しました！');
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <h3 className="font-semibold text-lg text-white">自動投稿設定</h3>

      <div className="space-y-2">
        <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">投稿テーマ</label>
        <input
          type="text"
          value={config.topic}
          onChange={e => setConfig({ ...config, topic: e.target.value })}
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="例: AIトレンド, 今日の名言, ライフハック"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">スケジュール (Cron形式)</label>
        <input
          type="text"
          value={config.time}
          onChange={e => setConfig({ ...config, time: e.target.value })}
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
          placeholder="例: 0 9 * * *"
        />
        <p className="text-xs text-zinc-500">書式: 分 時 日 月 曜日 (例: 0 9 * * * = 毎日朝9時)</p>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
      >
        設定を保存して自動化を開始
      </button>

      {/* Test Button */}
      <button
        onClick={async () => {
          if (!confirm("すぐにXへ投稿を行ってもよろしいですか？")) return;
          // Trigger manual test
          const res = await fetch('/api/test/generate', {
            method: 'POST',
            body: JSON.stringify({ topic: config.topic || 'Test Topic' })
          });
          const data = await res.json();
          if (data.content) alert(`生成完了:\n\n${data.content}`);
          else alert(`エラーが発生しました:\n${data.details || data.error || '不明なエラー'}`);
        }}
        className="w-full py-2 px-4 bg-zinc-800 text-sm text-zinc-400 font-medium rounded-lg hover:bg-zinc-700 transition-colors"
      >
        今すぐテスト実行 (投稿テスト)
      </button>
    </div>
  );
}
