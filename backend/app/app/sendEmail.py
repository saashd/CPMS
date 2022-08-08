import json
import os
import smtplib, ssl
from datetime import datetime
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from os.path import basename

from flask import jsonify


def sendMessage(receivers, subject, body, files=None):
    try:
        sender_email = os.getenv('GMAIL_USER')
        receivers_email = receivers
        password = os.getenv('GMAIL_PASSWORD_KEY')

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message['Bcc'] = ", ".join(receivers_email)
        html1 = """<html><head></head><body>"""
        html2 = """</body></html>"""
        HTML_BODY = MIMEText(html1 + body + html2, 'html')
        message.attach(HTML_BODY)
        for f in files or []:
            with open(f, "rb") as fil:
                part = MIMEApplication(fil.read(), Name=basename(f))
            # After the file is closed
            part['Content-Disposition'] = 'attachment; filename="%s"' % basename(f)
            message.attach(part)
        # Create secure connection with server and send email
        context = ssl.create_default_context()

        port = 587  # For starttls
        smtp_server = "smtp.gmail.com"
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()  # Can be omitted
            server.starttls(context=context)
            server.ehlo()  # Can be omitted
            server.login(sender_email, password)
            server.sendmail(sender_email, receivers_email, message.as_string())
            server.close()
    except Exception as err:
        response = {'status': 'error', 'message': f'Can not send email {str(err)}'}
        return jsonify(response), 500


def sendHTMLEmail(receiver, subject, strBody):
    try:
        sender_email = "cpms2020.info@gmail.com"
        receiver_email = receiver
        password = os.getenv('GMAIL_PASSWORD_KEY')

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = receiver_email
        htmlBody = MIMEText(strBody, 'html')
        message.attach(htmlBody)

        # Create secure connection with server and send email
        context = ssl.create_default_context()

        port = 587  # For starttls
        smtp_server = "smtp.gmail.com"
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()  # Can be omitted
            server.starttls(context=context)
            server.ehlo()  # Can be omitted
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, message.as_string())
            server.close()
    except Exception as err:
        response = {'status': 'error', 'message': f'Can not send email {str(err)}'}
        return jsonify(response), 500
