#!/usr/bin/python
# coding=utf-8
"""
Author:  moshed & alexD
Created on 14/06/2021

"""
import os

from sklearn import tree
import pickle
import firebase_admin
import numpy as np
import pandas as pd
from firebase_admin import credentials, db as firebaseDB

from ..models import Projects, Organizations, Teams, Users, db

cred = credentials.Certificate(os.path.abspath(os.path.join('app/config/cpms2020-firebase-adminsdk.json')))
algorithm = firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://cpms2020-default-rtdb.firebaseio.com/'}, name='algorithm')
dbRef = firebaseDB.reference('database', algorithm)
BASE_PATH = os.path.abspath('app')

refs = {'evaluationPages': dbRef.child('evaluationPages'),
        'gradeTemplates': dbRef.child('gradeTemplates'),
        'fileTemplates': dbRef.child('fileTemplates'),
        'notifications': dbRef.child('notifications'),
        'studentsGrades': dbRef.child('studentsGrades')}


def loadOldDataFromPickle():
    path = os.path.join('./app/algorithm', 'oldCpmsData')
    infile = open(path, 'rb')
    oldDataDF = pickle.load(infile)
    infile.close()
    return oldDataDF


def predict(team):
    projectId = team['projectId']
    if projectId is None:
        return "0"
    students = team['students']
    if len(students) == 0:
        return "0"
    faculties = []
    courseId = int(students[0]['courseId'])
    for student in students:
        faculties.append(student['faculty'])
    faculty = max(faculties, key=faculties.count)
    facultyCode = 1 if faculty == 'IE' else 0
    project = Projects.query.filter_by(id=projectId).one()
    organization = Organizations.query.filter_by(id=project.organizationId).one()
    innerOrg = 1 if any(substring in organization.name for substring in ['technion', 'Technion', 'טכניון']) else 0
    sameAdvisor = 1 if project.academicAdvisorId == project.industrialAdvisorId else 0
    X_test = pd.DataFrame([[courseId, facultyCode, innerOrg, sameAdvisor]],
                          columns=['courseId', 'faculty', 'innerOrganization', 'sameAdvisor'])
    path = os.path.join('./app/algorithm', 'model.pkl')
    infile = open(path, 'rb')
    model = pickle.load(infile)
    infile.close()
    prediction = model.predict(X_test)[0]
    gradeRange = None
    if prediction == 1:
        gradeRange = "90-100"
    elif prediction == 2:
        gradeRange = "70-90"
    elif prediction == 3:
        gradeRange = "60-70"
    return gradeRange


def loadStudentsNewData():
    students = Users.query.filter(Users.user_type == 'student').all()
    students = [s.serialize() for s in students]
    filtered_students = []
    for s in students:
        if s['teamId'] is not None:
            student = {'faculty': 1 if s['faculty'] == 'IE' else 0, 'teamId': s['teamId']}
            grades = []

            gradeTemplate = refs['studentsGrades'].child(s['firebase_user_id']).child('template').get()
            if gradeTemplate:
                for key, value in gradeTemplate.items():
                    if value['description'] == 'Final Grade':
                        grades.append(int(value['grade']) if 'grade' in value else 0)
                grade = int(np.mean(grades)) if len(grades) > 0 else 0
                if grade == 0:
                    continue
                if grade >= 90:
                    student['grades'] = 2
                elif 70 <= grade < 90:
                    student['grades'] = 1
                else:
                    student['grades'] = 0
                filtered_students.append(student)
    if len(filtered_students) == 0:
        return pd.DataFrame([])
    teamStudents_df = pd.DataFrame(filtered_students)
    records = []
    query_records = db.session.query(Projects, Organizations, Teams).join(Teams, Teams.id == Projects.teamId,
                                                                          isouter=True).join(Organizations,
                                                                                             Organizations.id == Projects.organizationId,
                                                                                             isouter=True).all()
    for item in query_records:
        project, organization = item.Projects, item.Organizations
        temp = {}
        temp.update(**item.Projects.serialize())
        if organization:
            innerOrg = 1 if any(
                substring in organization.name for substring in ['technion', 'Technion', 'טכניון']) else 0
            temp['innerOrganization'] = innerOrg
        else:
            temp['innerOrganization'] = 0
        if project.academicAdvisorId and project.industrialAdvisorId:
            temp['sameAdvisor'] = 1 if project.academicAdvisorId == project.industrialAdvisorId else 0
        else:
            temp['sameAdvisor'] = 0
        records.append(temp)
    df = pd.DataFrame(records)
    df.fillna(0, inplace=True)
    teamStudents_df.fillna(0, inplace=True)
    df.teamId.astype(int)
    teamStudents_df.teamId.astype(int)
    df = df.drop(columns=['id', 'name', 'organizationId', 'numOfSemesters',
                          'description', 'academicAdvisorId', 'industrialAdvisorId', 'status',
                          'initiationDate', 'assignDate', 'endDate', 'contactName',
                          'contactPhone', 'contactEmail', 'contactIsAdvisor', 'lastVerified',
                          'approvedRequestsIds'])
    merged_df = pd.merge(teamStudents_df, df, on='teamId', how='left')
    merged_df.fillna(0, inplace=True)
    merged_df = merged_df.drop(columns=['teamId'])
    return merged_df


def trainModel():
    oldData = loadOldDataFromPickle()
    dataFromDB = loadStudentsNewData()
    data = oldData.append(dataFromDB, ignore_index=True)
    data = data.dropna()
    student_features = ['courseId', 'faculty', 'innerOrganization', 'sameAdvisor']
    X_train = data[student_features].copy()
    y_train = data[['grades']].copy()
    grade_classifier = tree.DecisionTreeClassifier(max_leaf_nodes=len(student_features), random_state=0)
    model = grade_classifier.fit(X_train, y_train)
    path = os.path.join('./app/algorithm', 'model.pkl')
    infile = open(path, 'wb')
    pickle.dump(model, infile)
    infile.close()
    print('Grade Prediction Model Updated')


if __name__ == '__main__':
    trainModel()
