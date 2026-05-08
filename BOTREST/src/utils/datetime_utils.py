# src/utils/datetime_utils.py
from datetime import datetime, date, time, timedelta
from typing import List

def get_next_n_days(n: int) -> List[date]:
    start = date.today()
    return [start + timedelta(days=i) for i in range(n)]

def generate_time_slots(day: date, start_h: int, end_h: int, interval_min: int) -> List[str]:
    slots = []
    current = datetime.combine(day, time(start_h, 0))
    end = datetime.combine(day, time(end_h, 0))
    
    while current < end:
        # Не предлагаем время в прошлом для сегодняшнего дня
        if datetime.now() < current:
            slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=interval_min)
    return slots
