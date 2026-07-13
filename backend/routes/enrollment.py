from fastapi import APIRouter
from pydantic import BaseModel
from database import call_procedure, fetch_query

router = APIRouter()

class Enrollment(BaseModel):
    student_id: int
    course_id: int
    section_id: int

@router.post("/enroll")
def enroll_student(e: Enrollment):
    sql = "BEGIN attendance_pkg.enroll_student(:1,:2,:3); END;"
    return call_procedure(sql,
        [e.student_id, e.course_id, e.section_id])

@router.get("/all")
def get_enrollments():
    return fetch_query(
        """SELECT r.reg_id, s.student_name,
                  c.course_name, sec.section_name,
                  TO_CHAR(r.reg_date,'DD-Mon-YYYY') as reg_date
           FROM registration r
           JOIN student s   ON s.student_id   = r.student_id
           JOIN course  c   ON c.course_id    = r.course_id
           JOIN section sec ON sec.section_id = r.section_id
           ORDER BY r.reg_id""")