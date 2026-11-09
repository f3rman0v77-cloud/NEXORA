// NEXORA SportScore adapter. This file must live at /api/football.js on Vercel.
const BASE = "https://sportscore.com";
const cache = new Map();
const TTL = 60_000;

const SEEDS = [
  ["azerbaijan-premier-league","Azərbaycan Premyer Liqası","Azərbaycan","League"],
  ["azerbaijan-first-division","Azərbaycan Birinci Liqası","Azərbaycan","League"],
  ["azerbaijan-cup","Azərbaycan Kuboku","Azərbaycan","Cup"],
  ["azerbaijan-reserve-league","Azərbaycan Ehtiyat Liqası","Azərbaycan","League"],
  ["azerbaijan-u19-league","Azərbaycan U19 Liqası","Azərbaycan","League"],
  ["uefa-champions-league","UEFA Çempionlar Liqası","Avropa","Cup"],
  ["uefa-europa-league","UEFA Avropa Liqası","Avropa","Cup"],
  ["uefa-europa-conference-league","UEFA Konfrans Liqası","Avropa","Cup"],
  ["fifa-world-cup","FIFA Dünya Kuboku","Dünya","Cup"],
  ["uefa-european-championship","UEFA Avropa Çempionatı","Avropa","Cup"],
  ["english-premier-league","İngiltərə Premyer Liqası","İngiltərə","League"],
  ["english-football-league-championship","İngiltərə Çempionşip","İngiltərə","League"],
  ["spanish-la-liga","La Liga","İspaniya","League"],
  ["german-bundesliga","Bundesliga","Almaniya","League"],
  ["italian-serie-a","Serie A","İtaliya","League"],
  ["french-ligue-1","Ligue 1","Fransa","League"],
  ["netherlands-eredivisie","Eredivisie","Niderland","League"],
  ["turkish-super-lig","Türkiyə Super Liqası","Türkiyə","League"],
  ["portuguese-primeira-liga","Portuqaliya Premyer Liqası","Portuqaliya","League"],
  ["brazilian-serie-a","Braziliya Serie A","Braziliya","League"],
  ["saudi-professional-league","Saudi Pro League","Səudiyyə Ərəbistanı","League"],
  ["mls","MLS","ABŞ","League"]
];

function send(res, status, body, seconds=60) {
  res.setHeader("Cache-Control", `s-maxage=${seconds}, stale-while-revalidate=300`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res.status(status).json(body);
}
async function getJson(path, params={}) {
  const u = new URL(path, BASE);
  for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  const key = u.toString();
  const old = cache.get(key);
  if (old && Date.now()-old.time<TTL) return old.data;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 12000);
  try {
    const r = await fetch(key, {headers:{Accept:"application/json"}, signal:controller.signal});
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(`SportScore HTTP ${r.status}`);
    if (!data || typeof data !== "object") throw new Error("SportScore düzgün JSON cavabı qaytarmadı.");
    cache.set(key,{time:Date.now(),data});
    return data;
  } finally { clearTimeout(timer); }
}
function clean(s) {
  return String(s || "").replace(/&amp;/g,"&").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g," ").replace(/<[^>]*>/g,"").trim();
}
function countryName(slug) {
  const map = {azerbaijan:"Azərbaycan",england:"İngiltərə",spain:"İspaniya",germany:"Almaniya",italy:"İtaliya",france:"Fransa",turkey:"Türkiyə",netherlands:"Niderland",portugal:"Portuqaliya",brazil:"Braziliya",europe:"Avropa",world:"Dünya",usa:"ABŞ"};
  return map[slug] || slug.split("-").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ");
}
async function getCatalog() {
  const old=cache.get("__catalog");
  if (old && Date.now()-old.time<6*60*60*1000) return old.data;
  const found = new Map(SEEDS.map(([id,name,country,type])=>[id,{id,slug:id,name,country,type,season:new Date().getFullYear()}]));
  // The provider's own competitions directory is the source for the full available catalogue.
  try {
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),12000);
    let html;
    try {
      const r=await fetch(`${BASE}/football/competitions/`,{headers:{Accept:"text/html"},signal:controller.signal});
      if(!r.ok) throw new Error(`Kataloq HTTP ${r.status}`);
      html=await r.text();
    } finally { clearTimeout(timer); }
    const re=/<a\b[^>]*href=["']\/football\/competition\/([^/"']+)\/([^/"']+)\/([^/"']+)\/?["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while((m=re.exec(html))) {
      const [,countrySlug,leagueSlug,providerId,label]=m;
      const name=clean(label);
      if(!name || name.length>100 || /^(image|flag)$/i.test(name)) continue;
      const id=leagueSlug || providerId;
      found.set(id,{id,slug:id,name,country:countryName(countrySlug),type:/cup|copa|trophy/i.test(name)?"Cup":"League",season:new Date().getFullYear()});
    }
  } catch(e) {
    // Keep a useful, clearly labelled starter catalogue if the directory is temporarily unavailable.
    console.warn("SportScore competitions directory unavailable:",e.message);
  }
  const leagues=[...found.values()].sort((a,b)=>{
    const azA=/Azərbaycan/.test(a.country)?0:1, azB=/Azərbaycan/.test(b.country)?0:1;
    return azA-azB || a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
  });
  cache.set("__catalog",{time:Date.now(),data:leagues});
  return leagues;
}
function str(v) {
  if (typeof v==="string" || typeof v==="number") return String(v);
  if (v && typeof v==="object") return String(v.name || v.title || v.short_name || "");
  return "";
}
function normalizeMatch(m, league) {
  const statusRaw=str(m.status || m.state || m.match_status || "NS").toLowerCase();
  const live=/live|in.?progress|1h|2h|half.?time|extra.?time|ht/.test(statusRaw);
  const done=/finished|full.?time|(^|[^a-z])ft([^a-z]|$)|ended|complete/.test(statusRaw);
  const date=m.time || m.date || m.kickoff || m.start_time || new Date().toISOString();
  const home=m.home || m.home_team || m.homeTeam || {};
  const away=m.away || m.away_team || m.awayTeam || {};
  const score=(v)=>v===null||v===undefined||v===""?null:Number.isFinite(Number(v))?Number(v):null;
  return {
    fixture:{id:String(m.id || m.slug || `${league.id}-${date}-${str(home)}-${str(away)}`),date,
      status:{short:live?"LIVE":done?"FT":"NS",long:str(m.status_text)||str(m.status)||"Status məlum deyil",elapsed:m.minute||m.elapsed||null}},
    league:{id:league.id,name:league.name,country:league.country,logo:"",round:m.round||""},
    teams:{home:{name:str(home)||str(m.home_name)||"Ev sahibi",logo:home.logo||""},away:{name:str(away)||str(m.away_name)||"Qonaq",logo:away.logo||""}},
    goals:{home:score(m.home_score ?? m.homeScore),away:score(m.away_score ?? m.awayScore)}
  };
}
function arrays(payload) {
  if(Array.isArray(payload?.matches)) return payload.matches;
  if(Array.isArray(payload?.data?.matches)) return payload.data.matches;
  if(Array.isArray(payload?.data)) return payload.data;
  return [];
}
function standingsRows(payload) {
  let rows=payload?.standings || payload?.table || payload?.rows || payload?.data?.standings || [];
  if(rows && !Array.isArray(rows) && Array.isArray(rows.table)) rows=rows.table;
  if(Array.isArray(rows) && rows.length===1 && Array.isArray(rows[0])) rows=rows[0];
  return (Array.isArray(rows)?rows:[]).map((r,i)=>({
    rank:r.rank??r.position??r.place??i+1,
    team:str(r.team||r.club||r.name||r.participant)||"Komanda",
    played:r.played??r.matches??r.played_matches??r.all?.played??"—",
    win:r.win??r.wins??r.all?.win??"—",
    draw:r.draw??r.draws??r.all?.draw??"—",
    lose:r.lose??r.losses??r.all?.lose??"—",
    goal_difference:r.goal_difference??r.goalDifference??r.goals_diff??r.goalsDiff??"—",
    points:r.points??r.pts??"—"
  }));
}
module.exports = async (req,res) => {
  if(req.method==="OPTIONS") return send(res,204,{});
  if(req.method!=="GET") return send(res,405,{error:"Yalnız GET sorğuları dəstəklənir."});
  const {action,leagueId,date,live}=req.query||{};
  try {
    if(action==="leagues") {
      const leagues=await getCatalog();
      return send(res,200,{leagues,count:leagues.length,provider:"SportScore"},3600);
    }
    if(action==="fixtures") {
      if(!leagueId) return send(res,400,{error:"Liqa identifikatoru tələb olunur."});
      // Official documented endpoint: live + recent matches. Do not call the undocumented /api/v1/fixtures route.
      const payload=await getJson("/api/widget/matches/",{sport:"football",limit:50,src:"nexora"});
      const league=(await getCatalog()).find(x=>x.id===String(leagueId)) || {id:String(leagueId),name:String(req.query.leagueName||leagueId),country:String(req.query.country||"")};
      const target=league.name.toLocaleLowerCase();
      let matches=arrays(payload).filter(m=>{
        const competition=str(m.competition||m.league||m.tournament).toLocaleLowerCase();
        return competition===target || competition.includes(target) || target.includes(competition);
      }).map(m=>normalizeMatch(m,league));
      if(live==="all") matches=matches.filter(m=>m.fixture.status.short==="LIVE");
      else if(date) matches=matches.filter(m=>String(m.fixture.date).slice(0,10)===String(date));
      return send(res,200,{matches,count:matches.length,provider:"SportScore",scope:"provider recent/live feed"},45);
    }
    if(action==="standings") {
      if(!leagueId) return send(res,400,{error:"Liqa identifikatoru tələb olunur."});
      const payload=await getJson("/api/widget/standings/",{sport:"football",slug:String(leagueId),src:"nexora"});
      return send(res,200,{standings:standingsRows(payload),provider:"SportScore"},300);
    }
    return send(res,400,{error:"action leagues, fixtures və ya standings olmalıdır."});
  } catch(error) {
    console.error("NEXORA SportScore API:",error);
    return send(res,502,{error:error.name==="AbortError"?"SportScore cavabı gecikdi. Yenidən yoxlayın.":(error.message||"Futbol məlumatlarına qoşulmaq mümkün olmadı.")},20);
  }
};
