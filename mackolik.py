from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from zoneinfo import ZoneInfo
import json, re, html
from curl_cffi import requests

HEADERS = {
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Referer": "https://arsiv.mackolik.com/Canli-Sonuclar",
}

def _date(value=""):
    if not value:
        try:
            value = datetime.now(ZoneInfo("Europe/Istanbul")).strftime("%d/%m/%Y")
        except Exception:
            value = datetime.utcnow().strftime("%d/%m/%Y")
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", value)
    if m:
        return f"{m.group(3)}/{m.group(2)}/{m.group(1)}"
    if re.fullmatch(r"\d{2}/\d{2}/\d{4}", value):
        return value
    raise ValueError("Tarix YYYY-MM-DD və ya DD/MM/YYYY formatında olmalıdır")

def _fetch(url):
    response = requests.get(url, impersonate="chrome120", headers=HEADERS, timeout=25)
    if response.status_code == 403:
        raise RuntimeError("Maçkolik sorğunu rədd etdi (HTTP 403). Bir az sonra yenidən yoxlayın.")
    if response.status_code == 429:
        raise RuntimeError("Maçkolik sorğuları məhdudlaşdırdı (HTTP 429). Bir az sonra yenidən yoxlayın.")
    response.raise_for_status()
    return response.text

def _parse_matches(text):
    data = json.loads(text)
    parsed = []
    for row in data.get("m") or []:
        if not isinstance(row, list) or len(row) <= 36:
            continue
        group = row[36] if isinstance(row[36], list) else []
        detail = row[15] if len(row) > 15 and isinstance(row[15], dict) else {}
        score = re.fullmatch(r"(\d+)-(\d+)", str(row[7] or "").strip())
        code = int(row[5] or 0)
        status_text = str(row[6] or "").strip()
        if status_text == "MS" or code in (4, 13):
            status = "finished"
        elif code in (0, 12):
            status = "upcoming"
        elif code in (1, 3, 5, 14, 15, 16, 17, 18, 19, 20) or status_text in ("IY", "UZ") or status_text.endswith("'"):
            status = "live"
        else:
            status = "other"
        home_goals = int(score.group(1)) if score else None
        away_goals = int(score.group(2)) if score else None
        if status in ("live", "finished") and not row[7]:
            home_goals = away_goals = 0
        parsed.append({
            "match_id": str(row[0]), "home_team": str(row[2] or ""), "away_team": str(row[4] or ""),
            "league": str(group[3] if len(group) > 3 else "Digər liqalar"),
            "country": str(group[1] if len(group) > 1 else "Beynəlxalq"),
            "season": str(group[5] if len(group) > 5 else ""),
            "date": str(row[35] if len(row) > 35 else ""), "time": str(row[16] if len(row) > 16 else ""),
            "status": status, "status_text": status_text,
            "home_goals": home_goals, "away_goals": away_goals,
            "half_time_home": detail.get("h1"), "half_time_away": detail.get("h2"),
            "sport": "basketball" if str(row[37] if len(row) > 37 else "1") == "2" else "football",
        })
    return parsed

def _standings(code):
    raw = _fetch(f"https://arsiv.mackolik.com/Home/StandingHandler.aspx?league={code}")
    table_match = re.search(r'<table[^>]*id=["\']tblLightStanding["\'][\s\S]*?</table>', raw, re.I)
    source = table_match.group(0) if table_match else raw
    def clean(value):
        value = re.sub(r"<[^>]*>", " ", value)
        value = html.unescape(value)
        return re.sub(r"\s+", " ", value).strip()
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", source, re.I | re.S):
        cells = [clean(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.I | re.S)]
        if len(cells) != 5 or not cells[0].isdigit():
            continue
        try:
            rows.append({"rank": int(cells[0]), "team": cells[1], "played": int(cells[2]), "points": int(cells[3]), "goal_difference": int(cells[4])})
        except ValueError:
            continue
    return rows

class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Accept, Content-Type")
        self.send_header("Cache-Control", "s-maxage=20, stale-while-revalidate=60")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        try:
            q = parse_qs(urlparse(self.path).query)
            action = (q.get("action") or [""])[0]
            if action == "leagues":
                date = _date()
                raw = _fetch(f"https://vd.mackolik.com/livedata?date={date.replace('/', '%2F')}")
                matches = [m for m in _parse_matches(raw) if m["sport"] == "football"]
                unique = {}
                for m in matches:
                    key = f'{m["country"]}::{m["league"]}'
                    unique[key] = {"id": key, "country": m["country"], "name": m["league"]}
                leagues = sorted(unique.values(), key=lambda x: (x["country"].casefold(), x["name"].casefold()))
                return self._send(200, {"date": date, "leagues": leagues, "note": "Liqalar cari günün oyun feed-indən çıxarılıb."})
            if action == "matches":
                league_id = (q.get("leagueId") or [""])[0]
                if not league_id or len(league_id) > 250 or "::" not in league_id:
                    return self._send(400, {"error": "Yanlış liqa identifikatoru"})
                date = _date((q.get("date") or [""])[0])
                raw = _fetch(f"https://vd.mackolik.com/livedata?date={date.replace('/', '%2F')}")
                wanted_country, wanted_league = league_id.split("::", 1)
                matches = [m for m in _parse_matches(raw) if m["sport"] == "football" and m["country"] == wanted_country and m["league"] == wanted_league]
                return self._send(200, {"date": date, "matches": matches})
            if action == "standings":
                country = (q.get("country") or [""])[0]
                league = (q.get("leagueName") or [""])[0]
                combined = f"{country} {league}".casefold()
                code = None
                if ("türkiye" in combined or "turkey" in combined) and ("süper lig" in combined or "super lig" in combined): code = "Tur"
                elif "ingiltere" in combined or "england" in combined or "premier lig" in combined: code = "Eng"
                elif "ispanya" in combined or "spain" in combined or "la liga" in combined: code = "Esp"
                elif "italya" in combined or "italy" in combined or "serie a" in combined: code = "Ita"
                elif "almanya" in combined or "germany" in combined or "bundesliga" in combined: code = "Ger"
                if not code:
                    return self._send(200, {"standings": [], "supported": False, "message": "Maçkolik bu liqa üçün turnir cədvəli təqdim etmir."})
                return self._send(200, {"standings": _standings(code), "supported": True})
            return self._send(400, {"error": "action leagues, matches və ya standings olmalıdır"})
        except Exception as exc:
            print("Mackolik API error:", repr(exc))
            return self._send(502, {"error": str(exc) or "Maçkolik serverindən cavab alınmadı"})
