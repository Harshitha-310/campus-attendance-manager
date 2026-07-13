from fastapi import APIRouter
from database import fetch_query

router = APIRouter()

@router.get("/all")
def report_all():
    return fetch_query(
        """SELECT s.student_id,
                  s.student_name,
                  s.branch,
                  d.dept_name,
                  c.course_id,
                  c.course_name,
                  sec.section_id,
                  sec.section_name,
                  p.prof_name        AS coordinator_name,
                  COUNT(a.att_date)  AS total_classes,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END) AS present_count,
                  ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                        / NULLIF(COUNT(a.att_date),0),2)         AS attendance_pct,
                  CASE WHEN ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                       / NULLIF(COUNT(a.att_date),0),2) >= 75
                       THEN 'ELIGIBLE' ELSE 'NOT ELIGIBLE'
                  END                                            AS eligibility
           FROM   student     s
           LEFT JOIN department  d   ON d.dept_id    = s.dept_id
           JOIN   registration  r   ON r.student_id = s.student_id
           JOIN   course        c   ON c.course_id  = r.course_id
           JOIN   section       sec ON sec.section_id = r.section_id
           LEFT JOIN professor  p   ON p.prof_id    = sec.coord_prof_id
           JOIN   attendance    a   ON a.student_id = s.student_id
                                   AND a.section_id = sec.section_id
           GROUP  BY s.student_id, s.student_name, s.branch, d.dept_name,
                     c.course_id, c.course_name,
                     sec.section_id, sec.section_name, p.prof_name
           ORDER  BY s.student_name, c.course_name""")

@router.get("/section/{section_id}")
def report_section(section_id: int):
    return fetch_query(
        """SELECT s.student_id,
                  s.student_name,
                  s.branch,
                  d.dept_name,
                  c.course_name,
                  sec.section_id,
                  sec.section_name,
                  p.prof_name        AS coordinator_name,
                  COUNT(a.att_date)  AS total_classes,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END) AS present_count,
                  ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                        / NULLIF(COUNT(a.att_date),0),2)         AS attendance_pct,
                  CASE WHEN ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                       / NULLIF(COUNT(a.att_date),0),2) >= 75
                       THEN 'ELIGIBLE' ELSE 'NOT ELIGIBLE'
                  END                                            AS eligibility
           FROM   student     s
           LEFT JOIN department  d   ON d.dept_id    = s.dept_id
           JOIN   attendance    a   ON a.student_id = s.student_id
           JOIN   section       sec ON sec.section_id = a.section_id
           LEFT JOIN professor  p   ON p.prof_id    = sec.coord_prof_id
           JOIN   registration  r   ON r.student_id = s.student_id
                                   AND r.section_id = sec.section_id
           JOIN   course        c   ON c.course_id  = r.course_id
           WHERE  a.section_id = :1
           GROUP  BY s.student_id, s.student_name, s.branch, d.dept_name,
                     c.course_name, sec.section_id, sec.section_name, p.prof_name
           ORDER  BY s.student_id""",
        [section_id])

@router.get("/student/{student_id}")
def report_student(student_id: int):
    return fetch_query(
        """SELECT s.student_id,
                  s.student_name,
                  s.branch,
                  d.dept_name,
                  c.course_name,
                  sec.section_id,
                  sec.section_name,
                  p.prof_name        AS coordinator_name,
                  COUNT(a.att_date)  AS total_classes,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END) AS present_count,
                  ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                        / NULLIF(COUNT(a.att_date),0),2)         AS attendance_pct,
                  CASE WHEN ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                       / NULLIF(COUNT(a.att_date),0),2) >= 75
                       THEN 'ELIGIBLE' ELSE 'NOT ELIGIBLE'
                  END                                            AS eligibility
           FROM   student     s
           LEFT JOIN department  d   ON d.dept_id    = s.dept_id
           JOIN   registration  r   ON r.student_id = s.student_id
           JOIN   course        c   ON c.course_id  = r.course_id
           JOIN   section       sec ON sec.section_id = r.section_id
           LEFT JOIN professor  p   ON p.prof_id    = sec.coord_prof_id
           JOIN   attendance    a   ON a.student_id = s.student_id
                                   AND a.section_id = sec.section_id
           WHERE  s.student_id = :1
           GROUP  BY s.student_id, s.student_name, s.branch, d.dept_name,
                     c.course_name, sec.section_id, sec.section_name, p.prof_name
           ORDER  BY c.course_name""",
        [student_id])

@router.get("/stats")
def stats():
    return fetch_query(
        """SELECT
           (SELECT COUNT(*) FROM student)     AS students,
           (SELECT COUNT(*) FROM course)      AS courses,
           (SELECT COUNT(*) FROM section)     AS sections,
           (SELECT COUNT(*) FROM attendance)  AS att_records,
           (SELECT COUNT(*) FROM professor)   AS professors,
           (SELECT COUNT(*) FROM department)  AS departments,
           (SELECT COUNT(*) FROM professor WHERE is_coordinator='Y') AS coordinators
           FROM DUAL""")

@router.get("/alerts")
def alerts():
    return fetch_query(
        """SELECT s.student_id,
                  s.student_name,
                  s.branch,
                  d.dept_name,
                  c.course_name,
                  sec.section_id,
                  sec.section_name,
                  p.prof_name        AS coordinator_name,
                  COUNT(a.att_date)  AS total_classes,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END) AS present_count,
                  ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                        / NULLIF(COUNT(a.att_date),0),2)         AS attendance_pct,
                  'NOT ELIGIBLE'                                  AS eligibility
           FROM   student     s
           LEFT JOIN department  d   ON d.dept_id    = s.dept_id
           JOIN   registration  r   ON r.student_id = s.student_id
           JOIN   course        c   ON c.course_id  = r.course_id
           JOIN   section       sec ON sec.section_id = r.section_id
           LEFT JOIN professor  p   ON p.prof_id    = sec.coord_prof_id
           JOIN   attendance    a   ON a.student_id = s.student_id
                                   AND a.section_id = sec.section_id
           GROUP  BY s.student_id, s.student_name, s.branch, d.dept_name,
                     c.course_name, sec.section_id, sec.section_name, p.prof_name
           HAVING ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
                        / NULLIF(COUNT(a.att_date),0),2) < 75
           ORDER  BY attendance_pct ASC""")

@router.get("/chart-data/all")
def chart_data_all():
    return fetch_query(
        """SELECT sec.section_name,
                  c.course_name,
                  d.dept_name,
                  COUNT(a.att_date)                                          AS total_records,
                  ROUND(AVG(CASE WHEN a.status='P' THEN 100 ELSE 0 END),1)  AS avg_pct,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)             AS present_count,
                  SUM(CASE WHEN a.status='A' THEN 1 ELSE 0 END)             AS absent_count
           FROM   section    sec
           JOIN   batch       b  ON b.batch_id   = sec.batch_id
           JOIN   course      c  ON c.course_id  = b.course_id
           LEFT JOIN department d ON d.dept_id   = c.dept_id
           JOIN   attendance  a  ON a.section_id = sec.section_id
           GROUP  BY sec.section_id, sec.section_name, c.course_name, d.dept_name
           ORDER  BY sec.section_name""")

@router.get("/chart-data/course/{course_id}")
def chart_data_course(course_id: int):
    return fetch_query(
        """SELECT sec.section_name,
                  c.course_name,
                  COUNT(a.att_date)                                          AS total_records,
                  ROUND(AVG(CASE WHEN a.status='P' THEN 100 ELSE 0 END),1)  AS avg_pct,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)             AS present_count,
                  SUM(CASE WHEN a.status='A' THEN 1 ELSE 0 END)             AS absent_count
           FROM   section    sec
           JOIN   batch       b  ON b.batch_id   = sec.batch_id
           JOIN   course      c  ON c.course_id  = b.course_id
           JOIN   attendance  a  ON a.section_id = sec.section_id
           WHERE  c.course_id = :1
           GROUP  BY sec.section_id, sec.section_name, c.course_name
           ORDER  BY sec.section_name""",
        [course_id])

@router.get("/chart-data/section/{section_id}")
def chart_data_section(section_id: int):
    return fetch_query(
        """SELECT s.student_name,
                  COUNT(a.att_date)                                          AS total_classes,
                  ROUND(AVG(CASE WHEN a.status='P' THEN 100 ELSE 0 END),1)  AS avg_pct,
                  SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)             AS present_count,
                  SUM(CASE WHEN a.status='A' THEN 1 ELSE 0 END)             AS absent_count
           FROM   student    s
           JOIN   attendance a ON a.student_id = s.student_id
           WHERE  a.section_id = :1
           GROUP  BY s.student_id, s.student_name
           ORDER  BY s.student_name""",
        [section_id])