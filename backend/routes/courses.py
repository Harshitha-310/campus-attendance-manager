from fastapi import APIRouter
from pydantic import BaseModel
from database import call_procedure, fetch_query

router = APIRouter()

class Course(BaseModel):
    course_id: int
    course_name: str
    credits: int

@router.post("/create")
def create_course(c: Course):
    sql = "BEGIN attendance_pkg.create_course(:1,:2,:3); END;"
    return call_procedure(sql,
        [c.course_id, c.course_name, c.credits])

@router.get("/all")
def get_courses():
    return fetch_query(
        "SELECT course_id, course_name, credits FROM course ORDER BY course_id")