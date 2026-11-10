// NEXORA futbol API. Əsas mənbə: ESPN ictimai JSON (açar yoxdur). Ehtiyat: SofaScore.
// Hər liqa üçün mənbələr ardıcıl yoxlanılır; biri alınmasa növbətisi işə düşür.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";
const SOFA = "https://api.sofascore.com/api/v1";
const SOFA_IMG = "https://api.sofascore.app/api/v1";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const cache = globalThis.__nxCache || (globalThis.__nxCache = new Map());

// [açar, ad, ölkə, tip, espnSlug, sofaId]
const SEEDS = [
  ["az-pl","Premyer Liqa","Azərbaycan","League","aze.1",808],
  ["az-d1","Birinci Divizion","Azərbaycan","League",null,2186],
  ["az-cup","Azərbaycan Kuboku","Azərbaycan","Cup",null,10029],
  ["ucl","UEFA Çempionlar Liqası","Avropa","Cup","uefa.champions",7],
  ["uel","UEFA Avropa Liqası","Avropa","Cup","uefa.europa",679],
  ["uecl","UEFA Konfrans Liqası","Avropa","Cup","uefa.europa.conf",17015],
  ["unl","UEFA Millətlər Liqası","Avropa","Cup","uefa.nations",10783],
  ["wc","FIFA Dünya Çempionatı","Beynəlxalq","Cup","fifa.world",16],
  ["wcq-uefa","Dünya Çempionatı seçmə (UEFA)","Avropa","Cup","fifa.worldq.uefa",null],
  ["euro","Avropa Çempionatı","Avropa","Cup","uefa.euro",1],
  ["cwc","Klublararası Dünya Kuboku","Beynəlxalq","Cup","fifa.cwc",null],
  ["friendly","Beynəlxalq yoldaşlıq oyunları","Beynəlxalq","Cup","fifa.friendly",null],
  ["eng1","Premyer Liqa","İngiltərə","League","eng.1",17],
  ["eng2","Çempionşip","İngiltərə","League","eng.2",18],
  ["eng3","Birinci Liqa","İngiltərə","League","eng.3",24],
  ["engfa","FA Kuboku","İngiltərə","Cup","eng.fa",19],
  ["englc","Liqa Kuboku","İngiltərə","Cup","eng.league_cup",21],
  ["esp1","La Liga","İspaniya","League","esp.1",8],
  ["esp2","La Liga 2","İspaniya","League","esp.2",54],
  ["espcup","Kral Kuboku","İspaniya","Cup","esp.copa_del_rey",329],
  ["ger1","Bundesliqa","Almaniya","League","ger.1",35],
  ["ger2","2. Bundesliqa","Almaniya","League","ger.2",44],
  ["gercup","DFB Kuboku","Almaniya","Cup","ger.dfb_pokal",217],
  ["ita1","Serie A","İtaliya","League","ita.1",23],
  ["ita2","Serie B","İtaliya","League","ita.2",53],
  ["itacup","İtaliya Kuboku","İtaliya","Cup","ita.coppa_italia",328],
  ["fra1","Ligue 1","Fransa","League","fra.1",34],
  ["fra2","Ligue 2","Fransa","League","fra.2",182],
  ["tur1","Süper Liqa","Türkiyə","League","tur.1",52],
  ["tur2","1. Liqa","Türkiyə","League","tur.2",98],
  ["por1","Primeira Liga","Portuqaliya","League","por.1",238],
  ["ned1","Eredivisie","Niderland","League","ned.1",37],
  ["bel1","Pro Liqa","Belçika","League","bel.1",38],
  ["sco1","Premiership","Şotlandiya","League","sco.1",36],
  ["gre1","Super Liqa","Yunanıstan","League","gre.1",185],
  ["rus1","Premyer Liqa","Rusiya","League","rus.1",203],
  ["ukr1","Premyer Liqa","Ukrayna","League","ukr.1",218],
  ["geo1","Erovnuli Liga","Gürcüstan","League","geo.1",null],
  ["sui1","Super Liqa","İsveçrə","League","sui.1",215],
  ["aut1","Bundesliqa","Avstriya","League","aut.1",45],
  ["den1","Superliqa","Danimarka","League","den.1",39],
  ["swe1","Allsvenskan","İsveç","League","swe.1",40],
  ["nor1","Eliteserien","Norveç","League","nor.1",20],
  ["pol1","Ekstraklasa","Polşa","League","pol.1",202],
  ["cze1","Birinci Liqa","Çexiya","League","cze.1",172],
  ["cro1","HNL","Xorvatiya","League","cro.1",170],
  ["srb1","Super Liqa","Serbiya","League","srb.1",210],
  ["bra1","Brasileirão","Braziliya","League","bra.1",325],
  ["arg1","Primera División","Argentina","League","arg.1",155],
  ["libertadores","Kopa Libertadores","Cənubi Amerika","Cup","conmebol.libertadores",384],
  ["usa1","MLS","ABŞ","League","usa.1",242],
  ["mex1","Liga MX","Meksika","League","mex.1",11621],
  ["ksa1","Pro Liqa","Səudiyyə Ərəbistanı","League","ksa.1",955],
  ["jpn1","J1 Liqa","Yaponiya","League","jpn.1",196],
  ["kor1","K Liqa 1","Cənubi Koreya","League","kor.1",410],
  ["chn1","Super Liqa","Çin","League","chn.1",649],
  ["aus1","A-Liqa","Avstraliya","League","aus.1",136],
  ["egy1","Premyer Liqa","Misir","League","egy.1",808000]
];
const SEED_MAP = new Map(SEEDS.map((s) => [s[0], s]));

function send(res, status, body, sec = 30) {
  res.setHeader("Cache-Control", `s-maxage=${sec}, stale-while-revalidate=120`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(status).json(body);
}
async function getJson(url, ttl = 30000, headers = {}) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < ttl) return hit.d;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": UA, ...headers } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    cache.set(url, { t: Date.now(), d });
    return d;
  } finally { clearTimeout(timer); }
}
const sofa = (path, ttl) => getJson(SOFA + path, ttl, { Referer: "https://www.sofascore.com/", Origin: "https://www.sofascore.com" });
const compact = (d) => d.replaceAll("-", "");
const shiftDate = (ymd, n) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ---------- ESPN ---------- */
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
async function espnFixtures(slug, date, tz, liveOnly, league) {
  const from = liveOnly ? null : shiftDate(date, -1), to = liveOnly ? null : shiftDate(date, 1);
  const url = liveOnly ? `${ESPN}/${slug}/scoreboard` : `${ESPN}/${slug}/scoreboard?dates=${compact(from)}-${compact(to)}&limit=300`;
  const p = await getJson(url, 20000);
  const lg = (p.leagues && p.leagues[0]) || {};
  let events = p.events || [];
  if (liveOnly) events = events.filter((e) => e.status && e.status.type && e.status.type.state === "in");
  else events = events.filter((e) => {
    const local = new Date(new Date(e.date).getTime() - tz * 60000).toISOString().slice(0, 10);
    return local === date;
  });
  return { matches: events.map((e) => espnMatch(e, { ...league, logo: league.logo || (lg.logos && lg.logos[0] && lg.logos[0].href) || "" })) };
}
async function espnStandings(slug) {
  const p = await getJson(`${ESPN_V2}/${slug}/standings`, 120000);
  const groups = (p.children && p.children.length ? p.children : [p]).map((c) => ({
    name: p.children && p.children.length > 1 ? c.name : "",
    rows: ((c.standings && c.standings.entries) || []).map((en, i) => {
      const s = {}; (en.stats || []).forEach((x) => { s[x.name] = x.value; });
      const gf = s.pointsFor ?? 0, ga = s.pointsAgainst ?? 0;
      return { rank: s.rank || i + 1, team: en.team.displayName || en.team.name, logo: en.team.logos && en.team.logos[0] && en.team.logos[0].href || "",
        played: s.gamesPlayed, win: s.wins, draw: s.ties, lose: s.losses, goals: `${gf}:${ga}`, goal_difference: s.pointDifferential ?? gf - ga, points: s.points };
    }).sort((a, b) => a.rank - b.rank)
  })).filter((g) => g.rows.length);
  return { groups };
}

/* ---------- SofaScore ---------- */
function sofaMatch(e, league) {
  const st = e.status || {}; let short = "NS", long = "Başlamayıb", elapsed = null;
  if (st.type === "inprogress") {
    const d = String(st.description || "").toLowerCase();
    if (d === "halftime") { short = "HT"; long = "Fasilə"; }
    else { const base = d.includes("2nd") ? 45 : 0; const s = e.time && e.time.currentPeriodStartTimestamp;
      if (s) elapsed = Math.min(base + Math.floor((Date.now() / 1000 - s) / 60) + 1, base + 60); short = base ? "2H" : "1H"; long = "Canlı"; }
  } else if (st.type === "finished") { short = "FT"; long = "Bitib"; }
  else if (st.type === "postponed") { short = "PST"; long = "Təxirə salınıb"; }
  else if (st.type === "canceled") { short = "CANC"; long = "Ləğv edilib"; }
  const tm = (x) => ({ id: x.id, name: x.name, logo: `${SOFA_IMG}/team/${x.id}/image` });
  const g = (o) => (o && o.current != null ? o.current : null);
  return { fixture: { id: "s" + e.id, date: new Date(e.startTimestamp * 1000).toISOString(), status: { short, long, elapsed } },
    league, teams: { home: tm(e.homeTeam), away: tm(e.awayTeam) }, goals: { home: g(e.homeScore), away: g(e.awayScore) } };
}
async function sofaFixtures(id, date, tz, liveOnly, league) {
  const ev = liveOnly ? (await sofa("/sport/football/events/live", 15000)).events
    : [].concat(...(await Promise.all([date, shiftDate(date, -1), shiftDate(date, 1)].map((d) => sofa(`/sport/football/scheduled-events/${d}`, 30000).then((x) => x.events || []).catch(() => [])))));
  const seen = new Set();
  const matches = (ev || []).filter((e) => e.tournament && e.tournament.uniqueTournament && e.tournament.uniqueTournament.id === id && !seen.has(e.id) && seen.add(e.id))
    .filter((e) => liveOnly || new Date(e.startTimestamp * 1000 - tz * 60000).toISOString().slice(0, 10) === date)
    .map((e) => sofaMatch(e, league));
  return { matches };
}
async function sofaStandings(id) {
  const seasons = (await sofa(`/unique-tournament/${id}/seasons`, 3600000)).seasons || [];
  if (!seasons.length) return { groups: [] };
  const p = await sofa(`/unique-tournament/${id}/season/${seasons[0].id}/standings/total`, 120000);
  return { season: seasons[0].year, groups: (p.standings || []).map((g) => ({ name: (p.standings.length > 1 && g.name) || "", rows: (g.rows || []).map((r) => ({
    rank: r.position, team: r.team.name, logo: `${SOFA_IMG}/team/${r.team.id}/image`, played: r.matches, win: r.wins, draw: r.draws, lose: r.losses,
    goals: `${r.scoresFor}:${r.scoresAgainst}`, goal_difference: r.scoresFor - r.scoresAgainst, points: r.points })) })).filter((g) => g.rows.length) };
}

/* ---------- Ümumi ---------- */
function leagueOf(key) {
  if (/^sofa:\d+$/.test(key)) return { sofaId: Number(key.slice(5)), league: { id: key, name: "", country: "" } };
  const s = SEED_MAP.get(key); if (!s) return null;
  return { espn: s[4], sofaId: s[5], league: { id: key, name: s[1], country: s[2], logo: s[5] ? `${SOFA_IMG}/unique-tournament/${s[5]}/image` : "" } };
}
async function firstWorking(tasks) {
  const errors = []; let empty = null;
  for (const t of tasks) {
    try { const r = await t.run(); const has = (r.matches && r.matches.length) || (r.groups && r.groups.length);
      if (has) return { ...r, provider: t.name }; empty = empty || { ...r, provider: t.name };
    } catch (e) { errors.push(`${t.name}: ${e.message}`); }
  }
  if (empty) return empty;
  throw new Error("Mənbələr cavab vermədi (" + errors.join("; ") + ")");
}
async function catalog() {
  const hit = cache.get("__catalog");
  if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.d;
  const list = SEEDS.map((s) => ({ id: s[0], name: s[1], country: s[2], type: s[3], logo: s[5] ? `${SOFA_IMG}/unique-tournament/${s[5]}/image` : "", season: new Date().getFullYear() }));
  const known = new Set(SEEDS.map((s) => s[5]).filter(Boolean));
  const today = new Date().toISOString().slice(0, 10);
  const days = await Promise.all([today, shiftDate(today, 1)].map((d) => sofa(`/sport/football/scheduled-events/${d}`, 600000).catch(() => null)));
  const extra = new Map();
  days.forEach((p) => ((p && p.events) || []).forEach((e) => {
    const ut = e.tournament && e.tournament.uniqueTournament;
    if (ut && !known.has(ut.id) && !extra.has(ut.id)) extra.set(ut.id, { id: "sofa:" + ut.id, name: ut.name, country: (e.tournament.category && e.tournament.category.name) || "Beynəlxalq", type: /cup|qualif|champions|world|euro/i.test(ut.name) ? "Cup" : "League", logo: `${SOFA_IMG}/unique-tournament/${ut.id}/image`, season: new Date().getFullYear() });
  }));
  const rest = [...extra.values()].sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
  const out = [...list, ...rest];
  cache.set("__catalog", { t: Date.now(), d: out });
  return out;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "GET") return send(res, 405, { error: "Yalnız GET dəstəklənir." });
  const { action, leagueId, date, live } = req.query || {};
  try {
    if (action === "health") {
      const probe = async (name, fn) => { try { await fn(); return [name, "OK"]; } catch (e) { return [name, "XƏTA: " + e.message]; } };
      const r = await Promise.all([
        probe("espn-scoreboard", () => getJson(`${ESPN}/eng.1/scoreboard`, 1000)),
        probe("espn-standings", () => getJson(`${ESPN_V2}/eng.1/standings`, 1000)),
        probe("espn-azerbaijan", () => getJson(`${ESPN}/aze.1/scoreboard`, 1000)),
        probe("sofascore", () => sofa("/unique-tournament/808/seasons", 1000))
      ]);
      return send(res, 200, Object.fromEntries(r), 5);
    }
    if (action === "leagues") { const leagues = await catalog(); return send(res, 200, { leagues, count: leagues.length }, 600); }
    const cfg = leagueOf(String(leagueId || ""));
    if (!cfg) return send(res, 400, { error: "Liqa tapılmadı." });
    const tz = Number(req.query.tz) || 0;
    if (action === "fixtures") {
      const liveOnly = live === "all";
      if (!liveOnly && !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return send(res, 400, { error: "Tarix YYYY-MM-DD olmalıdır." });
      const tasks = [];
      if (cfg.espn) tasks.push({ name: "ESPN", run: () => espnFixtures(cfg.espn, date, tz, liveOnly, cfg.league) });
      if (cfg.sofaId) tasks.push({ name: "SofaScore", run: () => sofaFixtures(cfg.sofaId, date, tz, liveOnly, cfg.league) });
      const r = await firstWorking(tasks);
      return send(res, 200, { matches: r.matches, count: r.matches.length, provider: r.provider }, 20);
    }
    if (action === "standings") {
      const tasks = [];
      if (cfg.espn) tasks.push({ name: "ESPN", run: () => espnStandings(cfg.espn) });
      if (cfg.sofaId) tasks.push({ name: "SofaScore", run: () => sofaStandings(cfg.sofaId) });
      const r = await firstWorking(tasks);
      return send(res, 200, { groups: r.groups, season: r.season, standings: r.groups[0] ? r.groups[0].rows : [], provider: r.provider }, 120);
    }
    return send(res, 400, { error: "action: leagues, fixtures, standings və ya health olmalıdır." });
  } catch (err) {
    console.error("Football API error", err);
    return send(res, 502, { error: "Futbol məlumatlarına qoşulmaq mümkün olmadı. Bir az sonra yenidən yoxlayın. (" + err.message + ")" }, 10);
  }
};
