from fastapi import Header, HTTPException
from database import get_connection

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    conn  = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT user_id, username, role, ref_id, full_name
               FROM   app_users
               WHERE  session_token = :1""",
            [token]
        )
        cols = [c[0].lower() for c in cur.description]
        row  = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        return dict(zip(cols, row))
    finally:
        cur.close()
        conn.close()

def require_admin(user=None):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403,
            detail="Access denied. Admin only.")

def require_professor_or_admin(user=None):
    if user['role'] not in ('admin', 'professor'):
        raise HTTPException(status_code=403,
            detail="Access denied. Professor or Admin only.")