# Manikchand Pahade Law College, Aurangabad Attendance Management System

<div align="center">
  <img src="/attendance_system/attendance/frontend/public/logo.jpeg" alt="Law College Attendance System Logo" width="200"/>
  <br>
  <p><em>Streamlining attendance management for legal education</em></p>
  <!-- <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#api">API</a> •
    <a href="#development">Development</a>
  </p> -->

  ![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-Proprietary-red.svg)
  ![Python](https://img.shields.io/badge/python-3.8+-yellow.svg)
  ![Django](https://img.shields.io/badge/django-4.0+-green.svg)
  ![React](https://img.shields.io/badge/react-18.0+-orange.svg)
</div>

## 📋 Overview

The **Manikchand Pahade Law College, Aurangabad Attendance Management System** is a comprehensive solution designed to streamline attendance tracking, reporting, and analysis for law colleges. This system helps faculty, administrators, and students manage attendance records efficiently while ensuring compliance with attendance requirements.

## 🔧 Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React.js with Material-UI components TailwindCSS |
| **Backend** | Django (Python) |
| **Database** | MySQL |
| **API** | Django REST Framework |
| **Authentication** | JWT |

## ✨ Features

### 👑 For Administrators
- **User Management**: Create and manage accounts for faculty, staff.
- **Subject Management**: Set up Subjects, Program, and sections.
- **Timetable Management**: set up timetables, sesssion for semester.
- **Attendance Policy Configuration**: Define attendance rules and minimum attendance requirements.
- **View All Stats**: view student attendance status. view subject wise, time durationwise.
- **Reporting Dashboard**: Generate comprehensive reports on attendance patterns
- **Add Bulk Students**: att all class students at once through an excel sheet.
- **Promote Students**: Promote students for the next class ( next sem ).

### 👨‍🏫 For Faculty
- **Quick Attendance Recording**: Mark attendance with just a few clicks
- **Class Schedule View**: See upcoming classes and attendance statistics
- **Attendance Verification**: Review and update attendance records
- **Student Performance Tracking**: Monitor student attendance trends




## 💻 System Requirements

- **Python**: `3.8+`
- **Node.js**: `14.0+`
- **Database**: MySQL `5.7+`
- **Client Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

## 🚀 Installation

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/pranavsirsufale/attendance_system.git
   cd attendance
   ```

2. Create a virtual environment:
   ```bash
   python -m venv att
   source att/bin/activate  # On Windows: att\Scripts\activate.bat
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure database in `settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': 'attendance_db',
           'USER': 'db_user',
           'PASSWORD': 'db_password',
           'HOST': 'localhost',
           'PORT': '3306',
       }
   }
   ```

5. Run migrations:
   ```bash
   python manage.py makemigrations
   ```

   ```bash
   python manage.py migrate
   ```

6. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Start Django server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

## 📝 Usage Guidelines

### Initial Setup

1. Log in as administrator using the superuser credentials
2. Navigate to Admin Dashboard
3. Configure academic calendar, courses, and departments
4. Add faculty and student data or import from CSV
5. Define attendance policies and thresholds

### Taking Attendance
<!--
<div align="center">
  <img src="/api/placeholder/700/400" alt="Attendance Taking Interface" width="700"/>
</div> -->

1. Faculty logs into their account
2. Selects the course, date, and time slot
3. Marks present/absent status for each student
4. Submits and confirms the attendance record

## 📚 API Documentation

API documentation is available at `/api/docs/` when running the development server.

Example endpoint:

```http
GET /api/attendance/
Content-Type: application/json
Authorization: Bearer <token>

Response:
{
  "count": 120,
  "next": "http://example.com/api/attendance/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "student": "Pranav Sirsufale",
      "session": "Constitutional Law (Mon, 9:00 AM)",
      "status": "present",
      "timestamp": "2025-04-01T09:15:00Z",
      "recorded_by": "C. M. Rao"
    },
    // More records...
  ]
}
```

## 👨‍💻 Development

### Project Structure

```
attendance/
├── programme_attendance/
│   ├── app/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── ...
│   ├── config/
│   │   ├── settings.py
│   │   └── ...
│   └── manage.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── README.md
```

### Running Tests

Backend tests:
```bash
python manage.py test
```

Frontend tests:
```bash
cd frontend
npm test
```

### Code Style

- Backend: Follow PEP 8 guidelines
  ```bash
  # Install flake8
  pip install flake8

  # Run flake8
  flake8 .
  ```

- Frontend: ESLint with Airbnb config
  ```bash
  # Run ESLint
  npm run lint
  ```

<!-- ## 🚢 Deployment

For production deployment:

1. Set Django settings to production:
   ```python
   DEBUG = False
   ALLOWED_HOSTS = ['yourdomain.com']
   SECRET_KEY = os.environ.get('SECRET_KEY')
   ```

2. Build the React frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Collect static files:
   ```bash
   python manage.py collectstatic
   ```

4. Use Docker for containerized deployment:
   ```bash
   docker-compose up -d
   ```

5. Use a production-ready web server like Gunicorn with Nginx:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location /static/ {
           alias /path/to/static/;
       }

       location /media/ {
           alias /path/to/media/;
       }

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ``` -->

## 🔄 Database Backup

Regular database backups are essential:

```bash
# Backup MySQL database
mysqldump -u root -p law_college > attendance_backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p law_college < {created unique database name}.sql
```

## 🆘 Support and Maintenance

For technical support or system maintenance:
- 📧 Email: [pranavsirsfuale@gmail.com](mailto:pranavsirsfuale@gmail.com) | [pranav.sirsufale@antaris.global](mailto:pranav.sirsufale@antaris.global)
- ☎️ Phone: (+91) 8482852301
- 📚 Documentation: See the [wiki](https://github.com/pranavsirsufale/attendance_system) section of this repository

## 📃 License

This software is proprietary and licensed exclusively to Manikchand Pahade law college. Unauthorized distribution, modification, or use is prohibited.

## 👏 Acknowledgments

- Developed by [Pranav Sirsufale](https://www.linkedin.com/in/pranav-sirsufale-488ba4269/) ,[Rohan Magar](https://github.com/RohanMagar7)
- Special thanks to [Dr. Bharti W. Gawali](https://bamu.irins.org/profile/57209) and the faculty and administrative staff for their input and testing feedback

---

<div align="center">
  <p>© 2025 Manikchan Pahade Law College. Chh. Sambhajinagar All Rights Reserved by Pranav Sirsufale.</p>
  <p>
    <a href="https://yourwebsite.edu">Website</a> •
    <a href="https://twitter.com/yourlawcollege">Twitter</a> •
    <a href="https://facebook.com/yourlawcollege">Facebook</a>
  </p>
</div>