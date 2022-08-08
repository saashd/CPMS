#!/usr/bin/python
# coding=utf-8
"""
Author:  moshed
Created on 11/02/2021

"""

import datetime
from datetime import date, timedelta, datetime

from flask import Blueprint, jsonify, request

from ..algorithm.trainModel import trainModel
from ..models import db, Teams, Projects, Organizations, TeamsProjectsRequests, Events, Schedule, Semesters, \
    StudentsFindPartners, TeamsFindPartners, ProjectProposals, DelayRequests, GenericItems, Courses, Files, \
    Projects_cpms2011, Personel_cpms2011, Teams_cpms2011, Users, SyllabusConfirmation, LogTable
from ..sendEmail import sendMessage

dbs = {"users": Users,
       'teams': Teams,
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
       'syllabusconfirmation': SyllabusConfirmation,
       'logTable':LogTable}


def construct_blueprint(dbRef, firebaseAuth, projectsStatusUpdatesRef):
    usersMngt_bp = Blueprint('usersMngt_bp', __name__, )
    refs = {'notifications': dbRef.child('notifications'),
            'studentsGrades': dbRef.child('studentsGrades')}

    def calculateFinalGrades(uid):
        try:
            gradeTemplate = refs['studentsGrades'].child(uid).get()
            template = gradeTemplate['template'].values() if 'template' in gradeTemplate else None
            finalGrades = {}
            if template:
                for gradeObj in template:
                    if gradeObj["stage"] not in finalGrades:
                        finalGrades[gradeObj["stage"]] = []
                    if "grade" not in gradeObj or int(gradeObj["grade"]) == 0:
                        finalGrades[gradeObj["stage"]].append(0)

                    elif "grade" in gradeObj and gradeObj["description"] != "Final Grade":
                        finalGrades[gradeObj["stage"]].append(
                            int(gradeObj["grade"]) * int(gradeObj["percent"]) / 100)

                for key, value in finalGrades.items():
                    if value != [] and sum(value) != 0:
                        finalGrades[key] = sum(value)
                    else:
                        finalGrades[key] = None
                for gradeObj in template:
                    if gradeObj["description"] == 'Final Grade':
                        gradeObj["final_grade"] = finalGrades[gradeObj["stage"]]
                refs['studentsGrades'].child(uid).child('template').update(gradeTemplate['template'])
            return jsonify({'status': 'success', 'message': gradeTemplate}), 200
        except Exception as err:
            response = {'status': 'error',
                        'message': f"error occurred while calculating user's {uid} final grade {str(err)} in calculateFinalGrades"}
            return jsonify(response), 500

    @usersMngt_bp.route('/updateAllStudentsGrades/<teamId>', methods=['POST'])
    def updateAllStudentsGrades(teamId=None):
        try:
            if teamId:
                gradeTemplate = request.json
                gradeTemplate.pop('undefined', None)
                users = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(
                    teamId=teamId).all()

                response = ""
                for user in users:
                    refs['studentsGrades'].child(user.firebase_user_id).child('template').update(gradeTemplate)
                    response = calculateFinalGrades(user.firebase_user_id)
                return response
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    @usersMngt_bp.route('/updateStudentGrades/<uid>', methods=['POST'])
    def updateStudentGrades(uid=None):
        try:
            if uid:
                gradeTemplate = request.json
                gradeTemplate.pop('undefined', None)
                refs['studentsGrades'].child(uid).child('template').update(gradeTemplate)
                return calculateFinalGrades(uid)
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    @usersMngt_bp.route('/updateUser/<uid>', methods=['POST'])
    def updateUser(uid=None):
        try:
            if uid:
                userData = request.json
                user = dbs['users'].query.filter_by(firebase_user_id=uid).first()
                user.update(**userData)
                db.session.commit()
                return jsonify(userData), 200
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    def removeStudentFromDB(student, uid):
        try:
            syllabusConfirmation = dbs['syllabusconfirmation'].query.filter_by(id=uid).first()
            delayRequest = dbs['delayRequests'].query.filter_by(studentId=uid)
            delayRequest.update({'studentId': None})
            teamFindPartnersRequest = dbs['teamsFindPartners'].query.filter_by(student=uid).first()
            studentFindPartnersRequest = dbs['studentsFindPartners'].query.filter_by(student=uid).first()
            if syllabusConfirmation:
                db.session.delete(syllabusConfirmation)
            if teamFindPartnersRequest:
                db.session.delete(teamFindPartnersRequest)
            if studentFindPartnersRequest:
                db.session.delete(studentFindPartnersRequest)
            if student.teamId is not None:
                team = dbs['teams'].query.filter_by(id=student.teamId).first()
                teamCreator = team.creatorId
                if teamCreator == uid:
                    anotherTeamToStudents = dbs['users'].query.filter(
                        Users.teamId == student.teamId).filter(
                        Users.firebase_user_id != uid).all()
                    if len(anotherTeamToStudents) != 0:
                        dbs['teams'].query.filter_by(id=student.teamId).update(
                            {'creatorId': anotherTeamToStudents[0].firebase_user_id})
                    else:
                        db.session.delete(team)
            db.session.delete(student)
            db.session.commit()
            return True
        except Exception as err:
            return err

    @usersMngt_bp.route('/deleteUser/<uid>', methods=['POST'])
    def deleteUser(uid=None):
        try:
            if uid:
                user = dbs['users'].query.filter_by(firebase_user_id=uid).one()
                if user.user_type == "student":
                    if removeStudentFromDB(user, uid) is True:
                        refs['notifications'].child(uid).set({})
                        refs['studentsGrades'].child(uid).set({})
                        firebaseAuth.delete_user(uid)
                        return jsonify({'status': 'success', 'message': 'User has been deleted'}), 200
                    else:
                        return jsonify({"message": f"Error while deleting user: {str(removeStudentFromDB(uid))}"}), 400
                elif user.user_type == "advisor":
                    db.session.delete(user)
                    db.session.commit()
                    refs['notifications'].child(uid).set({})
                    try:
                        firebaseAuth.delete_user(uid)
                    except Exception as err:
                        response = {"message": f"Error while deleting user: {str(err)}"}
                        return jsonify(response), 500
                    return jsonify({'status': 'success', 'message': 'User has been deleted'}), 200
                else:
                    response = {'status': 'error', 'message': 'Error while  deleting user'}
                    return jsonify(response), 400
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    @usersMngt_bp.route('/readUsers/', methods=['GET', 'POST'])
    def readUsers():
        try:
            userIds = request.json
            usersData = {}
            if userIds and 'ids' in userIds:
                for uid in userIds['ids']:
                    user = db.session.query(Users, Projects) \
                        .join(Projects, Projects.teamId == Users.teamId, isouter=True) \
                        .filter(Users.firebase_user_id == uid).one()
                    temp = user.Users.serialize()
                    if user.Projects:
                        temp['projectId'] = user.Projects.serialize()['id']
                    usersData[uid] = temp
            return jsonify(usersData), 200
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    @usersMngt_bp.route('/retrieveUser/<endpoint>', methods=['GET', 'POST'])
    def retrieveUser(endpoint=None):
        if endpoint:
            try:
                if endpoint == 'users':
                    records = dbs['users'].query.all()
                    x = [u.serialize() for u in records]
                    return jsonify({'status': 'success', "message": x}), 200
                if endpoint == 'advisor':
                    records = db.session.query(Users, Projects) \
                        .join(Projects, Projects.teamId == Users.teamId, isouter=True) \
                        .filter(Users.user_type == endpoint).all()
                    x = []
                    for u in records:
                        temp = u.Users.serialize()
                        if u.Projects:
                            temp['projectId'] = u.Projects.serialize()['id']
                        x.append(temp)

                    return jsonify({'status': 'success',
                                    "message": x}), 200
                if endpoint == 'student':
                    records = []
                    query_records = db.session.query(Users, Projects, SyllabusConfirmation) \
                        .join(Projects, Projects.teamId == Users.teamId, isouter=True) \
                        .join(SyllabusConfirmation, Users.firebase_user_id == SyllabusConfirmation.id, isouter=True) \
                        .filter(Users.user_type == endpoint).all()
                    for item in query_records:
                        userData, userProject, syllabusConfirmation = item.Users, item.Projects, item.SyllabusConfirmation
                        userData = userData.serialize()
                        if syllabusConfirmation:
                            userData['syllabusConfirmation'] = syllabusConfirmation.confirmation
                        else:
                            userData['syllabusConfirmation'] = False
                        if userProject:
                            userData['projectId'] = userProject.serialize()['id']
                        records.append(userData)
                    return jsonify({'status': 'success',
                                    "message": records}), 200
                if endpoint == 'admin':
                    records = dbs['users'].query.filter(Users.is_admin == True).all()
                    x = [u.serialize() for u in records]
                    return jsonify({'status': 'success',
                                    "message": x}), 200
                if endpoint == 'not admin':
                    records = dbs['users'].query.filter(Users.is_admin == False).all()
                    x = [u.serialize() for u in records]
                    return jsonify({'status': 'success',
                                    "message": x}), 200
                if endpoint in ['academic', 'industrial', 'both']:
                    records = dbs['users'].query.filter(Users.advisorType == endpoint).all()
                    x = [u.serialize() for u in records]
                    return jsonify({'status': 'success',
                                    "message": x}), 200
                if endpoint == 'studentsWithoutATeam':
                    courseId = request.args.get("courseId", default=None)
                    semesterId = Semesters.query.filter(Semesters.isCurrent).one().id
                    students = dbs['users'].query.filter(Users.user_type == 'student').filter(Users.teamId == None)
                    if courseId:
                        students.filter(Users.courseId == courseId)
                    if semesterId:
                        students.filter(Users.semesterId == semesterId).all()
                    noTeamStudents = [u.serialize() for u in students]
                    return jsonify(
                        {'status': 'success', 'message': noTeamStudents, 'row_count': len(noTeamStudents)}), 200
                if endpoint == 'studentsInTeam':
                    teamId = request.args.get("teamId", default=None)
                    students = dbs['users'].query.filter(Users.teamId == teamId)
                    students = [u.serialize() for u in students]
                    return jsonify(
                        {'status': 'success', 'message': students, 'row_count': len(students)}), 200
                if endpoint == 'currAcademicAdvisor':
                    assignedProjects = dbs['projects'].query.filter(Projects.assignDate != None).all()
                    assignedProjects = [u.serialize() for u in assignedProjects]
                    semester = Semesters.query.filter(Semesters.isCurrent).one()
                    semesterStartDate = semester.startDate
                    semesterEndDate = semester.endDate
                    academAdvisorsIds = []
                    for p in assignedProjects:
                        assignDate = p['assignDate']
                        if isinstance(semesterEndDate, datetime) and isinstance(semesterStartDate,
                                                                                datetime) and isinstance(assignDate,
                                                                                                         datetime):
                            if semesterEndDate >= assignDate >= semesterStartDate:
                                academAdvisorsIds.append(p['academicAdvisorId'])
                    advisors = dbs['users'].query.filter(Users.firebase_user_id.in_(academAdvisorsIds)).all()
                    data = []
                    if advisors:
                        data = [a.serialize() for a in advisors]
                    return jsonify(
                        {'status': 'success', 'message': data, 'row_count': len(data)}), 200

                if endpoint == 'currIndustrialAdvisor':
                    assignedProjects = dbs['projects'].query.filter(Projects.assignDate != None).all()
                    assignedProjects = [u.serialize() for u in assignedProjects]
                    semester = Semesters.query.filter(Semesters.isCurrent).one()
                    semesterStartDate = semester.startDate
                    semesterEndDate = semester.endDate
                    academAdvisorsIds = []
                    for p in assignedProjects:
                        assignDate = p['assignDate']
                        if isinstance(semesterEndDate, datetime) and isinstance(semesterStartDate,
                                                                                datetime) and isinstance(assignDate,
                                                                                                         datetime):
                            if semesterEndDate >= assignDate >= semesterStartDate:
                                academAdvisorsIds.append(p['industrialAdvisorId'])
                    advisors = dbs['users'].query.filter(Users.firebase_user_id.in_(academAdvisorsIds)).all()
                    data = []
                    if advisors:
                        data = [a.serialize() for a in advisors]
                    return jsonify(
                        {'status': 'success', 'message': data, 'row_count': len(data)}), 200
            except Exception as err:
                response = {'status': 'error', 'message': 'error occurred while retrieving'}
                return jsonify(response), 400
        else:
            response = {'status': 'error', 'message': 'Non valid endpoint provided'}
            return jsonify(response), 400

    @usersMngt_bp.route('/createUser/<uid>', methods=['POST'])
    def createUser(uid=None):
        try:
            if uid:
                semesterId = Semesters.query.filter(Semesters.isCurrent).one().id
                userData = request.json
                userData['semesterId'] = semesterId
                entity = dbs['users'](**userData)
                db.session.add(entity)
                if userData['user_type'] == 'student':
                    syllabusConfirmation = {'id': userData['firebase_user_id'], 'confirmation': False}
                    entity = dbs['syllabusconfirmation'](**syllabusConfirmation)
                    db.session.add(entity)
                db.session.commit()
                firebaseAuth.set_custom_user_claims(uid, {'is_admin': False})
                return jsonify(userData), 200
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    # Move from Firebase to MySQL
    @usersMngt_bp.route('/updateUserAccess/<uid>', methods=['POST'])
    def updateUserAccess(uid=None):
        try:
            if uid:
                userData = request.json
                dbs['users'].query.filter_by(firebase_user_id=uid).update(userData)
                firebaseAuth.set_custom_user_claims(uid, userData)
                db.session.commit()
                notification = {"title": 'Permissions Notification:'}
                user = dbs['users'].query.filter_by(firebase_user_id=uid).one()
                user = user.serialize()
                if user['is_admin']:
                    notification["body"] = 'Congrats! You have admin permissions now.'
                else:
                    notification["body"] = 'You no longer have admin permissions.'
                createNotification(notification, ids=[{'firebase_user_id': uid}], endpoint='custom')
                return jsonify(userData), 200
            else:
                response = {'status': 'error', 'message': 'User id was not provided.'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

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
                notRef = refs['notifications'].child(userId['firebase_user_id'])
                nextId = notRef.push(notification).key
                notification["id"] = nextId
                refs['notifications'].child(userId['firebase_user_id']).child(nextId).update(notification)
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

    @usersMngt_bp.route('/removeNotifications/<uid>', methods=['POST'])
    def removeNotifications(uid=None):
        try:
            if uid:
                notifications = request.json
                notificationsRef = refs['notifications'].child(uid)
                for notification in notifications:
                    if 'readDate' not in notification:
                        notification["readDate"] = date.today().strftime('%d/%m/%Y')
                        notificationsRef.child(notification["id"]).update(notification)
                return readNotifications(uid)
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    @usersMngt_bp.route('/readNotifications/<uid>', methods=['POST'])
    def readNotifications(uid=None):
        try:
            if uid:
                notifications = refs['notifications'].child(uid).get()
                unread = []
                read = []
                two_days_ago_date = date.today() - timedelta(days=2)
                if notifications is None:
                    notifications = {"unread": [], "read": []}
                    return jsonify(notifications), 200
                for notificationId in notifications:
                    if 'readDate' not in notifications[notificationId]:
                        unread.append(notifications[notificationId])
                    else:
                        if datetime.strptime(notifications[notificationId]['creationDate'],
                                             '%d/%m/%Y').date() >= two_days_ago_date:
                            read.append(notifications[notificationId])
                        else:
                            refs['notifications'].child(uid).set({})
                notifications = {"unread": unread, "read": read}
                return jsonify(notifications), 200
            else:
                response = {'status': 'error', 'message': 'User id was not provided'}
                return jsonify(response), 400
        except Exception as err:
            response = {'status': 'error', 'message': f'An error has occurred, {str(err)}'}
            return jsonify(response), 400

    @usersMngt_bp.route('/updateCourseAndSemesterManually', methods=['POST'])
    def update_course_and_semester():
        try:
            curr_semester = dbs['semesters'].query.filter(Semesters.isCurrent).one()
            if curr_semester:
                # if date.today() == curr_semester.startDate.date():
                courses = dbs['courses'].query.all()
                courses = [u.serialize() for u in courses]

                students = dbs['users'].query.filter(Users.user_type == 'student').all()
                students = [s.serialize() for s in students]
                for student in students:
                    stud_courseId = student['courseId']
                    stud_semesterId = student['semesterId']
                    next_course = next(
                        (item for item in courses if item["continuationOfCourse"] == int(stud_courseId)),
                        None)
                    if next_course and next_course['id'] != 94196 and curr_semester.id != stud_semesterId:
                        student['semesterId'] = curr_semester.id
                        student['courseId'] = next_course['id']
                        dbs['users'].query.filter_by(firebase_user_id=student['firebase_user_id']).update(student)
            db.session.commit()
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not update Projects Status {err}"}), 400

    @usersMngt_bp.route('/trainGradeModelManually', methods=['Post'])
    def trainGradeModel():
        try:
            trainModel()
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not update Projects Status {err}"}), 400

    @usersMngt_bp.route('/clearLogTableManually', methods=['GET', 'POST'])
    # Remove all entities from logTable in sqlite db once in a month.
    def clearLogTable():
        try:
            dbs['logTable'].query.delete()
            db.session.commit()
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not clear Logs  {err}"}), 400

    @usersMngt_bp.route('/updateProjectsStatusManually', methods=['POST'])
    # Updates  Available Projects status depends of advisors response.
    # If project still available, update  lastVerified property, else change status to On Hold
    def updateProjectsStatus():
        try:
            data = projectsStatusUpdatesRef.get()
            data = list(data.values()) if data else []
            for project in data:
                if project["status"] == 'yes':
                    dbs['projects'].query. \
                        filter(Projects.id == project["projectId"]).update(
                        {'lastVerified': date.today()},
                        synchronize_session=False)
                else:
                    dbs['projects'].query. \
                        filter(Projects.id == project["projectId"]).update(
                        {'status': "On Hold"},
                        synchronize_session=False)
                projectsStatusUpdatesRef.child(str(project["projectId"])).set({})
            db.session.commit()
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not update Projects Status {err}"}), 400

    @usersMngt_bp.route('/updateStatusOfCompletedProjectsManually', methods=['POST'])
    # Updates  Projects status to Completed if project is graded.
    def updateStatusOfCompletedProjects():
        try:
            records = dbs['projects'].query.all()
            query_records = [u.serialize() for u in records]
            for project in query_records:
                teamId = project['teamId']
                if teamId:
                    studentsIds = dbs['users'].query.with_entities(Users.firebase_user_id).filter_by(
                        teamId=teamId).all()
                    count = 0
                    for studentIds in studentsIds:
                        gradeTemplate = refs['studentsGrades'].child(studentIds.firebase_user_id).child(
                            'template').get()
                        if gradeTemplate:
                            for key, value in gradeTemplate.items():
                                if value['description'] == 'Final Grade':
                                    if 'grade' in value and value['grade'] != 0:
                                        count += 1
                    if count == len(studentsIds):
                        dbs['projects'].query. \
                            filter(Projects.id == project["id"]).update(
                            {'status': "Complete", "endDate": date.today()},
                            synchronize_session=False)
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not update Status Of Completed Projects {err}"}), 400

    return usersMngt_bp
