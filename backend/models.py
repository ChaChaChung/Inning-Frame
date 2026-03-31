from typing import Literal, Optional
from pydantic import BaseModel

TeamId = Literal['brothers', 'lions', 'monkeys', 'guardians', 'dragons', 'eagles']
GameStatus = Literal['scheduled', 'live', 'final', 'postponed']


class Game(BaseModel):
    id: str
    date: str          # "YYYY-MM-DD"
    time: str          # "HH:MM"
    homeTeam: TeamId
    awayTeam: TeamId
    stadium: str
    homeScore: Optional[int] = None
    awayScore: Optional[int] = None
    status: GameStatus = 'scheduled'
