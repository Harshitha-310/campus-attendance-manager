from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import call_procedure, fetch_query, get_connection

router = APIRouter()

class Professor(BaseModel):
    prof_id:        int
    prof_name:      str
    email:          Optional[str] = None
    phone:          Optional[str] = None
    dept_id:        int
    designation:    Optional[str] = 'Assistant Professor'
    is_coordinator: Optional[str] = 'N'

@router.post("/create")
def create_professor(p: Professor):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO professor
               (prof_id, prof_name, email, phone,
                dept_id, designation, is_coordinator)
               VALUES (:1,:2,:3,:4,:5,:6,:7)""",
            [p.prof_id, p.prof_name, p.email, p.phone,
             p.dept_id, p.designation, p.is_coordinator]
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        conn.close()

@router.get("/all")
def get_professors():
    return fetch_query(
        """SELECT p.prof_id, p.prof_name, p.email, p.phone,
                  p.designation, p.is_coordinator,
                  d.dept_name, d.dept_code
           FROM   professor p
           JOIN   department d ON d.dept_id = p.dept_id
           ORDER  BY p.prof_name""")

@router.get("/coordinators")
def get_coordinators():
    return fetch_query(
        """SELECT p.prof_id, p.prof_name, p.email,
                  p.designation, d.dept_name
           FROM   professor p
           JOIN   department d ON d.dept_id = p.dept_id
           WHERE  p.is_coordinator = 'Y'
           ORDER  BY p.prof_name""")

@router.get("/{prof_id}/courses")
def get_professor_courses(prof_id: int):
    return fetch_query(
        """SELECT c.course_id, c.course_name, c.credits,
                  d.dept_name
           FROM   course_professor cp
           JOIN   course      c ON c.course_id = cp.course_id
           JOIN   department  d ON d.dept_id   = c.dept_id
           WHERE  cp.prof_id = :1
           ORDER  BY c.course_name""",
        [prof_id])