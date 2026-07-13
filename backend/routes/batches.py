from fastapi import APIRouter
from pydantic import BaseModel
from database import call_procedure, fetch_query

router = APIRouter()

class Batch(BaseModel):
    batch_id: int
    batch_name: str
    course_id: int

@router.post("/create")
def create_batch(b: Batch):
    sql = "BEGIN attendance_pkg.create_batch(:1,:2,:3); END;"
    return call_procedure(sql,
        [b.batch_id, b.batch_name, b.course_id])

@router.get("/all")
def get_batches():
    return fetch_query(
        """SELECT b.batch_id, b.batch_name, c.course_name
           FROM batch b JOIN course c ON c.course_id = b.course_id
           ORDER BY b.batch_id""")