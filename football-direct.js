var module = (typeof module !== "undefined") ? module : { exports: {} };
// NEXORA futbol API: yalnız ESPN ictimai JSON (açar yoxdur). Həm Vercel-də, həm brauzerdə işləyir.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";
const cache = globalThis.__nxCache || (globalThis.__nxCache = new Map());

// [espnSlug, ad, ölkə, tip]. Katalogda yalnız ESPN-də həqiqətən cavab verənlər qalır.
const SEEDS = [
  ["aze.1","Premyer Liqa","Azərbaycan","League"],
  ["aze.2","Birinci Divizion","Azərbaycan","League"],
  ["aze.cup","Azərbaycan Kuboku","Azərbaycan","Cup"],
  ["uefa.champions","UEFA Çempionlar Liqası","Avropa","Cup"],
  ["uefa.europa","UEFA Avropa Liqası","Avropa","Cup"],
  ["uefa.europa.conf","UEFA Konfrans Liqası","Avropa","Cup"],
  ["uefa.super_cup","UEFA Super Kuboku","Avropa","Cup"],
  ["uefa.nations","UEFA Millətlər Liqası","Avropa","Cup"],
  ["uefa.euro","Avropa Çempionatı","Avropa","Cup"],
  ["uefa.euroq","Avropa Çempionatı seçmə","Avropa","Cup"],
  ["uefa.wchampions","Qadınlar Çempionlar Liqası","Avropa","Cup"],
  ["fifa.world","FIFA Dünya Çempionatı","Beynəlxalq","Cup"],
  ["fifa.worldq.uefa","Dünya Çempionatı seçmə (UEFA)","Avropa","Cup"],
  ["fifa.worldq.conmebol","Dünya Çempionatı seçmə (CONMEBOL)","Cənubi Amerika","Cup"],
  ["fifa.worldq.afc","Dünya Çempionatı seçmə (AFC)","Asiya","Cup"],
  ["fifa.worldq.caf","Dünya Çempionatı seçmə (CAF)","Afrika","Cup"],
  ["fifa.worldq.concacaf","Dünya Çempionatı seçmə (CONCACAF)","Şimali Amerika","Cup"],
  ["fifa.cwc","Klublararası Dünya Kuboku","Beynəlxalq","Cup"],
  ["fifa.friendly","Yoldaşlıq oyunları","Beynəlxalq","Cup"],
  ["fifa.wwc","Qadınlar Dünya Çempionatı","Beynəlxalq","Cup"],
  ["caf.nations","Afrika Millətlər Kuboku","Afrika","Cup"],
  ["concacaf.gold","CONCACAF Qızıl Kubok","Şimali Amerika","Cup"],
  ["conmebol.libertadores","Kopa Libertadores","Cənubi Amerika","Cup"],
  ["conmebol.sudamericana","Kopa Sudamericana","Cənubi Amerika","Cup"],
  ["eng.1","Premyer Liqa","İngiltərə","League"],
  ["eng.2","Çempionşip","İngiltərə","League"],
  ["eng.3","Birinci Liqa","İngiltərə","League"],
  ["eng.4","İkinci Liqa","İngiltərə","League"],
  ["eng.fa","FA Kuboku","İngiltərə","Cup"],
  ["eng.league_cup","Liqa Kuboku","İngiltərə","Cup"],
  ["esp.1","La Liga","İspaniya","League"],
  ["esp.2","La Liga 2","İspaniya","League"],
  ["esp.copa_del_rey","Kral Kuboku","İspaniya","Cup"],
  ["ger.1","Bundesliqa","Almaniya","League"],
  ["ger.2","2. Bundesliqa","Almaniya","League"],
  ["ger.dfb_pokal","DFB Kuboku","Almaniya","Cup"],
  ["ita.1","Serie A","İtaliya","League"],
  ["ita.2","Serie B","İtaliya","League"],
  ["ita.coppa_italia","İtaliya Kuboku","İtaliya","Cup"],
  ["fra.1","Ligue 1","Fransa","League"],
  ["fra.2","Ligue 2","Fransa","League"],
  ["fra.coupe_de_france","Fransa Kuboku","Fransa","Cup"],
  ["tur.1","Süper Liqa","Türkiyə","League"],
  ["por.1","Primeira Liga","Portuqaliya","League"],
  ["ned.1","Eredivisie","Niderland","League"],
  ["bel.1","Pro Liqa","Belçika","League"],
  ["sco.1","Premiership","Şotlandiya","League"],
  ["sco.2","Çempionşip","Şotlandiya","League"],
  ["gre.1","Super Liqa","Yunanıstan","League"],
  ["rus.1","Premyer Liqa","Rusiya","League"],
  ["ukr.1","Premyer Liqa","Ukrayna","League"],
  ["geo.1","Erovnuli Liqa","Gürcüstan","League"],
  ["sui.1","Super Liqa","İsveçrə","League"],
  ["aut.1","Bundesliqa","Avstriya","League"],
  ["den.1","Superliqa","Danimarka","League"],
  ["swe.1","Allsvenskan","İsveç","League"],
  ["nor.1","Eliteserien","Norveç","League"],
  ["pol.1","Ekstraklasa","Polşa","League"],
  ["cze.1","Birinci Liqa","Çexiya","League"],
  ["cro.1","HNL","Xorvatiya","League"],
  ["srb.1","Super Liqa","Serbiya","League"],
  ["rou.1","Liga 1","Rumıniya","League"],
  ["hun.1","NB I","Macarıstan","League"],
  ["bul.1","Birinci Liqa","Bolqarıstan","League"],
  ["irl.1","Premyer Divizion","İrlandiya","League"],
  ["bra.1","Brasileirão","Braziliya","League"],
  ["arg.1","Primera División","Argentina","League"],
  ["col.1","Primera A","Kolumbiya","League"],
  ["chi.1","Primera División","Çili","League"],
  ["uru.1","Primera División","Uruqvay","League"],
  ["usa.1","MLS","ABŞ","League"],
  ["mex.1","Liga MX","Meksika","League"],
  ["ksa.1","Pro Liqa","Səudiyyə Ərəbistanı","League"],
  ["jpn.1","J1 Liqa","Yaponiya","League"],
  ["kor.1","K Liqa 1","Cənubi Koreya","League"],
  ["chn.1","Super Liqa","Çin","League"],
  ["aus.1","A-Liqa","Avstraliya","League"],
  ["ind.1","Super Liqa","Hindistan","League"]
];
const SEED_MAP = new Map(SEEDS.map((s) => [s[0], s]));

function send(res, status, body, sec = 30) {
  res.setHeader("Cache-Control", `s-maxage=${sec}, stale-while-revalidate=120`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(status).json(body);
}
async function getJson(url, ttl = 30000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < ttl) return hit.d;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    cache.set(url, { t: Date.now(), d });
    return d;
  } finally { clearTimeout(timer); }
}
const compact = (d) => d.replaceAll("-", "");
const shiftDate = (ymd, n) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function espnMatch(e, league) {
  const comp = (e.competitions && e.competitions[0]) || {};
  const home = (comp.competitors || []).find((c) => c.homeAway === "home") || {};
  const away = (comp.competitors || []).find((c) => c.homeAway === "away") || {};
  const st = (e.status && e.status.type) || {};
  let short = "NS", long = "Başlamayıb", elapsed = null;
  if (st.state === "in") {
    if (st.name === "STATUS_HALFTIME") { short = "HT"; long = "Fasilə"; }
    else { short = (e.status.period || 1) >= 2 ? "2H" : "1H"; long = "Canlı"; elapsed = parseInt(e.status.displayClock, 10) || null; }
  } else if (st.state === "post") { short = "FT"; long = "Bitib"; }
  else if (/POSTPONED|DELAYED/.test(st.name || "")) { short = "PST"; long = "Təxirə salınıb"; }
  else if (/CANCEL/.test(st.name || "")) { short = "CANC"; long = "Ləğv edilib"; }
  const sc = (c) => (st.state === "pre" || c.score === undefined || c.score === "" ? null : Number(c.score));
  const t = (c) => ({ id: c.team && c.team.id, name: (c.team && (c.team.displayName || c.team.name)) || "", logo: (c.team && c.team.logo) || "" });
  return {
    fixture: { id: "e" + e.id, date: e.date, status: { short, long, elapsed }, venue: { name: comp.venue && comp.venue.fullName, city: comp.venue && comp.venue.address && comp.venue.address.city } },
    league, teams: { home: t(home), away: t(away) }, goals: { home: sc(home), away: sc(away) }
  };
}
async function daysOf(slug, dates) {
  // Hər gün ayrıca sorğu: ESPN-in ən sadə və etibarlı formatı (dates=YYYYMMDD).
  const res = await Promise.allSettled(dates.map((d) => getJson(`${ESPN}/${slug}/scoreboard?dates=${compact(d)}`, 20000)));
  const ok = res.filter((r) => r.status === "fulfilled").map((r) => r.value);
  if (!ok.length) throw new Error(res[0].reason && res[0].reason.message || "cavab yoxdur");
  const seen = new Set(), events = [];
  ok.forEach((p) => (p.events || []).forEach((e) => { if (!seen.has(e.id)) { seen.add(e.id); events.push(e); } }));
  return events;
}
async function fixtures(slug, date, tz, mode, league) {
  let events;
  if (mode === "live") {
    const p = await getJson(`${ESPN}/${slug}/scoreboard`, 15000);
    events = (p.events || []).filter((e) => e.status && e.status.type && e.status.type.state === "in");
  } else if (mode === "day") {
    events = (await daysOf(slug, [shiftDate(date, -1), date, shiftDate(date, 1)]))
      .filter((e) => new Date(new Date(e.date).getTime() - tz * 60000).toISOString().slice(0, 10) === date);
  } else {
    const list = [];
    for (let i = -6; i <= 14; i += 2) list.push(shiftDate(date, i));
    const days = [];
    list.forEach((d) => { days.push(d); });
    events = await daysOf(slug, days);
    const now = Date.now();
    events = events.sort((a, b) => Math.abs(new Date(a.date) - now) - Math.abs(new Date(b.date) - now)).slice(0, 12);
  }
  return events.map((e) => espnMatch(e, league));
}
async function standings(slug) {
  const p = await getJson(`${ESPN_V2}/${slug}/standings`, 120000);
  const kids = p.children && p.children.length ? p.children : [p];
  const groups = kids.map((c) => ({
    name: kids.length > 1 ? c.name : "",
    rows: ((c.standings && c.standings.entries) || []).map((en, i) => {
      const s = {}; (en.stats || []).forEach((x) => { s[x.name] = x.value; });
      const gf = s.pointsFor ?? 0, ga = s.pointsAgainst ?? 0;
      return { rank: s.rank || i + 1, team: en.team.displayName || en.team.name, logo: (en.team.logos && en.team.logos[0] && en.team.logos[0].href) || "",
        played: s.gamesPlayed, win: s.wins, draw: s.ties, lose: s.losses, goals: `${gf}:${ga}`, goal_difference: s.pointDifferential ?? gf - ga, points: s.points };
    }).sort((a, b) => a.rank - b.rank)
  })).filter((g) => g.rows.length);
  return { groups };
}
function leagueOf(slug) {
  const s = SEED_MAP.get(slug); if (!s) return null;
  return { id: s[0], name: s[1], country: s[2], logo: "" };
}
async function catalog() {
  const hit = cache.get("__catalog");
  if (hit && Date.now() - hit.t < 6 * 3600 * 1000) return hit.d;
  const ok = [];
  for (let i = 0; i < SEEDS.length; i += 15) {
    const part = await Promise.all(SEEDS.slice(i, i + 15).map(async (s) => {
      try {
        const p = await getJson(`${ESPN}/${s[0]}/scoreboard`, 3600000);
        const lg = p.leagues && p.leagues[0];
        return lg ? { id: s[0], name: s[1], country: s[2], type: s[3], logo: (lg.logos && lg.logos[0] && lg.logos[0].href) || "", season: new Date().getFullYear() } : null;
      } catch (e) { return null; }
    }));
    part.forEach((x) => x && ok.push(x));
  }
  // ESPN heç nə qaytarmadısa (şəbəkə xətası), siyahı boş qalmasın.
  const out = ok.length ? ok : SEEDS.map((s) => ({ id: s[0], name: s[1], country: s[2], type: s[3], logo: "", season: new Date().getFullYear() }));
  if (ok.length) cache.set("__catalog", { t: Date.now(), d: out });
  return out;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "GET") return send(res, 405, { error: "Yalnız GET dəstəklənir." });
  const { action, leagueId, date, live, near } = req.query || {};
  try {
    if (action === "health") {
      const probe = async (name, url) => { try { await getJson(url, 1000); return [name, "OK"]; } catch (e) { return [name, "XƏTA: " + e.message]; } };
      const r = await Promise.all([probe("espn-scoreboard", `${ESPN}/eng.1/scoreboard`), probe("espn-standings", `${ESPN_V2}/eng.1/standings`), probe("espn-azerbaijan", `${ESPN}/aze.1/scoreboard`)]);
      return send(res, 200, Object.fromEntries(r), 5);
    }
    if (action === "leagues") { const leagues = await catalog(); return send(res, 200, { leagues, count: leagues.length }, 600); }
    const league = leagueOf(String(leagueId || ""));
    if (!league) return send(res, 400, { error: "Liqa tapılmadı." });
    const tz = Number(req.query.tz) || 0;
    if (action === "fixtures") {
      const mode = live === "all" ? "live" : near === "1" ? "near" : "day";
      if (mode !== "live" && !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return send(res, 400, { error: "Tarix YYYY-MM-DD olmalıdır." });
      const matches = await fixtures(league.id, date, tz, mode, league);
      return send(res, 200, { matches, count: matches.length }, 20);
    }
    if (action === "standings") {
      const r = await standings(league.id);
      return send(res, 200, { groups: r.groups, standings: r.groups[0] ? r.groups[0].rows : [] }, 120);
    }
    return send(res, 400, { error: "action: leagues, fixtures, standings və ya health olmalıdır." });
  } catch (err) {
    console.error("Football API error", err);
    return send(res, 502, { error: "ESPN məlumatlarına qoşulmaq mümkün olmadı (" + err.message + "). Bir az sonra yenidən yoxlayın." }, 10);
  }
};
if (typeof window !== "undefined") window.nxFootballHandler = module.exports;
