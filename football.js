var module = (typeof module !== "undefined") ? module : { exports: {} };
// NEXORA futbol API: yalnız ESPN ictimai JSON (açar yoxdur). Həm Vercel-də, həm brauzerdə işləyir.
const ESPN_ROOT = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_V2_ROOT = "https://site.api.espn.com/apis/v2/sports";
// İdman növü → ESPN yolu. Futbol liqa id-ləri köhnə formatda qalır (məs. "eng.1"),
// voleybol və basketbol id-ləri "basketball/nba" kimi prefikslə yazılır.
const SPORT_PATH = { football: "soccer", basketball: "basketball", volleyball: "volleyball" };
const ESPN = ESPN_ROOT + "/soccer";
const ESPN_V2 = ESPN_V2_ROOT + "/soccer";
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
// [id, ad, ölkə, tip, orta komanda-cəmi xal (model üçün), ESPN əlavə sorğu parametrləri]
const BASKET_SEEDS = [
  ["basketball/nba", "NBA", "ABŞ", "League", 228, ""],
  ["basketball/wnba", "WNBA", "ABŞ", "League", 165, ""],
  ["basketball/nba-development", "NBA G Liqası", "ABŞ", "League", 228, ""],
  ["basketball/nba-summer-las-vegas", "NBA Yay Liqası (Las-Veqas)", "ABŞ", "League", 200, ""],
  ["basketball/mens-college-basketball", "Kollec basketbolu (kişilər)", "ABŞ", "League", 140, "groups=50&limit=300"],
  ["basketball/womens-college-basketball", "Kollec basketbolu (qadınlar)", "ABŞ", "League", 130, "groups=50&limit=300"],
  ["basketball/fiba", "FIBA Dünya Kuboku", "Beynəlxalq", "Cup", 165, ""],
  ["basketball/mens-olympics-basketball", "Olimpiya oyunları (kişilər)", "Beynəlxalq", "Cup", 170, ""],
  ["basketball/womens-olympics-basketball", "Olimpiya oyunları (qadınlar)", "Beynəlxalq", "Cup", 150, ""],
  ["basketball/nbl", "NBL", "Avstraliya", "League", 175, ""],
  ["basketball/euroleague", "Avroliqa", "Avropa", "League", 160, ""],
  ["basketball/eurocup", "Avrokubok", "Avropa", "League", 160, ""]
];
const VOLLEY_SEEDS = [
  ["volleyball/womens-college-volleyball", "Kollec voleybolu (qadınlar)", "ABŞ", "League", 0, "limit=300"],
  ["volleyball/mens-college-volleyball", "Kollec voleybolu (kişilər)", "ABŞ", "League", 0, "limit=300"]
];
const SEEDS_BY_SPORT = { football: SEEDS, basketball: BASKET_SEEDS, volleyball: VOLLEY_SEEDS };
const SEED_MAP = new Map([...SEEDS, ...BASKET_SEEDS, ...VOLLEY_SEEDS].map((s) => [s[0], s]));

function parseLeagueId(id) {
  id = String(id || "");
  const i = id.indexOf("/");
  if (i < 0) return SEED_MAP.has(id) ? { sport: "football", slug: id } : null;
  const sport = id.slice(0, i);
  if (!SPORT_PATH[sport] || !SEED_MAP.has(id)) return null;
  return { sport, slug: id.slice(i + 1) };
}
const baseUrl = (p) => `${ESPN_ROOT}/${SPORT_PATH[p.sport]}/${p.slug}`;
const baseUrlV2 = (p) => `${ESPN_V2_ROOT}/${SPORT_PATH[p.sport]}/${p.slug}`;
const extraQuery = (id) => { const s = SEED_MAP.get(id); return s && s[5] ? "&" + s[5] : ""; };

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


const periodScores = (c) => ((c && c.linescores) || []).map((x) => Number(x.value ?? x.displayValue)).filter((v) => !Number.isNaN(v));

function espnMatch(e, league, sport = "football") {
  const comp = (e.competitions && e.competitions[0]) || {};
  const home = (comp.competitors || []).find((c) => c.homeAway === "home") || {};
  const away = (comp.competitors || []).find((c) => c.homeAway === "away") || {};
  const st = (e.status && e.status.type) || {};
  let short = "NS", long = "Başlamayıb", elapsed = null, text = "";
  if (st.state === "in") {
    if (st.name === "STATUS_HALFTIME") { short = "HT"; long = "Fasilə"; }
    else if (sport === "football") { short = (e.status.period || 1) >= 2 ? "2H" : "1H"; long = "Canlı"; elapsed = parseInt(e.status.displayClock, 10) || null; }
    else { short = "LIVE"; long = "Canlı"; }
    if (sport !== "football") text = st.shortDetail || st.detail || "";
  } else if (st.state === "post") { short = "FT"; long = "Bitib"; }
  else if (/POSTPONED|DELAYED/.test(st.name || "")) { short = "PST"; long = "Təxirə salınıb"; }
  else if (/CANCEL|FORFEIT/.test(st.name || "")) { short = "CANC"; long = "Ləğv edilib"; }
  const pre = st.state === "pre";
  const t = (c) => ({ id: c.team && c.team.id, name: (c.team && (c.team.displayName || c.team.name)) || "", logo: (c.team && (c.team.logo || (c.team.logos && c.team.logos[0] && c.team.logos[0].href))) || "" });
  let goals, sets = null;
  if (sport === "volleyball") {
    // Voleybolda əsas hesab = qazanılmış setlər. Setlər xətti hesabdan (linescores) çıxarılır;
    // oyun gedirsə sonuncu (davam edən) set sayılmır.
    const hl = periodScores(home), al = periodScores(away);
    sets = { home: hl, away: al };
    let hs = null, as = null;
    if (!pre && hl.length && hl.length === al.length) {
      const upto = st.state === "post" ? hl.length : Math.max(0, hl.length - 1);
      hs = 0; as = 0;
      for (let i = 0; i < upto; i++) { if (hl[i] > al[i]) hs++; else if (al[i] > hl[i]) as++; }
    } else if (!pre && home.score !== undefined && home.score !== "" && away.score !== undefined && away.score !== "") {
      hs = Number(home.score); as = Number(away.score);
    }
    goals = { home: hs, away: as };
  } else {
    const sc = (c) => (pre || c.score === undefined || c.score === "" ? null : Number(c.score));
    goals = { home: sc(home), away: sc(away) };
    if (sport === "basketball") sets = { home: periodScores(home), away: periodScores(away) };
  }
  const out = {
    fixture: { id: "e" + e.id, date: e.date, status: { short, long, elapsed, text }, venue: { name: comp.venue && comp.venue.fullName, city: comp.venue && comp.venue.address && comp.venue.address.city } },
    league, teams: { home: t(home), away: t(away) }, goals, sport
  };
  if (sets) out.sets = sets;
  return out;
}
async function daysOf(p, id, dates) {
  // Hər gün ayrıca sorğu: ESPN-in ən sadə və etibarlı formatı (dates=YYYYMMDD).
  const res = await Promise.allSettled(dates.map((d) => getJson(`${baseUrl(p)}/scoreboard?dates=${compact(d)}${extraQuery(id)}`, 20000)));
  const ok = res.filter((r) => r.status === "fulfilled").map((r) => r.value);
  if (!ok.length) throw new Error(res[0].reason && res[0].reason.message || "cavab yoxdur");
  const seen = new Set(), events = [];
  ok.forEach((x) => (x.events || []).forEach((e) => { if (!seen.has(e.id)) { seen.add(e.id); events.push(e); } }));
  return events;
}
async function fixtures(p, id, date, tz, mode, league) {
  let events;
  if (mode === "live") {
    const q = extraQuery(id);
    const x = await getJson(`${baseUrl(p)}/scoreboard${q ? "?" + q.slice(1) : ""}`, 15000);
    events = (x.events || []).filter((e) => e.status && e.status.type && e.status.type.state === "in");
  } else if (mode === "day") {
    events = (await daysOf(p, id, [shiftDate(date, -1), date, shiftDate(date, 1)]))
      .filter((e) => new Date(new Date(e.date).getTime() - tz * 60000).toISOString().slice(0, 10) === date);
  } else {
    const days = [];
    for (let i = -6; i <= 14; i += 2) days.push(shiftDate(date, i));
    events = await daysOf(p, id, days);
    const now = Date.now();
    events = events.sort((a, b) => Math.abs(new Date(a.date) - now) - Math.abs(new Date(b.date) - now)).slice(0, 12);
  }
  return events.map((e) => espnMatch(e, league, p.sport));
}
async function standings(p) {
  const x = await getJson(`${baseUrlV2(p)}/standings`, 120000);
  const kids = x.children && x.children.length ? x.children : [x];
  const groups = kids.map((c) => ({
    name: kids.length > 1 ? c.name : "",
    rows: ((c.standings && c.standings.entries) || []).map((en, i) => {
      const s = {}; (en.stats || []).forEach((st) => { s[st.name] = st.value; });
      const logo = (en.team.logos && en.team.logos[0] && en.team.logos[0].href) || "";
      const team = en.team.displayName || en.team.name;
      if (p.sport === "football") {
        const gf = s.pointsFor ?? 0, ga = s.pointsAgainst ?? 0;
        return { rank: s.rank || i + 1, team, logo, played: s.gamesPlayed, win: s.wins, draw: s.ties, lose: s.losses, goals: `${gf}:${ga}`, goal_difference: s.pointDifferential ?? gf - ga, points: s.points };
      }
      // Basketbol / voleybol: qalibiyyət-məğlubiyyət cədvəli, oyun başına xal göstəriciləri model üçün saxlanılır.
      const win = s.wins ?? 0, lose = s.losses ?? 0, played = s.gamesPlayed || (win + lose);
      let ppg = s.avgPointsFor, oppg = s.avgPointsAgainst;
      if (ppg == null && s.pointsFor != null && played) ppg = s.pointsFor / played;
      if (oppg == null && s.pointsAgainst != null && played) oppg = s.pointsAgainst / played;
      const okPg = (v) => typeof v === "number" && v > 40 && v < 200;
      const pct = s.winPercent != null ? s.winPercent : (played ? win / played : null);
      return { rank: s.rank || s.playoffSeed || 0, team, logo, played, win, lose, pct, ppg: okPg(ppg) ? ppg : null, oppg: okPg(oppg) ? oppg : null,
        diff: s.differential ?? s.pointDifferential ?? (okPg(ppg) && okPg(oppg) ? Math.round((ppg - oppg) * 10) / 10 : null) };
    }).sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : (b.pct ?? 0) - (a.pct ?? 0))).map((r, i) => (r.rank ? r : { ...r, rank: i + 1 }))
  })).filter((g) => g.rows.length);
  return { groups };
}
async function matchDetail(p, id, eventId, league) {
  const x = await getJson(`${baseUrl(p)}/summary?event=${eventId}`, 15000);
  const comp = (x.header && x.header.competitions && x.header.competitions[0]) || {};
  const match = espnMatch({ id: eventId, date: comp.date, status: comp.status || {}, competitions: [comp] }, league, p.sport);
  const gi = x.gameInfo || {};
  match.fixture.venue = { name: gi.venue && gi.venue.fullName, city: gi.venue && gi.venue.address && gi.venue.address.city };
  const bt = (x.boxscore && x.boxscore.teams) || [];
  const stats = [];
  if (bt.length === 2) {
    const hs = bt.find((t) => t.homeAway === "home") || bt[0], as = bt.find((t) => t.homeAway === "away") || bt[1];
    (hs.statistics || []).forEach((s) => { const o = (as.statistics || []).find((y) => y.name === s.name); if (o) stats.push({ label: s.label || s.name, home: s.displayValue, away: o.displayValue }); });
  }
  const homeId = String(match.teams.home.id);
  const events = p.sport !== "football" ? [] : (x.keyEvents || []).filter((k) => k.type && /goal|card|substitution|penalty/i.test(k.type.text || ""))
    .map((k) => ({ minute: (k.clock && k.clock.displayValue) || "", type: k.type.text, text: k.shortText || k.text || "", home: !!(k.team && String(k.team.id) === homeId), goal: !!k.scoringPlay }));
  const off = (gi.officials || [])[0];
  return { match, stats, events, info: { referee: off && (off.displayName || off.fullName) || "", attendance: gi.attendance || null } };
}
function leagueOf(id) {
  const s = SEED_MAP.get(id); if (!s) return null;
  return { id: s[0], name: s[1], country: s[2], logo: "", avg: s[4] || 0 };
}
async function catalog(sport = "football") {
  const key = sport === "football" ? "__catalog" : "__catalog_" + sport;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 6 * 3600 * 1000) return hit.d;
  const seeds = SEEDS_BY_SPORT[sport] || SEEDS;
  const ok = [];
  for (let i = 0; i < seeds.length; i += 15) {
    const part = await Promise.all(seeds.slice(i, i + 15).map(async (s) => {
      try {
        const p = parseLeagueId(s[0]);
        const x = await getJson(`${baseUrl(p)}/scoreboard`, 3600000);
        const lg = x.leagues && x.leagues[0];
        return lg ? { id: s[0], name: s[1], country: s[2], type: s[3], logo: (lg.logos && lg.logos[0] && lg.logos[0].href) || "", season: new Date().getFullYear(), sport } : null;
      } catch (e) { return null; }
    }));
    part.forEach((x) => x && ok.push(x));
  }
  // ESPN heç nə qaytarmadısa (şəbəkə xətası), siyahı boş qalmasın.
  const out = ok.length ? ok : seeds.map((s) => ({ id: s[0], name: s[1], country: s[2], type: s[3], logo: "", season: new Date().getFullYear(), sport }));
  if (ok.length) cache.set(key, { t: Date.now(), d: out });
  return out;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "GET") return send(res, 405, { error: "Yalnız GET dəstəklənir." });
  const { action, leagueId, date, live, near } = req.query || {};
  try {
    if (action === "health") {
      const probe = async (name, url) => { try { await getJson(url, 1000); return [name, "OK"]; } catch (e) { return [name, "XƏTA: " + e.message]; } };
      const r = await Promise.all([probe("espn-scoreboard", `${ESPN}/eng.1/scoreboard`), probe("espn-standings", `${ESPN_V2}/eng.1/standings`), probe("espn-azerbaijan", `${ESPN}/aze.1/scoreboard`),
        probe("espn-basketball", `${ESPN_ROOT}/basketball/nba/scoreboard`), probe("espn-volleyball", `${ESPN_ROOT}/volleyball/womens-college-volleyball/scoreboard`)]);
      return send(res, 200, Object.fromEntries(r), 5);
    }
    if (action === "leagues") {
      const sport = SEEDS_BY_SPORT[req.query.sport] ? req.query.sport : "football";
      const leagues = await catalog(sport);
      return send(res, 200, { leagues, count: leagues.length, sport }, 600);
    }
    const parsed = parseLeagueId(leagueId);
    const league = leagueOf(String(leagueId || ""));
    if (!league || !parsed) return send(res, 400, { error: "Liqa tapılmadı." });
    const tz = Number(req.query.tz) || 0;
    if (action === "fixtures") {
      const mode = live === "all" ? "live" : near === "1" ? "near" : "day";
      if (mode !== "live" && !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return send(res, 400, { error: "Tarix YYYY-MM-DD olmalıdır." });
      const matches = await fixtures(parsed, league.id, date, tz, mode, league);
      return send(res, 200, { matches, count: matches.length }, 20);
    }
    if (action === "match") {
      if (!/^\d+$/.test(String(req.query.eventId || ""))) return send(res, 400, { error: "Oyun identifikatoru səhvdir." });
      return send(res, 200, await matchDetail(parsed, league.id, req.query.eventId, league), 15);
    }
    if (action === "standings") {
      const r = await standings(parsed);
      return send(res, 200, { groups: r.groups, standings: r.groups[0] ? r.groups[0].rows : [] }, 120);
    }
    return send(res, 400, { error: "action: leagues, fixtures, match, standings və ya health olmalıdır." });
  } catch (err) {
    console.error("Sports API error", err);
    return send(res, 502, { error: "ESPN məlumatlarına qoşulmaq mümkün olmadı (" + err.message + "). Bir az sonra yenidən yoxlayın." }, 10);
  }
};
if (typeof window !== "undefined") window.nxFootballHandler = module.exports;
