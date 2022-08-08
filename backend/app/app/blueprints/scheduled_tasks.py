from datetime import date
from flask import Blueprint, jsonify
from ..algorithm.trainModel import trainModel
from ..models import db, Semesters, Courses, LogTable, Projects, Users

dbs = {"users": Users, "semesters": Semesters, "courses": Courses, "logTable": LogTable, "projects": Projects}


def construct_blueprint(dbRef, projectsStatusUpdatesRef):
    scheduled_tasks_bp = Blueprint('scheduled_tasks_bp', __name__, )
    refs = {'studentsGrades': dbRef.child('studentsGrades')}

    @scheduled_tasks_bp.route('/trainGradeModel', methods=['Post'])
    def trainGradeModel():
        try:
            trainModel()
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not update Projects Status {err}"}), 400

    @scheduled_tasks_bp.route('/update_course_and_semester', methods=['POST'])
    # Updates students semester and course id if student continues to the next course.(except techen 2)
    def update_course_and_semester():
        try:
            print("update_course_and_semester is on")
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

    @scheduled_tasks_bp.route('/clearLogTable', methods=['GET', 'POST'])
    # Remove all entities from logTable in sqlite db once in a month.
    def clearLogTable():
        try:
            dbs['logTable'].query.delete()
            db.session.commit()
            return jsonify({'status': 'success'}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': f"could not update Projects Status {err}"}), 400

    @scheduled_tasks_bp.route('/updateProjectsStatus', methods=['POST'])
    # Updates  Available Projects status depends of advisors response.
    # If project still available, update  lastVerified property, else change status to On Hold
    def updateProjectsStatus():
        try:
            print("updateProjectsStatus is on")
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

    @scheduled_tasks_bp.route('/updateStatusOfCompletedProjects', methods=['POST'])
    # Updates  Projects status to Completed if project is graded.
    def updateStatusOfCompletedProjects():
        try:
            print("updateStatusOfCompletedProjects is on")
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

    # def updateLogTable():
    #     try:
    #         dbs['logTable'].query.delete()
    #         db.session.commit()
    #         return jsonify({'status': 'success'}), 200
    #     except Exception as err:
    #         return jsonify({'status': 'error', 'message': f"could not update Projects Status {err}"}), 400
    #
    #
    # def scheduled():
    #     schedule.every().day.at("12:35").do(updateLogTable)
    #     while True:
    #         # Checks whether a scheduled task
    #         # is pending to run or not
    #         schedule.run_pending()
    #         time.sleep(1)
    #
    # thread = Thread(target=scheduled, name='scheduler')
    # thread.start()
    #     Prevent from double execution
    # if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    #     sched = BackgroundScheduler()
    #     sched.add_job(update_course_and_semester, 'cron', hour=1, minute=00)
    #     sched.add_job(update_logTable, 'cron', hour=17, minute=15)
    #     sched.add_job(updateProjectsStatus, 'cron', day=2, hour=5, minute=00)
    #     sched.add_job(updateStatusOfCompletedProjects, 'cron', day=3, hour=7, minute=00)
    #     sched.add_job(trainModel, 'cron', year='*', month='12', day=4, hour=22, minute=00)
    #     sched.start()

    return scheduled_tasks_bp
