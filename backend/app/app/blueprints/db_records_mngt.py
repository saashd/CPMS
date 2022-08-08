#!/usr/bin/python
# coding=utf-8
"""
Author:  moshed
Created on 11/02/2021

"""

import json
import os
from copy import copy
from datetime import date, datetime

import pandas as pd
import requests
from firebase_admin import firestore
from flask import Blueprint, jsonify, request
from mysql.connector import connect, Error
from sqlalchemy import or_
from sqlalchemy.sql import func

from ..algorithm.trainModel import predict
from ..models import app, db, Teams, Projects, Organizations, TeamsProjectsRequests, Events, Schedule, Semesters, \
    StudentsFindPartners, TeamsFindPartners, ProjectProposals, DelayRequests, GenericItems, Courses, Files, \
    Projects_cpms2011, Personel_cpms2011, Teams_cpms2011, Users, GenericItemToCourse, SyllabusConfirmation
from ..sendEmail import sendMessage

MYSQL_DB_USER = os.getenv('MYSQL_DB_USER')
MYSQL_DB_PASSWORD = os.getenv('MYSQL_DB_PASSWORD')

dbs = {'teams': Teams,
       'teams_cpms2011': Teams_cpms2011,
       'events': Events,
       'schedule': Schedule,
       'projects': Projects,
       'projects_cpms2011': Projects_cpms2011,
       'organizations': Organizations,
       'teamsProjectsRequests': TeamsProjectsRequests,
       'semesters': Semesters,
       'studentsFindPartners': StudentsFindPartners,
       'teamsFindPartners': TeamsFindPartners,
       'projectProposals': ProjectProposals,
       'delayRequests': DelayRequests,
       'genericItems': GenericItems,
       'courses': Courses,
       'files': Files,
       'personel_cpms2011': Personel_cpms2011,
       'users': Users,
       'genericitemtocourse': GenericItemToCourse,
       'syllabusconfirmation': SyllabusConfirmation}


def construct_blueprint(dbRef):
    db_records_mngt_bp = Blueprint('db_records_mngt_bp', __name__, )
    refs = {'evaluationPages': dbRef.child('evaluationPages'),
            'gradeTemplates': dbRef.child('gradeTemplates'),
            'fileTemplates': dbRef.child('fileTemplates'),
            'notifications': dbRef.child('notifications'),
            'studentsGrades': dbRef.child('studentsGrades'),
            'filesTemplatePerTeam': dbRef.child('filesTemplatePerTeam')}

    @db_records_mngt_bp.route('/getFiles', methods=['GET', 'POST'])
    def getFiles():
        projectId = request.args.get("projectId", default=None)
        itemId = request.args.get("itemId", default=None)
        files = None
        try:
            if projectId:
                files = dbs['files'].query.filter_by(projectId=projectId).all()
            elif itemId:
                files = dbs['files'].query.filter_by(itemId=itemId).all()
            if files is None:
                return jsonify([])
            else:
                files = [u.serialize() for u in files]
                return jsonify(files), 200
        except Exception as err:
            response = {"message": f'error occurred while retrieving {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/getFilesCPMS2011', methods=['GET', 'POST'])
    def getFilesCPMS2011():
        projectId = request.args.get("projectId", default=None)
        try:
            if projectId:
                directory = os.path.realpath(
                    os.path.join(os.getcwd(), os.path.dirname(__file__), '../static/uploads/CPMS2011_Projects_Files/',
                                 str(projectId)))
                documents = []
                for path, subdirs, files in os.walk(directory):
                    for name in files:
                        if '_vti_cnf' in path:
                            continue
                        doc_title = path.split('\\')[-1]
                        documents.append({'title': doc_title, 'name': name, 'project_id': projectId})
                return jsonify(documents), 200
        except Exception as err:
            response = {"message": f'error occurred while retrieving {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/loadCPMS2011Data/<filename>', methods=['POST'])
    def loadCPMS2011Data(filename=None):
        try:
            connection = connect(
                host="db",
                user=MYSQL_DB_USER,
                password=MYSQL_DB_PASSWORD,
                database="cpms",
            )
            if connection.is_connected():
                db_Info = connection.get_server_info()
                cursor = connection.cursor()
                # Using readlines()
                file = open(os.path.realpath(
                    os.path.join(os.getcwd(), os.path.dirname(__file__), '../static/legacyMySqlData/', filename)), 'r',
                    encoding="utf8")
                Lines = file.readlines()
                count = 0
                # Strips the newline character
                for line in Lines:
                    count += 1
                    try:
                        cursor.execute(line)
                    except Error as err:
                        response = {"message": f"Error while uploading file {str(err)}"}
                        return jsonify(response), 500
                connection.commit()
        except Error as err:
            response = {"message": f"Error while uploading file {str(err)}"}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/loadMySQLData', methods=['POST'])
    def loadMySQLData():
        try:
            connection = connect(
                host="db",
                user=MYSQL_DB_USER,
                password=MYSQL_DB_PASSWORD,
                database="cpms",
            )
            if connection.is_connected():
                db_Info = connection.get_server_info()

                # Using readlines()
                file = open(os.path.realpath(
                    os.path.join(os.getcwd(), os.path.dirname(__file__), '../static/', 'mysql_migration_inserts.txt')),
                    'r',
                    encoding="utf8")
                Lines = file.readlines()
                count = 0
                # Strips the newline character

                for line in Lines:
                    cursor = connection.cursor()
                    count += 1
                    try:
                        cursor.execute("SET FOREIGN_KEY_CHECKS=0")
                        cursor.execute(line)
                    except Error as err:
                        response = {"message": f"Error while inserting line {line}, error:{str(err)}"}
                        return jsonify(response), 500
                cursor.execute("SET FOREIGN_KEY_CHECKS=1")
                cursor.close()
                connection.commit()
        except Error as err:
            response = {"message": f"Error while inserting {str(err)}"}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/uploadFile', methods=['POST'])
    # argument: json with User class fields
    def uploadFile():
        if request.files:
            try:
                nextId = db.session.query(func.max(dbs['files'].id)).scalar()
                nextId = 1 if nextId is None else nextId + 1
                fileToUpload = request.files["file"]
                projectId = int(request.form["projectId"]) if "projectId" in request.form else None
                deadline = request.form["deadline"] if "deadline" in request.form else None
                submissionDate = request.form["submissionDate"] if "submissionDate" in request.form else None
                teamId = None
                path = './static/uploads/'
                if projectId:
                    path = path + str(projectId) + '/'
                    if not os.path.exists(path):
                        os.makedirs(path)
                    project = Projects.query.filter_by(id=projectId).one()
                    teamId = project.teamId
                itemId = int(request.form["itemId"]) if "itemId" in request.form else None
                if itemId:
                    dbs['genericItems'].query.filter_by(id=itemId).update({'fileId': nextId})
                fileComponentId = request.form["fileComponentId"] if "fileComponentId" in request.form else None
                url = path + fileToUpload.filename

                fileToUpload.save(
                    os.path.join(path, fileToUpload.filename))
                file = dbs['files'](projectId, teamId, nextId, fileToUpload.filename, url, fileComponentId, itemId,
                                    deadline, submissionDate)
                db.session.add(file)
                db.session.commit()
                file = file.serialize()
                return jsonify({"message": file}), 200
            except Exception as err:
                response = {"message": f"Error while uploading file {str(err)}"}
                return jsonify(response), 500

    @db_records_mngt_bp.route('/updateUploadedFile', methods=['POST'])
    # argument: json with User class fields
    def updateUploadedFile():
        if request.files:
            try:
                fileId = int(request.form["id"])
                fileToUpload = request.files["file"]
                deadline = request.form["deadline"] if "deadline" in request.form else None
                submissionDate = request.form["submissionDate"] if "submissionDate" in request.form else None
                existingFile = dbs['files'].query.filter_by(id=fileId).first()
                path = 'static/uploads/'
                projectId = int(request.form["projectId"]) if "projectId" in request.form else None
                if projectId:
                    path = path + str(projectId) + '/'
                url = path + fileToUpload.filename
                directory = os.path.join(app.instance_path, '..', path)
                # add uploaded file to folder.
                fileToUpload.save(
                    os.path.join(directory, fileToUpload.filename))
                oldFileURL = existingFile.url
                existingFile.update(fileToUpload.filename, url, existingFile.numOfUpdates + 1, deadline, submissionDate)
                db.session.commit()
                os.remove(oldFileURL)
                existingFile = existingFile.serialize()
                return jsonify({"message": existingFile}), 200
            except Exception as err:
                response = {"message": f"Error while updating file {str(err)}"}
                return jsonify(response), 500

    @db_records_mngt_bp.route('/deleteFile', methods=['POST'])
    # argument : file tag and project ID.
    def deleteFile():
        projectId = int(request.form["projectId"]) if "projectId" in request.form else None
        itemId = int(request.form["itemId"]) if "itemId" in request.form else None
        fileComponentId = request.form["fileComponentId"] if "fileComponentId" in request.form else None
        if projectId:
            file = dbs['files'].query.filter_by(projectId=projectId, fileComponentId=fileComponentId).first()
        elif itemId:
            file = dbs['files'].query.filter_by(itemId=itemId).first()
            dbs['genericItems'].query.filter_by(id=itemId).update({'fileId': None})
        if file:
            oldFileURL = file.url
            db.session.delete(file)
            db.session.commit()
            os.remove(oldFileURL)
            return jsonify({"message": "Deleted Successfully"}), 200

        response = {"message": 'error occurred while removing file'}
        return jsonify(response), 500

    def createTeamsProjectsRequests(data):
        try:
            if dbs['teamsProjectsRequests'].query \
                    .filter(TeamsProjectsRequests.teamId == data['teamId'],
                            TeamsProjectsRequests.projectId == data['projectId']).first():
                response = {'status': 'error',
                            'message': f'request was already placed for team-{data["teamId"]} and project-{data["projectId"]}'}
                return jsonify(response), 500

            if dbs['projects'].query.filter(Projects.id == data['projectId'], Projects.status != 'Available').first():
                response = {'status': 'error',
                            'message': f'Project {data["projectId"]} was already assigned'}
                return jsonify(response), 500
            if dbs['teams'].query.filter(Teams.id == data['teamId'], Teams.projectId.isnot(None)).first():
                response = {'status': 'error',
                            'message': f'Team {data["teamId"]} was already assigned'}
                return jsonify(response), 500

            nextId = db.session.query(func.max(dbs['teamsProjectsRequests'].id)).scalar()
            nextId = 1 if nextId is None else nextId + 1
            data['id'] = nextId
            entity = dbs['teamsProjectsRequests'](**data)
            db.session.add(entity)
            db.session.commit()
            notification = {
                'title': 'New Team-Project Request',
                'body': 'Team #' + str(data["teamId"]) + ' requests placement for project #' + str(data['projectId'])
            }
            if not createNotification(notification, endpoint='admin'):
                response = {'status': 'error',
                            'message': f'error occurred while creating notification'}
                return jsonify(response), 500

            return jsonify({'status': 'success',
                            "message": f"{'teamsProjectsRequests'[:-1]} {nextId} created successfully",
                            'newEntityId': nextId}), 200
        except Exception as err:
            response = {'status': 'error',
                        'message': f'error occurred while creating teamsProjectsRequests, {str(err)}'}
            return jsonify(response), 500

    def createProject(endpoint, data):
        try:
            data['initiationDate'] = date.today()
            if 'teamId' in data and data['teamId'] is not None:
                data['status'] = 'Active'
            if data['status'] == 'Complete':
                data['endDate'] = date.today()
                data['assignDate'] = None
            elif data['status'] == 'Available' or data['status'] == 'OnHold':
                data['assignDate'] = None
                data['endDate'] = None
            elif data['status'] == 'Active':
                data['assignDate'] = date.today()
                data['endDate'] = None
            elif data['status'] == 'OnHold':
                data['assignDate'] = None
                data['endDate'] = None
            entity = dbs[endpoint](**data)
            db.session.add(entity)
            db.session.commit()
            updateNewTeamAssignmentToProject(data, existingEntity=None)
            return jsonify({'status': 'success',
                            "message": f"{endpoint[:-1]} {data['id']} created successfully",
                            'newEntity': entity.serialize()}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while creating {endpoint[:-1]}, {str(err)}'}
            return jsonify(response), 500

    def createGenericItem(data):
        try:
            newId = db.session.query(func.max(dbs['genericItems'].id)).scalar()
            data['id'] = 1 if newId is None else newId + 1
            courses = data['courses']
            del data['courses']
            entity = dbs['genericItems'](**data)
            db.session.add(entity)
            for course in courses:
                nextId = db.session.query(func.max(dbs['genericitemtocourse'].id)).scalar()
                nextId = 1 if nextId is None else nextId + 1
                itemToCourse = {'id': nextId, 'courseId': course, 'genericItemId': data['id']}
                entity = dbs['genericitemtocourse'](**itemToCourse)
                db.session.add(entity)
            db.session.commit()
            return jsonify({'status': 'success',
                            "message": f"{'genericItems'} {data['id']} created successfully",
                            'newEntityId': data['id']}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while creating {"genericItems"}, {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/create/<endpoint>', methods=['POST'])
    def create(endpoint=None):
        if endpoint:
            try:
                data = request.json
                if endpoint == 'teamsProjectsRequests':
                    return createTeamsProjectsRequests(data)
                elif endpoint == 'genericItems':
                    return createGenericItem(data)
                elif endpoint == 'projectProposals':
                    if not is_human(data["token"]):
                        return jsonify({'status': 'error',
                                        "message": f"{endpoint[:-1]} recaptcha token unverified"}), 500
                    else:
                        del data["token"]
                nextId = db.session.query(func.max(dbs[endpoint].id)).scalar()
                nextId = 1 if nextId is None else nextId + 1
                if endpoint != 'courses':
                    data['id'] = nextId
                else:
                    nextId = data['id']
                if endpoint == 'projects':
                    return createProject(endpoint, data)
                elif endpoint == 'teams':
                    studentsIds = [s['firebase_user_id'] for s in data['students']]
                    del data['students']
                    if data['creatorId'] not in studentsIds:
                        if len(studentsIds) != 0:
                            data['creatorId'] = studentsIds[0]
                    entity = dbs[endpoint](**data)
                    db.session.add(entity)
                    for uid in studentsIds:
                        dbs['users'].query.filter_by(firebase_user_id=uid).update({'teamId': nextId})
                    db.session.commit()
                    return jsonify({'status': 'success',
                                    "message": f"{endpoint[:-1]} {nextId} created successfully",
                                    'newEntityId': nextId}), 200
                entity = dbs[endpoint](**data)
                db.session.add(entity)
                db.session.commit()
                if endpoint == 'organizations':
                    db_firestore = firestore.client()
                    doc_ref = db_firestore.collection(u'organizations')
                    doc_ref.document(str(data['id'])).set(data)
                elif endpoint == 'delayRequests':
                    notification = {
                        'title': 'New Delay Request: ' + data['subject'],
                        'body': 'New Delay Request from team  #' + str(data['teamId'] + ": " + data['body'])
                    }
                    if not createNotification(notification, endpoint='admin'):
                        response = {'status': 'error',
                                    'message': f'error occurred while sending notification'}
                        return jsonify(response), 500

                return jsonify({'status': 'success',
                                "message": f"{endpoint[:-1]} {nextId} created successfully",
                                'newEntityId': nextId}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while creating {endpoint[:-1]}, {str(err)}'}
                return jsonify(response), 500
        else:
            response = {'status': 'error', 'message': 'Non valid endpoint provided'}
            return jsonify(response), 500

    def updateProject(endpoint, data, existingEntity):
        try:
            data['initiationDate'] = datetime.strptime(data['initiationDate'], '%a, %d %b %Y %H:%M:%S GMT') if \
                data['initiationDate'] is not None else None
            data['assignDate'] = datetime.strptime(data['assignDate'], '%a, %d %b %Y %H:%M:%S GMT') if \
                data['assignDate'] is not None else None
            data['endDate'] = datetime.strptime(data['endDate'], '%a, %d %b %Y %H:%M:%S GMT') if \
                data['endDate'] is not None else None
            if 'teamId' in data and data['teamId'] is not None and data['status'] == 'Available':
                data['status'] = 'Active'
            if data['status'] == 'Complete' and data['endDate'] is None:
                data['endDate'] = date.today()
            elif data['status'] == 'Available' or data['status'] == 'OnHold':
                data['assignDate'] = None
                data['endDate'] = None
            elif data['status'] == 'Active' and data['assignDate'] is None:
                data['assignDate'] = date.today()
                data['endDate'] = None
            oldProjectData = copy(existingEntity)
            existingEntity.update(**data)
            db.session.commit()
            updateNewTeamAssignmentToProject(data, existingEntity=oldProjectData)
            return jsonify({'status': 'success',
                            "message": f"{endpoint[:-1]} {data['id']} updated successfully",
                            'updatedEntity': existingEntity.serialize()}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while updating {endpoint[:-1]}, {str(err)}'}
            return jsonify(response), 500

    def updateTeams(teamId, newTeam):
        studentsIdsUpdatedTeam = [s['firebase_user_id'] for s in newTeam['students']]

        oldStudentsIds = [student.firebase_user_id for student in dbs['users'].query.filter_by(teamId=teamId)]

        studentsIdsToRemove = [student.firebase_user_id for student in
                               dbs['users'].query.filter_by(teamId=teamId).filter(
                                   Users.firebase_user_id.notin_(studentsIdsUpdatedTeam))]

        newStudentsIds = list(set(studentsIdsUpdatedTeam).difference(oldStudentsIds))
        for uid in studentsIdsToRemove:
            dbs['users'].query.filter_by(firebase_user_id=uid).update({'teamId': None})
            refs['studentsGrades'].child(uid).set({})
        for uid in newStudentsIds:
            dbs['users'].query.filter_by(firebase_user_id=uid).update({'teamId': teamId})

        if newTeam['creatorId'] in studentsIdsToRemove:
            if len(studentsIdsUpdatedTeam) != 0:
                newTeam['creatorId'] = studentsIdsUpdatedTeam[0]
        del newTeam['students']
        dbs['teams'].query.filter_by(id=teamId).update(newTeam)
        db.session.commit()
        notification = {
            'title': 'Team update',
            'body': 'You have been removed from the team #' + str(teamId)
        }
        studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter(
            Users.firebase_user_id.in_(studentsIdsToRemove))
        if not createNotification(notification, endpoint='custom', ids=studentsIds):
            response = {'status': 'error',
                        'message': f'error occurred while sending notification'}
            return jsonify(response), 500

        notification = {
            'title': 'Team update',
            'body': 'You have been added to the team #' + str(teamId)
        }
        studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter(
            Users.firebase_user_id.in_(newStudentsIds))
        if not createNotification(notification, endpoint='custom', ids=studentsIds):
            response = {'status': 'error',
                        'message': f'error occurred while sending notification'}
            return jsonify(response), 500
        return jsonify(
            {'status': 'success', "message": f"{'update/updateTeams'} {teamId} updated successfully"}), 200

    def updateNewTeamAssignmentToProject(data, existingEntity=None):
        # remove assignment of old team to the project, also remove files and grades.
        # assing new team to project
        if 'teamId' in data and data['teamId'] is not None:
            newTeamId = data['teamId']
        else:
            newTeamId = None
        if existingEntity:
            if newTeamId == existingEntity.teamId:
                return

            dbs['teams'].query.filter_by(id=existingEntity.teamId).update({'projectId': None})
            dbs['files'].query.filter(Files.projectId == data['id']).delete(synchronize_session=False)
            oldTeamStudentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(
                teamId=existingEntity.teamId).all()
            for studentId in oldTeamStudentsIds:
                dbs['users'].query.filter_by(firebase_user_id=studentId.firebase_user_id).update({'teamId': None})
                refs['studentsGrades'].child(studentId.firebase_user_id).set({})
            db.session.commit()
            notification = {
                'title': 'Admin removed your team assignment to project #' + str(data['id'])
            }
            if not createNotification(notification, endpoint='custom', ids=oldTeamStudentsIds):
                response = {'status': 'error',
                            'message': f'error occurred while sending notification'}
                return jsonify(response), 500
        if newTeamId:
            dbs['teams'].query.filter_by(id=newTeamId).update({'projectId': data['id']})
            db.session.commit()
        return

    def updateGenericItem(recordId, data, existingEntity):
        try:
            courses = [int(courseId) for courseId in data['courses']]
            del data['courses']
            existingEntity.update(**data)
            itemToCourses = dbs['genericitemtocourse'].query.filter(
                GenericItemToCourse.genericItemId == recordId).all()
            existInCourses = [item.courseId for item in itemToCourses]
            toDelete = [x for x in existInCourses if x not in courses]
            toAdd = [x for x in courses if x not in existInCourses]
            for courseId in toAdd:
                nextId = db.session.query(func.max(dbs['genericitemtocourse'].id)).scalar()
                nextId = 1 if nextId is None else nextId + 1
                itemToCourse = {'id': nextId, 'courseId': courseId, 'genericItemId': recordId}
                entity = dbs['genericitemtocourse'](**itemToCourse)
                db.session.add(entity)
            for courseId in toDelete:
                itemToCourse = dbs['genericitemtocourse'].query.filter(
                    GenericItemToCourse.genericItemId == recordId).filter_by(courseId=int(courseId)).first()
                db.session.delete(itemToCourse)
            db.session.commit()
            return jsonify(
                {'status': 'success', "message": f"{'update/genericItems'} {recordId} updated successfully"}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while updating {recordId}, {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/update/<endpoint>/<recordId>', methods=['POST'])
    def update(endpoint=None, recordId=None):
        if endpoint and recordId:
            try:
                data = request.json
                existingEntity = dbs[endpoint].query.filter_by(id=recordId).first()
                if endpoint == 'semesters':
                    if data['isCurrent']:
                        dbs[endpoint].query.filter(Semesters.id != recordId).update({'isCurrent': False},
                                                                                    synchronize_session=False)
                    data['startDate'] = datetime.strptime(data['startDate'], '%Y-%m-%d %H:%M:%S')
                    data['endDate'] = datetime.strptime(data['endDate'], '%Y-%m-%d %H:%M:%S')
                    existingEntity.update(**data)
                elif endpoint == 'courses':
                    new_data = {'id': data['newId'], 'name': data['name'], 'description': data['description'],
                                'continuationOfCourse': data['continuationOfCourse']}
                    dbs[endpoint].query.filter_by(continuationOfCourse=existingEntity.id).update(
                        {'continuationOfCourse': new_data['id']})
                    existingEntity.update(**new_data)
                elif endpoint == 'teams':
                    return updateTeams(recordId, data)
                elif endpoint == 'genericItems':
                    return updateGenericItem(recordId, data, existingEntity)
                elif endpoint == 'projects':
                    return updateProject(endpoint, data, existingEntity)
                elif endpoint == 'organizations':
                    db_firestore = firestore.client()
                    doc_ref = db_firestore.collection(u'organizations')
                    doc_ref.document(str(data['id'])).update(data)
                elif endpoint == 'delayRequests':
                    notification = {
                        'title': 'Your request: ' + data['subject'] + ' was ' + data['status'],
                        'body': data['answer']
                    }
                    studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(
                        teamId=data['teamId']).all()
                    if not createNotification(notification, endpoint='custom', ids=studentsIds):
                        response = {'status': 'error',
                                    'message': f'error occurred while sending notification'}
                        return jsonify(response), 500
                    existingEntity.update(**data)
                else:
                    existingEntity.update(**data)
                db.session.commit()
                return jsonify(
                    {'status': 'success', "message": f"{endpoint[:-1]} {recordId} updated successfully"}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while updating {endpoint[:-1]}, {str(err)}'}
                return jsonify(response), 500

        else:
            response = {'status': 'error', 'message': 'Non valid endpoint provided'}
            return jsonify(response), 500

    def deleteTeams(team):
        try:
            dbs['projects'].query. \
                filter(Projects.id == team.projectId).update(
                {'status': 'Available', 'teamId': None, 'assignDate': None, 'endDate': None},
                synchronize_session=False)
            studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(teamId=team.id).all()
            for studentId in studentsIds:
                refs['studentsGrades'].child(studentId.firebase_user_id).set({})
            db.session.commit()
            notification = {
                'title': 'Team update',
                'body': 'You have been removed from the team #' + str(team.id)
            }
            if not createNotification(notification, endpoint='custom', ids=studentsIds):
                response = {'status': 'error',
                            'message': f'error occurred while sending notification'}
                return jsonify(response), 500
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while deleting team , {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/delete/<endpoint>/<recordId>', methods=['POST'])
    def delete(endpoint=None, recordId=None):
        if endpoint and recordId:
            try:
                existingEntity = dbs[endpoint].query.filter_by(id=recordId).first()
                # check if proposal came from firebase db
                if endpoint == 'projectProposals' and existingEntity is None:
                    db_firestore = firestore.client()
                    db_firestore.collection(u'projectProposes').document(recordId).delete()
                    return jsonify(
                        {'status': 'success', "message": f"{endpoint[:-1]} Project proposal deleted successfully"}), 200
                if existingEntity:
                    if endpoint == 'teams':
                        deleteTeams(existingEntity)
                    elif endpoint == 'organizations':
                        db_firestore = firestore.client()
                        doc_ref = db_firestore.collection(u'organizations')
                        doc_ref.document(str(existingEntity.id)).delete()
                    elif endpoint == 'projects':
                        refs['filesTemplatePerTeam'].child(recordId).set({})
                    db.session.delete(existingEntity)
                    db.session.commit()
                    return jsonify(
                        {'status': 'success', "message": f"{endpoint[:-1]} {recordId} deleted successfully"}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while deleting {endpoint[:-1]}, {str(err)}'}
                return jsonify(response), 500
        else:
            response = {'status': 'error', 'message': 'Non valid endpoint provided'}
            return jsonify(response), 500

    def retrieveProjectProposals():
        try:
            records = []
            # get proposes from mysql db
            query_records = db.session.query(ProjectProposals, Organizations) \
                .join(Organizations, Organizations.id == ProjectProposals.organizationId, isouter=True).all()
            for item in query_records:
                project, organization = item.ProjectProposals, item.Organizations
                temp = {}
                temp.update(**item.ProjectProposals.serialize())
                if organization:
                    temp['organizationId'] = {**organization.serialize()}
                academicAdvisor = dbs['users'].query.filter_by(firebase_user_id=project.academicAdvisorId).first()
                temp['academicAdvisorId'] = academicAdvisor.serialize() if academicAdvisor else None
                industrialAdvisor = dbs['users'].query.filter_by(firebase_user_id=project.industrialAdvisorId).first()
                temp['industrialAdvisorId'] = industrialAdvisor.serialize() if industrialAdvisor else None
                records.append(temp)
            # get proposes from firestore db
            db_firestore = firestore.client()
            docs = db_firestore.collection(u'projectProposes').stream()
            for doc in docs:
                records.append(doc.to_dict())
            return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving Project Proposals'}
            return jsonify(response), 500

    def retrieveGenericItems(item_type='all', courseId=None):
        try:
            records = []
            query_records = db.session.query(GenericItems)
            if item_type != 'all':
                query_records = query_records.filter(
                    dbs['genericItems'].type == item_type)
            query_records = query_records.all()
            for item in query_records:
                temp = {}
                if courseId:
                    itemToCourse = dbs['genericitemtocourse'].query.filter(
                        GenericItemToCourse.courseId == courseId).filter(
                        GenericItemToCourse.genericItemId == item.id).all()
                    if len(itemToCourse) == 0:
                        continue
                    temp['courseId'] = [str(record.courseId) for record in
                                        itemToCourse]
                else:
                    itemToCourse = dbs['genericitemtocourse'].query.filter(
                        GenericItemToCourse.genericItemId == item.id).all()
                    temp['courseId'] = [str(record.courseId) for record in
                                        itemToCourse]
                temp.update(**item.serialize())
                if item.fileId:
                    file = dbs['files'].query.filter(Files.id == item.fileId).first()
                    temp['fileId'] = {**file.serialize()}
                records.append(temp)
            return records
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving generic items'}
            return jsonify(response), 500

    def retrieveProjects(assigned=False, available=False, is_read=None, user_id=None, user_type=None):
        try:
            records = []
            if available:
                query_records = db.session.query(Projects, Organizations) \
                    .join(Organizations, Organizations.id == Projects.organizationId, isouter=True) \
                    .filter(Projects.status == 'Available')
            elif assigned:
                query_records = db.session.query(Projects, Organizations, Teams) \
                    .join(Organizations, Organizations.id == Projects.organizationId, isouter=True) \
                    .join(Teams, Teams.id == Projects.teamId, isouter=True)
            elif user_id and user_type == 'academic':
                query_records = db.session.query(Projects, Organizations) \
                    .join(Organizations, Organizations.id == Projects.organizationId, isouter=True) \
                    .filter(Projects.academicAdvisorId == user_id)
            elif user_id and user_type == 'industrial':
                query_records = db.session.query(Projects, Organizations) \
                    .join(Organizations, Organizations.id == Projects.organizationId, isouter=True) \
                    .filter(Projects.industrialAdvisorId == user_id)
            elif user_id and user_type == 'student':
                user = dbs['users'].query.filter_by(firebase_user_id=user_id).first()
                db.session.commit()
                if user.teamId is None:
                    return jsonify({'status': 'success', "message": [], "row_count": 0}), 200

                else:
                    team = dbs['teams'].query.filter(Teams.id == user.teamId).one()
                    query_records = db.session.query(Projects, Organizations) \
                        .join(Organizations, Organizations.id == Projects.organizationId, isouter=True) \
                        .filter(Projects.id == team.projectId)
            else:
                query_records = db.session.query(Projects, Organizations) \
                    .join(Organizations, Organizations.id == Projects.organizationId, isouter=True)

            if is_read:
                query_records = query_records.filter(Projects.id.in_(is_read)).all()
            else:
                query_records = query_records.all()

            for item in query_records:
                project, organization = item.Projects, item.Organizations
                if assigned:
                    team = item.Teams
                temp = {}
                temp.update(**item.Projects.serialize())
                if organization:
                    temp['organizationId'] = {**organization.serialize()}
                if assigned and team:
                    temp['teamId'] = {**team.serialize()}
                    students = dbs['users'].query.filter_by(teamId=team.id).all()
                    temp['students'] = [s.serialize() for s in students]
                if project.academicAdvisorId:
                    user = dbs['users'].query.filter_by(firebase_user_id=project.academicAdvisorId).first()
                    temp['academicAdvisorId'] = user.serialize() if user else None
                if project.industrialAdvisorId:
                    user = dbs['users'].query.filter_by(firebase_user_id=project.industrialAdvisorId).first()
                    temp['industrialAdvisorId'] = user.serialize() if user else None
                records.append(temp)
            return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving projects'}
            return jsonify(response), 500

    def retrieveFindPartnersRequests(enpoint):
        try:
            records = dbs[enpoint].query.all()
            records = [u.serialize() for u in records]
            res = []
            for r in records:
                usersData = dbs['users'].query.filter_by(firebase_user_id=r['student']).first().serialize() if r[
                                                                                                                   'student'] != '' else None
                if enpoint == 'teamsFindPartners':
                    if 'teamData' not in r:
                        team = dbs['teams'].query.filter(Teams.id == usersData['teamId']).one()
                        team = team.serialize()
                        r['teamData'] = team
                r['student'] = usersData
                res.append(r)
            return jsonify({'status': 'success', "message": res, "row_count": len(res)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving find-partner requests'}
            return jsonify(response), 500

    def retrieveTeams(state='all', is_read=None, add_filter=None):
        try:
            query_records = []
            if state == 'all':
                query_records = db.session.query(Teams, Projects) \
                    .join(Projects, Projects.id == Teams.projectId, isouter=True)

            if state == 'assigned':
                query_records = db.session.query(Teams, Projects) \
                    .join(Projects, Projects.id == Teams.projectId, isouter=True) \
                    .filter(Teams.projectId.isnot(None))

            if state == 'unassigned':
                query_records = db.session.query(Teams, Projects) \
                    .join(Projects, Projects.id == Teams.projectId, isouter=True) \
                    .filter(Teams.projectId.is_(None))
            if add_filter is not None:
                query_records = query_records.filter(add_filter)
            if is_read:
                query_records = query_records.filter(Teams.id.in_(is_read)).all()
            else:
                query_records = query_records.all()

            records = []
            for item in query_records:
                project, team = item.Projects, item.Teams
                if project and team:
                    records.append({**item.Projects.serialize(), **item.Teams.serialize()})
                else:
                    records.append(team.serialize())
            res = []
            for r in records:
                students = dbs['users'].query.filter_by(teamId=r['id']).all()
                students = [u.serialize() for u in students]
                r['students'] = students
                res.append(r)
            return jsonify({'status': 'success', "message": res, "row_count": len(res)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving teams'}
            return jsonify(response), 500

    def retrieveTeamsProjectsRequests(isAdvisorView, advisorId, is_read=None, team_id=None):
        try:
            query_records = db.session.query(TeamsProjectsRequests, Projects, Organizations) \
                .join(Projects, Projects.id == TeamsProjectsRequests.projectId, isouter=True) \
                .join(Organizations, Organizations.id == Projects.organizationId, isouter=True)
            if isAdvisorView:
                query_records = query_records.filter(Projects.academicAdvisorId == advisorId).all()
            elif team_id:
                query_records = query_records.filter(TeamsProjectsRequests.teamId == team_id).all()
            elif is_read:
                query_records = query_records.filter(TeamsProjectsRequests.id.in_(is_read)).all()
            else:
                query_records = query_records.all()

            records = []
            for item in query_records:
                teamsProjectsRequests, project, organization = item.TeamsProjectsRequests, item.Projects, item.Organizations
                temp = {}
                temp.update(**teamsProjectsRequests.serialize())
                if organization:
                    temp['organizationId'] = {**organization.serialize()}
                if project:
                    temp['projectId'] = {**project.serialize()}
                records.append(temp)
            return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving teams-projects requests'}
            return jsonify(response), 500

    def retrieveSchedule(is_read=None):
        try:
            if not is_read:
                return jsonify({'status': 'success', "message": [], "row_count": 0}), 200

            query_records = db.session.query(Schedule, Projects, Teams, Organizations) \
                .filter(Schedule.eventId.in_(is_read)) \
                .join(Projects, Projects.id == Schedule.projectId, isouter=True) \
                .join(Teams, Teams.projectId == Projects.id, isouter=True) \
                .join(Organizations, Organizations.id == Projects.organizationId, isouter=True).all()

            records = []
            for item in query_records:
                schedule, project, team, organization = item.Schedule, item.Projects, item.Teams, item.Organizations
                temp = {}
                temp.update(**schedule.serialize())
                if project:
                    temp['projectId'] = project.id
                    temp['projectObject'] = {**project.serialize()}
                if team:
                    temp['teamId'] = team.id
                    temp['teamObject'] = {**team.serialize()}
                    students = dbs['users'].query.filter_by(teamId=team.id).all()
                    students = [u.serialize() for u in students]
                    temp['teamObject']['students'] = students
                if organization:
                    temp['organizationId'] = organization.id
                    temp['organizationObject'] = {**organization.serialize()}
                records.append(temp)
            return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving schedule'}
            return jsonify(response), 500

    def delayRequests(endpoint='delayRequests', projectId=-1):
        try:
            if endpoint == 'delaysPerProject':
                query_records = dbs['delayRequests'].query.filter(dbs['delayRequests'].projectId == projectId).all()
            else:
                query_records = dbs['delayRequests'].query.all()
            query_records = [u.serialize() for u in query_records]
            for item in query_records:
                if 'studentId' in item and item['studentId']:
                    item['studentId'] = dbs['users'].query.filter_by(
                        firebase_user_id=item['studentId']).first().serialize()
            return jsonify({'status': 'success', "message": query_records, "row_count": len(query_records)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving delay requests'}
            return jsonify(response), 500

    def retrieveTeamsFiles():
        try:
            query_records = db.session.query(Teams, Projects) \
                .join(Projects, Projects.id == Teams.projectId, isouter=True) \
                .filter(Teams.projectId.isnot(None)).all()
            records = []
            for item in query_records:
                project, team = item.Projects, item.Teams
                if project and team:
                    records.append({**item.Projects.serialize(), **item.Teams.serialize()})
                else:
                    records.append(team.serialize())
            res = []
            for r in records:
                files = Files.query.filter(r['id'] == Files.teamId).all()
                files = [u.serialize() for u in files]
                r['files'] = files
                res.append(r)
            return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving teams files'}
            return jsonify(response), 500

    def get_students_data(students, with_grades=False, team_students=False):
        for student in students:
            semester = Semesters.query.filter_by(id=int(student['semesterId'])).first()
            if semester:
                semester = semester.serialize()
                student['semester'] = semester['title']
            else:
                student['semester'] = ''
            if not with_grades:
                continue
            else:
                if team_students:
                    finalGrades = refs['studentsGrades'].child(student['firebase_user_id']).child(
                        'template').order_by_child("description").equal_to("Final Grade").get()
                    if finalGrades:
                        for key, value in finalGrades.items():
                            student['gradeStage{}'.format(value['stage'])] = value['grade'] if 'grade' in value else ''
                else:
                    curr_template = \
                        list((refs['gradeTemplates'].order_by_child("isCurrent").equal_to(True).get()).values())[0][
                            'template']
                    for key, value in curr_template.items():
                        student['gradeStage{}'.format(value['stage'])] = ''
        return students

    def retrieveGradesReport():
        try:
            teamStudents = dbs['users'].query.filter(Users.user_type == 'student').filter(Users.teamId != None).all()
            teamStudents = [s.serialize() for s in teamStudents]
            noTeamStudents = dbs['users'].query.filter(Users.user_type == 'student').filter(Users.teamId == None).all()
            noTeamStudents = [s.serialize() for s in noTeamStudents]

            teamStudents = get_students_data(teamStudents, with_grades=True, team_students=True)
            noTeamStudents = get_students_data(noTeamStudents, with_grades=True, team_students=False)

            teamStudents_df = pd.DataFrame(teamStudents)
            noTeamStudents_df = pd.DataFrame(noTeamStudents)
            teams = db.session.query(Teams).all()
            teams = [t.serialize() for t in teams]
            teams_df = pd.DataFrame(teams)
            teams_df.fillna("", inplace=True)
            teamStudents_df.fillna("", inplace=True)
            teams_df = teams_df.rename(index=str, columns={"id": "teamId"})
            teams_df.teamId.astype(int)
            if 'teamId' in teamStudents_df.columns and 'teamId' in teams_df.columns:
                teamStudents_df.teamId.astype(int)
                merged_df = pd.merge(teamStudents_df, teams_df, on='teamId', how='left')
            else:
                merged_df = teamStudents_df
            result = pd.concat([merged_df, noTeamStudents_df], ignore_index=True)
            result.fillna('', inplace=True)
            result = result.to_dict('records')
            return json.dumps({'status': 'success', "message": result, "row_count": len(result)},
                              ensure_ascii=False), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving grades report'}
            return jsonify(response), 500

    def data_for_secretariat(student):
        semester = Semesters.query.filter_by(id=int(student['semesterId'])).first()
        semester = semester.serialize()
        student['semester'] = semester['title']
        finalGrades = refs['studentsGrades'].child(student['firebase_user_id']).child(
            'template').order_by_child("description").equal_to("Final Grade").get()
        if not finalGrades:
            return student, False
        else:
            isGrade = False
            for key, value in finalGrades.items():
                if 'grade' in value:
                    isGrade = True
                    student['gradeStage{}'.format(value['stage'])] = value['grade']
            return student, isGrade

    def retrieveSecretariatReport(semesterId, courseId):
        try:
            records = []
            query_records = db.session.query(Users, Projects).filter(Users.user_type == 'student',
                                                                     Users.teamId > 0,
                                                                     Users.semesterId == int(semesterId),
                                                                     Users.courseId == int(courseId))
            query_records = query_records.join(Projects, Users.teamId == Projects.teamId, isouter=True).all()
            for item in query_records:
                user, project = item.Users, item.Projects
                temp = {}
                if project is None:
                    continue
                user, hasGrade = data_for_secretariat(user.serialize())
                if not hasGrade:
                    continue
                temp.update(user)
                temp['studentName'] = user['engFirstName'] + ' ' + user['engLastName']
                if project:
                    temp['projectId'] = project.id
                records.append(temp)

            df = pd.DataFrame(records)
            df.fillna('', inplace=True)
            result = df.to_dict('records')
            return json.dumps({'status': 'success', "message": result, "row_count": len(result)},
                              ensure_ascii=False), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving reports'}
            return jsonify(response), 500

    def retrieveStudentsReport():
        try:
            records = []
            query_records = db.session.query(Users, Projects, Organizations).filter(Users.user_type == 'student').join(
                Projects, Users.teamId == Projects.teamId, isouter=True).join(Organizations,
                                                                              Projects.organizationId == Organizations.id,
                                                                              isouter=True).all()
            for item in query_records:
                user, project, organization = item.Users, item.Projects, item.Organizations
                temp = {}
                user = get_students_data([user.serialize()], False)[0]
                temp.update(user)
                temp['studentName'] = user['engFirstName'] + ' ' + user['engLastName']
                if organization:
                    temp['organizationName'] = organization.name
                if project:
                    temp['projectId'] = project.id
                    temp['name'] = project.name
                    if project.academicAdvisorId:
                        advisor = dbs['users'].query.filter_by(
                            firebase_user_id=project.academicAdvisorId).first()
                        temp['academicAdvisorName'] = advisor.engFirstName + ' ' + advisor.engLastName
                        temp['academicAdvisorId'] = project.academicAdvisorId
                    if project.industrialAdvisorId:
                        advisor = dbs['users'].query.filter_by(
                            firebase_user_id=project.industrialAdvisorId).first()
                        temp['industrialAdvisorName'] = advisor.engFirstName + ' ' + advisor.engLastName
                        temp['industrialAdvisorId'] = project.industrialAdvisorId
                records.append(temp)

            df = pd.DataFrame(records)
            df.fillna("", inplace=True)
            result = df.to_dict('records')
            return json.dumps({'status': 'success', "message": result, "row_count": len(result)},
                              ensure_ascii=False), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving reports'}
            return jsonify(response), 500

    def retrieveAdvisorsReports(semesterId):
        try:
            advisors = dbs['users'].query.filter(Users.user_type == 'advisor').all()
            advisors = [s.serialize() for s in advisors]
            academAdvisors = []
            for a in advisors:
                if a['advisorType'] in ['academic', 'both']:
                    academAdvisors.append(a)
            advisors_df = pd.DataFrame(academAdvisors)
            advisors_df = advisors_df.rename(columns={'firebase_user_id': 'academicAdvisorId'})
            projects = dbs['projects'].query.all()
            projects = [u.serialize() for u in projects]
            if semesterId:
                semester = Semesters.query.filter_by(id=semesterId).one()
                semesterStartDate = semester.startDate
                semesterEndDate = semester.endDate
                projectsAssignedInCurrSemester = []
                for project in projects:
                    if project['assignDate'] is not None:
                        assignDate = project['assignDate']
                        if isinstance(semesterEndDate, datetime) and isinstance(semesterStartDate,
                                                                                datetime) and isinstance(assignDate,
                                                                                                         datetime):
                            if semesterStartDate <= assignDate <= semesterEndDate:
                                projectsAssignedInCurrSemester.append(project)
                            elif assignDate < semesterStartDate:
                                if project["status"] == "Active":
                                    projectsAssignedInCurrSemester.append(project)
                                else:
                                    if project['endDate'] is not None:
                                        endDate = project['endDate']
                                        if semesterStartDate <= endDate:
                                            projectsAssignedInCurrSemester.append(project)
                projects = projectsAssignedInCurrSemester

            if len(projects) == 0:
                return json.dumps({'status': 'success', "message": [], "row_count": 0},
                                  ensure_ascii=False), 200
            projects_df = pd.DataFrame(projects)
            projects_df = projects_df.drop(columns=['lastVerified', 'initiationDate', 'assignDate', 'endDate'])
            merged_df = pd.merge(advisors_df, projects_df, on='academicAdvisorId', how='left')
            merged_df = merged_df.rename(columns={'id_x': 'id', 'id_y': 'projectId'})
            merged_df.fillna('', inplace=True)
            merged_df.drop(merged_df.index[merged_df['projectId'] == ''], inplace=True)
            result = merged_df.to_dict('records')
            return json.dumps({'status': 'success', "message": result, "row_count": len(result)},
                              ensure_ascii=False), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving, {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/retrieve/<endpoint>', methods=['GET', 'POST'])
    def retrieve(endpoint=None):
        if endpoint:
            is_read = json.loads(request.args.get("is_read", default='false'))
            entityData = request.json
            if is_read and entityData and 'ids' in entityData:
                query_ids = entityData['ids']
            else:
                query_ids = None
            if entityData and 'user_id' in entityData:
                user_id = entityData['user_id'][0]
            else:
                user_id = None
            try:
                if endpoint == 'teams':
                    return retrieveTeams(state='all', is_read=query_ids)
                elif endpoint == 'assignedTeams':
                    return retrieveTeams(state='assigned', is_read=query_ids)
                elif endpoint == 'unassignedTeams':
                    return retrieveTeams(state='unassigned', is_read=query_ids)
                elif endpoint == 'projects':
                    return retrieveProjects(is_read=query_ids)
                elif endpoint == 'studentProjects':
                    return retrieveProjects(is_read=query_ids, user_id=user_id, user_type='student')
                elif endpoint == 'academicProjects':
                    return retrieveProjects(is_read=query_ids, user_id=user_id, user_type='academic')
                elif endpoint == 'industrialProjects':
                    return retrieveProjects(is_read=query_ids, user_id=user_id, user_type='industrial')
                elif endpoint == 'projectProposals':
                    return retrieveProjectProposals()
                elif endpoint == 'availableProjects':
                    return retrieveProjects(available=True, is_read=query_ids)
                elif endpoint == 'assignedProjects':
                    return retrieveProjects(assigned=True, is_read=query_ids)
                elif endpoint == 'teamsProjectsRequests':
                    team_id = request.args.get("team_id", default=None)
                    isAdvisorView = json.loads(request.args.get("isAdvisorView", default='false'))
                    advisorId = request.args.get("advisorId", default=None)
                    return retrieveTeamsProjectsRequests(isAdvisorView, advisorId, is_read=query_ids, team_id=team_id)
                elif endpoint == 'schedule':
                    return retrieveSchedule(is_read=query_ids)
                elif endpoint == 'eventsDisplayedToAll':
                    records = dbs['events'].query.filter(dbs['events'].displayToAll).all()
                elif endpoint == 'eventsByCourse':
                    courseId = request.args.get("courseId", default=-1)
                    studentSemesterId = request.args.get("semesterId", default=-1)
                    currsemesterId = Semesters.query.filter(Semesters.isCurrent).one().id
                    if int(currsemesterId) == int(studentSemesterId):
                        records = dbs['events'].query.filter(dbs['events'].courseId == int(courseId)).filter(
                            dbs['events'].displayToAll).all()
                    else:
                        records = []
                elif endpoint in ['studentsFindPartners', 'teamsFindPartners']:
                    return retrieveFindPartnersRequests(endpoint)
                elif endpoint in ['delayRequests', 'delaysPerProject']:
                    return delayRequests(endpoint=endpoint, projectId=request.args.get("projectId", default=-1))
                elif endpoint == 'genericItems':
                    item_type = request.args.get("item_type")
                    courseId = request.args.get("courseId", default=None)
                    records = retrieveGenericItems(item_type, courseId)
                    return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
                elif endpoint == 'teamsFiles':
                    return retrieveTeamsFiles()
                elif endpoint == 'secretariatReport':
                    semesterId = request.args.get("semesterId", default=None)
                    courseId = request.args.get("courseId", default=None)
                    return retrieveSecretariatReport(semesterId, courseId)
                elif endpoint == 'studentsReport':
                    return retrieveStudentsReport()
                elif endpoint == 'gradesReport':
                    return retrieveGradesReport()
                elif endpoint == 'advisorsReports':
                    semesterId = request.args.get("semesterId", default=None)
                    return retrieveAdvisorsReports(semesterId)
                else:
                    if is_read:
                        records = dbs[endpoint].query.filter(dbs[endpoint].id.in_(entityData['ids'])).all()
                    else:
                        records = dbs[endpoint].query.all()
                x = [u.serialize() for u in records]
                return jsonify({'status': 'success', "message": x, "row_count": len(x)}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while retrieving, {str(err)}'}
                return jsonify(response), 500
        else:
            response = {'status': 'error', 'message': 'error occurred while retrieving'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/read/<endpoint>', methods=['GET'])
    def read(endpoint=None):
        if endpoint:
            try:
                entityIds = request.json
                if entityIds and 'ids' in entityIds:
                    records = dbs[endpoint].query.filter(dbs[endpoint].id.in_(entityIds['ids'])).all()
                    records = [u.serialize() for u in records]
                    return jsonify({'status': 'success', "message": records, "row_count": len(records)}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while retrieving, {str(err)}'}
                return jsonify(response), 500
        else:
            response = {'status': 'error', 'message': 'error occurred while retrieving'}
            return jsonify(response), 500

    def approveTeamsProjectsRequests(tprId):
        try:
            tpRequest = dbs['teamsProjectsRequests'].query.filter(TeamsProjectsRequests.id == tprId).one()
            if tpRequest is None:
                response = {'status': 'error', 'message': f'error occurred while approving request'}
                return jsonify(response), 500
            dbs['projects'].query. \
                filter(Projects.teamId == tpRequest.teamId).update(
                {'status': 'Available', 'teamId': None, 'assignDate': None},
                synchronize_session=False)
            dbs['projects'].query. \
                filter(Projects.id == tpRequest.projectId).update(
                {'status': 'Active', 'teamId': tpRequest.teamId, 'assignDate': date.today()},
                synchronize_session=False)
            dbs['teams'].query.filter(Teams.id == tpRequest.teamId).update({'projectId': tpRequest.projectId},
                                                                           synchronize_session=False)
            dbs['teamsProjectsRequests'].query. \
                filter(TeamsProjectsRequests.id == tprId).update({'adminStatus': 'approved'}, synchronize_session=False)
            db.session.commit()
            message = request.args.get("message")

            notification = {
                'title': 'Team-Project Request was approved',
                'body': 'Assignment to project #' + str(
                    tpRequest.projectId) + ' was approved. {}'.format(
                    'Message from admin: ' + message if message else "")
            }
            team = dbs['teams'].query.filter_by(id=tpRequest.teamId).one()
            studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(teamId=team.id).all()
            if not createNotification(notification, endpoint='custom', ids=studentsIds):
                response = {'status': 'error',
                            'message': f'error occurred while sending notification'}
                return jsonify(response), 500

            return jsonify({'status': 'success',
                            "message": f"request {tprId} approved successfully"}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while approving request, {str(err)}'}
            return jsonify(response), 500

    def rejectTeamsProjectsRequests(tprId):
        try:
            tpRequest = dbs['teamsProjectsRequests'].query.filter(TeamsProjectsRequests.id == tprId).one()
            dbs['teamsProjectsRequests'].query. \
                filter(TeamsProjectsRequests.id == tprId).update({'adminStatus': 'rejected'}, synchronize_session=False)
            dbs['projects'].query. \
                filter(Projects.id == tpRequest.projectId).update({'status': 'Available', 'teamId': None},
                                                                  synchronize_session=False)
            dbs['teams'].query.filter(Teams.id == tpRequest.teamId).update({'projectId': None},
                                                                           synchronize_session=False)
            team = dbs['teams'].query.filter(Teams.id == tpRequest.teamId).one()
            dbs['files'].query.filter(Files.projectId == tpRequest.projectId).delete(synchronize_session=False)
            db.session.commit()
            studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(teamId=team.id).all()
            for studentsId in studentsIds:
                refs['studentsGrades'].child(studentsId.firebase_user_id).set({})
            message = request.args.get("message")
            notification = {
                'title': 'Team-Project Request was rejected',
                'body': 'Assignment to project #' + str(tpRequest.projectId) + ' was rejected {}'.format(
                    'Message from admin: ' + message if message else "")
            }
            if not createNotification(notification, endpoint='custom', ids=studentsIds):
                response = {'status': 'error',
                            'message': f'error occurred while sending notification'}
                return jsonify(response), 500

            return jsonify({'status': 'success',
                            "message": f"request {tprId} rejected successfully"}), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while rejecting request, {str(err)}'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/approve/<endpoint>/<recordId>', methods=['POST'])
    def approve(endpoint=None, recordId=None):
        if endpoint and recordId:
            try:
                if endpoint == 'teamsProjectsRequests':
                    return approveTeamsProjectsRequests(recordId)
                response = {'status': 'error',
                            "message": f"Unknown request type"}
                return jsonify(response), 500

            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while approving request, {str(err)}'}
                return jsonify(response), 500

        response = {'status': 'error', 'message': 'Non valid endpoint or record id provided'}
        return jsonify(response), 500

    @db_records_mngt_bp.route('/reject/<endpoint>/<recordId>', methods=['POST'])
    def reject(endpoint=None, recordId=None):
        if endpoint and recordId:
            try:
                if endpoint == 'teamsProjectsRequests':
                    return rejectTeamsProjectsRequests(recordId)
                return jsonify({'status': 'success',
                                "message": f"request {recordId} rejected successfully"}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while rejecting request, {str(err)}'}
                return jsonify(response), 500
        else:
            response = {'status': 'error', 'message': 'Non valid endpoint provided'}
            return jsonify(response), 500

    @db_records_mngt_bp.route('/predictGrade/<recordId>', methods=['POST'])
    def predictGrade(recordId=None):
        if recordId:
            try:
                teamData = request.json
                prediction = predict(teamData)
                return jsonify({'status': 'success',
                                "message": prediction}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while predicting grade, {str(err)}'}
                return jsonify(response), 500
        else:
            response = {'status': 'error', 'message': 'error occurred while predicting grade'}
            return jsonify(response), 500

    # Moved from notifications object inside user object to notification db in Firebase.
    def createNotification(notification, endpoint=None, ids=None):
        if endpoint:
            usersIds = []
            receivers = []
            if endpoint == 'admin':
                usersIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter(
                    Users.is_admin == True).all()
                # receivers = dbs['users'].query.with_entities(Users.email).filter(Users.is_admin == True).all()
                # receivers = [_.email for _ in receivers]
            elif endpoint in ['student', 'advisor']:
                usersIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter(
                    Users.user_type == endpoint).all()
                if endpoint == 'student':
                    receivers = dbs['users'].query.with_entities(Users.email).filter(Users.user_type == endpoint).all()
                    receivers = [_.email for _ in receivers]
            elif ids and endpoint == 'custom':
                usersIds = ids
                receivers = dbs['users'].query.with_entities(Users.email).filter(
                    Users.firebase_user_id.in_(usersIds)).all()
                receivers = [_.email for _ in receivers]
            notification["creationDate"] = date.today().strftime('%d/%m/%Y')
            for userId in usersIds:
                notRef = refs['notifications'].child(userId.firebase_user_id)
                nextId = notRef.push(notification).key
                notification["id"] = nextId
                refs['notifications'].child(userId.firebase_user_id).child(nextId).update(notification)
            subject = notification['title']
            message = notification['body']
            message = message.replace('\n', '')
            try:
                sendMessage(receivers, subject, message, None)
            except Exception as err:
                return jsonify({'status': 'error', 'message': f'Can not send email {str(err)}'}), 500
            return True
        else:
            return False

    def is_human(captcha_response):
        """ Validating recaptcha response from google server
            Returns True captcha test passed for submitted form else returns False.
        """
        secret = os.getenv('RECAPTCHA_SECRET_KEY')
        payload = {'response': captcha_response, 'secret': secret}
        response = requests.post("https://www.google.com/recaptcha/api/siteverify", payload)
        response_text = json.loads(response.text)
        return response_text['success']

    @db_records_mngt_bp.route('/search', methods=['GET'])
    def search():
        relevet_dbs = request.args.get("entities", default='projects,teams,users').split(',')
        search_term = request.args.get("search_term", default='alex')
        if not search_term:
            return jsonify({'status': 'success', "message": [], "row_count": 0}), 200
        models = {k: dbs[k] for k in relevet_dbs if k in dbs}.values()

        res = {'projects': [], 'teams': [], 'users': {'students': [], 'advisors': []}}
        for model in models:
            columns = model.__table__.columns.keys()
            d = {column: search_term for column in columns}
            conditions = [getattr(model, col).ilike(f"%{val}%") for col, val in d.items()]

            if model.__table__.fullname == 'projects':
                raw = db.session.query(Projects, Organizations, Teams) \
                    .join(Organizations, Organizations.id == Projects.organizationId, isouter=True) \
                    .join(Teams, Teams.id == Projects.teamId, isouter=True).filter(or_(*conditions)).all()
                for item in raw:
                    project, organization = item.Projects, item.Organizations
                    team = None
                    if project.teamId is not None:
                        team = item.Teams
                    temp = {}
                    temp.update(**item.Projects.serialize())
                    if organization:
                        temp['organizationId'] = {**organization.serialize()}
                    # if project.teamId is not None and team:
                    #     temp['teamId'] = {**team.serialize()}
                    #     students = dbs['users'].query.filter_by(teamId=team.id).all()
                    #     temp['students'] = [s.serialize() for s in students]
                    if project.academicAdvisorId:
                        user = dbs['users'].query.filter_by(firebase_user_id=project.academicAdvisorId).first()
                        temp['academicAdvisorId'] = user.serialize() if user else None
                    if project.industrialAdvisorId:
                        user = dbs['users'].query.filter_by(firebase_user_id=project.industrialAdvisorId).first()
                        temp['industrialAdvisorId'] = user.serialize() if user else None
                    res['projects'].append(temp)
            elif model.__table__.fullname == 'teams':
                response = retrieveTeams(state='all', is_read=None, add_filter=or_(*conditions))
                data = json.loads(response[0].get_data())['message']
                res['teams'] = data

            else:
                raw = model.query.filter(or_(*conditions)).all()
                if model.__table__.fullname != 'users':
                    res[model.__table__.fullname] += [item.serialize() for item in raw if item]
                else:
                    raw = db.session.query(Users, Projects, SyllabusConfirmation) \
                        .join(Projects, Projects.teamId == Users.teamId, isouter=True) \
                        .join(SyllabusConfirmation, Users.firebase_user_id == SyllabusConfirmation.id, isouter=True) \
                        .filter(or_(*conditions)).all()
                    for item in raw:
                        if item:
                            userData, userProject, syllabusConfirmation = item.Users, item.Projects, item.SyllabusConfirmation
                            t = userData.serialize()
                            if t['user_type'] == 'student':
                                if syllabusConfirmation:
                                    t['syllabusConfirmation'] = syllabusConfirmation.confirmation
                                else:
                                    t['syllabusConfirmation'] = False
                                if userProject:
                                    t['projectId'] = userProject.serialize()['id']
                                res['users']['students'].append(t)
                            else:
                                res['users']['advisors'].append(t)

        # query_records = db.session.query(Projects, Teams, Users).join(Teams, Teams.id == Projects.teamId).join(Users, Teams.id == Users.teamId).all()

        return jsonify({'status': 'success', "message": res, "row_count": len(res)}), 200

    return db_records_mngt_bp
