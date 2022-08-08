import copy
import glob
import json
import os
from datetime import datetime

import firebase_admin
import google.auth.transport.requests
import google.oauth2.id_token
from docxtpl import DocxTemplate
from dotenv import load_dotenv
from firebase_admin import auth, credentials, db as firebaseDB
from flask import request, jsonify, send_from_directory
from flask_migrate import Migrate, MigrateCommand
from flask_script import Manager

from .blueprints import users_mngt, db_records_mngt, firebase_db_records_mngt, scheduled_tasks, logs_sqlite
from .blueprints.logs_sqlite import insertLog
from .functions.permissions_handler import handleMySqlRequestAccess, handleFBRequestAccess, handleMySQLUserRequestAccess, \
    handleFilesRequestAccess
from .models import db, app, Users
from .sendEmail import sendMessage

migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)
client = app.test_client()
HTTP_REQUEST = google.auth.transport.requests.Request()
cred = credentials.Certificate(
    os.path.abspath(os.path.join('app/config/cpms2020-firebase-adminsdk.json')))  # docker cred
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://cpms2020-default-rtdb.firebaseio.com/'
})
projectsStatusUpdatesRef = firebaseDB.reference('projectsStatusUpdates')
load_dotenv()


@app.before_request
def before_request_callback():
    if request.method != 'OPTIONS':
        try:
            if request.path in ['/api/retrieve/organizations',
                                '/api/retrieve/courses',
                                '/api/create/organizations',
                                '/api/create/projectProposals']:
                return
            if not request.headers.get('Authorization'):
                return json.dumps({'status': 'error', 'message': 'User Unauthorized'}), 401
            id_token = request.headers['Authorization'].split(' ').pop()
            claims = google.oauth2.id_token.verify_firebase_token(id_token, HTTP_REQUEST)
            setattr(request, "userFirebaseId", claims['user_id'])
            if not claims:
                return json.dumps({'status': 'error', 'message': 'User Unauthorized'}), 401
            if 'is_admin' in claims and claims['is_admin'] is True:
                return
            handleFilesRequestAccessRes = handleFilesRequestAccess(claims, request)
            if handleFilesRequestAccessRes is not None:
                return json.dumps({'status': 'error', 'message': f'User Unauthorized To Access Files Enpoint'}), 401
            handleRequestAccessRes = handleMySQLUserRequestAccess(claims, request)
            if handleRequestAccessRes is not None:
                return json.dumps(
                    {'status': 'error', 'message': f'User Unauthorized To Access MySQL Users Endpoint'}), 401
            handleMySqlRequestAccessRes = handleMySqlRequestAccess(claims, request)
            if handleMySqlRequestAccessRes is not None:
                return json.dumps({'status': 'error', 'message': f'User Unauthorized To Access MySQL Endpoint'}), 401
            handleFBRequestAccessRes = handleFBRequestAccess(request)
            if handleFBRequestAccessRes is not None:
                return json.dumps({'status': 'error', 'message': f'User Unauthorized To Access FB Endpoint'}), 401
            else:
                return
        except ValueError as error:
            return json.dumps({'status': 'error', 'message': f'User Unauthorized, {str(error)}'}), 401


@app.after_request
def after_request_func(response):
    try:
        uid = request.userFirebaseId
    except Exception as error:
        uid = None
    try:
        jsonResponse = json.loads(response.data)
        errorMessage = jsonResponse['message'] if jsonResponse[
                                                      'status'] == 'error' and 'message' in jsonResponse else ''
    except Exception as error:
        jsonResponse = {}
        errorMessage = ''
    try:
        request_json = json.dumps(request.get_json(force=False, silent=True))
    except Exception as err:
        request_json = None
    try:
        insertLog(
            {'dateCreated': datetime.now(),
             'uid': uid,
             'logLevel': 'info' if response.status_code == 200 else 'error',
             'jsonResponse': '' if jsonResponse is None else json.dumps(jsonResponse),
             'requestBody': request_json if request_json else str(request.data),
             'requestHeaders': '' if request.headers is None else str(request.headers),
             'requestArgs': '' if request.args is None else json.dumps(request.args),
             'errorMessage': errorMessage,
             'endpoint': request.path,
             'statusCode': response.status_code})
    except Exception as err:
        pass
    return response


app.register_blueprint(
    users_mngt.construct_blueprint(dbRef=firebaseDB.reference('database'), firebaseAuth=auth,
                                   projectsStatusUpdatesRef=projectsStatusUpdatesRef),
    url_prefix='/api')
app.register_blueprint(db_records_mngt.construct_blueprint(dbRef=firebaseDB.reference('database')),
                       url_prefix='/api')
app.register_blueprint(firebase_db_records_mngt.construct_blueprint(dbRef=firebaseDB.reference('database')),
                       url_prefix='/api')
app.register_blueprint(
    scheduled_tasks.construct_blueprint(dbRef=firebaseDB.reference('database'),
                                        projectsStatusUpdatesRef=projectsStatusUpdatesRef))
app.register_blueprint(logs_sqlite.construct_blueprint(), url_prefix='/api')


@app.route('/api/verify_user', methods=['GET'])
def verify_user():
    try:
        id_token = request.headers['Authorization'].split(' ').pop()
        claims = google.oauth2.id_token.verify_firebase_token(id_token, HTTP_REQUEST)
        try:
            userItem = Users.query.filter_by(firebase_user_id=claims['user_id']).first()
        except Exception as err:
            return jsonify(
                {'status': 'error', 'message': f'MySQL Error {err}'}), 500
        if not userItem:
            return json.dumps({'status': 'success', 'is_exists': False}), 200
        return json.dumps(
            {'status': 'success', 'is_exists': True, 'is_admin': userItem.is_admin,
             'user_details': userItem.serialize(),
             'test': os.getcwd()}), 200
    except Exception as err:
        return jsonify(
            {"message": "Could not authenticate user (pymysql.err.OperationalError) (2006, \"MySQL server has gone away (ConnectionResetError(10054, 'An existing connection was forcibly closed by the remote host', None, 10054, None))\")\n[SQL: SELECT users.firebase_user_id AS users_firebase_user_id, users.id AS users_id, users.`hebFirstName` AS `users_hebFirstName`, users.`hebLastName` AS `users_hebLastName`, users.`engFirstName` AS `users_engFirstName`, users.`engLastName` AS `users_engLastName`, users.email AS users_email, users.`cellPhone` AS `users_cellPhone`, users.`workPhone` AS `users_workPhone`, users.is_admin AS users_is_admin, users.prefix AS users_prefix, users.user_type AS users_user_type, users.`organizationId` AS `users_organizationId`, users.`advisorType` AS `users_advisorType`, users.faculty AS users_faculty, users.`semesterId` AS `users_semesterId`, users.`courseId` AS `users_courseId`, users.`teamId` AS `users_teamId` \nFROM users \nWHERE users.firebase_user_id = %(firebase_user_id_1)s \n LIMIT %(param_1)s]\n[parameters: {'firebase_user_id_1': 'cUsfolXPzuhrr6Nk8JTHYdGoY3H3', 'param_1': 1}]\n(Background on this error at: http://sqlalche.me/e/13/e3q8)", "status": "error"}), 500


@app.route('/api/sendEmail', methods=['POST'])
def sendEmail():
    files = []
    path = 'static/emailAttachments/'
    directory = os.path.join(app.instance_path, '..', path)
    if request.files:
        for file in request.files:
            fileToUpload = request.files[file]
            fileToUpload.save(
                os.path.join(directory, fileToUpload.filename))
            fullPath = os.path.join(directory, fileToUpload.filename)
            files.append(fullPath)
    receivers = list(request.form['receivers'].split(","))
    receivers = list(filter(None, receivers))
    subject = request.form['subject']
    message = request.form['message']
    message = message.replace('\n', '')
    try:
        sendMessage(receivers, subject, message, files)
        # remove all files from folder
        os.makedirs(directory, exist_ok=True)
        files = glob.glob(directory + '/*')
        for f in files:
            os.remove(f)
        return json.dumps({'status': 'success'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': f'Can not send email {str(err)}'}), 500


# Returns the actual file form the FS
@app.route('/api/downloadFile', methods=['POST'])
def downloadFile():
    try:
        data = request.json
        filePath = data['filePath']
        return send_from_directory(os.getcwd(), filePath, as_attachment=False)
    except FileNotFoundError:
        response = {'status': 404, 'message': f'File was not found {os.getcwd()}'}
        return jsonify(response), 404
    except Exception as err:
        response = {'status': 400, 'message': f'Error while retrieving file {str(err)}'}
        return jsonify(response), 200


def combine_word_documents(files):
    merged_document = DocxTemplate(files[0])
    merged_document.render({})
    if len(files) > 1:
        merged_document.add_page_break()
    for index, file in enumerate(files):
        if index > 0:
            sub_doc = DocxTemplate(file)
            sub_doc.render({})

            # Don't add a page break if you've reached the last file.
            if index < len(files) - 1:
                sub_doc.add_page_break()

            for element in sub_doc.element.body:
                merged_document.element.body.append(element)

    merged_document.save(
        os.path.abspath(os.path.join(os.getcwd(), 'app/static/output/evaluationPages.docx')))


@app.route('/api/getEvaluationPages', methods=['POST'])
def getEvaluationPages():
    try:
        tpl = DocxTemplate(
            os.path.abspath(os.path.join(os.getcwd(), 'app/static/evaluation_page_template.docx')))
        data = request.json
        file_list = []
        for idx, context in enumerate(data['schedule']):
            if not context['teamId'] or context['teamId'] not in data['teamIds']:
                continue
            temp = copy.deepcopy(data['currentEvaluationTemplate'])
            context.update({
                'templateTitle': temp['template']['title'],
                'template': temp['template'],
                'startDate': data['startDate']
            })
            del context['template']['title']
            tpl.render(context)
            tpl.save(os.path.abspath(os.path.join(os.getcwd(), f'app/static/output/team_{idx}.docx')))
            file_list.append(
                os.path.abspath(os.path.join(os.getcwd(), f'app/static/output/team_{idx}.docx')))
        combine_word_documents(file_list)
        return send_from_directory(os.getcwd(), 'app/static/output/evaluationPages.docx',
                                   as_attachment=False)
    except FileNotFoundError:
        response = {'status': 404, 'message': f'File was not found, {os.getcwd()}'}
        return jsonify(response), 404
    except Exception as err:
        response = {'status': 400, 'message': f'Error while retrieving file, {str(err)}'}
        return jsonify(response), 400


@app.route('/api/getSecretariatReport', methods=['POST'])
def getSecretariatReport():
    try:
        tpl = DocxTemplate(
            os.path.abspath(os.path.join(os.getcwd(), 'app/static/secretariat_report_template.docx')))
        context = request.json
        if not context:
            raise 'Missing data to create report'
        tpl.render(context)
        tpl.save(os.path.abspath(os.path.join(os.getcwd(), f'app/static/output/SecretariatReport.docx')))
        return send_from_directory(os.getcwd(), 'app/static/output/SecretariatReport.docx', as_attachment=False)
    except FileNotFoundError:
        response = {'status': 404, 'message': f'File was not found, {os.getcwd()}'}
        return jsonify(response), 404
    except Exception as err:
        response = {'status': 400, 'message': f'Error while retrieving file, {str(err)}'}
        return jsonify(response), 400


if __name__ == '__main__':
    # manager.run()
    app.run(host='127.0.0.1', port=5000)
    exit()
