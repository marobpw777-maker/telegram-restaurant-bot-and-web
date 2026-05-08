# src/api/schemas.py
from datetime import datetime
from typing import Optional, List
from pydantic import ConfigDict, BaseModel, Field

# --- CRM / User ---
class UserCRM(BaseModel):
    no_show_count: int = 0
    is_banned: bool = False
    visits_count: int = 0
    total_spent: float = 0.0

# --- Бронирования ---
class BookingBase(BaseModel):
    customer_name: str
    phone: str
    guests_count: int = Field(..., ge=1, le=20)
    start_at: datetime
    duration_minutes: int = 90
    notes: Optional[str] = ""

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    admin_comment: Optional[str] = None
    spent_amount: Optional[float] = 0.0
    attended: Optional[bool] = None

class BookingRead(BookingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    telegram_id: Optional[int] = None
    status: str
    attended: bool
    source: str
    admin_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    crm: UserCRM

# --- Категории ---
class CategoryBase(BaseModel):
    name: str
    type: str = "food"
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryRead(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

# --- Меню ---
class MenuItemBase(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    weight: Optional[str] = None
    composition: Optional[str] = None
    allergens: Optional[str] = None
    spice_level: int = 0
    is_available: bool = True
    is_hit: bool = False
    is_new: bool = False
    image_url: Optional[str] = None
    
    # Винные поля
    vintage: Optional[str] = None
    region: Optional[str] = None
    grape_variety: Optional[str] = None
    wine_type: Optional[str] = None
    food_pairing: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    is_hit: Optional[bool] = None
    is_new: Optional[bool] = None

class MenuItemRead(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryRead] = None

# --- Маркетинг ---
class BroadcastRequest(BaseModel):
    text: str


# --- Unit Economics / Settings ---
class UnitEconomicsSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    average_check: float = 2850.0
    average_guests_per_booking: float = 3.2
    bookings_per_day: float = 12.0
    occupancy_rate_percent: float = 70.0
    no_show_rate_percent: float = 8.0
    days_open_per_month: int = 30

    tax_rate_percent: float = 20.0
    payroll_tax_percent: float = 30.0

    rent_monthly: float = 350000.0
    electricity_monthly: float = 55000.0
    water_monthly: float = 12000.0
    salaries_monthly: float = 900000.0
    marketing_monthly: float = 60000.0
    delivery_monthly: float = 0.0
    other_fixed_monthly: float = 40000.0

    food_cost_percent: float = 32.0
    acquiring_percent: float = 2.5
    packaging_cost_per_guest: float = 35.0
    other_variable_percent: float = 1.5


class UnitEconomicsSensitivity(BaseModel):
    average_check_plus_10: float
    average_check_minus_10: float
    no_show_zero: float
    occupancy_plus_10: float


class UnitEconomicsPeriodRow(BaseModel):
    month: str
    bookings: float
    guests: float
    revenue: float
    gross_profit: float
    operating_profit: float
    net_profit: float


class UnitEconomicsReport(BaseModel):
    settings: UnitEconomicsSettings
    today_bookings: int
    today_guests: int
    today_no_show_rate: float
    today_revenue_estimate: float
    average_check: float
    bookings_per_day: float
    forecast_bookings_per_month: float
    forecast_guests_per_month: float
    forecast_revenue_per_month: float
    forecast_gross_profit_per_month: float
    forecast_operating_profit_per_month: float
    forecast_net_profit_per_month: float
    fixed_costs_per_month: float
    variable_costs_per_month: float
    fixed_cost_share: float
    variable_cost_share: float
    profit_per_guest: float
    profit_per_booking: float
    break_even_revenue: float
    break_even_guests: float
    no_show_lost_revenue: float
    no_show_lost_profit: float
    occupancy_rate_effective: float
    sensitivities: UnitEconomicsSensitivity
    weekly_series: List[dict]
    monthly_forecast: List[UnitEconomicsPeriodRow]
    formula_notes: List[str]
