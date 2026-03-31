"""
CPBL 中華職棒賽程爬蟲
使用 CPBL 官網內部 API: POST /schedule/getgamedatas
需要先取得 ASP.NET Anti-Forgery Token（cookie + form token 組合）
"""

import re
import json
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Optional
from models import Game, TeamId

TEAM_NAME_MAP: dict[str, TeamId] = {
    '中信兄弟': 'brothers',
    '統一7-ELEVEn獅': 'lions',
    '統一7-Eleven獅': 'lions',
    '統一獅': 'lions',
    '樂天桃猿': 'monkeys',
    '富邦悍將': 'guardians',
    '味全龍': 'dragons',
    '台鋼雄鷹': 'eagles',
}

BASE_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept-Language': 'zh-TW,zh;q=0.9',
    'Referer': 'https://www.cpbl.com.tw/schedule',
}

BASE_URL = 'https://www.cpbl.com.tw'


def normalize_team(name: str) -> Optional[TeamId]:
    name = name.strip()
    for key, val in TEAM_NAME_MAP.items():
        if key in name:
            return val
    return None


async def _get_csrf_token(client: httpx.AsyncClient, year: int) -> str:
    """取得 ASP.NET Anti-Forgery Token（cookie:form 格式）"""
    resp = await client.get(
        f'{BASE_URL}/schedule',
        params={'year': year, 'month': 1, 'kindCode': 'A'},
        headers=BASE_HEADERS,
    )
    cookie_token = client.cookies.get('__RequestVerificationToken', '')
    form_match = re.search(
        r'name=["\']__RequestVerificationToken["\'][^>]*value=["\'](.*?)["\']',
        resp.text,
    )
    form_token = form_match.group(1) if form_match else ''
    return f'{cookie_token}:{form_token}'


async def scrape_schedule(year: int, month: int) -> list[Game]:
    """
    爬取指定年月的賽程（使用 CPBL 內部 JSON API）
    注意：API 以整年為單位回傳，再自行篩選月份
    """
    async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
        try:
            token = await _get_csrf_token(client, year)
        except Exception as e:
            print(f'[Scraper] 取得 Token 失敗: {e}')
            return []

        post_headers = {
            **BASE_HEADERS,
            'RequestVerificationToken': token,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
        data = {
            'calendar': f'{year}/01/01',
            'location': '',
            'kindCode': 'A',
        }

        try:
            resp = await client.post(
                f'{BASE_URL}/schedule/getgamedatas',
                headers=post_headers,
                data=data,
            )
            resp.raise_for_status()
            result = resp.json()
        except Exception as e:
            print(f'[Scraper] API 呼叫失敗: {e}')
            return []

    if not result.get('Success'):
        print(f'[Scraper] API 回傳失敗: {result}')
        return []

    all_games: list[dict] = json.loads(result['GameDatas'])

    # 篩選指定月份
    games: list[Game] = []
    for g in all_games:
        try:
            game_dt = datetime.fromisoformat(g['GameDate'])
        except (ValueError, TypeError):
            continue

        if game_dt.year != year or game_dt.month != month:
            continue

        away_id = normalize_team(g.get('VisitingTeamName', ''))
        home_id = normalize_team(g.get('HomeTeamName', ''))

        if not away_id or not home_id:
            print(f'[Scraper] 無法識別球隊: {g.get("VisitingTeamName")} vs {g.get("HomeTeamName")}')
            continue

        # 比分：有 GameResult 且分數不為 0/0 才視為完賽
        game_result = g.get('GameResult', '')
        away_score_raw = g.get('VisitingScore')
        home_score_raw = g.get('HomeScore')
        is_final = bool(game_result) or (
            away_score_raw is not None
            and home_score_raw is not None
            and (away_score_raw != 0 or home_score_raw != 0)
        )

        away_score = int(away_score_raw) if is_final and away_score_raw is not None else None
        home_score = int(home_score_raw) if is_final and home_score_raw is not None else None

        # 時間
        time_str = '18:00'
        try:
            start_dt = datetime.fromisoformat(g['GameDateTimeS'])
            time_str = start_dt.strftime('%H:%M')
        except (ValueError, TypeError, KeyError):
            pass

        date_str = game_dt.strftime('%Y-%m-%d')
        game_sno = g.get('GameSno', len(games))
        game_id = f'{date_str}_{away_id}_{home_id}_{game_sno}'

        games.append(Game(
            id=game_id,
            date=date_str,
            time=time_str,
            homeTeam=home_id,
            awayTeam=away_id,
            stadium=g.get('FieldAbbe', '待確認'),
            homeScore=home_score,
            awayScore=away_score,
            status='final' if is_final else 'scheduled',  # type: ignore
        ))

    print(f'[Scraper] {year}/{month} 共找到 {len(games)} 場比賽')
    return games


async def scrape_game_detail(game_id: str) -> Optional[Game]:
    """爬取單場比賽詳細資訊"""
    parts = game_id.split('_')
    if len(parts) < 3:
        return None
    try:
        dt = datetime.strptime(parts[0], '%Y-%m-%d')
    except ValueError:
        return None

    games = await scrape_schedule(dt.year, dt.month)
    return next((g for g in games if g.id == game_id), None)
