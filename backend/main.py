from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import (students, courses, batches, coordinators,
                    sections, slots, enrollment, attendance,
                    reports, auth, professors, departments, logs)

app = FastAPI(title="Student Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth")
app.include_router(departments.router,  prefix="/api/departments")
app.include_router(professors.router,   prefix="/api/professors")
app.include_router(students.router,     prefix="/api/students")
app.include_router(courses.router,      prefix="/api/courses")
app.include_router(batches.router,      prefix="/api/batches")
app.include_router(coordinators.router, prefix="/api/coordinators")
app.include_router(sections.router,     prefix="/api/sections")
app.include_router(slots.router,        prefix="/api/slots")
app.include_router(enrollment.router,   prefix="/api/enrollment")
app.include_router(attendance.router,   prefix="/api/attendance")
app.include_router(reports.router,      prefix="/api/reports")
app.include_router(logs.router,         prefix="/api/logs")

@app.get("/")
def root():
    return {"message": "Attendance System API running"}