# campus-attendance-manager
A full-stack Campus Attendance Management System built with React, FastAPI, and Oracle Database to streamline student attendance, academic management, and database operations through a modern web interface and RESTful APIs.

<div align="center">

### A Modern Full-Stack Attendance Management System

Built using **React • FastAPI • Oracle Database**

</div>

---

## Overview

Campus Attendance Manager is a full-stack web application designed to simplify attendance management in educational institutions.

The system provides an intuitive interface for managing students, faculty members, departments, academic courses, batches, sections, and attendance records while maintaining data integrity through a normalized Oracle relational database.

This project demonstrates the practical implementation of **Database Management Systems (DBMS)** concepts along with modern **full-stack web development** practices.

---

## Features

### Authentication

- Secure user login
- User authentication

### Student Management

- Add student records
- Update student information
- Delete students
- View student details

### Faculty Management

- Add faculty members
- Update faculty information
- Manage faculty records

### Department Management

- Create departments
- Update department information
- Delete departments

### Course Management

- Add courses
- Update course information
- Manage course records

### Batch & Section Management

- Create academic batches
- Manage sections
- Organize students

### Attendance Management

- Mark attendance
- Update attendance
- View attendance history
- Maintain attendance records

### Database Features

- Oracle Database Integration
- Normalized Database Design
- SQL Script Included
- Relational Schema

---

# Technology Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React, Vite, JavaScript, HTML5, CSS3 |
| Backend | FastAPI, Python, Uvicorn |
| Database | Oracle SQL |
| Version Control | Git, GitHub |

---

# Project Structure

```
campus-attendance-manager
│
├── backend/
│
├── frontend/
│
├── database/
│   └── CampusAttendance.sql
│
├── docs/
│   ├── ER_Diagram.png
│   ├── Relational_Schema.pdf
│   ├── Normalization_Proof.pdf
│   └── System_Flowchart.pdf
│
├── screenshots/
│
├── README.md
├── LICENSE
└── .gitignore
```

---

# Prerequisites

Install the following software before running the project.

- Python 3.10+
- Node.js (Latest LTS)
- npm
- Oracle Database
- Git

---

# Installation

## Clone the Repository

```bash
git clone https://github.com/Harshitha-310/campus-attendance-manager.git
```

Navigate into the project folder.

```bash
cd campus-attendance-manager
```

---

# Backend Setup

Open a terminal.

Navigate to the backend directory.

```bash
cd backend
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

Windows

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend

```bash
uvicorn main:app --reload
```

The backend server starts at

```
http://127.0.0.1:8000
```

---

# Frontend Setup

Open another terminal.

Navigate to the frontend folder.

```bash
cd frontend
```

Install all dependencies.

```bash
npm install
```

Run the application.

```bash
npm run dev
```

The frontend starts at

```
http://localhost:5173
```

---

# Database Setup

1. Open Oracle SQL Developer.

2. Create a database connection.

3. Open the SQL script located inside

```
database/
```

4. Execute the complete SQL script.

5. Verify that all required tables are created successfully.

6. Update the database configuration in the backend if required.

---

# Running the Project

### Step 1

Start Oracle Database.

### Step 2

Run the FastAPI backend.

```bash
uvicorn main:app --reload
```

### Step 3

Run the React frontend.

```bash
npm run dev
```

### Step 4

Open your browser.

```
http://localhost:5173
```

The application should now be running successfully.

---

# API Documentation

FastAPI automatically generates interactive API documentation.

After starting the backend, open

```
http://127.0.0.1:8000/docs
```

---

# Database Documentation

The repository includes complete database documentation.

- Entity Relationship Diagram (ER Diagram)
- Relational Schema
- Database Normalization
- SQL Database Script
- System Flowchart

---

# Future Enhancements

- QR Code Attendance
- Attendance Analytics Dashboard
- Email Notifications
- PDF Report Export
- Excel Report Export
- Cloud Deployment
- Mobile Responsive Design
- Role-Based Authorization

---

# Learning Outcomes

This project demonstrates practical implementation of

- Database Management Systems
- Oracle Database
- SQL
- Database Normalization
- React Development
- FastAPI
- RESTful APIs
- CRUD Operations
- Full-Stack Web Development
- Git & GitHub

---

# Contributing

Contributions, suggestions, and improvements are welcome.

Feel free to fork the repository and submit a pull request.

---

# Author

**Sudha Harshitha**

Computer Engineering Student

GitHub: https://github.com/YOUR_GITHUB_USERNAME

---

# License

This project is licensed under the MIT License.

See the LICENSE file for additional information.
