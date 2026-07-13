SET SERVEROUTPUT ON;

CREATE TABLE faculty_coordinator (
    coord_id     NUMBER(10)    PRIMARY KEY,
    coord_name   VARCHAR2(100) NOT NULL,
    email        VARCHAR2(100),
    phone        VARCHAR2(15)
)
TABLESPACE users
STORAGE (
    INITIAL 64K
    NEXT    64K
);
/


CREATE TABLE course (
    course_id    NUMBER(10)    PRIMARY KEY,
    course_name  VARCHAR2(100) NOT NULL,
    credits      NUMBER(2)     CHECK (credits BETWEEN 1 AND 10)
);
/


CREATE TABLE batch (
    batch_id     NUMBER(10)    PRIMARY KEY,
    batch_name   VARCHAR2(50)  NOT NULL,
    course_id    NUMBER(10)    NOT NULL,
    CONSTRAINT fk_batch_course FOREIGN KEY (course_id)
        REFERENCES course(course_id)
);
/


CREATE TABLE section (
    section_id   NUMBER(10)    PRIMARY KEY,
    section_name VARCHAR2(10)  NOT NULL,
    batch_id     NUMBER(10)    NOT NULL,
    coord_id     NUMBER(10)    NOT NULL,
    CONSTRAINT fk_section_batch FOREIGN KEY (batch_id)
        REFERENCES batch(batch_id),
    CONSTRAINT fk_section_coord FOREIGN KEY (coord_id)
        REFERENCES faculty_coordinator(coord_id)
);
/


CREATE TABLE student (
    student_id   NUMBER(10)    PRIMARY KEY,
    student_name VARCHAR2(100) NOT NULL,
    branch       VARCHAR2(50)  NOT NULL,
    semester     NUMBER(2)     NOT NULL CHECK (semester BETWEEN 1 AND 8),
    email        VARCHAR2(100),
    phone        VARCHAR2(15)
)
TABLESPACE users
STORAGE (
    INITIAL 64K
    NEXT    64K
);
/


CREATE TABLE registration (
    reg_id       NUMBER(10)    PRIMARY KEY,
    student_id   NUMBER(10)    NOT NULL,
    course_id    NUMBER(10)    NOT NULL,
    section_id   NUMBER(10)    NOT NULL,
    reg_date     DATE          DEFAULT SYSDATE,
    CONSTRAINT fk_reg_student  FOREIGN KEY (student_id)  REFERENCES student(student_id),
    CONSTRAINT fk_reg_course   FOREIGN KEY (course_id)   REFERENCES course(course_id),
    CONSTRAINT fk_reg_section  FOREIGN KEY (section_id)  REFERENCES section(section_id),
    CONSTRAINT uq_registration UNIQUE (student_id, course_id, section_id)
);
/


CREATE TABLE slot (
    slot_id      NUMBER(10)    PRIMARY KEY,
    slot_number  NUMBER(2)     NOT NULL,
    start_time   VARCHAR2(10)  NOT NULL,
    end_time     VARCHAR2(10)  NOT NULL
);
/


CREATE TABLE attendance (
    student_id   NUMBER(10)    NOT NULL,
    section_id   NUMBER(10)    NOT NULL,
    slot_id      NUMBER(10)    NOT NULL,
    att_date     DATE          NOT NULL,
    status       CHAR(1)       NOT NULL CHECK (status IN ('P','A')),
    CONSTRAINT pk_attendance PRIMARY KEY (student_id, section_id, slot_id, att_date),
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES student(student_id),
    CONSTRAINT fk_att_section FOREIGN KEY (section_id) REFERENCES section(section_id),
    CONSTRAINT fk_att_slot    FOREIGN KEY (slot_id)    REFERENCES slot(slot_id)
);
/

SELECT table_name FROM user_tables ORDER BY table_name;



--Creating a report view

CREATE OR REPLACE VIEW attendance_report_view AS
SELECT
    s.student_id,
    s.student_name,
    s.branch,
    c.course_name,
    sec.section_name,
    COUNT(a.att_date)                                                      AS total_classes,
    SUM(CASE WHEN a.status = 'P' THEN 1 ELSE 0 END)                       AS present_count,
    ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
          / NULLIF(COUNT(a.att_date),0), 2)                                AS attendance_pct,
    CASE
        WHEN ROUND(SUM(CASE WHEN a.status='P' THEN 1 ELSE 0 END)*100.0
             / NULLIF(COUNT(a.att_date),0), 2) >= 75
        THEN 'ELIGIBLE'
        ELSE 'NOT ELIGIBLE'
    END                                                                    AS eligibility
FROM student s
JOIN registration r  ON s.student_id  = r.student_id
JOIN course      c   ON r.course_id   = c.course_id
JOIN section     sec ON r.section_id  = sec.section_id
JOIN attendance  a   ON a.student_id  = s.student_id
                    AND a.section_id  = sec.section_id
GROUP BY s.student_id, s.student_name, s.branch, c.course_name, sec.section_name;
/


--trigger to avoid duplicate attendance

CREATE OR REPLACE TRIGGER prevent_dup_attendance
BEFORE INSERT ON attendance
FOR EACH ROW
DECLARE
    v_count     NUMBER;
    v_reg_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_reg_count
    FROM   registration
    WHERE  student_id = :NEW.student_id
    AND    section_id = :NEW.section_id;

    IF v_reg_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20001,
            'Student ' || :NEW.student_id ||
            ' is NOT registered in section ' || :NEW.section_id ||
            '. Register first.');
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM   attendance
    WHERE  student_id = :NEW.student_id
    AND    section_id = :NEW.section_id
    AND    slot_id    = :NEW.slot_id
    AND    att_date   = :NEW.att_date;

    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20002,
            'Attendance already marked for student ' || :NEW.student_id ||
            ' on ' || TO_CHAR(:NEW.att_date,'DD-MON-YYYY') ||
            ' slot ' || :NEW.slot_id);
    END IF;
END;
/

--check trigger

SELECT trigger_name, status FROM user_triggers;


--package specification

CREATE OR REPLACE PACKAGE attendance_pkg AS

    PROCEDURE register_student(
        p_student_id IN NUMBER, p_name IN VARCHAR2,
        p_branch IN VARCHAR2,   p_semester IN NUMBER,
        p_email IN VARCHAR2 DEFAULT NULL,
        p_phone IN VARCHAR2 DEFAULT NULL
    );

    PROCEDURE create_course(
        p_course_id IN NUMBER, p_course_name IN VARCHAR2,
        p_credits IN NUMBER DEFAULT 3
    );

    PROCEDURE create_batch(
        p_batch_id IN NUMBER, p_batch_name IN VARCHAR2,
        p_course_id IN NUMBER
    );

    PROCEDURE create_section(
        p_section_id IN NUMBER, p_section_name IN VARCHAR2,
        p_batch_id IN NUMBER,   p_coord_id IN NUMBER
    );

    PROCEDURE assign_coordinator(
        p_section_id IN NUMBER, p_coord_id IN NUMBER
    );

    PROCEDURE create_slot(
        p_slot_id IN NUMBER,   p_slot_number IN NUMBER,
        p_start_time IN VARCHAR2, p_end_time IN VARCHAR2
    );

    PROCEDURE enroll_student(
        p_student_id IN NUMBER, p_course_id IN NUMBER,
        p_section_id IN NUMBER
    );

    PROCEDURE mark_attendance(
        p_student_id IN NUMBER,  p_section_id IN NUMBER,
        p_slot_id    IN NUMBER,  p_att_date   IN DATE,
        p_status     IN CHAR
    );

    FUNCTION calculate_percentage(
        p_student_id IN NUMBER, p_section_id IN NUMBER
    ) RETURN NUMBER;

    PROCEDURE generate_report(p_section_id IN NUMBER);

    PROCEDURE generate_student_report(p_student_id IN NUMBER);

END attendance_pkg;
/

--package body

CREATE OR REPLACE PACKAGE BODY attendance_pkg AS

    PROCEDURE register_student(
        p_student_id IN NUMBER, p_name IN VARCHAR2,
        p_branch IN VARCHAR2,   p_semester IN NUMBER,
        p_email IN VARCHAR2 DEFAULT NULL,
        p_phone IN VARCHAR2 DEFAULT NULL
    ) IS
        v_exists NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_exists FROM student WHERE student_id = p_student_id;
        IF v_exists > 0 THEN
            RAISE_APPLICATION_ERROR(-20010, 'Student ID ' || p_student_id || ' already exists.');
        END IF;
        INSERT INTO student(student_id,student_name,branch,semester,email,phone)
        VALUES(p_student_id,p_name,p_branch,p_semester,p_email,p_phone);
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Student registered - ' || p_name);
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END register_student;

    PROCEDURE create_course(
        p_course_id IN NUMBER, p_course_name IN VARCHAR2,
        p_credits IN NUMBER DEFAULT 3
    ) IS
    BEGIN
        INSERT INTO course(course_id,course_name,credits)
        VALUES(p_course_id,p_course_name,p_credits);
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Course created - ' || p_course_name);
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20011,'Course ID ' || p_course_id || ' already exists.');
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END create_course;

    PROCEDURE create_batch(
        p_batch_id IN NUMBER, p_batch_name IN VARCHAR2,
        p_course_id IN NUMBER
    ) IS
    BEGIN
        INSERT INTO batch(batch_id,batch_name,course_id)
        VALUES(p_batch_id,p_batch_name,p_course_id);
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Batch created - ' || p_batch_name);
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END create_batch;

    PROCEDURE create_section(
        p_section_id IN NUMBER, p_section_name IN VARCHAR2,
        p_batch_id IN NUMBER,   p_coord_id IN NUMBER
    ) IS
    BEGIN
        INSERT INTO section(section_id,section_name,batch_id,coord_id)
        VALUES(p_section_id,p_section_name,p_batch_id,p_coord_id);
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Section created - ' || p_section_name);
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END create_section;

    PROCEDURE assign_coordinator(
        p_section_id IN NUMBER, p_coord_id IN NUMBER
    ) IS
    BEGIN
        UPDATE section SET coord_id = p_coord_id WHERE section_id = p_section_id;
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20012,'Section ' || p_section_id || ' not found.');
        END IF;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Coordinator ' || p_coord_id || ' assigned to section ' || p_section_id);
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END assign_coordinator;

    PROCEDURE create_slot(
        p_slot_id IN NUMBER,   p_slot_number IN NUMBER,
        p_start_time IN VARCHAR2, p_end_time IN VARCHAR2
    ) IS
    BEGIN
        INSERT INTO slot(slot_id,slot_number,start_time,end_time)
        VALUES(p_slot_id,p_slot_number,p_start_time,p_end_time);
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Slot ' || p_slot_number || ' (' || p_start_time || '-' || p_end_time || ') created.');
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END create_slot;

    PROCEDURE enroll_student(
        p_student_id IN NUMBER, p_course_id IN NUMBER,
        p_section_id IN NUMBER
    ) IS
        v_reg_id NUMBER;
    BEGIN
        SELECT NVL(MAX(reg_id),0)+1 INTO v_reg_id FROM registration;
        INSERT INTO registration(reg_id,student_id,course_id,section_id,reg_date)
        VALUES(v_reg_id,p_student_id,p_course_id,p_section_id,SYSDATE);
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Student ' || p_student_id || ' enrolled in course ' || p_course_id || ', section ' || p_section_id);
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20013,'Student already enrolled in this course/section.');
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END enroll_student;

    PROCEDURE mark_attendance(
        p_student_id IN NUMBER,  p_section_id IN NUMBER,
        p_slot_id    IN NUMBER,  p_att_date   IN DATE,
        p_status     IN CHAR
    ) IS
    BEGIN
        IF UPPER(p_status) NOT IN ('P','A') THEN
            RAISE_APPLICATION_ERROR(-20014,'Status must be P or A only.');
        END IF;
        INSERT INTO attendance(student_id,section_id,slot_id,att_date,status)
        VALUES(p_student_id,p_section_id,p_slot_id,p_att_date,UPPER(p_status));
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('SUCCESS: Attendance marked - Student ' || p_student_id || ' = ' || UPPER(p_status));
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END mark_attendance;

    FUNCTION calculate_percentage(
        p_student_id IN NUMBER, p_section_id IN NUMBER
    ) RETURN NUMBER IS
        v_total   NUMBER := 0;
        v_present NUMBER := 0;
    BEGIN
        SELECT COUNT(*),
               SUM(CASE WHEN status='P' THEN 1 ELSE 0 END)
        INTO   v_total, v_present
        FROM   attendance
        WHERE  student_id = p_student_id
        AND    section_id = p_section_id;
        IF v_total = 0 THEN RETURN 0; END IF;
        RETURN ROUND((v_present/v_total)*100, 2);
    END calculate_percentage;

    PROCEDURE generate_report(p_section_id IN NUMBER) IS
        v_pct NUMBER;
        CURSOR c_students IS
            SELECT DISTINCT a.student_id, s.student_name
            FROM   attendance a
            JOIN   student s ON s.student_id = a.student_id
            WHERE  a.section_id = p_section_id
            ORDER  BY a.student_id;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('================================================');
        DBMS_OUTPUT.PUT_LINE('   ATTENDANCE REPORT  -  Section: ' || p_section_id);
        DBMS_OUTPUT.PUT_LINE('================================================');
        DBMS_OUTPUT.PUT_LINE(RPAD('Student ID',12) || RPAD('Name',25) || RPAD('Att%',8) || 'Status');
        DBMS_OUTPUT.PUT_LINE(RPAD('-',60,'-'));
        FOR rec IN c_students LOOP
            v_pct := calculate_percentage(rec.student_id, p_section_id);
            DBMS_OUTPUT.PUT_LINE(
                RPAD(rec.student_id,12) ||
                RPAD(rec.student_name,25) ||
                RPAD(v_pct||'%',8) ||
                CASE WHEN v_pct >= 75 THEN 'ELIGIBLE' ELSE '*** NOT ELIGIBLE ***' END
            );
        END LOOP;
        DBMS_OUTPUT.PUT_LINE('================================================');
    END generate_report;

    PROCEDURE generate_student_report(p_student_id IN NUMBER) IS
        v_pct NUMBER;
        CURSOR c_sec IS
            SELECT r.section_id, sec.section_name, c.course_name
            FROM   registration r
            JOIN   section sec ON sec.section_id = r.section_id
            JOIN   course  c   ON c.course_id    = r.course_id
            WHERE  r.student_id = p_student_id;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('================================================');
        DBMS_OUTPUT.PUT_LINE('   STUDENT REPORT  -  ID: ' || p_student_id);
        DBMS_OUTPUT.PUT_LINE('================================================');
        FOR rec IN c_sec LOOP
            v_pct := calculate_percentage(p_student_id, rec.section_id);
            DBMS_OUTPUT.PUT_LINE(
                RPAD(rec.course_name,28) ||
                'Section: ' || RPAD(rec.section_name,5) ||
                v_pct || '%  -> ' ||
                CASE WHEN v_pct >= 75 THEN 'ELIGIBLE' ELSE 'NOT ELIGIBLE' END
            );
        END LOOP;
        DBMS_OUTPUT.PUT_LINE('================================================');
    END generate_student_report;

END attendance_pkg;
/

--package execution

SELECT object_name, object_type, status FROM user_objects
WHERE object_name = 'ATTENDANCE_PKG';


--Inserting sample data

-- Faculty coordinators (direct INSERT since no package procedure for them)
INSERT INTO faculty_coordinator VALUES (1,'Dr. Sharma','sharma@uni.edu','9876543210');
INSERT INTO faculty_coordinator VALUES (2,'Prof. Mehta','mehta@uni.edu','9876543211');
COMMIT;
/

-- Courses
BEGIN
    attendance_pkg.create_course(101,'Database Management Systems',4);
    attendance_pkg.create_course(102,'Data Structures',3);
    attendance_pkg.create_course(103,'Operating Systems',3);
END;
/

-- Batches
BEGIN
    attendance_pkg.create_batch(1,'Batch-A-2024',101);
    attendance_pkg.create_batch(2,'Batch-B-2024',101);
    attendance_pkg.create_batch(3,'Batch-A-2024',102);
END;
/

-- Sections (batch_id, coord_id)
BEGIN
    attendance_pkg.create_section(10,'S1',1,1);
    attendance_pkg.create_section(11,'S2',2,2);
    attendance_pkg.create_section(12,'S1',3,1);
END;
/

-- Students
BEGIN
    attendance_pkg.register_student(1001,'Ravi Kumar','CSE',5,'ravi@mail.com','9111111111');
    attendance_pkg.register_student(1002,'Priya Singh','CSE',5,'priya@mail.com','9111111112');
    attendance_pkg.register_student(1003,'Aman Verma','IT',5,'aman@mail.com','9111111113');
END;
/

-- Slots
BEGIN
    attendance_pkg.create_slot(1,1,'09:00','09:50');
    attendance_pkg.create_slot(2,2,'10:00','10:50');
    attendance_pkg.create_slot(3,3,'11:00','11:50');
    attendance_pkg.create_slot(4,4,'12:00','12:50');
    attendance_pkg.create_slot(5,5,'14:00','14:50');
    attendance_pkg.create_slot(6,6,'15:00','15:50');
END;
/

-- Enroll students into course + section
BEGIN
    attendance_pkg.enroll_student(1001,101,10);
    attendance_pkg.enroll_student(1002,101,10);
    attendance_pkg.enroll_student(1003,102,12);
END;
/

-- Mark attendance
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1002,10,2,DATE '2024-01-16','P');
END;
/


--output checking

-- Test 1: Generate section report
BEGIN
    attendance_pkg.generate_report(10);
END;
/

-- Test 2: Student report
BEGIN
    attendance_pkg.generate_student_report(1001);
END;
/

-- Test 3: Calculate percentage for one student
SELECT attendance_pkg.calculate_percentage(1001,10) AS percentage FROM DUAL;
/

-- Test 4: Query the view
SELECT * FROM attendance_report_view;
/

-- Test 5: TRIGGER TEST - this must FAIL with error -20002 (duplicate)
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-15','P');
END;
/

-- Test 6: TRIGGER TEST - this must FAIL with error -20001 (not registered)
BEGIN
    attendance_pkg.mark_attendance(9999,10,1,DATE '2024-01-15','P');
END;
/


--Inserting huge data

--Faculty Coordinators
INSERT INTO faculty_coordinator VALUES (1,'Dr. Ramesh Sharma','ramesh.sharma@college.edu','9876543210');
INSERT INTO faculty_coordinator VALUES (2,'Prof. Priya Mehta','priya.mehta@college.edu','9876543211');
INSERT INTO faculty_coordinator VALUES (3,'Dr. Suresh Kumar','suresh.kumar@college.edu','9876543212');
INSERT INTO faculty_coordinator VALUES (4,'Prof. Anita Desai','anita.desai@college.edu','9876543213');
INSERT INTO faculty_coordinator VALUES (5,'Dr. Vikram Patel','vikram.patel@college.edu','9876543214');
INSERT INTO faculty_coordinator VALUES (6,'Prof. Neha Joshi','neha.joshi@college.edu','9876543215');
COMMIT;
/

--courses

BEGIN
    attendance_pkg.create_course(101,'Database Management Systems',4);
    attendance_pkg.create_course(102,'Data Structures',3);
    attendance_pkg.create_course(103,'Operating Systems',3);
    attendance_pkg.create_course(104,'Computer Networks',3);
    attendance_pkg.create_course(105,'Software Engineering',3);
    attendance_pkg.create_course(106,'Web Technologies',2);
END;
/

--Batches

BEGIN
    attendance_pkg.create_batch(1,'Batch-A-2024',101);
    attendance_pkg.create_batch(2,'Batch-B-2024',101);
    attendance_pkg.create_batch(3,'Batch-A-2024',102);
    attendance_pkg.create_batch(4,'Batch-B-2024',102);
    attendance_pkg.create_batch(5,'Batch-A-2024',103);
    attendance_pkg.create_batch(6,'Batch-A-2024',104);
    attendance_pkg.create_batch(7,'Batch-A-2024',105);
    attendance_pkg.create_batch(8,'Batch-A-2024',106);
END;
/

--Sections

BEGIN
    attendance_pkg.create_section(10,'S1',1,1);
    attendance_pkg.create_section(11,'S2',2,2);
    attendance_pkg.create_section(12,'S1',3,3);
    attendance_pkg.create_section(13,'S2',4,4);
    attendance_pkg.create_section(14,'S1',5,5);
    attendance_pkg.create_section(15,'S1',6,6);
    attendance_pkg.create_section(16,'S1',7,1);
    attendance_pkg.create_section(17,'S1',8,2);
END;
/

--Slots

BEGIN
    attendance_pkg.create_slot(1,1,'09:00','09:50');
    attendance_pkg.create_slot(2,2,'10:00','10:50');
    attendance_pkg.create_slot(3,3,'11:00','11:50');
    attendance_pkg.create_slot(4,4,'12:00','12:50');
    attendance_pkg.create_slot(5,5,'14:00','14:50');
    attendance_pkg.create_slot(6,6,'15:00','15:50');
END;
/

--Students

BEGIN
    attendance_pkg.register_student(1001,'Ravi Kumar','CSE',5,'ravi.kumar@student.edu','9111111101');
    attendance_pkg.register_student(1002,'Priya Singh','CSE',5,'priya.singh@student.edu','9111111102');
    attendance_pkg.register_student(1003,'Aman Verma','IT',5,'aman.verma@student.edu','9111111103');
    attendance_pkg.register_student(1004,'Sneha Patel','CSE',5,'sneha.patel@student.edu','9111111104');
    attendance_pkg.register_student(1005,'Rohit Gupta','CSE',5,'rohit.gupta@student.edu','9111111105');
    attendance_pkg.register_student(1006,'Neha Sharma','IT',5,'neha.sharma@student.edu','9111111106');
    attendance_pkg.register_student(1007,'Karan Mehta','CSE',5,'karan.mehta@student.edu','9111111107');
    attendance_pkg.register_student(1008,'Pooja Yadav','IT',5,'pooja.yadav@student.edu','9111111108');
    attendance_pkg.register_student(1009,'Arjun Nair','CSE',5,'arjun.nair@student.edu','9111111109');
    attendance_pkg.register_student(1010,'Divya Reddy','CSE',5,'divya.reddy@student.edu','9111111110');
    attendance_pkg.register_student(1011,'Saurabh Jain','IT',5,'saurabh.jain@student.edu','9111111111');
    attendance_pkg.register_student(1012,'Anjali Mishra','CSE',5,'anjali.mishra@student.edu','9111111112');
    attendance_pkg.register_student(1013,'Vivek Tiwari','ECE',5,'vivek.tiwari@student.edu','9111111113');
    attendance_pkg.register_student(1014,'Ritika Shah','ECE',5,'ritika.shah@student.edu','9111111114');
    attendance_pkg.register_student(1015,'Harsh Agarwal','CSE',5,'harsh.agarwal@student.edu','9111111115');
END;
/

--Enroll Students

-- Section 10 (DBMS Batch-A S1): students 1001-1005
BEGIN
    attendance_pkg.enroll_student(1001,101,10);
    attendance_pkg.enroll_student(1002,101,10);
    attendance_pkg.enroll_student(1003,101,10);
    attendance_pkg.enroll_student(1004,101,10);
    attendance_pkg.enroll_student(1005,101,10);
END;
/

-- Section 11 (DBMS Batch-B S2): students 1006-1010
BEGIN
    attendance_pkg.enroll_student(1006,101,11);
    attendance_pkg.enroll_student(1007,101,11);
    attendance_pkg.enroll_student(1008,101,11);
    attendance_pkg.enroll_student(1009,101,11);
    attendance_pkg.enroll_student(1010,101,11);
END;
/

-- Section 12 (DS Batch-A S1): students 1001,1002,1011,1012,1013
BEGIN
    attendance_pkg.enroll_student(1001,102,12);
    attendance_pkg.enroll_student(1002,102,12);
    attendance_pkg.enroll_student(1011,102,12);
    attendance_pkg.enroll_student(1012,102,12);
    attendance_pkg.enroll_student(1013,102,12);
END;
/

-- Section 13 (DS Batch-B S2): students 1003,1004,1014,1015
BEGIN
    attendance_pkg.enroll_student(1003,102,13);
    attendance_pkg.enroll_student(1004,102,13);
    attendance_pkg.enroll_student(1014,102,13);
    attendance_pkg.enroll_student(1015,102,13);
END;
/

-- Section 14 (OS S1): students 1005,1006,1007,1008
BEGIN
    attendance_pkg.enroll_student(1005,103,14);
    attendance_pkg.enroll_student(1006,103,14);
    attendance_pkg.enroll_student(1007,103,14);
    attendance_pkg.enroll_student(1008,103,14);
END;
/

-- Section 15 (Networks S1): students 1009,1010,1011,1012
BEGIN
    attendance_pkg.enroll_student(1009,104,15);
    attendance_pkg.enroll_student(1010,104,15);
    attendance_pkg.enroll_student(1011,104,15);
    attendance_pkg.enroll_student(1012,104,15);
END;
/


--Attendance data

-- ── SECTION 10 — DBMS Batch-A S1 ──────────────────────────────
-- Date 1: 15-Jan-2024  Slot 1
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1003,10,1,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1004,10,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1005,10,1,DATE '2024-01-15','P');
END;
/

-- Date 1: 15-Jan-2024  Slot 2
BEGIN
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1002,10,2,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1003,10,2,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1004,10,2,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1005,10,2,DATE '2024-01-15','P');
END;
/

-- Date 2: 16-Jan-2024  Slot 1
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1003,10,1,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1004,10,1,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1005,10,1,DATE '2024-01-16','P');
END;
/

-- Date 2: 16-Jan-2024  Slot 2
BEGIN
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1002,10,2,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1003,10,2,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1004,10,2,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1005,10,2,DATE '2024-01-16','P');
END;
/

-- Date 3: 17-Jan-2024  Slot 1
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1003,10,1,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1004,10,1,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1005,10,1,DATE '2024-01-17','A');
END;
/

-- Date 3: 17-Jan-2024  Slot 2
BEGIN
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1002,10,2,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1003,10,2,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1004,10,2,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1005,10,2,DATE '2024-01-17','A');
END;
/

-- Date 4: 18-Jan-2024  Slot 1
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1003,10,1,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1004,10,1,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1005,10,1,DATE '2024-01-18','P');
END;
/

-- Date 4: 18-Jan-2024  Slot 2
BEGIN
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1002,10,2,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1003,10,2,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1004,10,2,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1005,10,2,DATE '2024-01-18','P');
END;
/

-- Date 5: 19-Jan-2024  Slot 1
BEGIN
    attendance_pkg.mark_attendance(1001,10,1,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1002,10,1,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1003,10,1,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1004,10,1,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1005,10,1,DATE '2024-01-19','A');
END;
/

-- Date 5: 19-Jan-2024  Slot 2
BEGIN
    attendance_pkg.mark_attendance(1001,10,2,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1002,10,2,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1003,10,2,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1004,10,2,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1005,10,2,DATE '2024-01-19','A');
END;
/


-- ── SECTION 11 — DBMS Batch-B S2 ──────────────────────────────
BEGIN
    attendance_pkg.mark_attendance(1006,11,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1007,11,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1008,11,1,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1009,11,1,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1010,11,1,DATE '2024-01-15','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,2,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1007,11,2,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1008,11,2,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1009,11,2,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1010,11,2,DATE '2024-01-15','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1007,11,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1008,11,1,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1009,11,1,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1010,11,1,DATE '2024-01-16','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,2,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1007,11,2,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1008,11,2,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1009,11,2,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1010,11,2,DATE '2024-01-16','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,1,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1007,11,1,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1008,11,1,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1009,11,1,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1010,11,1,DATE '2024-01-17','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,2,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1007,11,2,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1008,11,2,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1009,11,2,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1010,11,2,DATE '2024-01-17','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,1,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1007,11,1,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1008,11,1,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1009,11,1,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1010,11,1,DATE '2024-01-18','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,2,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1007,11,2,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1008,11,2,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1009,11,2,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1010,11,2,DATE '2024-01-18','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,1,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1007,11,1,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1008,11,1,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1009,11,1,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1010,11,1,DATE '2024-01-19','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1006,11,2,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1007,11,2,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1008,11,2,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1009,11,2,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1010,11,2,DATE '2024-01-19','P');
END;
/


-- ── SECTION 12 — Data Structures Batch-A S1 ───────────────────
BEGIN
    attendance_pkg.mark_attendance(1001,12,3,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1002,12,3,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1011,12,3,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1012,12,3,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1013,12,3,DATE '2024-01-15','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1001,12,3,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1002,12,3,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1011,12,3,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1012,12,3,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1013,12,3,DATE '2024-01-16','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1001,12,3,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1002,12,3,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1011,12,3,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1012,12,3,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1013,12,3,DATE '2024-01-17','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1001,12,3,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1002,12,3,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1011,12,3,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1012,12,3,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1013,12,3,DATE '2024-01-18','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1001,12,3,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1002,12,3,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1011,12,3,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1012,12,3,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1013,12,3,DATE '2024-01-19','A');
END;
/


-- ── SECTION 13 — Data Structures Batch-B S2 ───────────────────
BEGIN
    attendance_pkg.mark_attendance(1003,13,4,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1004,13,4,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1014,13,4,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1015,13,4,DATE '2024-01-15','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1003,13,4,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1004,13,4,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1014,13,4,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1015,13,4,DATE '2024-01-16','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1003,13,4,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1004,13,4,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1014,13,4,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1015,13,4,DATE '2024-01-17','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1003,13,4,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1004,13,4,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1014,13,4,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1015,13,4,DATE '2024-01-18','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1003,13,4,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1004,13,4,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1014,13,4,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1015,13,4,DATE '2024-01-19','P');
END;
/


-- ── SECTION 14 — Operating Systems S1 ─────────────────────────
BEGIN
    attendance_pkg.mark_attendance(1005,14,5,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1006,14,5,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1007,14,5,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1008,14,5,DATE '2024-01-15','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1005,14,5,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1006,14,5,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1007,14,5,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1008,14,5,DATE '2024-01-16','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1005,14,5,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1006,14,5,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1007,14,5,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1008,14,5,DATE '2024-01-17','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1005,14,5,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1006,14,5,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1007,14,5,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1008,14,5,DATE '2024-01-18','A');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1005,14,5,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1006,14,5,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1007,14,5,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1008,14,5,DATE '2024-01-19','P');
END;
/


-- ── SECTION 15 — Computer Networks S1 ─────────────────────────
BEGIN
    attendance_pkg.mark_attendance(1009,15,6,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1010,15,6,DATE '2024-01-15','A');
    attendance_pkg.mark_attendance(1011,15,6,DATE '2024-01-15','P');
    attendance_pkg.mark_attendance(1012,15,6,DATE '2024-01-15','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1009,15,6,DATE '2024-01-16','P');
    attendance_pkg.mark_attendance(1010,15,6,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1011,15,6,DATE '2024-01-16','A');
    attendance_pkg.mark_attendance(1012,15,6,DATE '2024-01-16','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1009,15,6,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1010,15,6,DATE '2024-01-17','P');
    attendance_pkg.mark_attendance(1011,15,6,DATE '2024-01-17','A');
    attendance_pkg.mark_attendance(1012,15,6,DATE '2024-01-17','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1009,15,6,DATE '2024-01-18','A');
    attendance_pkg.mark_attendance(1010,15,6,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1011,15,6,DATE '2024-01-18','P');
    attendance_pkg.mark_attendance(1012,15,6,DATE '2024-01-18','P');
END;
/
BEGIN
    attendance_pkg.mark_attendance(1009,15,6,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1010,15,6,DATE '2024-01-19','P');
    attendance_pkg.mark_attendance(1011,15,6,DATE '2024-01-19','A');
    attendance_pkg.mark_attendance(1012,15,6,DATE '2024-01-19','P');
END;
/

--Verify Everything

-- Count check
SELECT 'Students'    AS tbl, COUNT(*) AS cnt FROM student     UNION ALL
SELECT 'Courses',          COUNT(*)           FROM course      UNION ALL
SELECT 'Batches',          COUNT(*)           FROM batch       UNION ALL
SELECT 'Sections',         COUNT(*)           FROM section     UNION ALL
SELECT 'Slots',            COUNT(*)           FROM slot        UNION ALL
SELECT 'Registrations',    COUNT(*)           FROM registration UNION ALL
SELECT 'Attendance rows',  COUNT(*)           FROM attendance;
/

-- Quick attendance percentage check
SELECT * FROM attendance_report_view ORDER BY attendance_pct ASC;
/

--Users

CREATE TABLE app_users (
    user_id        NUMBER(10)    PRIMARY KEY,
    username       VARCHAR2(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR2(100) NOT NULL,
    role           VARCHAR2(20)  NOT NULL
                   CHECK (role IN ('admin','professor','student')),
    ref_id         NUMBER(10),
    full_name      VARCHAR2(100) NOT NULL,
    session_token  VARCHAR2(100)
);
/

-- Default admin account (password: admin123)
INSERT INTO app_users VALUES (
    1, 'admin',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a',
    'admin', 0, 'System Administrator', NULL
);
COMMIT;
/


INSERT INTO app_users (user_id, username, password_hash, role, ref_id, full_name, session_token)
VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 0, 'System Administrator', NULL);
COMMIT;


--Adding Department and professor table 

-- 1. Create DEPARTMENT table
CREATE TABLE department (
    dept_id    NUMBER(10)    PRIMARY KEY,
    dept_name  VARCHAR2(100) NOT NULL,
    dept_code  VARCHAR2(10)  NOT NULL UNIQUE
);

INSERT INTO department VALUES (1,'Computer Science Engineering','CSE');
INSERT INTO department VALUES (2,'Information Technology','IT');
INSERT INTO department VALUES (3,'Electronics and Communication','ECE');
INSERT INTO department VALUES (4,'Mechanical Engineering','ME');
INSERT INTO department VALUES (5,'Civil Engineering','CE');
COMMIT;
/

-- 2. Create PROFESSOR table
CREATE TABLE professor (
    prof_id      NUMBER(10)    PRIMARY KEY,
    prof_name    VARCHAR2(100) NOT NULL,
    email        VARCHAR2(100),
    phone        VARCHAR2(15),
    dept_id      NUMBER(10)    NOT NULL,
    designation  VARCHAR2(50)  DEFAULT 'Assistant Professor',
    is_coordinator CHAR(1)     DEFAULT 'N' CHECK (is_coordinator IN ('Y','N')),
    CONSTRAINT fk_prof_dept FOREIGN KEY (dept_id)
        REFERENCES department(dept_id)
);
/

-- 3. Insert professors (superset of your coordinators)
INSERT INTO professor VALUES (1,'Dr. Ramesh Sharma','ramesh.sharma@college.edu','9876543210',1,'Professor','Y');
INSERT INTO professor VALUES (2,'Prof. Priya Mehta','priya.mehta@college.edu','9876543211',1,'Associate Professor','Y');
INSERT INTO professor VALUES (3,'Dr. Suresh Kumar','suresh.kumar@college.edu','9876543212',2,'Professor','Y');
INSERT INTO professor VALUES (4,'Prof. Anita Desai','anita.desai@college.edu','9876543213',2,'Assistant Professor','Y');
INSERT INTO professor VALUES (5,'Dr. Vikram Patel','vikram.patel@college.edu','9876543214',3,'Professor','Y');
INSERT INTO professor VALUES (6,'Prof. Neha Joshi','neha.joshi@college.edu','9876543215',1,'Assistant Professor','Y');
-- Professors who are NOT coordinators
INSERT INTO professor VALUES (7,'Dr. Anil Gupta','anil.gupta@college.edu','9876543216',1,'Professor','N');
INSERT INTO professor VALUES (8,'Prof. Kavita Singh','kavita.singh@college.edu','9876543217',2,'Assistant Professor','N');
INSERT INTO professor VALUES (9,'Dr. Mohan Rao','mohan.rao@college.edu','9876543218',3,'Associate Professor','N');
INSERT INTO professor VALUES (10,'Prof. Sunita Verma','sunita.verma@college.edu','9876543219',1,'Assistant Professor','N');
COMMIT;
/

-- 4. Create COURSE_PROFESSOR table (which prof teaches which course)
CREATE TABLE course_professor (
    cp_id      NUMBER(10)  PRIMARY KEY,
    course_id  NUMBER(10)  NOT NULL,
    prof_id    NUMBER(10)  NOT NULL,
    CONSTRAINT fk_cp_course  FOREIGN KEY (course_id) REFERENCES course(course_id),
    CONSTRAINT fk_cp_prof    FOREIGN KEY (prof_id)   REFERENCES professor(prof_id),
    CONSTRAINT uq_cp         UNIQUE (course_id, prof_id)
);

INSERT INTO course_professor VALUES (1,101,1);
INSERT INTO course_professor VALUES (2,101,7);
INSERT INTO course_professor VALUES (3,102,3);
INSERT INTO course_professor VALUES (4,102,8);
INSERT INTO course_professor VALUES (5,103,5);
INSERT INTO course_professor VALUES (6,104,9);
INSERT INTO course_professor VALUES (7,105,2);
INSERT INTO course_professor VALUES (8,106,6);
COMMIT;
/

-- 5. Update SECTION to reference PROFESSOR instead of FACULTY_COORDINATOR
-- First add new column
ALTER TABLE section ADD coord_prof_id NUMBER(10);
/

-- Copy existing coord_id values across (they have same IDs)
UPDATE section SET coord_prof_id = coord_id;
COMMIT;
/

-- Add FK to professor
ALTER TABLE section ADD CONSTRAINT fk_section_prof
    FOREIGN KEY (coord_prof_id) REFERENCES professor(prof_id);
/

-- 6. Add dept_id to STUDENT (keep branch for now, add dept reference)
ALTER TABLE student ADD dept_id NUMBER(10);
ALTER TABLE student ADD CONSTRAINT fk_student_dept
    FOREIGN KEY (dept_id) REFERENCES department(dept_id);
/

-- Update existing students with dept_id based on their branch string
UPDATE student SET dept_id = 1 WHERE branch = 'CSE';
UPDATE student SET dept_id = 2 WHERE branch = 'IT';
UPDATE student SET dept_id = 3 WHERE branch = 'ECE';
UPDATE student SET dept_id = 4 WHERE branch = 'ME';
UPDATE student SET dept_id = 5 WHERE branch = 'CE';
COMMIT;
/

-- 7. Add dept_id to COURSE
ALTER TABLE course ADD dept_id NUMBER(10);
ALTER TABLE course ADD CONSTRAINT fk_course_dept
    FOREIGN KEY (dept_id) REFERENCES department(dept_id);
/

UPDATE course SET dept_id = 1 WHERE course_id IN (101,105,106);
UPDATE course SET dept_id = 1 WHERE course_id = 102;
UPDATE course SET dept_id = 2 WHERE course_id = 103;
UPDATE course SET dept_id = 3 WHERE course_id = 104;
COMMIT;
/

--Another Trigger

CREATE TABLE attendance_log (
    log_id       NUMBER(10)     PRIMARY KEY,
    student_id   NUMBER(10)     NOT NULL,
    section_id   NUMBER(10)     NOT NULL,
    log_date     DATE           DEFAULT SYSDATE,
    old_status   CHAR(1),
    new_status   CHAR(1),
    action_taken VARCHAR2(200),
    att_pct      NUMBER(5,2)
);
/

CREATE SEQUENCE attendance_log_seq START WITH 1 INCREMENT BY 1;
/


CREATE OR REPLACE TRIGGER check_attendance_eligibility
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
DECLARE
    v_total    NUMBER := 0;
    v_present  NUMBER := 0;
    v_pct      NUMBER := 0;
    v_msg      VARCHAR2(200);
    v_log_id   NUMBER;
BEGIN
    -- Calculate current attendance percentage for this student in this section
    SELECT COUNT(*),
           SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END)
    INTO   v_total, v_present
    FROM   attendance
    WHERE  student_id = :NEW.student_id
    AND    section_id = :NEW.section_id;

    IF v_total > 0 THEN
        v_pct := ROUND((v_present / v_total) * 100, 2);
    END IF;

    -- Generate action message
    IF v_pct < 75 AND v_total >= 3 THEN
        v_msg := 'WARNING: Attendance dropped to ' || v_pct ||
                 '%. Student is NOT ELIGIBLE for exam.';
    ELSIF v_pct >= 75 THEN
        v_msg := 'OK: Attendance at ' || v_pct ||
                 '%. Student is ELIGIBLE.';
    ELSE
        v_msg := 'INFO: Attendance at ' || v_pct ||
                 '%. Insufficient data (only ' || v_total || ' records).';
    END IF;

    -- Insert into log table
    SELECT attendance_log_seq.NEXTVAL INTO v_log_id FROM DUAL;

    INSERT INTO attendance_log (
        log_id, student_id, section_id,
        log_date, old_status, new_status,
        action_taken, att_pct
    ) VALUES (
        v_log_id, :NEW.student_id, :NEW.section_id,
        SYSDATE, :OLD.status, :NEW.status,
        v_msg, v_pct
    );

EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Never block the main attendance insert
END;
/


--Checking the triggers created

SELECT trigger_name, trigger_type, status
FROM   user_triggers
ORDER  BY trigger_name;
/

--Deleting data from tables
DELETE FROM attendance;
DELETE FROM registration;
DELETE FROM section;
DELETE FROM batch;
DELETE FROM student;
DELETE FROM slot;
DELETE FROM course;
DELETE FROM faculty_coordinator;

COMMIT;

--deleting from app_users table
-- First delete the wrong record
DELETE FROM app_users WHERE username = 'admin';
COMMIT;