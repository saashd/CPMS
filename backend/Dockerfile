FROM tiangolo/uwsgi-nginx-flask:python3.7

COPY reqForDocker.txt /app

COPY ./app /app
WORKDIR /app/

RUN pip install -r reqForDocker.txt

EXPOSE 80
