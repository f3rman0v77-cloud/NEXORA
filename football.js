// NEXORA futbol API: SofaScore ictimai məlumatları (açar tələb olunmur).
// Vercel-də bu fayl /api/football ünvanında işləyir.
const BASE = "https://api.sofascore.com/api/v1";
const IMG = "https://api.sofascore.app/api/v1";
const cache = globalThis.__nxCache || (globalThis.__nxCache = new Map());

// [id, ad, ölkə, tip]. Azərbaycan turnirləri həmişə əvvəldə.
const SEEDS = [
  [808,"Premyer Liqa","Azərbaycan","League"],
  [2186,"Birinci Divizion","Azərbaycan","League"],
  [7,"UEFA Çempionlar Liqası","Avropa","Cup"],
  [679,"UEFA Avropa Liqası","Avropa","Cup"],
  [17015,"UEFA Konfrans Liqası","Avropa","Cup"],
  [17,"Premyer Liqa","İngiltərə","League"],
  [8,"La Liga","İspaniya","League"],
  [35,"Bundesliqa","Almaniya","League"],
  [23,"Serie A","İtaliya","League"],
  [34,"Ligue 1","Fransa","League"],
  [52,"Süper Liqa","Türkiyə","League"],
  [238,"Primeira Liga","Portuqaliya","League"],
  [37,"Eredivisie","Niderland","League"],
  [325,"Serie A","Braziliya","League"],
  [955,"Pro Liqa","Səudiyyə Ərəbistanı","League"],
  [36,"Premiership","Şotlandiya","League"],
  [38,"Pro Liqa","Belçika","League"],
  [185,"Super Liqa","Yunanıstan","League"],
  [242,"MLS","ABŞ","League"],
  [196,"J1 Liqa","Yaponiya","League"],
  [16,"Dünya Çempionatı","Beynəlxalq","Cup"],
  [1,"Avropa Çempionatı","Beynəlxalq","Cup"],
  [133,"Çempionlar Liqası (Qadınlar)","Avropa","Cup"]
];

const AZ_COUNTRY = { Azerbaijan:"Azərbaycan", England:"İngiltərə", Spain:"İspaniya", Germany:"Almaniya", Italy:"İtaliya", France:"Fransa", Turkey:"Türkiyə", Türkiye:"Türkiyə", Portugal:"Portuqaliya", Netherlands:"Niderland", Brazil:"Braziliya", Argentina:"Argentina", Russia:"Rusiya", Georgia:"Gürcüstan", USA:"ABŞ", Europe:"Avropa", World:"Beynəlxalq", Scotland:"Şotlandiya", Belgium:"Belçika", Greece:"Yunanıstan", Japan:"Yaponiya", "Saudi Arabia":"Səudiyyə Ərəbistanı" };

function send(res, status, body, sec = 30) {
  res.setHeader("Cache-Control", `s-maxage=${sec}, stale-while-revalidate=120`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(status).json(body);
}

async function sofa(path, ttl = 30000) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.t < ttl) return hit.d;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(BASE + path, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        Referer: "https://www.sofascore.com/", Origin: "https://www.sofascore.com"
      }
    });
    if (!r.ok) throw new Error("SofaScore HTTP " + r.status);
    const d = await r.json();
    cache.set(path, { t: Date.now(), d });
    return d;
  } finally { clearTimeout(timer); }
}

const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d; };

function normalizeEvent(e) {
  const st = e.status || {};
  const type = st.type; // notstarted | inprogress | finished | postponed | canceled
  let short = "NS", long = "Başlamayıb", elapsed = null;
  if (type === "inprogress") {
    const desc = String(st.description || "").toLowerCase();
    if (desc.includes("half") && !desc.includes("1st") && !desc.includes("2nd")) { short = "HT"; long = "Fasilə"; }
    else {
      const start = e.time && e.time.currentPeriodStartTimestamp;
      const base = desc.includes("2nd") ? 45 : 0;
      if (start) elapsed = Math.min(base + Math.floor((Date.now() / 1000 - start) / 60) + 1, base + 60);
      short = base ? "2H" : "1H"; long = "Canlı";
    }
  } else if (type === "finished") { short = "FT"; long = "Bitib"; }
  else if (type === "postponed") { short = "PST"; long = "Təxirə salınıb"; }
  else if (type === "canceled") { short = "CANC"; long = "Ləğv edilib"; }
  const ut = (e.tournament && e.tournament.uniqueTournament) || {};
  const ctry = e.tournament && e.tournament.category && e.tournament.category.name;
  return {
    fixture: { id: e.id, date: new Date(e.startTimestamp * 1000).toISOString(), status: { short, long, elapsed } },
    league: { id: ut.id, name: ut.name || (e.tournament && e.tournament.name) || "", country: AZ_COUNTRY[ctry] || ctry || "", round: e.roundInfo && (e.roundInfo.name || e.roundInfo.round) || "" },
    teams: {
      home: { id: e.homeTeam.id, name: e.homeTeam.name, logo: `${IMG}/team/${e.homeTeam.id}/image` },
      away: { id: e.awayTeam.id, name: e.awayTeam.name, logo: `${IMG}/team/${e.awayTeam.id}/image` }
    },
    goals: {
      home: e.homeScore && e.homeScore.current != null ? e.homeScore.current : null,
      away: e.awayScore && e.awayScore.current != null ? e.awayScore.current : null
    }
  };
}

async function catalog() {
  const hit = cache.get("__catalog");
  if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.d;
  const map = new Map(SEEDS.map(([id, name, country, type]) => [id, { id, name, country, type, logo: `${IMG}/unique-tournament/${id}/image`, season: new Date().getFullYear(), seed: true }]));
  // Bu günün oyunu olan bütün turnirləri əlavə et (bütün futbol turnirləri).
  const days = await Promise.all([0, 1, -1].map((n) => sofa(`/sport/football/scheduled-events/${ymd(addDays(n))}`, 600000).catch(() => null)));
  days.forEach((p) => (p && p.events || []).forEach((e) => {
    const ut = e.tournament && e.tournament.uniqueTournament;
    if (!ut || map.has(ut.id)) return;
    const ctry = e.tournament.category && e.tournament.category.name;
    map.set(ut.id, { id: ut.id, name: ut.name, country: AZ_COUNTRY[ctry] || ctry || "Beynəlxalq", type: /cup|champions|europa|conference|world|euro|qualif/i.test(ut.name) ? "Cup" : "League", logo: `${IMG}/unique-tournament/${ut.id}/image`, season: new Date().getFullYear() });
  }));
  const list = [...map.values()].sort((a, b) =>
    ((a.country === "Azərbaycan" ? 0 : 1) - (b.country === "Azərbaycan" ? 0 : 1)) ||
    ((a.seed ? 0 : 1) - (b.seed ? 0 : 1)) || a.country.localeCompare(b.country, "az") || a.name.localeCompare(b.name, "az"));
  cache.set("__catalog", { t: Date.now(), d: list });
  return list;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "GET") return send(res, 405, { error: "Yalnız GET dəstəklənir." });
  const { action, leagueId, date, live } = req.query || {};
  try {
    if (action === "leagues") {
      const leagues = await catalog();
      return send(res, 200, { leagues, count: leagues.length }, 600);
    }
    if (action === "live") {
      const p = await sofa("/sport/football/events/live", 15000);
      const matches = (p.events || []).map(normalizeEvent);
      return send(res, 200, { matches, count: matches.length }, 15);
    }
    if (action === "fixtures") {
      const id = Number(leagueId);
      if (!id) return send(res, 400, { error: "Liqa identifikatoru tələb olunur." });
      let events;
      if (live === "all") events = (await sofa("/sport/football/events/live", 15000)).events || [];
      else {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return send(res, 400, { error: "Tarix YYYY-MM-DD olmalıdır." });
        events = (await sofa(`/sport/football/scheduled-events/${date}`, 30000)).events || [];
      }
      const matches = events.filter((e) => e.tournament && e.tournament.uniqueTournament && e.tournament.uniqueTournament.id === id).map(normalizeEvent);
      return send(res, 200, { matches, count: matches.length }, 20);
    }
    if (action === "standings") {
      const id = Number(leagueId);
      if (!id) return send(res, 400, { error: "Liqa identifikatoru tələb olunur." });
      const seasons = (await sofa(`/unique-tournament/${id}/seasons`, 3600000)).seasons || [];
      if (!seasons.length) return send(res, 200, { groups: [], standings: [] }, 300);
      const sid = seasons[0].id;
      const p = await sofa(`/unique-tournament/${id}/season/${sid}/standings/total`, 120000);
      const groups = (p.standings || []).map((g) => ({
        name: g.name || "",
        rows: (g.rows || []).map((r) => ({
          rank: r.position, team: r.team.name, logo: `${IMG}/team/${r.team.id}/image`,
          played: r.matches, win: r.wins, draw: r.draws, lose: r.losses,
          goals: `${r.scoresFor}:${r.scoresAgainst}`, goal_difference: r.scoresFor - r.scoresAgainst,
          points: r.points, promotion: r.promotion && r.promotion.text || ""
        }))
      })).filter((g) => g.rows.length);
      return send(res, 200, { season: seasons[0].year, groups, standings: groups[0] ? groups[0].rows : [] }, 120);
    }
    return send(res, 400, { error: "action: leagues, live, fixtures və ya standings olmalıdır." });
  } catch (err) {
    console.error("Football API error", err);
    return send(res, 502, { error: "Futbol məlumatlarına qoşulmaq mümkün olmadı. Bir az sonra yenidən yoxlayın." }, 10);
  }
};
