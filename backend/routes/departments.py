from fastapi import APIRouter
from pydantic import BaseModel
from database import fetch_query, get_connection

router = APIRouter()

class Department(BaseModel):
    dept_id:   int
    dept_name: str
    dept_code: str

@router.post("/create")
def create_department(d: Department):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO department VALUES (:1,:2,:3)",
            [d.dept_id, d.dept_name, d.dept_code]
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
def get_departments():
    return fetch_query(
        """SELECT dept_id, dept_name, dept_code
           FROM   department
           ORDER  BY dept_name""")