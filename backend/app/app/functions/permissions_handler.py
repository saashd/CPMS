#!/usr/bin/python
# coding=utf-8

"""
Author:  moshed
Created on 22/08/2021

"""
import json

from ..models import Teams, Events, Schedule, Projects, Organizations, TeamsProjectsRequests, Semesters, \
    StudentsFindPartners, TeamsFindPartners, ProjectProposals, DelayRequests, GenericItems, Courses, Files, Users

""" handling non-admin users access"""

dbs = {'teams': Teams,
       'events': Events,
       'schedule': Schedule,
       'projects': Projects,
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
       'users': Users}


# Security check of all endpoints connected to user table in firebase db.
def handleMySQLUserRequestAccess(claims, request):
    path = request.path.split("/")
    uid_claims = claims['user_id']
    user = dbs['users'].query.filter_by(firebase_user_id=uid_claims).first()
    if user:
        user = user.serialize()
    # Simple User can't create new user
    if 'createUser' == path[2]:
        if uid_claims == path[3]:
            return
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    if user is None:
        if 'verify_user' == path[2]:
            return
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    # Simple User can update his personal data only
    if 'updateUser' == path[2]:
        uid = path[3]
        add_grades_template = request.args.get("add_grades_template", default=False)
        if add_grades_template:
            return
        if uid != uid_claims:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # Simple User can't update personal access
    if 'updateUserAccess' == path[2]:
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # Simple User can read personal details only (by passing his id)
    if 'readUsers' == path[2]:
        # userIds is array
        userIds = request.json
        # if no ids send deny access
        if not userIds or 'ids' not in userIds:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # if user asks for details of other users, deny acess
        if uid_claims not in userIds['ids'] or len(userIds['ids']) > 1:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # Simple User can't remove users
    if 'deleteUser' == path[2]:
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # Simple User trying to read users details.
    if 'retrieveUser' == path[2]:
        enpoint = path[3]
        # students can access studentsWithoutATeam endpoint.
        if enpoint == 'studentsWithoutATeam':
            if user['user_type'] == 'advisor':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            # courseId = request.args.get("courseId", default=None)
            # if int(user['courseId']) != int(courseId):
            #     return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # only admin can read user's details from those endpoins
        if enpoint in ['users', 'student', 'advisor', 'admin', 'not admin']:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    # Simple User trying to read notifications.
    if 'readNotifications' == path[2]:
        uid = path[3]
        if uid != uid_claims:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # Simple User trying to delete notifications.
    if 'removeNotifications' == path[2]:
        uid = path[3]
        if uid != uid_claims:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    return


# Security check of all endpoints connected to evaluationPages, gradeTemplates, fileTemplates tables in firebase db.
def handleFBRequestAccess(request):
    path = request.path.split("/")
    # createFB endpoint: only admin
    if 'createFB' == path[2]:
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # updateFB endpoint: only admin
    elif 'updateFB' == path[2]:
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # deleteFB endpoint: only admin
    elif 'deleteFB' == path[2]:
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    # retrieveFB endpoint: all users
    return


def handleFilesRequestAccess(claims, request):
    try:
        path = request.path.split("/")
        if path[2] != 'downloadFile':
            return
        uid = claims['user_id']
        user = dbs['users'].query.filter_by(firebase_user_id=uid).first()
        if user:
            user = user.serialize()

        data = request.json
        filePath = data['filePath']
        pathProjectId = filePath.split('/')[3] if len(filePath.split('/')) > 3 else ''
        requestedProjectId = data['projectId']
        if (not requestedProjectId and not pathProjectId.isdigit()) or user['user_type'] in ['advisor', 'admin']:
            return
        if user['teamId'] is None:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        project = dbs['projects'].query.filter_by(teamId=user['teamId']).first()
        if int(requestedProjectId) != int(project.id) or int(requestedProjectId) != int(pathProjectId):
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    except Exception as err:
        return json.dumps({'status': 'error', 'message': f'{err}'}), 500


# Security check of all endpoints connected to tables in MySQL db.
def handleMySqlRequestAccess(claims, request):
    path = request.path.split("/")
    uid = claims['user_id']
    user = dbs['users'].query.filter_by(firebase_user_id=uid).first()
    if user:
        user = user.serialize()

    user_has_assigned_team = None
    if user:
        user_has_assigned_team = user['teamId']
    # User trying to read files:
    if 'getFilesCPMS2011' == path[2]:
        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    if 'getFiles' == path[2]:
        projectId = request.args.get("projectId", default=None)
        if projectId is not None:
            project = dbs['projects'].query.filter_by(id=int(projectId)).first()
            if project is not None:
                if user['user_type'] == 'student':
                    # student can get files of the project his team assigned to.
                    if user_has_assigned_team is None:
                        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
                    elif user['teamId'] != project.teamId:
                        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
                # advisor can get files attached to  projects he is in charge of
                elif user['user_type'] == 'advisor':
                    if not (
                            project is not None and uid == project.academicAdvisorId or uid == project.industrialAdvisorId):
                        return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # User trying to upload file:
    elif 'uploadFile' == path[2]:
        if user_has_assigned_team is None:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        projectId = int(request.form["projectId"]) if "projectId" in request.form else None
        if projectId is not None:
            # student can upload files only to the project his team assigned to.
            project = dbs['projects'].query.filter_by(id=projectId).first()
            if project is None or int(user['teamId']) != int(project.teamId):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # User trying to update existing file
    elif 'updateUploadedFile' == path[2]:
        if user_has_assigned_team is None:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        fileId = int(request.form["id"]) if "id" in request.form else None
        if fileId is not None:
            existingFile = dbs['files'].query.filter_by(id=fileId).first()
            # student can update only files attached to project his team assigned to.
            if existingFile is None or int(user['teamId']) != int(existingFile.teamId):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # User trying to delete file
    elif 'deleteFile' == path[2]:
        if user_has_assigned_team is None:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        projectId = int(request.form["projectId"]) if "projectId" in request.form else None
        if projectId is not None:
            project = dbs['projects'].query.filter_by(id=projectId).first()
            if project is None or user['teamId'] != project.teamId:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # User trying to create record:
    elif 'create' == path[2]:
        # advisor can't create mysql records.
        if user['user_type'] == 'advisor':
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # student can create new team (can be assigned to one team only)
        elif 'teams' == path[3]:
            if user_has_assigned_team:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # team-project request - student can place one request (request without admin response)
        elif 'teamsProjectsRequests' == path[3]:
            if user_has_assigned_team is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            elif int(user['teamId']) != int(request.json['teamId']):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            if user['teamId']:
                project = dbs['projects'].query.filter_by(teamId=int(user['teamId'])).first()
                # if student already has a project assigned to, can't place request
                if project is not None:
                    return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
                request = dbs['teamsProjectsRequests'].query.filter_by(teamId=int(user['teamId'])).first()
                # if student's team already placed request  which waits to  admin's respond, can't place request
                if request is not None and request.adminStatus is None:
                    return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # student find partner or team find partner request - only one request can be placed.
        elif 'studentsFindPartners' == path[3]:
            # check that user places request corresponds to himself
            if uid != request.json['student']:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            # check if there is already another request
            request = dbs['studentsFindPartners'].query.filter_by(student=int(uid)).first()
            if request is not None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        elif 'teamsFindPartners' == path[3]:
            # check that user places request corresponds to himself
            if uid != request.json['student']:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            # check if there is already another request
            request = dbs['teamsFindPartners'].query.filter_by(student=uid).first()
            if request is not None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # delay request - student can place request only to the proj. he asssigned to.
        elif 'delayRequests' == path[3]:
            # student tries to place ruquest for another team
            if user_has_assigned_team is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            elif int(user['teamId']) != int(request.json['teamId']):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            if user['teamId']:
                project = dbs['projects'].query.filter_by(teamId=int(user['teamId'])).first()
                # student tries to place ruquest for another project
                if project is not None and int(project.id) != int(request.json['projectId']):
                    return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    # User trying to update record:
    elif 'update' == path[2]:
        # advisor can't update mysql records.
        if user['user_type'] == 'advisor':
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # student can update team members of the team he created(files update we checked earlier, user details also)
        elif 'teams' == path[3]:
            teamId = int(request.path.split("teams/")[1])
            if user_has_assigned_team is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            elif teamId != int(user['teamId']):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            team = dbs['teams'].query.filter_by(id=teamId).first()
            if team.creatorId != uid:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # User trying to remove record
    elif 'delete' == path[2]:
        # advisor can't delete mysql records.
        if user['user_type'] == 'advisor':
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # student can remove team he created,requests(team-partner\student-patrner) (files delete checked earlier)
        elif 'teams' == path[3]:
            teamId = request.path.split("teams/")[1]
            if user_has_assigned_team is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            elif int(teamId) != int(user['teamId']):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            team = dbs['teams'].query.filter_by(id=int(teamId)).first()
            if team is not None and team.creatorId != uid:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        elif 'studentsFindPartners' == path[3]:
            # check that user places request corresponds to himself
            if uid != request.json['student']:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            # check if request exists
            request = dbs['studentsFindPartners'].query.filter_by(student=int(uid)).first()
            if request is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        elif 'teamsFindPartners' == path[3]:
            # check that user places request corresponds to himself
            if uid != request.json['student']:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            # check if there is already another request
            request = dbs['teamsFindPartners'].query.filter_by(student=int(uid)).first()
            if request is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # Only admin can approve or reject record:
    elif 'approve' == path[2] or 'reject' == path[2]:
        if path[3] == 'teamsProjectsRequests':
            if user['user_type'] == 'advisor' and user['advisorType'] == 'academical':
                return
        else:
            return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

    # User trying to retrieve records:
    elif 'retrieve' == path[2]:
        if 'teamsProjectsRequests' == path[3]:
            team_id = request.args.get("team_id", default=None)
            if user['user_type'] == 'advisor':
                return
            if user['user_type'] == 'student' and user_has_assigned_team is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            if team_id is not None and int(user['teamId']) != int(team_id):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # Advisor can retrieve all generic items
        if 'genericItems' == path[3]:
            if user['user_type'] == 'advisor':
                return
            # student can retrieve generic items:syllabus, stuff, help, course material,
            # and announcements, acc. to course he assigned to.
            elif user['courseId'] is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            courseId = request.args.get("courseId")
            if courseId is not None and int(user['courseId']) != int(courseId):
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        elif 'teams' == path[3]:
            is_read = json.loads(request.args.get("is_read", default='false'))
            entityData = request.json
            if is_read and entityData and 'ids' in entityData:
                teamId = entityData['ids'][0]
            else:
                teamId = None
            # advisor can retrieve details about teams assigned to projects he in charge of.
            if user['user_type'] == 'advisor':
                if teamId:
                    project = dbs['projects'].query.filter_by(id=int(teamId)).first()
                    if project and not (project.academicAdvisorId == uid or project.industrialAdvisorId == uid):
                        return json.dumps(
                            {'status': 'error', 'message': 'Unauthorized Action for this user}'}), 401
            # student can retrieve his team details
            elif user_has_assigned_team is None:
                return json.dumps(
                    {'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            if teamId:
                records = dbs['teams'].query.filter_by(id=int(teamId)).first()
                if records and int(records.id) != int(teamId):
                    return json.dumps({'status': 'error',
                                       'message': 'Unauthorized Action for this user}'}), 401
        # student/advisor can retrieve projects details they assigned to.
        elif 'studentProjects' == path[3]:
            if user['user_type'] == 'advisor':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            entityData = request.json
            if entityData and 'user_id' in entityData:
                user_id = entityData['user_id'][0]
            else:
                user_id = None
            if user_id != uid:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

        elif 'academicProjects' == path[3] or 'industrialProjects' == path[3]:
            if user['user_type'] == 'student':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            entityData = request.json
            if entityData and 'user_id' in entityData:
                user_id = entityData['user_id'][0]
            else:
                user_id = None
            if user_id != uid:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401

        # all users can retrieve available projects
        elif 'availableProjects' == path[3]:
            return
        # student can retrieve all find partner requests
        elif 'studentsFindPartners' == path[3]:
            if user['user_type'] == 'advisor':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        elif 'teamsFindPartners' == path[3]:
            if user['user_type'] == 'advisor':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # student/advosr can retrieve delay requests corresponding to project he assigned to.
        elif 'delaysPerProject' == path[3] or 'delayRequests' == path[3]:
            if user['teamId'] is None and user['user_type'] == 'student':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            projectId = request.args.get("projectId", default=None)
            if projectId:
                project = dbs['projects'].query.filter_by(id=int(projectId)).first()
            else:
                project = None
            if user['user_type'] == 'student':
                if project and int(user['teamId']) != int(project.teamId):
                    return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
            if user['user_type'] == 'advisor':
                if project and not (uid == project.academicAdvisorId or uid == project.industrialAdvisorId):
                    return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # student can rettrieve events acc. to course and semester he assigned to.
        elif 'eventsByCourse' == path[3]:
            if user['courseId'] is None or user['semesterId'] is None:
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
        # advisor can retrieve  events allowed to view by admin.
        elif 'eventsDisplayedToAll' == path[3]:
            if user['user_type'] == 'student':
                return json.dumps({'status': 'error', 'message': 'Unauthorized Action for this user'}), 401
    return
