import os

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate, MigrateCommand
from flask_script import Manager
from flask_sqlalchemy import SQLAlchemy

MYSQL_DB_USER = os.getenv('MYSQL_DB_USER')
MYSQL_DB_PASSWORD = os.getenv('MYSQL_DB_PASSWORD')
SQLALCHEMY_SECRET_KEY = os.getenv('SQLALCHEMY_SECRET_KEY')

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = SQLALCHEMY_SECRET_KEY
app.config[
    'SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{MYSQL_DB_USER}:{MYSQL_DB_PASSWORD}@db/cpms'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SQLALCHEMY_BINDS = {'sqlitedb': 'sqlite:///pythonsqlite.db'}
app.config['SQLALCHEMY_BINDS'] = SQLALCHEMY_BINDS

db = SQLAlchemy(app)
with app.app_context():
    db.init_app(app)
migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

BACKEND_CORS_ORIGINS = 'http://localhost:3000,http://localhost:5000'

origins = []

# Set all CORS enabled origins
if BACKEND_CORS_ORIGINS:
    origins_raw = BACKEND_CORS_ORIGINS.split(",")
    for origin in origins_raw:
        use_origin = origin.strip()
        origins.append(use_origin)

    CORS(app, origins=origins, supports_credentials=True)


class LogTable(db.Model):
    __bind_key__ = 'sqlitedb'
    __tablename__ = 'logTable'
    id = db.Column(db.Integer(), primary_key=True)
    uid = db.Column(db.String(), nullable=True)
    dateCreated = db.Column(db.DateTime, nullable=False)
    logLevel = db.Column(db.Integer(), nullable=False)
    statusCode = db.Column(db.Integer(), nullable=False)
    jsonResponse = db.Column(db.String(), nullable=True)
    requestBody = db.Column(db.String(), nullable=True)
    requestHeaders = db.Column(db.String(), nullable=True)
    requestArgs = db.Column(db.String(), nullable=True)
    errorMessage = db.Column(db.String(), nullable=True)
    type = db.Column(db.String(), nullable=True)
    endpoint = db.Column(db.String())

    def __init__(self, id, endpoint, dateCreated, logLevel, statusCode=None, jsonResponse=None, requestBody=None,
                 requestHeaders=None, requestArgs=None, errorMessage=None, type=None, uid=None):
        self.id = id
        self.endpoint = endpoint
        self.dateCreated = dateCreated
        self.logLevel = logLevel
        self.jsonResponse = jsonResponse
        self.requestBody = requestBody
        self.requestHeaders = requestHeaders
        self.requestArgs = requestArgs
        self.errorMessage = errorMessage
        self.statusCode = statusCode
        self.type = type
        self.uid = uid

    def serialize(self):
        return {"id": self.id,
                "endpoint": self.endpoint,
                "dateCreated": self.dateCreated,
                "logLevel": self.logLevel,
                "jsonResponse": self.jsonResponse,
                "requestBody": self.requestBody,
                "requestHeaders": self.requestHeaders,
                "requestArgs": self.requestArgs,
                "errorMessage": self.errorMessage,
                "statusCode": self.statusCode,
                "type": self.type,
                "uid": self.uid}


class Files(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    projectId = db.Column(db.Integer)
    teamId = db.Column(db.Integer)
    itemId = db.Column(db.Integer)
    numOfUpdates = db.Column(db.Integer)
    name = db.Column()
    url = db.Column()
    fileComponentId = db.Column()
    submissionDate = db.Column(db.DateTime)
    deadline = db.Column(db.DateTime)

    def __init__(self, projectId, teamId, fileId, name, url, fileComponentId, itemId, deadline, submissionDate):
        self.projectId = projectId
        self.teamId = teamId
        self.itemId = itemId
        self.id = fileId
        self.name = name
        self.url = url
        self.fileComponentId = fileComponentId
        self.submissionDate = submissionDate
        self.deadline = deadline
        self.numOfUpdates = 0

    def update(self, name, url, numOfUpdates, deadline, submissionDate):
        self.name = name
        self.url = url
        self.numOfUpdates = numOfUpdates
        self.submissionDate = submissionDate
        self.deadline = deadline

    def serialize(self):
        return {"projectId": self.projectId,
                "teamId": self.teamId,
                "itemId": self.itemId,
                "id": self.id,
                "name": self.name,
                "url": self.url,
                "fileComponentId": self.fileComponentId,
                "submissionDate": self.submissionDate,
                "deadline": self.deadline,
                "numOfUpdates": self.numOfUpdates}


class Teams(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    projectId = db.Column(db.String(64), db.ForeignKey('projects.id'), nullable=True)
    creatorId = db.Column(db.String(64), nullable=False)
    comment = db.Column(db.String(64), nullable=True)

    def __init__(self, id, creatorId, projectId=None, comment=None):
        self.id = id
        self.projectId = projectId
        self.comment = comment
        self.creatorId = creatorId

    def serialize(self):
        return {"id": self.id,
                "projectId": self.projectId,
                "comment": self.comment,
                "creatorId": self.creatorId}

    def update(self, id, creatorId, projectId=None, comment=None):
        self.id = id
        self.projectId = projectId
        self.comment = comment
        self.creatorId = creatorId


class Organizations(db.Model):
    __tablename__ = 'organizations'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.String(64), nullable=False)

    def __init__(self, id, name, description):
        self.id = id
        self.name = name
        self.description = description

    def serialize(self):
        return {"id": self.id,
                "name": self.name,
                "description": self.description}

    def update(self, id, name, description):
        self.id = id
        self.name = name
        self.description = description


class Projects(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    name = db.Column(db.String(64, collation='utf8_bin'))
    organizationId = db.Column(db.Integer)
    teamId = db.Column(db.Integer, db.ForeignKey('teams.id'))
    numOfSemesters = db.Column(db.Integer)
    description = db.Column(db.String(64))
    academicAdvisorId = db.Column(db.String(64))
    industrialAdvisorId = db.Column(db.String(64))
    status = db.Column(db.String(64))
    initiationDate = db.Column(db.DateTime)
    assignDate = db.Column(db.DateTime)
    endDate = db.Column(db.DateTime)
    contactName = db.Column(db.String(64))
    contactPhone = db.Column(db.String(64))
    contactEmail = db.Column(db.String(64))
    contactIsAdvisor = db.Column(db.Boolean)
    approvedRequestsIds = db.Column(db.String(64))
    lastVerified = db.Column(db.DateTime)

    def __init__(self, id, name, organizationId, teamId, numOfSemesters, description, academicAdvisorId,
                 industrialAdvisorId, status, initiationDate,
                 assignDate, endDate, contactName, contactPhone, contactEmail, contactIsAdvisor, approvedRequestsIds,
                 lastVerified):
        self.id = id
        self.name = name
        self.organizationId = organizationId
        self.teamId = teamId
        self.numOfSemesters = numOfSemesters
        self.description = description
        self.academicAdvisorId = academicAdvisorId
        self.industrialAdvisorId = industrialAdvisorId
        self.status = status
        self.initiationDate = initiationDate
        self.assignDate = assignDate
        self.endDate = endDate
        self.contactName = contactName
        self.contactPhone = contactPhone
        self.contactEmail = contactEmail
        self.contactIsAdvisor = contactIsAdvisor
        self.approvedRequestsIds = approvedRequestsIds
        self.lastVerified = lastVerified

    def serialize(self):
        return {"id": self.id,
                "name": self.name,
                "organizationId": self.organizationId,
                "teamId": self.teamId,
                "numOfSemesters": self.numOfSemesters,
                "description": self.description,
                "academicAdvisorId": self.academicAdvisorId,
                "industrialAdvisorId": self.industrialAdvisorId,
                "status": self.status,
                "initiationDate": self.initiationDate,
                "assignDate": self.assignDate,
                "endDate": self.endDate,
                "contactName": self.contactName,
                "contactPhone": self.contactPhone,
                "contactEmail": self.contactEmail,
                "contactIsAdvisor": self.contactIsAdvisor,
                "lastVerified": self.lastVerified,
                "approvedRequestsIds": self.approvedRequestsIds.split(',') if self.approvedRequestsIds else None}

    def update(self, id, name, organizationId, teamId, numOfSemesters, description, academicAdvisorId,
               industrialAdvisorId, status, initiationDate,
               assignDate, endDate, contactName, contactPhone, contactEmail, contactIsAdvisor, approvedRequestsIds,
               lastVerified):
        self.id = id
        self.name = name
        self.organizationId = organizationId
        self.teamId = teamId
        self.numOfSemesters = numOfSemesters
        self.description = description
        self.academicAdvisorId = academicAdvisorId
        self.industrialAdvisorId = industrialAdvisorId
        self.status = status
        self.initiationDate = initiationDate
        self.assignDate = assignDate
        self.endDate = endDate
        self.contactName = contactName
        self.contactPhone = contactPhone
        self.contactEmail = contactEmail
        self.contactIsAdvisor = contactIsAdvisor
        self.approvedRequestsIds = approvedRequestsIds
        self.lastVerified = lastVerified


class Projects_cpms2011(db.Model):
    __tablename__ = 'projects_cpms2011'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    name = db.Column(db.String(64, collation='utf8_bin'))
    organizationName = db.Column(db.String(64))
    teamId = db.Column(db.Integer)
    numOfSemesters = db.Column(db.Integer)
    description = db.Column(db.String(64))
    academicAdvisorId = db.Column(db.String(64))
    industrialAdvisorId = db.Column(db.String(64))
    status = db.Column(db.String(64))
    initiationDate = db.Column(db.DateTime)
    assignDate = db.Column(db.DateTime)
    endDate = db.Column(db.DateTime)
    contactName = db.Column(db.String(64))
    contactPhone = db.Column(db.String(64))
    contactEmail = db.Column(db.String(64))
    contactIsAdvisor = db.Column(db.Boolean)

    def __init__(self, id, name, organizationName, teamId, numOfSemesters, description, academicAdvisorId,
                 industrialAdvisorId, status, initiationDate,
                 assignDate, endDate, contactName, contactPhone, contactEmail, contactIsAdvisor, ):
        self.id = id
        self.name = name
        self.organizationName = organizationName
        self.teamId = teamId
        self.numOfSemesters = numOfSemesters
        self.description = description
        self.academicAdvisorId = academicAdvisorId
        self.industrialAdvisorId = industrialAdvisorId
        self.status = status
        self.initiationDate = initiationDate
        self.assignDate = assignDate
        self.endDate = endDate
        self.contactName = contactName
        self.contactPhone = contactPhone
        self.contactEmail = contactEmail
        self.contactIsAdvisor = contactIsAdvisor

    def serialize(self):
        return {"id": self.id,
                "name": self.name,
                "organizationName": self.organizationName,
                "teamId": self.teamId,
                "numOfSemesters": self.numOfSemesters,
                "description": self.description,
                "academicAdvisorId": self.academicAdvisorId,
                "industrialAdvisorId": self.industrialAdvisorId,
                "status": self.status,
                "initiationDate": self.initiationDate,
                "assignDate": self.assignDate,
                "endDate": self.endDate,
                "contactName": self.contactName,
                "contactPhone": self.contactPhone,
                "contactEmail": self.contactEmail,
                "contactIsAdvisor": self.contactIsAdvisor}

    def update(self, id, name, organizationName, teamId, numOfSemesters, description, academicAdvisorId,
               industrialAdvisorId, status, initiationDate,
               assignDate, endDate, contactName, contactPhone, contactEmail, contactIsAdvisor
               ):
        self.id = id
        self.name = name
        self.organizationName = organizationName
        self.teamId = teamId
        self.numOfSemesters = numOfSemesters
        self.description = description
        self.academicAdvisorId = academicAdvisorId
        self.industrialAdvisorId = industrialAdvisorId
        self.status = status
        self.initiationDate = initiationDate
        self.assignDate = assignDate
        self.endDate = endDate
        self.contactName = contactName
        self.contactPhone = contactPhone
        self.contactEmail = contactEmail
        self.contactIsAdvisor = contactIsAdvisor


class TeamsProjectsRequests(db.Model):
    __tablename__ = 'teamsprojectsrequests'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    teamId = db.Column(db.Integer)
    projectId = db.Column(db.Integer)
    adminStatus = db.Column(db.String(64), nullable=False)

    def __init__(self, id, teamId, projectId, adminStatus):
        self.id = id
        self.teamId = teamId
        self.projectId = projectId
        self.adminStatus = adminStatus

    def serialize(self):
        return {"id": self.id,
                "teamId": self.teamId,
                "projectId": self.projectId,
                "adminStatus": self.adminStatus}

    def update(self, id, teamId, projectId, adminStatus):
        self.id = id
        self.teamId = teamId
        self.projectId = projectId
        self.adminStatus = adminStatus


class Events(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    title = db.Column(db.String(64), nullable=True)
    start = db.Column(db.Integer)
    end = db.Column(db.String(64), nullable=True)
    type = db.Column(db.String(15), nullable=True)
    location = db.Column(db.String(64), nullable=True)
    description = db.Column(db.String(64), nullable=True)
    color = db.Column(db.String(64), nullable=True)
    displayToAll = db.Column(db.Boolean, nullable=True)
    courseId = db.Column(db.String(64), nullable=True)
    sessionTime = db.Column(db.Integer, nullable=True)

    def __init__(self, id, title, start, end, type, location, description, color, displayToAll, courseId,
                 sessionTime):
        self.id = id
        self.title = title
        self.start = start
        self.end = end
        self.type = type
        self.location = location
        self.description = description
        self.color = color
        self.displayToAll = displayToAll
        self.courseId = courseId
        self.sessionTime = sessionTime

    def serialize(self):
        return {"id": self.id,
                "title": self.title,
                "start": str(self.start),
                "end": str(self.end),
                "type": self.type,
                "location": self.location,
                "description": self.description,
                "color": self.color,
                "displayToAll": self.displayToAll,
                "courseId": self.courseId,
                "sessionTime": self.sessionTime}

    def update(self, id, title, start, end, type, location, description, color, displayToAll, courseId,
               sessionTime):
        self.id = id
        self.title = title
        self.start = start
        self.end = end
        self.type = type
        self.location = location
        self.description = description
        self.color = color
        self.displayToAll = displayToAll
        self.courseId = courseId
        self.sessionTime = sessionTime


class Schedule(db.Model):
    __tablename__ = 'schedule'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    time = db.Column(db.String(64), nullable=True)
    duration = db.Column(db.Integer)
    projectId = db.Column(db.Integer)
    teamId = db.Column(db.Integer)
    eventId = db.Column(db.Integer)

    def __init__(self, id, time, duration, projectId, teamId, eventId):
        self.id = id
        self.time = time
        self.duration = duration
        self.projectId = projectId
        self.teamId = teamId
        self.eventId = eventId

    def serialize(self):
        return {"id": self.id,
                "time": self.time,
                "duration": self.duration,
                "projectId": self.projectId,
                "teamId": self.teamId,
                "eventId": self.eventId}

    def update(self, id, time, duration, projectId, teamId, eventId):
        self.id = id
        self.time = time
        self.duration = duration
        self.projectId = projectId
        self.teamId = teamId
        self.eventId = eventId


class Semesters(db.Model):
    __tablename__ = 'semesters'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    title = db.Column(db.String(64), nullable=True)
    startDate = db.Column(db.DateTime, nullable=True)
    endDate = db.Column(db.DateTime, nullable=True)
    isCurrent = db.Column(db.Boolean, nullable=True)

    def __init__(self, id, title, startDate, endDate, isCurrent):
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.isCurrent = isCurrent

    def serialize(self):
        return {"id": self.id,
                "title": self.title,
                "startDate": str(self.startDate),
                "endDate": str(self.endDate),
                "isCurrent": self.isCurrent}

    def update(self, id, title, startDate, endDate, isCurrent):
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.isCurrent = isCurrent


class Courses(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.String(64))
    continuationOfCourse = db.Column(db.Integer)

    def __init__(self, id, name, description, continuationOfCourse):
        self.id = id
        self.name = name
        self.description = description
        self.continuationOfCourse = continuationOfCourse

    def serialize(self):
        return {"id": self.id,
                "name": self.name,
                "description": self.description,
                "continuationOfCourse": self.continuationOfCourse}

    def update(self, id, name, description, continuationOfCourse):
        self.id = id
        self.name = name
        self.description = description
        self.continuationOfCourse = continuationOfCourse


class StudentsFindPartners(db.Model):
    __tablename__ = 'studentsfindpartners'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    student = db.Column(db.String(64), nullable=True)

    def __init__(self, id, student=None):
        self.id = id
        self.student = student

    def serialize(self):
        return {"id": self.id,
                "student": self.student}

    def update(self, id, student=None):
        self.id = id
        self.student = student


class TeamsFindPartners(db.Model):
    __tablename__ = 'teamsfindpartners'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    student = db.Column(db.String(64), nullable=True)

    def __init__(self, id, student=None):
        self.id = id
        self.student = student

    def serialize(self):
        return {"id": self.id,
                "student": self.student}

    def update(self, id, student=None):
        self.id = id
        self.student = student


class ProjectProposals(db.Model):
    __tablename__ = 'projectproposals'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    name = db.Column(db.String(64, collation='utf8_bin'))
    organizationId = db.Column(db.Integer)
    description = db.Column(db.String(64))
    numOfSemesters = db.Column(db.Integer)
    initiationDate = db.Column(db.DateTime)
    contactName = db.Column(db.String(64))
    contactPhone = db.Column(db.String(64))
    contactEmail = db.Column(db.String(64))
    contactIsAdvisor = db.Column(db.Boolean)
    academicAdvisorId = db.Column(db.String(64))
    industrialAdvisorId = db.Column(db.String(64))

    def __init__(self, id, name, organizationId, numOfSemesters, description, initiationDate,
                 contactName, contactPhone, contactEmail, contactIsAdvisor, academicAdvisorId, industrialAdvisorId):
        self.id = id
        self.name = name
        self.organizationId = organizationId
        self.numOfSemesters = numOfSemesters
        self.description = description
        self.initiationDate = initiationDate
        self.contactName = contactName
        self.contactPhone = contactPhone
        self.contactEmail = contactEmail
        self.contactIsAdvisor = contactIsAdvisor
        self.academicAdvisorId = academicAdvisorId
        self.industrialAdvisorId = industrialAdvisorId

    def serialize(self):
        return {"id": self.id,
                "name": self.name,
                "organizationId": self.organizationId,
                "numOfSemesters": self.numOfSemesters,
                "description": self.description,
                "initiationDate": self.initiationDate,
                "contactName": self.contactName,
                "contactPhone": self.contactPhone,
                "contactEmail": self.contactEmail,
                "contactIsAdvisor": self.contactIsAdvisor,
                "academicAdvisorId": self.academicAdvisorId,
                "industrialAdvisorId": self.industrialAdvisorId}

    def update(self, id, name, organizationId, numOfSemesters, description, initiationDate,
               contactName, contactPhone, contactEmail, contactIsAdvisor, academicAdvisorId=None,
               industrialAdvisorId=None):
        self.id = id
        self.name = name
        self.organizationId = organizationId
        self.numOfSemesters = numOfSemesters
        self.description = description
        self.initiationDate = initiationDate
        self.contactName = contactName
        self.contactPhone = contactPhone
        self.contactEmail = contactEmail
        self.contactIsAdvisor = contactIsAdvisor
        self.academicAdvisorId = academicAdvisorId
        self.industrialAdvisorId = industrialAdvisorId


class DelayRequests(db.Model):
    __tablename__ = 'delayrequests'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    projectId = db.Column(db.Integer)
    teamId = db.Column(db.String(64), nullable=False)
    studentId = db.Column(db.String(64), db.ForeignKey('users.firebase_user_id'), nullable=False)
    subject = db.Column(db.String(64), nullable=False)
    body = db.Column(db.String(64), nullable=False)
    requestedDate = db.Column(db.DateTime)
    answeredDate = db.Column(db.DateTime)
    answer = db.Column(db.String(64), nullable=False)
    status = db.Column(db.String(64), nullable=False)

    def __init__(self, id, projectId, studentId, teamId, subject, body, requestedDate, answeredDate, answer, status):
        self.id = id
        self.projectId = projectId
        self.studentId = studentId
        self.teamId = teamId
        self.subject = subject
        self.body = body
        self.requestedDate = requestedDate
        self.answeredDate = answeredDate
        self.answer = answer
        self.status = status

    def serialize(self):
        return {"id": self.id,
                "projectId": self.projectId,
                "studentId": self.studentId,
                "teamId": self.teamId,
                "subject": self.subject,
                "body": self.body,
                "requestedDate": str(self.requestedDate),
                "answeredDate": str(self.answeredDate),
                "answer": self.answer,
                "status": self.status}

    def update(self, id, projectId, studentId, teamId, subject, body, requestedDate, answeredDate, answer, status):
        self.id = id
        self.projectId = projectId
        self.studentId = studentId
        self.teamId = teamId
        self.subject = subject
        self.body = body
        self.requestedDate = requestedDate
        self.answeredDate = answeredDate
        self.answer = answer
        self.status = status


class GenericItemToCourse(db.Model):
    __tablename__ = 'genericitemtocourse'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    courseId = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    genericItemId = db.Column(db.Integer, db.ForeignKey('genericitems.id'), nullable=True)

    def __init__(self, id, courseId, genericItemId):
        self.id = id
        self.genericItemId = genericItemId
        self.courseId = courseId

    def update(self, id, courseId, genericItemId):
        self.id = id
        self.genericItemId = genericItemId
        self.courseId = courseId

    def serialize(self):
        return {"id": self.id,
                "genericItemId": self.genericItemId,
                "courseId": self.courseId}


class GenericItems(db.Model):
    __tablename__ = 'genericitems'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    header = db.Column(db.String(64))
    body = db.Column(db.String(64))
    fileId = db.Column(db.Integer, nullable=True)
    type = db.Column(db.String(64))
    date = db.Column(db.DateTime)

    def __init__(self, id, header, body, type, date, fileId=None):
        self.id = id
        self.header = header
        self.body = body
        self.fileId = fileId
        self.type = type
        self.date = date

    def update(self, id, header, body, type, date, fileId=None):
        self.id = id
        self.header = header
        self.body = body
        self.fileId = fileId
        self.type = type
        self.date = date

    def serialize(self):
        return {"id": self.id,
                "header": self.header,
                "body": self.body,
                "fileId": self.fileId,
                "type": self.type,
                "date": str(self.date)}


class Personel_cpms2011(db.Model):
    __tablename__ = 'personel_cpms2011'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    prefix = db.Column(db.String(64))
    advisorType = db.Column(db.String(64))
    engFirstName = db.Column(db.String(64))
    engLastName = db.Column(db.String(64))
    hebFirstName = db.Column(db.String(64))
    hebLastName = db.Column(db.String(64))
    email = db.Column(db.String(64))
    workPhone = db.Column(db.String(64))
    cellPhone = db.Column(db.String(64))
    organizationId = db.Column(db.Integer)

    def __init__(self, id, prefix, advisorType, engFirstName, engLastName, hebFirstName, hebLastName,
                 email, workPhone, cellPhone, organizationId):
        self.id = id
        self.prefix = prefix
        self.advisorType = advisorType
        self.engFirstName = engFirstName
        self.engLastName = engLastName
        self.hebFirstName = hebFirstName
        self.hebLastName = hebLastName
        self.email = email
        self.workPhone = workPhone
        self.cellPhone = cellPhone
        self.organizationId = organizationId

    def serialize(self):
        return {"id": self.id,
                "prefix": self.prefix,
                "advisorType": self.advisorType,
                "engFirstName": self.engFirstName,
                "engLastName": self.engLastName,
                "hebFirstName": self.hebFirstName,
                "hebLastName": self.hebLastName,
                "email": self.email,
                "workPhone": self.workPhone,
                "cellPhone": self.cellPhone,
                "organizationId": self.organizationId}

    def update(self, id, prefix, advisorType, engFirstName, engLastName, hebFirstName, hebLastName,
               email, workPhone, cellPhone, organizationId
               ):
        self.id = id
        self.prefix = prefix
        self.advisorType = advisorType
        self.engFirstName = engFirstName
        self.engLastName = engLastName
        self.hebFirstName = hebFirstName
        self.hebLastName = hebLastName
        self.email = email
        self.workPhone = workPhone
        self.cellPhone = cellPhone
        self.organizationId = organizationId


class Teams_cpms2011(db.Model):
    __tablename__ = 'teams_cpms2011'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    students = db.Column(db.String(64), nullable=True)

    def __init__(self, id, students):
        self.id = id
        self.students = students

    def serialize(self):
        return {"id": self.id,
                "students": self.students}

    def update(self, id, students):
        self.id = id
        self.students = students


class Users(db.Model):
    __tablename__ = 'users'
    firebase_user_id = db.Column(db.String(255), unique=True, primary_key=True)
    id = db.Column(db.Integer, nullable=True)
    hebFirstName = db.Column(db.String(255), nullable=True)
    hebLastName = db.Column(db.String(255), nullable=True)
    engFirstName = db.Column(db.String(255), nullable=True)
    engLastName = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    cellPhone = db.Column(db.String(64), nullable=True)
    workPhone = db.Column(db.String(64), nullable=True)
    is_admin = db.Column(db.Boolean, nullable=True)
    prefix = db.Column(db.String(64), nullable=True)
    user_type = db.Column(db.String(64), nullable=True)
    organizationId = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=True)
    advisorType = db.Column(db.String(64), nullable=True)
    faculty = db.Column(db.String(64), nullable=True)
    semesterId = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=True)
    courseId = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    teamId = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=True)

    def __init__(self, firebase_user_id, id, hebFirstName, hebLastName, engFirstName, engLastName, email, cellPhone,
                 is_admin, prefix, user_type, advisorType=None, organizationId=None, workPhone=None, faculty=None,
                 semesterId=None, courseId=None,
                 teamId=None):
        self.firebase_user_id = firebase_user_id
        self.id = id
        self.hebFirstName = hebFirstName
        self.hebLastName = hebLastName
        self.engFirstName = engFirstName
        self.engLastName = engLastName
        self.email = email
        self.cellPhone = cellPhone
        self.workPhone = workPhone
        self.is_admin = is_admin
        self.prefix = prefix
        self.user_type = user_type
        self.organizationId = organizationId
        self.advisorType = advisorType
        self.faculty = faculty
        self.semesterId = semesterId
        self.courseId = courseId
        self.teamId = teamId

    def serialize(self):
        return {
            "firebase_user_id": self.firebase_user_id,
            "id": self.id,
            "hebFirstName": self.hebFirstName,
            "hebLastName": self.hebLastName,
            "engFirstName": self.engFirstName,
            "engLastName": self.engLastName,
            "email": self.email,
            "cellPhone": self.cellPhone,
            "workPhone": self.workPhone,
            "is_admin": self.is_admin,
            "prefix": self.prefix,
            "user_type": self.user_type,
            "organizationId": self.organizationId,
            "advisorType": self.advisorType,
            "faculty": self.faculty,
            "semesterId": self.semesterId,
            "courseId": self.courseId,
            "teamId": self.teamId}

    def update(self, firebase_user_id, id, hebFirstName, hebLastName, engFirstName, engLastName, email, cellPhone,
               is_admin, prefix, user_type, advisorType, organizationId=None, workPhone=None, faculty=None,
               semesterId=None, courseId=None,
               teamId=None):
        self.firebase_user_id = firebase_user_id
        self.id = id
        self.hebFirstName = hebFirstName
        self.hebLastName = hebLastName
        self.engFirstName = engFirstName
        self.engLastName = engLastName
        self.email = email
        self.cellPhone = cellPhone
        self.workPhone = workPhone
        self.is_admin = is_admin
        self.prefix = prefix
        self.user_type = user_type
        self.organizationId = organizationId
        self.advisorType = advisorType
        self.faculty = faculty
        self.semesterId = semesterId
        self.courseId = courseId
        self.teamId = teamId


class SyllabusConfirmation(db.Model):
    __tablename__ = 'syllabusconfirmation'
    id = db.Column(db.String(255), unique=True, primary_key=True)
    confirmation = db.Column(db.Boolean, nullable=True)

    def __init__(self, id, confirmation):
        self.id = id
        self.confirmation = confirmation

    def serialize(self):
        return {"id": self.id,
                "confirmation": self.confirmation}

    def update(self, id, confirmation):
        self.id = id
        self.confirmation = confirmation
