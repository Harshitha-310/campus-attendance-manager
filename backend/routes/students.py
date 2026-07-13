from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import call_procedure, fetch_query

router = APIRouter()

class Student(BaseModel):
    student_id: int
    name: str
    branch: str
    semester: int
    email: Optional[str] = None
    phone: Optional[str] = None

@router.post("/register")
def register_student(s: Student):
    sql = """BEGIN attendance_pkg.register_student(
             :1,:2,:3,:4,:5,:6); END;"""
    return call_procedure(sql,
        [s.student_id, s.name, s.branch,
         s.semester, s.email, s.phone])

@router.get("/all")
def get_students():
    return fetch_query(
        """SELECT student_id, student_name, branch,
                  semester, email, phone
           FROM student ORDER BY student_id""")