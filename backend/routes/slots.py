from fastapi import APIRouter
from pydantic import BaseModel
from database import call_procedure, fetch_query

router = APIRouter()

class Slot(BaseModel):
    slot_id: int
    slot_number: int
    start_time: str
    end_time: str

@router.post("/create")
def create_slot(s: Slot):
    sql = "BEGIN attendance_pkg.create_slot(:1,:2,:3,:4); END;"
    return call_procedure(sql,
        [s.slot_id, s.slot_number, s.start_time, s.end_time])

@router.get("/all")
def get_slots():
    return fetch_query(
        "SELECT slot_id, slot_number, start_time, end_time FROM slot ORDER BY slot_number")