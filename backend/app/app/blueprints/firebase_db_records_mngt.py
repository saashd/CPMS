#!/usr/bin/python
# coding=utf-8
"""
Author:  moshed
Created on 23/05/2021

"""

from flask import Blueprint, jsonify, request
import json

from ..models import Users

dbs = {"users": Users}


def construct_blueprint(dbRef):
    firebase_db_records_mngt = Blueprint('firebase_db_records_mngt', __name__, )
    refs = {'evaluationPages': dbRef.child('evaluationPages'),
            'gradeTemplates': dbRef.child('gradeTemplates'),
            'fileTemplates': dbRef.child('fileTemplates'),
            'notifications': dbRef.child('notifications'),
            'studentsGrades': dbRef.child('studentsGrades'),
            'filesTemplatePerTeam': dbRef.child('filesTemplatePerTeam')}

    @firebase_db_records_mngt.route('/createFB/<endpoint>', methods=['POST'])
    def createFB(endpoint=None):
        if endpoint:
            try:
                entityData = request.json
                nextId = refs[endpoint].push(entityData).key
                entityData["id"] = nextId
                refs[endpoint].child(nextId).update(entityData)
                return jsonify({'status': 'success',
                                "message": f"{endpoint[:-1]} {nextId} created successfully",
                                'newEntityId': nextId}), 200
            except Exception as err:
                response = {'status': 'error', 'message': f'error occurred while creating {endpoint[:-1]}, {str(err)}'}
                return jsonify(response), 500

        else:
            response = {'status': 'error', 'message': 'Non valid endpoint provided'}
            return jsonify(response), 500

    def updateFilesTemplates(entityId, entityData):
        component = request.args.get("newComponent", default=None)
        makeCurrent = json.loads(request.args.get("makeCurrent", default='false'))
        if component:
            component = json.loads(component)
            ref = refs["fileTemplates"].child(entityId).child('template')
            nextId = ref.push(component).key
            component["id"] = nextId
            refs["fileTemplates"].child(entityId).child('template').child(nextId).update(component)
            return jsonify({'status': 'success',
                            "message": nextId}), 200
        elif makeCurrent:
            data = refs["fileTemplates"].get()
            data = list(data.values() if data else [])
            if entityData["isCurrent"]:
                for temp in data:
                    if temp["id"] != entityId:
                        temp["isCurrent"] = False
                    elif temp["id"] == entityId:
                        temp["isCurrent"] = True
                    refs["fileTemplates"].child(temp["id"]).update(temp)

        else:
            refs["fileTemplates"].child(entityId).update(entityData)

        filesTemplatePerTeam = refs['filesTemplatePerTeam'].order_by_child("id").equal_to(entityId).get()
        for key, value in filesTemplatePerTeam.items():
            refs['filesTemplatePerTeam'].child(key).update(entityData)

        return jsonify({'status': 'success',
                        "message": f"{'fileTemplates'} {entityId} updated successfully"}), 200

    @firebase_db_records_mngt.route('/updateFB/<endpoint>', methods=['POST'])
    def updateFB(endpoint=None):
        try:
            entityData = request.json
            entityId = entityData['id']
            if endpoint == 'evaluationPages':
                refs[endpoint].child(entityId).update(entityData)
                return jsonify({'status': 'success',
                                "message": f"{endpoint[:-1]} {entityId} updated successfully"}), 200
            elif endpoint == "fileTemplates":
                return updateFilesTemplates(entityId, entityData)
            elif endpoint == "filesTemplatePerTeam":
                projectId = request.args.get('projectId', default=None)
                refs[endpoint].child(projectId).update(entityData)

            elif endpoint == "gradeTemplates":
                component = request.args.get("newComponent", default=None)
                makeCurrent = json.loads(request.args.get("makeCurrent", default='false'))
                if component:
                    component = json.loads(component)
                    ref = refs[endpoint].child(entityId).child('template')
                    nextId = ref.push(component).key
                    component["id"] = nextId
                    refs[endpoint].child(entityId).child('template').child(nextId).update(component)
                    return jsonify({'status': 'success',
                                    "message": nextId}), 200
                elif makeCurrent:
                    data = refs[endpoint].get()
                    data = list(data.values() if data else [])
                    if entityData["isCurrent"]:
                        for temp in data:
                            if temp["id"] != entityId:
                                temp["isCurrent"] = False
                            elif temp["id"] == entityId:
                                temp["isCurrent"] = True
                            refs[endpoint].child(temp["id"]).update(temp)
                else:
                    refs[endpoint].child(entityId).update(entityData)
            else:
                refs[endpoint].child(entityId).update(entityData)
            return jsonify({'status': 'success',
                            "message": f"{endpoint[:-1]} {entityId} updated successfully"}), 200
        except Exception as err:
            response = {'status': 'error',
                        'message': f'error occurred while updating {endpoint[:-1]}, {str(err)}'}
            return jsonify(response), 500

    @firebase_db_records_mngt.route('/readFB/<endpoint>', methods=['GET', 'POST'])
    def readFB(endpoint=None):
        try:
            if endpoint:
                entitiesIds = request.json
                entitiesData = []
                if entitiesIds and 'ids' in entitiesIds:
                    for uid in entitiesIds['ids']:
                        entitiesData.append(refs[endpoint].child(uid).get())
                return jsonify({'status': 'success', "message": entitiesData, "row_count": len(entitiesData)}), 200
            else:
                response = {'status': 'error', 'message': 'Non valid endpoint provided'}
                return jsonify(response), 500
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while reading {endpoint[:-1]}, {str(err)}'}
            return jsonify(response), 500

    @firebase_db_records_mngt.route('/deleteFB/<endpoint>/<eId>', methods=['POST'])
    def deleteFB(endpoint=None, eId=None):
        try:
            if endpoint and eId:
                refs[endpoint].child(eId).set({})
                return jsonify({'status': 'success', 'message': 'Entity deleted successfully'}), 200
            else:
                response = {'status': 'error', 'message': 'Non valid endpoint provided'}
                return jsonify(response), 500
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while reading {endpoint[:-1]}, {str(err)}'}
            return jsonify(response), 500

    def getFinalGrade(uid):
        try:
            gradeTemplate = refs['studentsGrades'].child(uid).get()
            if gradeTemplate is None:
                return None
            template = gradeTemplate['template'].values() if 'template' in gradeTemplate else None
            finalGradesPerStage = []
            numOfStages = 0
            if template:
                for gradeObj in template:
                    if gradeObj["description"] == 'Final Grade':
                        numOfStages += 1
                        if "grade" in gradeObj and int(gradeObj["grade"] != 0):
                            finalGradesPerStage.append(int(gradeObj["grade"]))
            return gradeTemplate

        except Exception as err:
            response = {'status': 'error',
                        'message': f"error occurred while retrieving  user's {uid} final grade {str(err)} in getFinalGrade "}
            return jsonify(response), 500

    def getSutdentGradesTemplates(teamId):
        currGradeTemp = None
        gradeTemplates = refs['gradeTemplates'].get()
        gradeTemplates = list(gradeTemplates.values() if gradeTemplates else [])
        for temp in gradeTemplates:
            if temp['isCurrent']:
                currGradeTemp = temp
        students = dbs['users'].query.filter_by(teamId=teamId).all()
        students = [u.serialize() for u in students]
        isEqual = True
        currStudentTemp = None
        for student in students:
            template = getFinalGrade(student['firebase_user_id'])
            if template:
                student['gradeTemplate'] = template
            else:
                refs['studentsGrades'].child(student['firebase_user_id']).update(currGradeTemp)
                student['gradeTemplate'] = currGradeTemp
                template = currGradeTemp
            if currStudentTemp is None:
                currStudentTemp = template
            else:
                if currStudentTemp['template'] != template['template']:
                    isEqual = False
        return jsonify({'status': 'success', "message": [students, isEqual]}), 200

    def getTeamFilesTemplate(projectId):
        teamFilesTemp = refs['filesTemplatePerTeam'].child(projectId).get()
        if teamFilesTemp is None:
            currFilesTemp = refs['fileTemplates'].order_by_child("isCurrent").equal_to(True).get()
            refs['filesTemplatePerTeam'].child(projectId).update(list(currFilesTemp.values())[0])
            teamFilesTemp = list(currFilesTemp.values())[0]

        return jsonify({'status': 'success', "message": teamFilesTemp}), 200

    @firebase_db_records_mngt.route('/retrieveFB/<endpoint>', methods=['GET'])
    def retrieveFB(endpoint=None):
        try:
            if endpoint:
                if endpoint == 'studentsGrades':
                    teamId = request.args.get('teamId', default=None)
                    if teamId:
                        return getSutdentGradesTemplates(teamId)
                    else:
                        return jsonify({'status': 'success', "message": []}), 200
                if endpoint == 'filesTemplatePerTeam':
                    projectId = request.args.get('projectId', default=None)
                    if projectId:
                        return getTeamFilesTemplate(projectId)
                    else:
                        return jsonify({'status': 'success', "message": []}), 200

                data = refs[endpoint].get()
                return jsonify({'status': 'success', "message": list(data.values() if data else [])}), 200
            else:
                response = {'status': 'error', 'message': 'Non valid endpoint provided'}
                return jsonify(response), 500
        except Exception as err:
            response = {'status': 'error', 'message': f'error occurred while retrieving {endpoint[:-1]}, {str(err)}'}
            return jsonify(response), 500

    return firebase_db_records_mngt
