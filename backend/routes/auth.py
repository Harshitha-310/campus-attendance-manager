from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_connection
import hashlib
import secrets

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id: int, role: str) -> str:
    raw = f"{user_id}:{role}:{secrets.token_hex(16)}"
    return hashlib.sha256(raw.encode()).hexdigest()

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username:   str
    password:   str
    role:       str        # 'admin' | 'professor' | 'student'
    ref_id:     int        # student_id / coord_id / any id for admin
    full_name:  str

@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT user_id, username, role, ref_id, full_name, password_hash
               FROM   app_users
               WHERE  username = :1""",
            [req.username]
        )
        cols = [c[0].lower() for c in cur.description]
        row  = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        user = dict(zip(cols, row))
        if user['password_hash'] != hash_password(req.password):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        # generate session token
        token = generate_token(user['user_id'], user['role'])

        # save token to db
        cur.execute(
            """UPDATE app_users SET session_token = :1
               WHERE user_id = :2""",
            [token, user['user_id']]
        )
        conn.commit()

        return {
            "success":   True,
            "token":     token,
            "role":      user['role'],
            "ref_id":    user['ref_id'],
            "full_name": user['full_name'],
            "user_id":   user['user_id'],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/register")
def register(req: RegisterRequest):
    if req.role not in ('admin', 'professor', 'student'):
        raise HTTPException(status_code=400, detail="Invalid role")
    conn = get_connection()
    try:
        cur = conn.cursor()
        # check username taken
        cur.execute(
            "SELECT COUNT(*) FROM app_users WHERE username = :1",
            [req.username]
        )
        if cur.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Username already taken")

        cur.execute(
            """SELECT NVL(MAX(user_id), 0) + 1 FROM app_users""")
        new_id = cur.fetchone()[0]

        cur.execute(
            """INSERT INTO app_users
               (user_id, username, password_hash, role, ref_id, full_name)
               VALUES (:1,:2,:3,:4,:5,:6)""",
            [new_id, req.username, hash_password(req.password),
             req.role, req.ref_id, req.full_name]
        )
        conn.commit()
        return {"success": True, "message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/logout")
def logout(token: str):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE app_users SET session_token = NULL WHERE session_token = :1",
            [token]
        )
        conn.commit()
        return {"success": True}
    finally:
        cur.close()
        conn.close()

@router.get("/verify")
def verify_token(token: str):
    conn = get_connection()
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
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"success": True, "user": dict(zip(cols, row))}
    finally:
        cur.close()
        conn.close()