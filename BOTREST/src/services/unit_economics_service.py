
# src/services/unit_economics_service.py
from __future__ import annotations

from calendar import monthrange
from dataclasses import dataclass
from datetime import datetime, timedelta
from math import isfinite
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.booking import Booking
from src.models.business_settings import BusinessSettings
from src.api.schemas import (
    UnitEconomicsReport,
    UnitEconomicsSettings,
    UnitEconomicsSensitivity,
    UnitEconomicsPeriodRow,
)


SETTINGS_NAME = "unit_economics"

DEFAULT_SETTINGS = UnitEconomicsSettings()


def _percent(value: float) -> float:
    if value is None or not isfinite(float(value)):
        return 0.0
    return max(0.0, min(float(value), 100.0)) / 100.0


def _number(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return float(default)
        num = float(value)
        if not isfinite(num):
            return float(default)
        return num
    except Exception:
        return float(default)


def _int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return int(default)
        return int(float(value))
    except Exception:
        return int(default)


def _clamp_percent(value: Any, default: float) -> float:
    num = _number(value, default)
    return max(0.0, min(num, 100.0))


def _clamp_non_negative(value: Any, default: float = 0.0) -> float:
    return max(0.0, _number(value, default))


def _month_label(dt: datetime) -> str:
    months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
    return f"{months[dt.month - 1]} {dt.year}"


def _normalize_payload(payload: dict[str, Any] | None) -> UnitEconomicsSettings:
    payload = payload or {}
    defaults = DEFAULT_SETTINGS.model_dump()
    data = {**defaults, **payload}
    return UnitEconomicsSettings(
        average_check=_clamp_non_negative(data.get("average_check"), defaults["average_check"]),
        average_guests_per_booking=max(0.1, _number(data.get("average_guests_per_booking"), defaults["average_guests_per_booking"])),
        bookings_per_day=max(0.0, _number(data.get("bookings_per_day"), defaults["bookings_per_day"])),
        occupancy_rate_percent=_clamp_percent(data.get("occupancy_rate_percent"), defaults["occupancy_rate_percent"]),
        no_show_rate_percent=_clamp_percent(data.get("no_show_rate_percent"), defaults["no_show_rate_percent"]),
        days_open_per_month=max(1, _int(data.get("days_open_per_month"), defaults["days_open_per_month"])),
        tax_rate_percent=_clamp_percent(data.get("tax_rate_percent"), defaults["tax_rate_percent"]),
        payroll_tax_percent=_clamp_percent(data.get("payroll_tax_percent"), defaults["payroll_tax_percent"]),
        rent_monthly=_clamp_non_negative(data.get("rent_monthly"), defaults["rent_monthly"]),
        electricity_monthly=_clamp_non_negative(data.get("electricity_monthly"), defaults["electricity_monthly"]),
        water_monthly=_clamp_non_negative(data.get("water_monthly"), defaults["water_monthly"]),
        salaries_monthly=_clamp_non_negative(data.get("salaries_monthly"), defaults["salaries_monthly"]),
        marketing_monthly=_clamp_non_negative(data.get("marketing_monthly"), defaults["marketing_monthly"]),
        delivery_monthly=_clamp_non_negative(data.get("delivery_monthly"), defaults["delivery_monthly"]),
        other_fixed_monthly=_clamp_non_negative(data.get("other_fixed_monthly"), defaults["other_fixed_monthly"]),
        food_cost_percent=_clamp_percent(data.get("food_cost_percent"), defaults["food_cost_percent"]),
        acquiring_percent=_clamp_percent(data.get("acquiring_percent"), defaults["acquiring_percent"]),
        packaging_cost_per_guest=_clamp_non_negative(data.get("packaging_cost_per_guest"), defaults["packaging_cost_per_guest"]),
        other_variable_percent=_clamp_percent(data.get("other_variable_percent"), defaults["other_variable_percent"]),
    )


class UnitEconomicsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_settings(self) -> UnitEconomicsSettings:
        stmt = select(BusinessSettings).where(BusinessSettings.name == SETTINGS_NAME)
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        return _normalize_payload(row.value if row else None)

    async def update_settings(self, payload: dict[str, Any]) -> UnitEconomicsSettings:
        settings = _normalize_payload(payload)
        stmt = select(BusinessSettings).where(BusinessSettings.name == SETTINGS_NAME)
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        if row:
            row.value = settings.model_dump()
        else:
            row = BusinessSettings(name=SETTINGS_NAME, value=settings.model_dump())
            self.session.add(row)
        await self.session.commit()
        return settings

    async def build_report(self, months: int = 6) -> UnitEconomicsReport:
        settings = await self.get_settings()
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        lookback_start = now - timedelta(days=30)

        today_bookings = await self._fetch_bookings(today_start, tomorrow_start)
        month_bookings = await self._fetch_bookings(month_start, now + timedelta(days=1))
        period_bookings = await self._fetch_bookings(lookback_start, now + timedelta(days=1))

        today_guests = sum(b.guests_count or 0 for b in today_bookings)
        today_total = len(today_bookings)
        today_no_shows = sum(1 for b in today_bookings if b.status == "no_show")
        today_no_show_rate = (today_no_shows / today_total * 100.0) if today_total else settings.no_show_rate_percent

        avg_check = settings.average_check
        show_rate = max(0.0, 1.0 - settings.no_show_rate_percent / 100.0)
        occupancy = max(0.0, min(settings.occupancy_rate_percent / 100.0, 1.0))

        forecast_bookings_per_month = settings.bookings_per_day * settings.days_open_per_month * occupancy
        forecast_guests_per_month = forecast_bookings_per_month * settings.average_guests_per_booking * show_rate
        forecast_revenue_per_month = forecast_guests_per_month * avg_check

        fixed_costs = (
            settings.rent_monthly
            + settings.electricity_monthly
            + settings.water_monthly
            + settings.salaries_monthly
            + settings.marketing_monthly
            + settings.delivery_monthly
            + settings.other_fixed_monthly
            + (settings.salaries_monthly * settings.payroll_tax_percent / 100.0)
        )

        variable_food = forecast_revenue_per_month * (settings.food_cost_percent / 100.0)
        variable_packaging = forecast_guests_per_month * settings.packaging_cost_per_guest
        variable_acquiring = forecast_revenue_per_month * (settings.acquiring_percent / 100.0)
        variable_other = forecast_revenue_per_month * (settings.other_variable_percent / 100.0)
        variable_costs = variable_food + variable_packaging + variable_acquiring + variable_other
        gross_profit = forecast_revenue_per_month - variable_food - variable_packaging
        operating_profit = gross_profit - (fixed_costs + variable_acquiring + variable_other)
        tax = max(0.0, operating_profit) * (settings.tax_rate_percent / 100.0)
        net_profit = operating_profit - tax

        fixed_cost_share = (fixed_costs / forecast_revenue_per_month * 100.0) if forecast_revenue_per_month else 0.0
        variable_cost_share = (variable_costs / forecast_revenue_per_month * 100.0) if forecast_revenue_per_month else 0.0

        contribution_per_guest = avg_check - (
            avg_check * (settings.food_cost_percent / 100.0)
            + avg_check * (settings.acquiring_percent / 100.0)
            + avg_check * (settings.other_variable_percent / 100.0)
            + settings.packaging_cost_per_guest
        )
        break_even_guests = fixed_costs / contribution_per_guest if contribution_per_guest > 0 else 0.0
        break_even_revenue = break_even_guests * avg_check if break_even_guests else 0.0

        no_show_lost_guests = settings.bookings_per_day * settings.days_open_per_month * occupancy * settings.average_guests_per_booking * (settings.no_show_rate_percent / 100.0)
        no_show_lost_revenue = no_show_lost_guests * avg_check
        no_show_lost_profit = no_show_lost_revenue * max(0.0, 1.0 - (settings.food_cost_percent + settings.acquiring_percent + settings.other_variable_percent) / 100.0)

        profit_per_guest = net_profit / forecast_guests_per_month if forecast_guests_per_month else 0.0
        profit_per_booking = net_profit / forecast_bookings_per_month if forecast_bookings_per_month else 0.0

        sensitivity = UnitEconomicsSensitivity(
            average_check_plus_10=self._scenario_profit(settings, avg_check * 1.1),
            average_check_minus_10=self._scenario_profit(settings, avg_check * 0.9),
            no_show_zero=self._scenario_profit(settings, avg_check, no_show_rate_percent=0.0),
            occupancy_plus_10=self._scenario_profit(settings, avg_check, occupancy_rate_percent=min(100.0, settings.occupancy_rate_percent + 10.0)),
        )

        weekly_series = self._build_weekly_series(period_bookings, now)
        monthly_forecast = self._build_monthly_forecast(settings, months)

        formula_notes = [
            "Выручка = брони × среднее число гостей × (1 − no-show) × средний чек",
            "Валовая прибыль = выручка − food cost − упаковка",
            "Операционная прибыль = валовая прибыль − фиксированные расходы − переменные OPEX",
            "Чистая прибыль = операционная прибыль − налог",
            "Break-even — это выручка, при которой contribution margin покрывает фиксированные расходы",
        ]

        return UnitEconomicsReport(
            settings=settings,
            today_bookings=today_total,
            today_guests=today_guests,
            today_no_show_rate=today_no_show_rate,
            today_revenue_estimate=today_guests * avg_check * max(0.0, 1.0 - settings.no_show_rate_percent / 100.0),
            average_check=avg_check,
            bookings_per_day=settings.bookings_per_day,
            forecast_bookings_per_month=forecast_bookings_per_month,
            forecast_guests_per_month=forecast_guests_per_month,
            forecast_revenue_per_month=forecast_revenue_per_month,
            forecast_gross_profit_per_month=gross_profit,
            forecast_operating_profit_per_month=operating_profit,
            forecast_net_profit_per_month=net_profit,
            fixed_costs_per_month=fixed_costs,
            variable_costs_per_month=variable_costs,
            fixed_cost_share=fixed_cost_share,
            variable_cost_share=variable_cost_share,
            profit_per_guest=profit_per_guest,
            profit_per_booking=profit_per_booking,
            break_even_revenue=break_even_revenue,
            break_even_guests=break_even_guests,
            no_show_lost_revenue=no_show_lost_revenue,
            no_show_lost_profit=no_show_lost_profit,
            occupancy_rate_effective=settings.occupancy_rate_percent,
            sensitivities=sensitivity,
            weekly_series=weekly_series,
            monthly_forecast=monthly_forecast,
            formula_notes=formula_notes,
        )

    async def _fetch_bookings(self, start_at: datetime, end_at: datetime) -> list[Booking]:
        stmt = select(Booking).where(Booking.start_at >= start_at, Booking.start_at < end_at)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    def _build_weekly_series(self, bookings: Iterable[Booking], now: datetime) -> list[dict]:
        weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        start = now - timedelta(days=6)
        buckets: dict[str, dict[str, float]] = {}
        for i in range(7):
            day = (start + timedelta(days=i)).date()
            buckets[str(day)] = {"day": weekdays[day.weekday()], "reservations": 0, "guests": 0}
        for booking in bookings:
            key = str(booking.start_at.date())
            if key in buckets:
                buckets[key]["reservations"] += 1
                buckets[key]["guests"] += booking.guests_count or 0
        return [buckets[k] for k in sorted(buckets.keys())]

    def _scenario_profit(self, settings: UnitEconomicsSettings, scenario_check: float, no_show_rate_percent: float | None = None, occupancy_rate_percent: float | None = None) -> float:
        no_show = settings.no_show_rate_percent if no_show_rate_percent is None else no_show_rate_percent
        occupancy = settings.occupancy_rate_percent if occupancy_rate_percent is None else occupancy_rate_percent
        show_rate = max(0.0, 1.0 - no_show / 100.0)
        occupancy_factor = max(0.0, min(occupancy / 100.0, 1.0))
        bookings = settings.bookings_per_day * settings.days_open_per_month * occupancy_factor
        guests = bookings * settings.average_guests_per_booking * show_rate
        revenue = guests * scenario_check
        fixed_costs = (
            settings.rent_monthly
            + settings.electricity_monthly
            + settings.water_monthly
            + settings.salaries_monthly
            + settings.marketing_monthly
            + settings.delivery_monthly
            + settings.other_fixed_monthly
            + (settings.salaries_monthly * settings.payroll_tax_percent / 100.0)
        )
        variable_food = revenue * (settings.food_cost_percent / 100.0)
        variable_packaging = guests * settings.packaging_cost_per_guest
        variable_acquiring = revenue * (settings.acquiring_percent / 100.0)
        variable_other = revenue * (settings.other_variable_percent / 100.0)
        gross_profit = revenue - variable_food - variable_packaging
        operating_profit = gross_profit - (fixed_costs + variable_acquiring + variable_other)
        tax = max(0.0, operating_profit) * (settings.tax_rate_percent / 100.0)
        return operating_profit - tax

    def _build_monthly_forecast(self, settings: UnitEconomicsSettings, months: int) -> list[UnitEconomicsPeriodRow]:
        months = max(1, min(int(months), 12))
        now = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        rows: list[UnitEconomicsPeriodRow] = []
        for offset in range(months):
            year = now.year + (now.month - 1 + offset) // 12
            month = ((now.month - 1 + offset) % 12) + 1
            dt = now.replace(year=year, month=month)
            days = monthrange(year, month)[1]
            occupancy = max(0.0, min(settings.occupancy_rate_percent / 100.0, 1.0))
            show_rate = max(0.0, 1.0 - settings.no_show_rate_percent / 100.0)
            bookings = settings.bookings_per_day * min(days, settings.days_open_per_month) * occupancy
            guests = bookings * settings.average_guests_per_booking * show_rate
            revenue = guests * settings.average_check
            fixed_costs = (
                settings.rent_monthly
                + settings.electricity_monthly
                + settings.water_monthly
                + settings.salaries_monthly
                + settings.marketing_monthly
                + settings.delivery_monthly
                + settings.other_fixed_monthly
                + (settings.salaries_monthly * settings.payroll_tax_percent / 100.0)
            )
            variable_food = revenue * (settings.food_cost_percent / 100.0)
            variable_packaging = guests * settings.packaging_cost_per_guest
            variable_acquiring = revenue * (settings.acquiring_percent / 100.0)
            variable_other = revenue * (settings.other_variable_percent / 100.0)
            gross_profit = revenue - variable_food - variable_packaging
            operating_profit = gross_profit - (fixed_costs + variable_acquiring + variable_other)
            tax = max(0.0, operating_profit) * (settings.tax_rate_percent / 100.0)
            net_profit = operating_profit - tax
            rows.append(UnitEconomicsPeriodRow(
                month=_month_label(dt),
                bookings=round(bookings, 2),
                guests=round(guests, 2),
                revenue=round(revenue, 2),
                gross_profit=round(gross_profit, 2),
                operating_profit=round(operating_profit, 2),
                net_profit=round(net_profit, 2),
            ))
        return rows
