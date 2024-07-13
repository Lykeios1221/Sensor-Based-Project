FROM library/python:3.11-slim-bullseye AS base

WORKDIR /app

ENV PYTHONUNBUFFERED 1

ENV PATH="/opt/venv/bin:$PATH"

ARG USER=vscode
RUN useradd -m -s /usr/bin/bash ${USER}

FROM base AS dev

RUN python -m venv /opt/venv

COPY ./requirements.txt /tmp/requirements.txt

RUN pip install --upgrade pip
RUN pip install -Ur /tmp/requirements.txt

RUN rm /tmp/requirements.txt

ARG DEBIAN_FRONTEND=noninteractive
RUN apt update \
    && apt install -y --no-install-recommends sudo curl  \
    && apt autoremove -y \
    && echo "${USER} ALL=(ALL) NOPASSWD: ALL" >/etc/sudoers.d/${USER} \
    && chmod 0440 /etc/sudoers.d/${USER} \
    && chown -R ${USER}:${USER} /opt/venv

USER ${USER}

FROM base AS prod
COPY --chown=${USER}:${USER} . /app
COPY --chown=${USER}:${USER} --from=dev /opt/venv /opt/venv

RUN rm /app/requirements.txt

WORKDIR /app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

