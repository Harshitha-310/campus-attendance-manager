from fastapi import APIRouter
from database import fetch_query

router = APIRouter()

@router.get("/all")
def get_all_logs():
    return fetch_query(
        """SELECT l.log_id,
                  l.student_id,
                  s.student_name,
                  l.section_id,
                  sec.section_name,
                  c.course_name,
                  TO_CHAR(l.log_date,'DD-Mon-YYYY HH24:MI') AS log_date,
                  l.old_status,
                  l.new_status,
                  l.att_pct,
                  l.action_taken
           FROM   attendance_log l
           JOIN   student  s   ON s.student_id   = l.student_id
           JOIN   section  sec ON sec.section_id = l.section_id
           JOIN   batch    b   ON b.batch_id     = sec.batch_id
           JOIN   course   c   ON c.course_id    = b.course_id
           ORDER  BY l.log_id DESC""")

@router.get("/warnings")
def get_warnings():
    return fetch_query(
        """SELECT l.log_id,
                  s.student_name,
                  sec.section_name,
                  c.course_name,
                  TO_CHAR(l.log_date,'DD-Mon-YYYY HH24:MI') AS log_date,
                  l.att_pct,
                  l.action_taken
           FROM   attendance_log l
           JOIN   student  s   ON s.student_id   = l.student_id
           JOIN   section  sec ON sec.section_id = l.section_id
           JOIN   batch    b   ON b.batch_id     = sec.batch_id
           JOIN   course   c   ON c.course_id    = b.course_id
           WHERE  l.att_pct < 75
           AND    l.action_taken LIKE 'WARNING%'
           ORDER  BY l.log_id DESC""")

@router.get("/student/{student_id}")
def get_student_logs(student_id: int):
    return fetch_query(
        """SELECT l.log_id,
                  sec.section_name,
                  c.course_name,
                  TO_CHAR(l.log_date,'DD-Mon-YYYY HH24:MI') AS log_date,
                  l.old_status,
                  l.new_status,
                  l.att_pct,
                  l.action_taken
           FROM   attendance_log l
           JOIN   section  sec ON sec.section_id = l.section_id
           JOIN   batch    b   ON b.batch_id     = sec.batch_id
           JOIN   course   c   ON c.course_id    = b.course_id
           WHERE  l.student_id = :1
           ORDER  BY l.log_id DESC""",
        [student_id])