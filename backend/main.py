"""
定格九局 - Inning Frame
後端 API 服務
部署目標: Google Cloud Run
"""

import os
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from models import Game
from scraper import scrape_schedule, scrape_game_detail

# 記憶體快取 {year_month: games}
_cache: dict[str, list[Game]] = {}
_scheduler = AsyncIOScheduler()


async def refresh_current_month():
    """每天凌晨 3 點自動更新當前月份賽程"""
    now = datetime.now()
    key = f'{now.year}_{now.month}'
    print(f'[Scheduler] 更新賽程快取: {key}')
    games = await scrape_schedule(now.year, now.month)
    _cache[key] = games


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動時預載當月賽程
    now = datetime.now()
    key = f'{now.year}_{now.month}'
    _cache[key] = await scrape_schedule(now.year, now.month)

    # 設定定時任務
    _scheduler.add_job(refresh_current_month, 'cron', hour=3, minute=0)
    _scheduler.start()
    yield
    _scheduler.shutdown()


app = FastAPI(
    title='定格九局 API',
    description='中華職棒賽程 API',
    version='1.0.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # 生產環境請限縮 origins
    allow_methods=['GET'],
    allow_headers=['*'],
)


@app.get('/health')
async def health():
    return {'status': 'ok', 'timestamp': datetime.now().isoformat()}


@app.get('/schedule', response_model=list[Game])
async def get_schedule(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    force_refresh: bool = Query(False),
):
    """
    取得指定年月的賽程
    - 優先從快取回傳
    - force_refresh=true 強制重新爬取
    """
    key = f'{year}_{month}'

    if force_refresh or key not in _cache:
        games = await scrape_schedule(year, month)
        _cache[key] = games

    return _cache.get(key, [])


@app.get('/game/{game_id}', response_model=Game)
async def get_game(game_id: str):
    """取得單場比賽詳細資訊"""
    # 先從快取找
    for games in _cache.values():
        for g in games:
            if g.id == game_id:
                return g

    # 快取找不到，重新爬取
    game = await scrape_game_detail(game_id)
    if not game:
        raise HTTPException(status_code=404, detail='找不到此場比賽')
    return game


@app.get('/teams')
async def get_teams():
    """回傳所有球隊基本資訊"""
    return [
        {'id': 'brothers', 'name': '中信兄弟', 'shortName': '兄弟', 'emoji': '🐘'},
        {'id': 'lions', 'name': '統一7-ELEVEn獅', 'shortName': '統一獅', 'emoji': '🦁'},
        {'id': 'monkeys', 'name': '樂天桃猿', 'shortName': '桃猿', 'emoji': '🐒'},
        {'id': 'guardians', 'name': '富邦悍將', 'shortName': '悍將', 'emoji': '🛡️'},
        {'id': 'dragons', 'name': '味全龍', 'shortName': '味全龍', 'emoji': '🐉'},
        {'id': 'eagles', 'name': '台鋼雄鷹', 'shortName': '雄鷹', 'emoji': '🦅'},
    ]


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('main:app', host='0.0.0.0', port=port, reload=True)
