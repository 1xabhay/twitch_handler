# One photo in on stdin, one anime-style PNG out on stdout, same size.
import io
import sys
import torch
from PIL import Image
from torchvision.transforms.functional import to_pil_image, to_tensor

model = torch.hub.load('bryandlee/animegan2-pytorch:main', 'generator', pretrained='paprika', trust_repo=True, verbose=False).eval()
img = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB')
w, h = img.size
x = to_tensor(img.resize((w // 4 * 4, h // 4 * 4))).unsqueeze(0) * 2 - 1  # model wants [-1, 1] and sides divisible by 4
with torch.no_grad():
    y = model(x)[0].clamp(-1, 1)
to_pil_image((y + 1) / 2).resize((w, h)).save(sys.stdout.buffer, 'PNG')
