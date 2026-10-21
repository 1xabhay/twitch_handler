# AnimeGANv2 (bryandlee/animegan2-pytorch, "paprika" = the scenery style), CPU only. Weights are baked in at build,
# so a run needs no network. Usage: docker run --rm -i twitch-handler-anime < in.png > out.png
FROM python:3.12-slim
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
ENV TORCH_HOME=/models
RUN python -c "import torch; torch.hub.load('bryandlee/animegan2-pytorch:main', 'generator', pretrained='paprika', trust_repo=True)"
COPY stylize.py /stylize.py
ENTRYPOINT ["python", "/stylize.py"]
