from flask import Blueprint, jsonify
from sqlalchemy.sql import func

from ..models import db, LogTable


def insertLog(data):
    try:
        nextId = db.session.query(func.max(LogTable.id)).scalar()
        nextId = 1 if nextId is None else nextId + 1
        data['id'] = nextId
        entity = LogTable(**data)
        db.session.add(entity)
        db.session.commit()
    except Exception as err:
        pass


def construct_blueprint():
    logs_bp = Blueprint('logs_bp', __name__, )

    @logs_bp.route('/retrieveLogs', methods=['GET'])
    def retrieveLogs():
        try:
            records = LogTable.query.all()
            x = [u.serialize() for u in records]
            return jsonify({'status': 'success', 'message': x}), 200
        except Exception as err:
            return jsonify({'status': 'error', 'message': "couldn't retreive logs"}), 400

    return logs_bp
    #     try:
    #         page = int(request.args.get("page", default=0))
    #         per_page = int(request.args.get("per_page", default=5))
    #         records = LogTable.query.order_by(desc(LogTable.dateCreated)).limit(per_page).offset(page * per_page)
    #         total = db.session.query(func.count(LogTable.id)).scalar()
    #         x = [u.serialize() for u in records]
    #         return jsonify({'status': 'success', 'data': x, 'page': page, 'total': total}), 200
    #     except Exception as err:
    #         return jsonify({'status': 'error', 'message': f"could not retrieve logs {err}"}), 400
    #
    # return logs_bp
