// NEXORA football data adapter — SportScore public API (no API key required)
// Attribution is displayed in the UI as required by SportScore's developer terms.
const BASE = "https://sportscore.com";
const cache = globalThis.__nexoraSportScoreCache || (globalThis.__nexoraSportScoreCache = new Map());
const TTL = 5 * 60 * 1000;

const SEEDS = [
  ["azerbaijan-premier-league","Azərbaycan Premyer Liqası","Azərbaycan","League"],
  ["azerbaijan-first-division","Azərbaycan Birinci Liqası","Azərbaycan","League"],
  ["azerbaijan-cup","Azərbaycan Kuboku","Azərbaycan","Cup"],
  ["uefa-champions-league","UEFA Çempionlar Liqası","Avropa","Cup"],
  ["uefa-europa-league","UEFA Avropa Liqası","Avropa","Cup"],
  ["uefa-europa-conference-league","UEFA Konfrans Liqası","Avropa","Cup"],
  ["english-premier-league","İngiltərə Premyer Liqası","İngiltərə","League"],
  ["spanish-la-liga","La Liga","İspaniya","League"],
  ["german-bundesliga","Bundesliga","Almaniya","League"],
  ["italian-serie-a","Serie A","İtaliya","League"],
  ["french-ligue-1","Ligue 1","Fransa","League"],
  ["turkish-super-lig","Türkiyə Super Liqası","Türkiyə","League"],
  ["portuguese-primeira-liga","Primeira Liga","Portuqaliya","League"],
  ["dutch-eredivisie","Eredivisie","Niderland","League"],
  ["brazilian-serie-a","Brasileirão","Braziliya","League"],
  ["argentine-primera-division","Argentina Primera División","Argentina","League"],
  ["saudi-professional-league","Saudi Pro League","Səudiyyə Ərəbistanı","League"],
  ["scottish-premiership","Scottish Premiership","Şotlandiya","League"],
  ["belgian-pro-league","Belgian Pro League","Belçika","League"],
  ["greek-super-league","Greek Super League","Yunanıstan","League"],
  ["mls","MLS","ABŞ","League"],
  ["j1-league","J1 League","Yaponiya","League"],
  ["fifa-world-cup","FIFA Dünya Kuboku","Beynəlxalq","Cup"],
  ["uefa-european-championship","UEFA Avropa Çempionatı","Beynəlxalq","Cup"],
  ["fifa-club-world-cup","FIFA Klublararası Dünya Kuboku","Beynəlxalq","Cup"]
];

function send(res, status, body, cacheSeconds=60) {
  res.setHeader("Cache-Control", `s-maxage=${cacheSeconds}, stale-while-revalidate=300`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(status).json(body);
}
async function getJson(path, params={}) {
  const url = new URL(path, BASE);
  for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const key = url.toString();
  const saved = cache.get(key);
  if (saved && Date.now()-saved.time<TTL) return saved.data;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 9000);
  try {
    const r = await fetch(key, {headers:{Accept:"application/json"}, signal:controller.signal});
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(`SportScore HTTP ${r.status}`);
    cache.set(key,{time:Date.now(),data});
    return data;
  } finally { clearTimeout(timer); }
}
function text(v) { return typeof v === "string" ? v : (v && typeof v === "object" ? (v.name || v.title || v.display_name || "") : ""); }
function normalizeLeague(item, path="") {
  const slug = item.slug || item.competition_slug || item.league_slug;
  const name = text(item.name || item.title || item.competition || item.league || item.tournament);
  if (!slug || !name) return null;
  const typeText = String(item.type || item.entity_type || path || "").toLowerCase();
  const country = text(item.country || item.country_name || item.region) || (/azerbaijan/i.test(name+slug) ? "Azərbaycan" : "Beynəlxalq");
  if (/team|player|club|athlete/.test(typeText) && !/league|competition|tournament/.test(typeText)) return null;
  return {id:String(slug),slug:String(slug),name,country,type:/cup|knockout|tournament/.test(typeText+name.toLowerCase())?"Cup":"League",logo:item.logo || item.image || item.badge || "",season:new Date().getFullYear()};
}
function extractLeagues(payload) {
  const found = new Map();
  const walk = (node,path="") => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(x=>walk(x,path)); return; }
    if (typeof node !== "object") return;
    const candidate = normalizeLeague(node,path);
    if (candidate) found.set(candidate.id,candidate);
    for (const [k,v] of Object.entries(node)) walk(v,k.toLowerCase());
  };
  walk(payload);
  return [...found.values()];
}
function firstArray(payload, keys) {
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  if (payload?.data && !Array.isArray(payload.data)) return firstArray(payload.data,keys);
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
function scoreValue(v) { if (v===null || v===undefined || v==="") return null; const n=Number(v); return Number.isFinite(n)?n:null; }
function normalizeMatch(m, league) {
  const home = m.home || m.home_team || m.homeTeam || m.teams?.home || m.participants?.[0] || {};
  const away = m.away || m.away_team || m.awayTeam || m.teams?.away || m.participants?.[1] || {};
  const statusRaw = String(m.status?.short || m.status?.type || m.status || m.state || m.match_status || "NS").toLowerCase();
  const live = /live|in.?progress|1h|2h|half.?time|extra.?time/.test(statusRaw);
  const finished = /finished|full.?time|ft|ended|complete/.test(statusRaw);
  const short = live ? (statusRaw.includes("half") ? "HT" : "LIVE") : finished ? "FT" : "NS";
  const date = m.time || m.date || m.kickoff || m.start_time || m.startTime || m.fixture?.date || new Date().toISOString();
  const homeScore = scoreValue(m.home_score ?? m.homeScore ?? m.score?.home ?? m.scores?.home ?? m.goals?.home);
  const awayScore = scoreValue(m.away_score ?? m.awayScore ?? m.score?.away ?? m.scores?.away ?? m.goals?.away);
  return {
    fixture:{id:m.id || m.match_id || m.event_id || m.slug || `${league.id}-${date}`,date,status:{short,long:m.status_text || m.status?.text || m.status_text || (live?"Canlı":finished?"Bitib":"Başlamayıb"),elapsed:m.minute || m.elapsed || null}},
    league:{id:league.id,name:league.name,country:league.country,logo:league.logo || "",round:m.round || ""},
    teams:{home:{name:text(home) || m.home_name || "Ev sahibi",logo:home.logo || home.image || ""},away:{name:text(away) || m.away_name || "Qonaq",logo:away.logo || away.image || ""}},
    goals:{home:homeScore,away:awayScore}
  };
}
function normalizeStandings(payload) {
  let rows = firstArray(payload,["standings","table","rows","teams","items"]);
  if (!rows.length && Array.isArray(payload?.groups)) rows=payload.groups.flatMap(g=>g.table||g.rows||g.teams||[]);
  return rows.map((r,i)=>({
    rank:r.rank ?? r.position ?? r.place ?? i+1,
    team:text(r.team || r.club || r.name || r.participant) || "Komanda",
    played:r.played ?? r.matches ?? r.played_matches ?? r.all?.played,
    win:r.win ?? r.wins ?? r.all?.win,
    draw:r.draw ?? r.draws ?? r.all?.draw,
    lose:r.lose ?? r.losses ?? r.all?.lose,
    goal_difference:r.goal_difference ?? r.goalDifference ?? r.goals_diff ?? r.goalsDiff,
    points:r.points ?? r.pts
  }));
}

module.exports = async (req,res) => {
  if (req.method === "OPTIONS") return send(res,204,{});
  if (req.method !== "GET") return send(res,405,{error:"Yalnız GET sorğuları dəstəklənir."});
  const {action,leagueId,date,live} = req.query || {};
  try {
    if (action === "leagues") {
      const cached=cache.get("__catalog");
      if (cached && Date.now()-cached.time<6*60*60*1000) return send(res,200,{leagues:cached.data,count:cached.data.length,provider:"SportScore"},3600);
      const queries=["Azerbaijan","England","Spain","Germany","Italy","France","Europe","World","Turkey","Portugal","Netherlands","Brazil","Argentina","Saudi Arabia","Scotland","Belgium","Greece","United States","Japan","football cup"];
      const discovered=[];
      // Keep requests below the provider's anonymous burst limit.
      for (let i=0;i<queries.length;i+=4) {
        const batch=await Promise.all(queries.slice(i,i+4).map(q=>getJson("/api/v1/search/",{q,sport:"football",limit:20}).catch(()=>null)));
        batch.forEach(p=>{ if(p) discovered.push(...extractLeagues(p)); });
      }
      const map=new Map(SEEDS.map(([id,name,country,type])=>[id,{id,slug:id,name,country,type,logo:"",season:new Date().getFullYear()}]));
      discovered.forEach(l=>map.set(l.id,l));
      const leagues=[...map.values()].sort((a,b)=>((/Azərbaycan/i.test(a.country)?0:1)-(/Azərbaycan/i.test(b.country)?0:1)) || a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
      cache.set("__catalog",{time:Date.now(),data:leagues});
      return send(res,200,{leagues,count:leagues.length,provider:"SportScore"},3600);
    }
    if (action === "fixtures") {
      if (!leagueId) return send(res,400,{error:"Liqa identifikatoru tələb olunur."});
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date||"")) && live !== "all") return send(res,400,{error:"Tarix YYYY-MM-DD formatında olmalıdır."});
      const params={sport:"football",competition:String(leagueId),limit:200};
      if (live === "all") params.status="live"; else params.date=String(date);
      const payload=await getJson("/api/v1/fixtures/",params);
      const league={id:String(leagueId),name:String(req.query.leagueName||leagueId),country:String(req.query.country||""),logo:""};
      const raw=firstArray(payload,["matches","fixtures","events","results"]);
      const matches=raw.map(m=>normalizeMatch(m,league));
      return send(res,200,{matches,count:matches.length,provider:"SportScore"},45);
    }
    if (action === "standings") {
      if (!leagueId) return send(res,400,{error:"Liqa identifikatoru tələb olunur."});
      const payload=await getJson("/api/widget/standings/",{sport:"football",slug:String(leagueId)});
      const standings=normalizeStandings(payload);
      return send(res,200,{standings,provider:"SportScore",rawAvailable:!!payload},300);
    }
    return send(res,400,{error:"action leagues, fixtures və ya standings olmalıdır."});
  } catch (error) {
    console.error("SportScore API error",error);
    return send(res,502,{error:"SportScore məlumatlarına qoşulmaq mümkün olmadı. Bir az sonra yenidən yoxlayın."},20);
  }
};
