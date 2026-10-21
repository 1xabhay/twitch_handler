# One photo in on stdin, one anime-style PNG out on stdout, same size.
import io
import sys
import torch
from PIL import Image
from torchvision.transforms.functional import to_pil_image, to_tensor

model = torch.hub.load('bryandlee/animegan2-pytorch:main', 'generator', pretrained='paprika', trust_repo=True, verbose=False).eval()
img = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB')
w, h = img.size
# Painted at 512 px tall, then scaled back: the model learned on small pictures, full 1080p comes out barely anime.
# Model wants [-1, 1] and sides divisible by 4.
x = to_tensor(img.resize((round(w * 512 / h) // 4 * 4, 512))).unsqueeze(0) * 2 - 1
with torch.no_grad():
    y = model(x)[0].clamp(-1, 1)
to_pil_image((y + 1) / 2).resize((w, h)).save(sys.stdout.buffer, 'PNG')
