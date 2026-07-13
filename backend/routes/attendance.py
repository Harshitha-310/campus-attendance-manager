from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from database import get_connection, fetch_query

router = APIRouter()

class AttRecord(BaseModel):
    student_id: int
    section_id: int
    slot_id: int
    att_date: str
    status: str

class BulkAttendance(BaseModel):
    records: List[AttRecord]

@router.post("/mark-bulk")
def mark_bulk(payload: BulkAttendance):
    conn = get_connection()
    errors = []
    try:
        cur = conn.cursor()
        for r in payload.records:
            try:
                cur.execute(
                    """BEGIN attendance_pkg.mark_attendance(
                       :1,:2,:3,TO_DATE(:4,'YYYY-MM-DD'),:5); END;""",
                    [r.student_id, r.section_id, r.slot_id,
                     r.att_date, r.status])
                conn.commit()
            except Exception as e:
                conn.rollback()
                errors.append(f"Student {r.student_id}: {str(e)}")
        return {"success": True, "errors": errors}
    finally:
        cur.close()
        conn.close()

@router.post("/edit")
def edit_attendance(r: AttRecord):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """UPDATE attendance SET status = :1
               WHERE student_id = :2
               AND   section_id = :3
               AND   slot_id    = :4
               AND   att_date   = TO_DATE(:5,'YYYY-MM-DD')""",
            [r.status, r.student_id, r.section_id,
             r.slot_id, r.att_date])
        conn.commit()
        if cur.rowcount == 0:
            return {"success": False, "error": "Record not found"}
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        conn.close()

@router.get("/datewise")
def date_wise(student_id: int, section_id: int):
    """
    Called as: /api/attendance/datewise?student_id=1001&section_id=10
    Using query params avoids path conflicts with other routes.
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT TO_CHAR(a.att_date, 'YYYY-MM-DD') AS att_date,
                      a.slot_id,
                      a.status,
                      s.slot_number,
                      s.start_time,
                      s.end_time
               FROM   attendance a
               JOIN   slot s ON s.slot_id = a.slot_id
               WHERE  a.student_id = :1
               AND    a.section_id = :2
               ORDER  BY a.att_date, a.slot_id""",
            [student_id, section_id]
        )
        cols = [c[0].lower() for c in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        return {"success": True, "data": rows}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}
    finally:
        cur.close()
        conn.close()