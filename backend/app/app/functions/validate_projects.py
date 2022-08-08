#!/usr/bin/python
# coding=utf-8
"""
Author:  moshed
Created on 03/02/2021

"""
import base64
import json
import os

from Cryptodome import Random
from Cryptodome.Cipher import AES
from flask import jsonify
from pkcs7 import PKCS7Encoder

from ..models import db, Projects, Users
from ..sendEmail import sendHTMLEmail
from ..static.project_validation_email.project_validation_email_template import email_template


# fixme: connect me please
def getAvailableProjects():
    records = []
    query_records = db.session.query(Projects).filter(Projects.status == 'Available').all()

    for project in query_records:
        temp = {}
        temp.update(**project.serialize())
        if 'contactEmail' in temp and temp['contactEmail'] and temp['contactEmail'] != '':
            temp['recipientEmail'] = temp['contactEmail']
            temp['recipientName'] = temp['contactName'] if 'contactName' in temp else ''
        elif project.industrialAdvisorId:
            industrialAdvisor = db.session.query(Users).filter(
                Users.firebase_user_id == project.industrialAdvisorId).one()
            temp['industrialAdvisorId'] = industrialAdvisor.Users.serialize()
            temp['recipientEmail'] = temp['industrialAdvisorId']['email']
            temp['recipientName'] = temp['industrialAdvisorId']['engFirstName'] if 'engFirstName' in temp[
                'industrialAdvisorId'] else ''
        elif project.academicAdvisorId:
            academicAdvisor = db.session.query(Users).filter(
                Users.firebase_user_id == project.academicAdvisorId).one()
            temp['academicAdvisorId'] = academicAdvisor.Users.serialize()
            temp['recipientEmail'] = temp['academicAdvisorId']['email']
            temp['recipientName'] = temp['academicAdvisorId']['engFirstName'] if 'engFirstName' in temp[
                'academicAdvisorId'] else ''
        else:
            continue
        records.append(temp)
    return records


def encrypt_val(clear_text):
    master_key = os.getenv('EMAIL_HASH_KEY').encode("utf8")
    encoder = PKCS7Encoder()
    raw = encoder.encode(clear_text).encode("utf8")
    iv = Random.new().read(16)
    cipher = AES.new(master_key, AES.MODE_CBC, iv)
    return base64.urlsafe_b64encode(iv + cipher.encrypt(raw)).decode("utf8")


def sendValidationEmail(project):
    projectApproveLink = f"{os.getenv('PROJECT_STATUS_BASE_URL')}?id={encrypt_val(json.dumps({'projectId': project['id'], 'status': 'yes'}))}"
    projectRejectLink = f"{os.getenv('PROJECT_STATUS_BASE_URL')}?id={encrypt_val(json.dumps({'projectId': project['id'], 'status': 'off'}))}"
    sendEmail(project, projectApproveLink, projectRejectLink)


def sendEmail(project, projectApproveLink, projectRejectLink):
    subject = f'Technion Project Validation - {project["name"]}'
    message = email_template(welcome=project['recipientName'],
                             projectName=project["name"],
                             approveLink=projectApproveLink,
                             rejectLink=projectRejectLink)
    try:
        sendHTMLEmail(project['recipientEmail'], subject, message)
        return jsonify({'status': 'error', 'message': 'Can not send email'}), 400
    except Exception as err:
        return jsonify({'status': 'error', 'message': f'Email Could not be sent, {err}'}), 400


def validateProjects():
    available_projects = getAvailableProjects()
    for project in available_projects:
        sendValidationEmail(project)
