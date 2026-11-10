// NEXORA oyun mərkəzi: oyun səhifəsi + PULSUZ virtual mərc (real pul yoxdur, yalnız NX xal).
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sb = () => window.nexoraSupabase;
const W = { balance: 0, last_bonus: null, bets: [], authed: false };
const balance = () => W.balance;
const mapBet = (r) => ({ id: r.id, created: Date.parse(r.created_at), mode: r.mode, stake: +r.stake, status: r.status, payout: +r.payout,
  legs: (r.nexora_bet_legs || []).map((l) => ({ id: l.id, key: l.fixture_key, slug: l.league_slug, eid: l.event_id, home: l.home, away: l.away, league: l.league_name, kickoff: l.kickoff, sid: l.selection_id, mname: l.market_name, sname: l.selection_name, odd: +l.odd, res: l.result, score: l.score })) });
const setWallet = (w) => { if (w) { W.balance = +w.balance; W.last_bonus = w.last_bonus; } renderBalanceChip(); };
async function loadAll() {
  try {
    const { data: { user } } = await sb().auth.getUser();
    W.authed = !!user;
    if (!user) { W.balance = 0; W.bets = []; return; }
    const w = await sb().rpc("nexora_get_wallet"); if (w.error) throw w.error; setWallet(w.data);
    const r = await sb().from("nexora_bets").select("*, nexora_bet_legs(*)").order("created_at", { ascending: false }).limit(100);
    if (r.error) throw r.error; W.bets = r.data.map(mapBet);
  } catch (e) { console.warn("Mərc məlumatı yüklənmədi:", e); W.err = String(e.message || e); }
  render(); renderBetsPage();
}
const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString("az-AZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

function toast(msg) {
  let t = $("#nxToast"); if (!t) { t = document.createElement("div"); t.id = "nxToast"; document.body.append(t); }
  t.textContent = msg; t.className = "show"; clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 3500);
}

/* ---------- Əmsal modeli (Poisson) ---------- */
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880], N = 10;
const pois = (l, k) => Math.exp(-l) * l ** k / FACT[k];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
function lambdas(rows, home, away) {
  const find = (n) => rows.find((r) => norm(r.team) === norm(n)) || rows.find((r) => norm(r.team).includes(norm(n)) || norm(n).includes(norm(r.team)));
  const gfga = (r) => String(r.goals).split(":").map(Number);
  const valid = rows.filter((r) => r.played > 0);
  let avg = 1.35;
  if (valid.length) avg = clamp(valid.reduce((s, r) => s + gfga(r)[0], 0) / valid.reduce((s, r) => s + r.played, 0), 0.8, 2.2);
  const f = (r) => { if (!r || !r.played) return [1, 1]; const [gf, ga] = gfga(r), k = r.played / (r.played + 6); return [1 + k * (gf / r.played / avg - 1), 1 + k * (ga / r.played / avg - 1)]; };
  const [ha, hd] = f(find(home)), [aa, ad] = f(find(away));
  return [clamp(avg * 1.1 * ha * ad, 0.3, 3.5), clamp(avg * 0.92 * aa * hd, 0.2, 3.2)];
}
function matrix(lh, la) {
  const P = []; let s = 0;
  for (let i = 0; i < N; i++) { P[i] = []; for (let j = 0; j < N; j++) { P[i][j] = pois(lh, i) * pois(la, j); s += P[i][j]; } }
  return P.map((r) => r.map((v) => v / s));
}

/* ---------- Bütün mərc bazarları ---------- */
function buildMarkets(H, A) {
  const M = [];
  const add = (id, name, cols, sels) => M.push({ id, name, cols, sels: sels.map(([k, n, f]) => ({ id: id + ":" + k, name: n, f })) });
  const R = [["1", H, (h, a) => h > a], ["X", "Heç-heçə", (h, a) => h === a], ["2", A, (h, a) => h < a]];
  const ou = (pre, lines, tot) => lines.flatMap((l) => [[`${pre}o${l}`, `Üst ${l}`, (h, a) => tot(h, a) > l], [`${pre}u${l}`, `Alt ${l}`, (h, a) => tot(h, a) < l]]);
  add("1x2", "Matç nəticəsi (1X2)", 3, R);
  add("dc", "İkiqat şans", 3, [["1X", `${H} / X`, (h, a) => h >= a], ["12", "Heç-heçəsiz (1/2)", (h, a) => h !== a], ["X2", `X / ${A}`, (h, a) => h <= a]]);
  add("dnb", "Heç-heçədə mərc qaytarılır", 2, [["1", H, (h, a) => (h === a ? "void" : h > a)], ["2", A, (h, a) => (h === a ? "void" : h < a)]]);
  add("ou", "Ümumi qol sayı (Üst/Alt)", 2, ou("", [0.5, 1.5, 2.5, 3.5, 4.5, 5.5], (h, a) => h + a));
  add("btts", "İki komanda da qol vurur", 2, [["y", "Bəli", (h, a) => h > 0 && a > 0], ["n", "Xeyr", (h, a) => h === 0 || a === 0]]);
  add("cs", "Dəqiq hesab", 4, [...[0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].map((j) => [`${i}-${j}`, `${i}:${j}`, (h, a) => h === i && a === j])), ["other", "Digər", (h, a) => h > 3 || a > 3]]);
  add("hc", "Handikap", 2, [["h-1.5", `${H} (-1.5)`, (h, a) => h - 1.5 > a], ["a+1.5", `${A} (+1.5)`, (h, a) => a + 1.5 > h], ["h-2.5", `${H} (-2.5)`, (h, a) => h - 2.5 > a], ["a+2.5", `${A} (+2.5)`, (h, a) => a + 2.5 > h], ["h+1.5", `${H} (+1.5)`, (h, a) => h + 1.5 > a], ["a-1.5", `${A} (-1.5)`, (h, a) => a - 1.5 > h], ["h+2.5", `${H} (+2.5)`, (h, a) => h + 2.5 > a], ["a-2.5", `${A} (-2.5)`, (h, a) => a - 2.5 > h]]);
  add("htot", `${H}: fərdi total`, 2, ou("", [0.5, 1.5, 2.5], (h) => h));
  add("atot", `${A}: fərdi total`, 2, ou("", [0.5, 1.5, 2.5], (h, a) => a));
  add("oe", "Ümumi qol: Tək / Cüt", 2, [["odd", "Tək", (h, a) => (h + a) % 2 === 1], ["even", "Cüt", (h, a) => (h + a) % 2 === 0]]);
  add("tg", "Dəqiq qol sayı", 3, [0, 1, 2, 3, 4].map((n) => [String(n), String(n), (h, a) => h + a === n]).concat([["5+", "5 və daha çox", (h, a) => h + a >= 5]]));
  add("res_ou", "Nəticə + Total 2.5", 2, R.flatMap(([k, n, f]) => [[`${k}o`, `${n} & Üst 2.5`, (h, a) => f(h, a) && h + a > 2.5], [`${k}u`, `${n} & Alt 2.5`, (h, a) => f(h, a) && h + a < 2.5]]));
  add("res_btts", "Nəticə + İki komanda qol vurur", 2, R.flatMap(([k, n, f]) => [[`${k}y`, `${n} & Bəli`, (h, a) => f(h, a) && h > 0 && a > 0], [`${k}n`, `${n} & Xeyr`, (h, a) => f(h, a) && (h === 0 || a === 0)]]));
  add("wtn", "Quru qələbə (qol buraxmadan)", 2, [["1", `${H} quru qələbə`, (h, a) => h > a && a === 0], ["2", `${A} quru qələbə`, (h, a) => a > h && h === 0]]);
  add("mg", "Qələbə fərqi", 3, [["h1", `${H} +1`, (h, a) => h - a === 1], ["h2", `${H} +2`, (h, a) => h - a === 2], ["h3", `${H} +3 və çox`, (h, a) => h - a >= 3], ["d", "Heç-heçə", (h, a) => h === a], ["a1", `${A} +1`, (h, a) => a - h === 1], ["a2", `${A} +2`, (h, a) => a - h === 2], ["a3", `${A} +3 və çox`, (h, a) => a - h >= 3]]);
  return M;
}
function price(M, P) {
  M.forEach((m) => m.sels.forEach((s) => {
    let p = 0, v = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const r = s.f(i, j); if (r === "void") v += P[i][j]; else if (r) p += P[i][j]; }
    p = p / (1 - v);
    s.odd = p <= 0 ? 150 : clamp(Math.round(0.92 / p * 100) / 100, 1.01, 150);
  }));
  return M;
}
const judge = (sid, H, A, h, a) => buildMarkets(H, A).find((m) => m.id === sid.split(":")[0]).sels.find((s) => s.id === sid).f(h, a);

/* ---------- Kupon və mərclər ---------- */
let slip = { mode: "single", legs: [], stake: 10 }; // kupon yalnız seans üçündür
const saveSlip = () => {};
const S = { m: null, d: null, rows: [], tab: "bet", open: new Set(["1x2", "ou", "btts"]), timer: null, markets: [] };
const key = (m) => `${m.league.id}|${String(m.fixture.id).replace(/^e/, "")}`;
const canBet = () => S.m && S.m.fixture.status.short === "NS" && Date.parse(S.m.fixture.date) > Date.now();

function toggleSel(mk, sel) {
  const k = key(S.m), i = slip.legs.findIndex((l) => l.key === k && l.sid === sel.id);
  const same = slip.legs.filter((l) => !(l.key === k && l.sid.split(":")[0] === mk.id));
  if (i >= 0) slip.legs = same;
  else slip.legs = [...same, { key: k, slug: S.m.league.id, eid: String(S.m.fixture.id).replace(/^e/, ""), home: S.m.teams.home.name, away: S.m.teams.away.name, league: S.m.league.name, kickoff: S.m.fixture.date, sid: sel.id, mname: mk.name, sname: sel.name, odd: sel.odd }];
  saveSlip(); render();
}
async function place() {
  const legs = slip.legs; if (!legs.length) return;
  if (!W.authed) return toast("Mərc etmək üçün hesaba daxil ol.");
  const stake = Math.floor((+slip.stake || 0) * 100) / 100;
  if (!(stake >= 1)) return toast("Minimum mərc 1 NX-dir.");
  const express = slip.mode === "express" && legs.length > 1;
  if ((express ? stake : stake * legs.length) > balance()) return toast("Balans kifayət etmir.");
  if (legs.some((l) => Date.parse(l.kickoff) <= Date.now())) return toast("Bəzi oyunlar artıq başlayıb. Onları kupondan çıxar.");
  if (express && new Set(legs.map((l) => l.key)).size < legs.length) return toast("Express üçün hər oyundan yalnız bir seçim ola bilər.");
  const payload = legs.map(({ key, slug, eid, home, away, league, kickoff, sid, mname, sname, odd }) => ({ key, slug, eid, home, away, league, kickoff, sid, mname, sname, odd }));
  const { data, error } = await sb().rpc("nexora_place_bets", { p_mode: express ? "express" : "single", p_stake: stake, p_legs: payload });
  if (error) return toast(error.message || "Mərc qəbul edilmədi.");
  setWallet(data); slip.legs = [];
  toast(express ? "Express mərc qəbul edildi." : `${legs.length} mərc qəbul edildi.`);
  await loadAll();
}
let settling = false;
async function settleAll() {
  if (settling || !W.authed) return; settling = true;
  try {
    const keys = new Map();
    W.bets.filter((b) => b.status === "pending").forEach((b) => b.legs.forEach((l) => { if (l.res === "pending" && Date.parse(l.kickoff) < Date.now()) keys.set(l.key, l); }));
    if (!keys.size) return;
    const out = new Map();
    await Promise.all([...keys].map(async ([k, l]) => {
      try {
        const d = await window.nxFootballRequest({ action: "match", leagueId: l.slug, eventId: l.eid });
        const st = d.match.fixture.status.short;
        if (st === "FT" && d.match.goals.home != null) out.set(k, { h: d.match.goals.home, a: d.match.goals.away });
        else if (st === "PST" || st === "CANC") out.set(k, { v: true });
      } catch {}
    }));
    if (!out.size) return;
    let changed = 0;
    for (const b of W.bets.filter((x) => x.status === "pending")) {
      const results = b.legs.filter((l) => l.res === "pending" && out.has(l.key)).map((l) => {
        const r = out.get(l.key);
        if (r.v) return { leg_id: l.id, result: "void", score: null };
        const j = judge(l.sid, l.home, l.away, r.h, r.a);
        return { leg_id: l.id, result: j === "void" ? "void" : j ? "won" : "lost", score: `${r.h}:${r.a}` };
      });
      if (!results.length) continue;
      const { data, error } = await sb().rpc("nexora_settle_bet", { p_bet_id: b.id, p_results: results });
      if (!error) { setWallet(data); changed++; }
    }
    if (changed) { toast("Mərclərin nəticələri yeniləndi."); await loadAll(); }
  } finally { settling = false; }
}

/* ---------- Səhifə ---------- */
const page = () => $("#matchPage");
const showOnly = (id) => { document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === id)); document.querySelectorAll(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.page === "games")); window.scrollTo({ top: 0 }); };
async function openMatch(m) {
  S.m = m; S.d = null; S.tab = "bet"; S.markets = []; S.rows = [];
  showOnly("matchPage"); render();
  clearInterval(S.timer); S.timer = setInterval(() => refresh(), 30000);
  buildOdds(); refresh(); settleAll();
}
async function buildOdds() {
  const m = S.m;
  try {
    const st = await window.nxFootballRequest({ action: "standings", leagueId: m.league.id });
    S.rows = (st.groups || []).flatMap((g) => g.rows);
  } catch {}
  if (S.m !== m) return;
  const [lh, la] = lambdas(S.rows, m.teams.home.name, m.teams.away.name);
  S.markets = price(buildMarkets(m.teams.home.name, m.teams.away.name), matrix(lh, la)); S.lam = [lh, la];
  render();
}
async function refresh() {
  const m = S.m; if (!m) return;
  try {
    const d = await window.nxFootballRequest({ action: "match", leagueId: m.league.id, eventId: String(m.fixture.id).replace(/^e/, "") });
    if (S.m !== m) return; S.d = d; S.m = { ...m, ...d.match, league: m.league };
  } catch {}
  render();
}
function teamBox(t) { return `<div class="nx-team"><span class="nx-logo">${t.logo ? `<img src="${esc(t.logo)}" alt="" onerror="this.remove()">` : "⚽"}</span><b>${esc(t.name)}</b></div>`; }
function heroHTML() {
  const m = S.m, st = m.fixture.status, live = ["1H", "2H", "HT"].includes(st.short), dt = new Date(m.fixture.date);
  const mid = m.goals.home == null ? dt.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : `${m.goals.home} - ${m.goals.away}`;
  const sub = live ? (st.short === "HT" ? "FASİLƏ" : `CANLI · ${st.elapsed ?? ""}′`) : st.short === "FT" ? "BAŞA ÇATIB" : st.long;
  return `<div class="nx-hero"><div class="nx-league">${esc(m.league.name)} · ${esc(m.league.country || "")}${m.league.round ? " · " + esc(m.league.round) : ""}</div>
  <div class="nx-score">${teamBox(m.teams.home)}<div class="nx-mid"><strong>${esc(mid)}</strong><small class="${live ? "live" : ""}">${esc(sub)}</small><small>${dt.toLocaleDateString("az-AZ", { day: "numeric", month: "long" })}</small></div>${teamBox(m.teams.away)}</div></div>`;
}
function slipHTML() {
  if (!slip.legs.length) return "";
  const ex = slip.mode === "express" && slip.legs.length > 1, total = slip.legs.reduce((p, l) => p * l.odd, 1);
  return `<div class="nx-card nx-slip"><div class="nx-row"><b>Mərc kuponu (${slip.legs.length})</b><button data-act="clear" class="nx-link">Təmizlə</button></div>
  ${slip.legs.map((l, i) => `<div class="nx-leg"><div><small>${esc(l.home)} – ${esc(l.away)}</small><div>${esc(l.mname)}: <b>${esc(l.sname)}</b></div></div><div class="nx-legr"><b>${l.odd.toFixed(2)}</b><button data-act="rm" data-i="${i}" aria-label="Sil">×</button></div></div>`).join("")}
  <div class="nx-seg"><button data-act="mode" data-v="single" class="${!ex ? "on" : ""}">Tək-tək</button><button data-act="mode" data-v="express" class="${slip.mode === "express" ? "on" : ""}" ${slip.legs.length < 2 ? "disabled" : ""}>Express</button></div>
  <div class="nx-stake"><input id="nxStake" type="number" inputmode="decimal" min="1" value="${esc(slip.stake)}" aria-label="Mərc məbləği"><span>NX ${ex ? "" : slip.legs.length > 1 ? "(hər biri)" : ""}</span></div>
  <div class="nx-chips">${[10, 50, 100, 500].map((v) => `<button data-act="chip" data-v="${v}">${v}</button>`).join("")}<button data-act="chip" data-v="max">Hamısı</button></div>
  <div class="nx-sum" id="nxSum"></div><button class="nx-primary" data-act="place">Mərc et</button></div>`;
}
function sumUpdate() {
  const el = $("#nxSum"); if (!el) return;
  const ex = slip.mode === "express" && slip.legs.length > 1, total = slip.legs.reduce((p, l) => p * l.odd, 1), st = +slip.stake || 0;
  el.innerHTML = ex ? `<span>Ümumi əmsal <b>${total.toFixed(2)}</b></span><span>Mümkün qazanc <b>${fmt(st * total)} NX</b></span>`
    : `<span>Ümumi mərc <b>${fmt(st * slip.legs.length)} NX</b></span><span>Mümkün qazanc <b>${fmt(slip.legs.reduce((s, l) => s + st * l.odd, 0))} NX</b></span>`;
}
function walletHTML() {
  if (!W.authed) return `<div class="nx-card nx-wallet"><div><small>Mərc üçün hesaba daxil ol</small><strong>0 NX</strong></div><small>Balans və mərclər hesabında saxlanılır.</small></div>`;
  const bets = W.bets, broke = balance() < 1 && !bets.some((b) => b.status === "pending");
  return `<div class="nx-card nx-wallet"><div><small>Balansın</small><strong>${fmt(balance())} NX</strong></div>${W.last_bonus !== today() ? `<button class="nx-primary sm" data-act="bonus">+500 gündəlik bonus</button>` : broke ? `<button class="nx-primary sm" data-act="reset">Balansı bərpa et</button>` : `<small>Yalnız virtual xal · real pul yoxdur</small>`}</div>`;
}
function marketsHTML() {
  if (!S.markets.length) return `<div class="nx-empty">Əmsallar hesablanır…</div>`;
  const picked = new Set(slip.legs.filter((l) => l.key === key(S.m)).map((l) => l.sid)), ok = canBet();
  return (ok ? "" : `<div class="nx-note">Oyun başlayıb və ya bitib: mərc bağlıdır.</div>`) + S.markets.map((mk) => {
    const open = S.open.has(mk.id);
    return `<div class="nx-card nx-mk"><button class="nx-mkh" data-act="mk" data-id="${mk.id}"><b>${esc(mk.name)}</b><span>${open ? "−" : "+"}</span></button>${open ? `<div class="nx-grid" style="--c:${mk.cols}">${mk.sels.map((s) => `<button class="nx-odd ${picked.has(s.id) ? "on" : ""}" data-act="sel" data-mk="${mk.id}" data-id="${esc(s.id)}" ${ok ? "" : "disabled"}><span>${esc(s.name)}</span><b>${s.odd.toFixed(2)}</b></button>`).join("")}</div>` : ""}</div>`;
  }).join("") + `<p class="nx-foot">Əmsallar komandaların turnir cədvəlindəki qol göstəricilərinə görə hesablanır və oyunun əsas vaxtının (90 dəq) nəticəsinə görə yekunlaşdırılır.</p>`;
}
const STATUS = { pending: "Gözləyir", won: "Qazandı", lost: "Uduzdu", void: "Qaytarıldı" };
function betsHTML() {
  const bets = W.bets;
  if (!bets.length) return `<div class="nx-empty">Hələ mərcin yoxdur. Oyun səhifəsindən əmsala toxun.</div>`;
  return bets.map((b) => `<div class="nx-card nx-bet ${b.status}"><div class="nx-row"><b>${b.mode === "express" ? `Express (${b.legs.length})` : "Tək mərc"}</b><span class="nx-chip ${b.status}">${STATUS[b.status]}</span></div>
  ${b.legs.map((l) => `<div class="nx-leg"><div><small>${esc(l.home)} – ${esc(l.away)}${l.score ? " · " + l.score : ""}</small><div>${esc(l.mname)}: <b>${esc(l.sname)}</b></div></div><div class="nx-legr"><b>${l.odd.toFixed(2)}</b><small>${l.res === "pending" ? "" : STATUS[l.res]}</small></div></div>`).join("")}
  <div class="nx-row"><small>Məbləğ ${fmt(b.stake)} NX</small><small>${b.status === "pending" ? `Mümkün: ${fmt(b.stake * b.legs.reduce((p, l) => p * l.odd, 1))} NX` : `Ödəniş: ${fmt(b.payout)} NX`}</small></div></div>`).join("");
}
function tabHTML() {
  const d = S.d;
  if (S.tab === "bet") return walletHTML() + slipHTML() + marketsHTML();
  if (S.tab === "bets") return betsHTML();
  if (S.tab === "events") {
    if (!d) return `<div class="nx-empty">Yüklənir…</div>`;
    return d.events.length ? `<div class="nx-card">${d.events.map((e) => `<div class="nx-ev ${e.home ? "h" : "a"}"><b>${esc(e.minute)}</b><span>${e.goal ? "⚽" : /yellow/i.test(e.type) ? "🟨" : /red/i.test(e.type) ? "🟥" : /sub/i.test(e.type) ? "🔁" : "•"} ${esc(e.text)}</span></div>`).join("")}</div>` : `<div class="nx-empty">Hələ hadisə yoxdur.</div>`;
  }
  if (S.tab === "stats") {
    if (!d) return `<div class="nx-empty">Yüklənir…</div>`;
    return d.stats.length ? `<div class="nx-card">${d.stats.map((s) => { const a = parseFloat(s.home) || 0, b = parseFloat(s.away) || 0, t = a + b || 1; return `<div class="nx-stat"><div class="nx-row"><b>${esc(s.home)}</b><small>${esc(s.label)}</small><b>${esc(s.away)}</b></div><div class="nx-bar"><i style="width:${a / t * 100}%"></i></div></div>`; }).join("")}</div>` : `<div class="nx-empty">Statistika hələ yoxdur.</div>`;
  }
  const m = S.m, v = m.fixture.venue || {}, lam = S.lam;
  return `<div class="nx-card nx-info">${[["Məkan", v.name], ["Şəhər", v.city], ["Hakim", S.d?.info.referee], ["Tamaşaçı", S.d?.info.attendance && fmt(S.d.info.attendance)], ["Tarix", new Date(m.fixture.date).toLocaleString("az-AZ", { dateStyle: "long", timeStyle: "short" })], ["Gözlənilən qol (model)", lam && `${lam[0].toFixed(2)} – ${lam[1].toFixed(2)}`]].map(([k, x]) => `<p><small>${k}</small><b>${esc(x || "Məlumat yoxdur")}</b></p>`).join("")}</div>`;
}
function render() {
  if (!S.m || !page()) return;
  const tabs = [["bet", "Mərc"], ["events", "Hadisələr"], ["stats", "Statistika"], ["info", "Məlumat"], ["bets", "Mərclərim"]];
  const y = window.scrollY;
  page().innerHTML = `<button class="outline-button" data-act="back">← Geri</button>${heroHTML()}<div class="nx-tabs">${tabs.map(([k, n]) => `<button data-act="tab" data-v="${k}" class="${S.tab === k ? "on" : ""}">${n}</button>`).join("")}</div>${tabHTML()}`;
  sumUpdate(); window.scrollTo({ top: y });
}
function renderBalanceChip() {
  const el = $("#nxBalanceValue"); if (el) el.textContent = `${fmt(W.authed ? balance() : 0)} NX`;
}
function renderBetsPage() {
  renderBalanceChip();
  const box = $("#nxBetsPage"); if (!box) return;
  box.innerHTML = walletHTML() + betsHTML();
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !(page()?.contains(b) || $("#nxBetsPage")?.contains(b))) return;
  const a = b.dataset.act;
  if (a === "back") { clearInterval(S.timer); showOnly("games"); return; }
  if (a === "tab") { S.tab = b.dataset.v; render(); if (S.tab === "bets") settleAll(); return; }
  if (a === "mk") { S.open.has(b.dataset.id) ? S.open.delete(b.dataset.id) : S.open.add(b.dataset.id); render(); return; }
  if (a === "sel") { const mk = S.markets.find((m) => m.id === b.dataset.mk); toggleSel(mk, mk.sels.find((s) => s.id === b.dataset.id)); return; }
  if (a === "rm") { slip.legs.splice(+b.dataset.i, 1); saveSlip(); render(); return; }
  if (a === "clear") { slip.legs = []; saveSlip(); render(); return; }
  if (a === "mode") { slip.mode = b.dataset.v; saveSlip(); render(); return; }
  if (a === "chip") { slip.stake = b.dataset.v === "max" ? Math.floor(balance()) : +b.dataset.v; saveSlip(); render(); return; }
  if (a === "place") { place(); return; }
  if (a === "bonus" || a === "reset") {
    sb().rpc(a === "bonus" ? "nexora_claim_bonus" : "nexora_reset_wallet").then(({ data, error }) => {
      if (error) return toast(error.message);
      setWallet(data); toast(a === "bonus" ? "+500 NX bonus əlavə olundu." : "Balans 1000 NX-ə bərpa olundu."); render(); renderBetsPage();
    });
  }
});
document.addEventListener("input", (e) => { if (e.target.id === "nxStake") { slip.stake = e.target.value; saveSlip(); sumUpdate(); } });

function init() {
  window.nxOpenMatch = openMatch;
  renderBetsPage();
  const openBets = () => { showOnly("betsPage"); history.replaceState(null, "", "#games"); renderBetsPage(); settleAll(); };
  $("#nxBalanceButton")?.addEventListener("click", openBets);
  $("#betsBack")?.addEventListener("click", () => { showOnly("games"); history.replaceState(null, "", "#games"); });
  document.querySelectorAll('[data-page="games"]').forEach((l) => l.addEventListener("click", () => clearInterval(S.timer)));
  const boot = () => { if (!sb()) return setTimeout(boot, 500); loadAll().then(settleAll); sb().auth.onAuthStateChange(() => setTimeout(() => loadAll(), 0)); };
  boot(); setInterval(settleAll, 90000);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
