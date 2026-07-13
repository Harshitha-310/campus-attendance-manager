from fastapi import APIRouter
from pydantic import BaseModel
from database import fetch_query, get_connection

router = APIRouter()

class Section(BaseModel):
    section_id:   int
    section_name: str
    batch_id:     int
    coord_id:     int

@router.post("/create")
def create_section(s: Section):
    conn = get_connection()
    try:
        cur = conn.cursor()
        # coord_id here is prof_id from professor table
        cur.execute(
            """INSERT INTO section
               (section_id, section_name, batch_id,
                coord_id, coord_prof_id)
               VALUES (:1, :2, :3, :4, :4)""",
            [s.section_id, s.section_name, s.batch_id, s.coord_id]
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
def get_sections():
    return fetch_query(
        """SELECT s.section_id,
                  s.section_name,
                  b.batch_id,
                  b.batch_name,
                  c.course_id,
                  c.course_name,
                  d.dept_id,
                  d.dept_name,
                  d.dept_code,
                  p.prof_id,
                  p.prof_name   AS coord_name,
                  p.designation AS coord_designation
           FROM   section    s
           JOIN   batch      b  ON b.batch_id  = s.batch_id
           JOIN   course     c  ON c.course_id = b.course_id
           LEFT JOIN department d ON d.dept_id = c.dept_id
           LEFT JOIN professor  p ON p.prof_id = s.coord_prof_id
           ORDER  BY s.section_id""")

@router.get("/{section_id}/students")
def get_section_students(section_id: int):
    return fetch_query(
        """SELECT s.student_id,
                  s.student_name,
                  s.branch,
                  d.dept_name,
                  d.dept_code
           FROM   student      s
           JOIN   registration r ON r.student_id = s.student_id
           LEFT JOIN department d ON d.dept_id   = s.dept_id
           WHERE  r.section_id = :1
           ORDER  BY s.student_id""",
        [section_id])

@router.get("/{section_id}/info")
def get_section_info(section_id: int):
    return fetch_query(
        """SELECT s.section_id,
                  s.section_name,
                  b.batch_name,
                  c.course_id,
                  c.course_name,
                  c.credits,
                  d.dept_name,
                  d.dept_code,
                  p.prof_name   AS coord_name,
                  p.designation AS coord_designation
           FROM   section    s
           JOIN   batch      b  ON b.batch_id  = s.batch_id
           JOIN   course     c  ON c.course_id = b.course_id
           LEFT JOIN department d ON d.dept_id = c.dept_id
           LEFT JOIN professor  p ON p.prof_id = s.coord_prof_id
           WHERE  s.section_id = :1""",
        [section_id])