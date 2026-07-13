from fastapi import APIRouter
from database import fetch_query, get_connection
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# This route kept for backward compatibility
# All data now comes from professor table
@router.get("/all")
def get_coordinators():
    return fetch_query(
        """SELECT p.prof_id   AS coord_id,
                  p.prof_name AS coord_name,
                  p.email,
                  p.phone,
                  d.dept_name,
                  d.dept_code
           FROM   professor  p
           JOIN   department d ON d.dept_id = p.dept_id
           WHERE  p.is_coordinator = 'Y'
           ORDER  BY p.prof_name""")