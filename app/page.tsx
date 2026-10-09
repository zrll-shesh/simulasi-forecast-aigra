"use client";
import { useMemo, useState } from "react";
import * as E from "../lib/engine";
const { P, L, U, MS, SCN, THR, KBS, f, st, gab, conf, hz, idl, jp, jm, jl, rk, chart } = E as any;
const SK = Object.keys(SCN);
const TONE: any = { ok: "border-l-green-500", near: "border-l-amber-400", warn: "border-l-orange-500", crit: "border-l-red-500" };
const BADGE: any = { Normal: "bg-green-100 text-green-800", Peringatan: "bg-amber-100 text-amber-800", Kritis: "bg-red-100 text-red-800" };
const RANK: any = { ok: 0, near: 1, warn: 2, crit: 3 };
const HEAD = [["Kumbung aman", "Semua parameter diperkirakan tetap Normal."], ["Perlu dipantau", "Ada parameter yang mendekati batas."], ["Perlu tindakan", "Ada parameter yang akan melewati batas."], ["Kondisi kritis", "Ada parameter mendekati batas bahaya."]];
const clone = (x: any) => JSON.parse(JSON.stringify(x));

function Card({ icon, tag, rng, o }: any) {
  return (
    <article className={`rounded-2xl border border-slate-200 border-l-[6px] bg-white p-5 shadow-sm transition hover:shadow-md ${TONE[o.tone]}`}>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-semibold text-green-900"><span>{icon}</span>{tag}</span>
        <span>{rng}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug">{o.judul}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{o.ring}</p>
      <div className="mt-3 rounded-xl bg-green-50 p-3"><div className="text-xs font-bold uppercase tracking-wide text-green-900">Yang perlu dilakukan</div><p className="mt-1 text-sm">{o.tind}</p></div>
      {o.damp ? <div className="mt-2 rounded-xl bg-orange-50 p-3"><div className="text-xs font-bold uppercase tracking-wide text-orange-800">Dampak</div><p className="mt-1 text-sm">{o.damp}</p></div> : null}
      {(o.extra || []).map((x: string, i: number) => <p key={i} className="mt-2 text-sm text-slate-500">{x}</p>)}
      {o.cat ? <p className="mt-2 text-xs italic text-slate-500">{o.cat}</p> : null}
      {o.bar ? <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100"><i style={{ width: o.bar.n + "%", background: "#16a34a" }} /><i style={{ width: o.bar.w + "%", background: "#f59e0b" }} /></div> : null}
      <div className="mt-3 flex flex-wrap gap-1.5">{(o.acts || []).map((a: any, i: number) => <span key={i} className={`rounded-full px-3 py-1 text-xs ${a.by === "sistem" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}>{a.by === "sistem" ? "Otomatis oleh sistem" : "Dikerjakan operator"}: {a.n}, {a.kap}</span>)}</div>
    </article>
  );
}
const Sec = ({ title, sub, children }: any) => (<section className="mt-10"><h2 className="text-xl font-bold text-green-950">{title}</h2>{sub ? <p className="mb-4 text-sm text-slate-500">{sub}</p> : <div className="mb-4" />}{children}</section>);

export default function Page() {
  const [auto, setAuto] = useState(true), [kb, setKb] = useState(KBS[0]), [clk, setClk] = useState("09:35"), [cmp, setCmp] = useState(false), [scn, setScn] = useState(SK[0]);
  const [v, setV] = useState(() => { const [a, g] = SCN[SK[0]](); return { a: [...a], g: clone(g) }; });
  const pick = (k: string) => { const [a, g] = SCN[k](); setScn(k); setV({ a: [...a], g: clone(g) }); };
  const edit = (m: any, i: number, val: string) => setV((s: any) => { const n = clone(s); (m === "a" ? n.a : n.g[m])[i] = Number(val) || 0; return n; });
  const run = (au: boolean) => {
    const [h, mi] = clk.split(":").map(Number);
    const S: any = { auto: au, t: THR[au ? "inkubasi" : "threshold_manual"], nowMin: h * 60 + mi, a: Object.fromEntries(P.map((p: string, i: number) => [p, v.a[i]])), g: Object.fromEntries(MS.map((m: number) => [m, Object.fromEntries(P.map((p: string, i: number) => [p, v.g[m][i]]))])) };
    return { S, jp: jp({ ...S, now: S.nowMin }), jm: jm({ ...S, now: S.nowMin }), jl: jl({ ...S, now: { d: new Date(2026, 7, 31) } }), rk: rk(S, kb) };
  };
  const R = useMemo(() => run(auto), [auto, kb, clk, v]);
  const C = useMemo(() => (cmp ? [run(true), run(false)] : null), [cmp, kb, clk, v]);
  const { S } = R, t = S.t;
  const worst = Math.max(RANK[R.jp.tone], RANK[R.jm.tone]);
  const data = () => ({ mode: auto ? "Otomasi (profil Inkubasi)" : "Threshold (manual)", kumbung: kb, jangka_pendek: R.jp, jangka_menengah: R.jm, jangka_panjang: R.jl, rangkuman_periodik: R.rk });
  const exportJson = () => { const u = URL.createObjectURL(new Blob([JSON.stringify(data(), null, 2)], { type: "application/json" })); const el = document.createElement("a"); el.href = u; el.download = "insight-aigra.json"; el.click(); URL.revokeObjectURL(u); };
  const [copied, setCopied] = useState(false);
  const copy = async () => { const d: any = data(); await navigator.clipboard.writeText(["jangka_pendek", "jangka_menengah", "jangka_panjang", "rangkuman_periodik"].map((k) => `${d[k].judul}\n${d[k].ring}\n${d[k].tind}`).join("\n\n")); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <>
      <header className="bg-gradient-to-r from-green-900 via-green-700 to-emerald-500 pb-20 pt-8 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5">
          <div className="rounded-2xl bg-white/20 p-3 text-2xl">🍄</div>
          <div><h1 className="text-2xl font-bold sm:text-3xl">AIGRA Insight Simulator</h1><p className="text-sm text-green-50/90">Simulasi insight dan rekomendasi AI untuk kumbung jamur</p></div>
        </div>
      </header>
      <main className="mx-auto -mt-14 max-w-6xl px-5 pb-16">
        <div className="grid gap-5 rounded-2xl border border-green-100 bg-white p-5 shadow-lg md:grid-cols-2 lg:grid-cols-4">
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mode kumbung</label>
            <div className="flex rounded-xl bg-green-50 p-1">{[["Otomasi", true], ["Threshold manual", false]].map(([n, b]: any) => <button key={n} onClick={() => setAuto(b)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${auto === b ? "bg-green-600 text-white shadow" : "text-slate-600 hover:bg-green-100"}`}>{n}</button>)}</div>
            <p className="mt-1.5 text-xs text-slate-500">{auto ? "Sistem yang menyalakan perangkat." : "Operator yang menyalakan perangkat."}</p></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Kumbung (Rangkuman)</label>
            <select value={kb} onChange={(e) => setKb(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{KBS.map((k: string) => <option key={k}>{k}</option>)}</select></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Jam sekarang</label>
            <input type="time" value={clk} onChange={(e) => setClk(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bandingkan dua mode</label>
            <button onClick={() => setCmp(!cmp)} className={`w-full rounded-xl px-3 py-2.5 text-sm font-medium transition ${cmp ? "bg-green-600 text-white" : "bg-green-50 text-green-900 hover:bg-green-100"}`}>{cmp ? "Aktif: lihat bagian perbandingan" : "Tampilkan berdampingan"}</button></div>
          <div className="md:col-span-2 lg:col-span-4"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Skenario</label>
            <div className="flex flex-wrap gap-2">{SK.map((k: string) => <button key={k} onClick={() => pick(k)} className={`rounded-full border px-4 py-1.5 text-sm transition ${scn === k ? "border-green-600 bg-green-600 text-white" : "border-green-200 bg-white text-green-900 hover:bg-green-50"}`}>{k}</button>)}</div></div>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-green-800 to-green-600 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><div className="text-xs uppercase tracking-widest text-green-100">Status kumbung saat ini</div><div className="text-3xl font-bold">{HEAD[worst][0]}</div><p className="text-sm text-green-50">{HEAD[worst][1]} {R.jp.judul}.</p></div>
            <div className="rounded-full bg-white/15 px-4 py-1.5 text-xs">Mode {auto ? "Otomasi (profil Inkubasi)" : "Threshold (manual)"}</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{P.map((p: string) => { const x = t[p], val = S.a[p], s = st(p, val, t), pos = (n: number) => Math.min(100, Math.max(0, ((n - x.mk) / (x.Mk - x.mk)) * 100));
            return (<div key={p} className="rounded-xl bg-white p-4 text-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-500"><span>{L[p]}</span><span className={`rounded-full px-2 py-0.5 font-semibold ${BADGE[s]}`}>{s}</span></div>
              <div className="mt-1 text-2xl font-bold">{f(p, val)}</div>
              <div className="relative mt-3 h-2 rounded-full" style={{ background: `linear-gradient(to right,#fde68a 0,#fde68a ${pos(x.mp)}%,#bbf7d0 ${pos(x.mp)}%,#bbf7d0 ${pos(x.Mp)}%,#fde68a ${pos(x.Mp)}%,#fde68a 100%)` }}><i className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-900 shadow" style={{ left: pos(val) + "%" }} /></div>
              <div className="mt-2 text-xs text-slate-500">Normal {x.mp} sampai {x.Mp}{U[p]}. Ideal {f(p, idl(p, t))}</div></div>); })}</div>
        </section>

        <Sec title="Insight untuk operator" sub="Empat jenis insight, dari aksi 30 menit ke depan sampai evaluasi 30 hari.">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={exportJson} className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Unduh JSON</button>
            <button onClick={copy} className="rounded-full border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50">{copied ? "Tersalin" : "Salin teks insight"}</button>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card icon="⚡" tag="Jangka Pendek" rng="5 sampai 30 menit" o={R.jp} />
            <Card icon="🕒" tag="Jangka Menengah" rng="1 sampai 6 jam" o={R.jm} />
            <Card icon="📅" tag="Jangka Panjang" rng="1 sampai 7 hari" o={R.jl} />
            <Card icon="📊" tag="Rangkuman Periodik" rng="30 hari terakhir" o={R.rk} />
          </div>
        </Sec>

        {C ? (
          <Sec title="Perbandingan mode" sub="Data yang sama, kalimat tindakan berbeda: sistem yang bertindak atau operator yang bertindak.">
            <div className="grid gap-5 lg:grid-cols-2">{C.map((c: any, i: number) => (
              <div key={i} className="space-y-4"><div className={`rounded-xl px-4 py-2 text-sm font-semibold ${i === 0 ? "bg-green-600 text-white" : "bg-amber-500 text-white"}`}>{i === 0 ? "Mode Otomasi (profil Inkubasi)" : "Mode Threshold manual"}</div>
                <Card icon="⚡" tag="Jangka Pendek" rng="5 sampai 30 menit" o={c.jp} /><Card icon="🕒" tag="Jangka Menengah" rng="1 sampai 6 jam" o={c.jm} /></div>))}</div>
          </Sec>) : null}

        <Sec title="Prediksi 6 jam ke depan" sub="Titik menunjukkan nilai prediksi, warnanya mengikuti status. Latar hijau adalah rentang Normal.">
          <div className="grid gap-5 lg:grid-cols-3">{P.map((p: string) => <div key={p} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" dangerouslySetInnerHTML={{ __html: (E as any).chart(p, S) }} />)}</div>
          <p className="mt-3 text-xs text-slate-500"><span className="mr-1 inline-block h-3 w-3 rounded bg-green-200 align-middle" />Normal <span className="mx-1 ml-4 inline-block h-3 w-3 rounded bg-amber-200 align-middle" />Peringatan <span className="mx-1 ml-4 inline-block h-3 w-3 rounded bg-red-200 align-middle" />Kritis</p>
        </Sec>

        <Sec title="Skor kondisi dan keyakinan prediksi" sub="Baca bersama: skor rendah dengan keyakinan Tinggi adalah peringatan serius yang layak dipercaya.">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-sm">
            <thead className="bg-green-50 text-xs uppercase text-slate-500"><tr>{["Horizon", "Suhu", "Kelembapan", "CO2", "Status lingkungan", "Skor kondisi", "Keyakinan prediksi"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody>{MS.map((m: number) => { const g = S.g[m], ss = P.map((p: string) => st(p, g[p], t)), w = ss.includes("Kritis") ? "Kritis" : ss.includes("Peringatan") ? "Peringatan" : "Normal", pm = P.filter((p: string) => st(p, g[p], t) === w && w !== "Normal").map((p: string) => L[p]).join(", "), o = gab(m, g, t);
              return (<tr key={m} className="border-t border-slate-100"><td className="px-4 py-2.5 font-medium">{hz(m)}</td>{P.map((p: string) => <td key={p} className="px-4 py-2.5">{f(p, g[p])}</td>)}
                <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[w]}`}>{w}{pm ? ` (${pm})` : ""}</span></td>
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-600" style={{ width: o + "%" }} /></div>{o.toFixed(0)}%</div></td>
                <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs ${conf(m) === "Tinggi" ? "bg-green-100 text-green-800" : conf(m) === "Sedang" ? "bg-amber-100 text-amber-800" : "bg-orange-100 text-orange-800"}`}>{conf(m)}</span></td></tr>); })}</tbody></table></div>
        </Sec>

        <Sec title="Batas threshold aktif" sub={auto ? "Sumber: mode Inkubasi (automation_mode = true)." : "Sumber: device Threshold manual (automation_mode = false)."}>
          <div className="grid gap-4 sm:grid-cols-3">{P.map((p: string) => <div key={p} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">{L[p]}</div><div className="text-xl font-bold text-green-900">{t[p].mp} sampai {t[p].Mp}{U[p]}</div><div className="mt-1 text-xs text-slate-500">Ideal {f(p, idl(p, t))}. Kritis di bawah {t[p].mk} atau di atas {t[p].Mk}{U[p]}.</div></div>)}</div>
        </Sec>

        <Sec title="Ubah data simulasi" sub="Ubah angka mana pun, semua insight dihitung ulang langsung.">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-sm">
            <thead className="bg-green-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Data</th>{P.map((p: string) => <th key={p} className="px-4 py-3 text-left">{L[p]} ({U[p].trim()})</th>)}</tr></thead>
            <tbody>{[["a", "Aktual sekarang"], ...MS.map((m: number) => [m, `Prediksi ${hz(m)}`])].map(([m, n]: any) => (<tr key={m} className="border-t border-slate-100"><td className="px-4 py-2 font-medium">{n}</td>{P.map((p: string, i: number) => <td key={p} className="px-4 py-1.5"><input type="number" step="0.1" value={(m === "a" ? v.a : v.g[m])[i]} onChange={(e) => edit(m, i, e.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 focus:border-green-500 focus:outline-none" /></td>)}</tr>))}</tbody></table></div>
        </Sec>

        <Sec title="Cara membaca">
          <div className="grid gap-4 sm:grid-cols-2">{[["Otomasi dan Threshold manual", "Pada Otomasi, sistem yang menyalakan perangkat. Pada Threshold manual, operator yang diminta mempersiapkan dan menyalakan."], ["Skor kondisi (0 sampai 100)", "100 berarti masih di rentang Normal. Skor turun saat mendekati batas Kritis. Suhu berbobot paling besar karena modelnya paling akurat."], ["Keyakinan prediksi", "Makin jauh horizon, makin kecil keyakinan. Prediksi 7 hari bersifat indikatif."], ["Status", "Normal: dalam rentang. Peringatan: di luar rentang ideal. Kritis: mendekati batas bahaya bagi miselium."], ["Jangka Pendek, Menengah, Panjang", "Aksi 30 menit ke depan, persiapan 6 jam ke depan, dan perencanaan 7 hari ke depan."], ["Rangkuman Periodik", "Evaluasi 30 hari dari data aktual: persentase waktu per status dan jam yang paling sering bermasalah."]].map(([a, b]) => <div key={a} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><b className="text-green-900">{a}</b><p className="mt-1 text-sm text-slate-600">{b}</p></div>)}</div>
        </Sec>
      </main>
      <footer className="border-t border-green-100 py-8 text-center text-xs text-slate-500">AIGRA Greenhouse Forecasting. Data pada halaman ini adalah simulasi.</footer>
    </>
  );
}
