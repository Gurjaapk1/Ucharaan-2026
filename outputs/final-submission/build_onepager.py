from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
pdfmetrics.registerFont(TTFont('SF', '/System/Library/Fonts/SFNS.ttf'))
C = canvas.Canvas(str(HERE / 'Team12_Final_OnePager.pdf'), pagesize=(612, 792))
C.setTitle('Uchaaran | A Gurbani learning journey | Team 12')
C.setAuthor('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj')
NAVY, INK, MUTED, TEAL = '#152F4E', '#21364B', '#536475', '#176C77'

def text(value, x, top, width, size=11, leading=15, color=INK):
    style = ParagraphStyle('SF', fontName='SF', fontSize=size, leading=leading,
                           textColor=HexColor(color))
    p = Paragraph(value, style)
    _, h = p.wrap(width, 900)
    p.drawOn(C, x, top-h)
    return top-h

def rect(x, y, w, h, color, radius=0):
    C.setFillColor(HexColor(color))
    if radius:
        C.roundRect(x, y, w, h, radius, fill=1, stroke=0)
    else:
        C.rect(x, y, w, h, fill=1, stroke=0)

rect(0, 0, 612, 792, '#FBFAF7')
rect(0, 647, 612, 145, NAVY)
text('Uchaaran', 36, 766, 540, 33, 36, '#FFFFFF')
text('A Gurbani learning journey children can return to.', 36, 720, 540, 16, 20, '#FFFFFF')
text('Team 12  ·  Khalis Foundation', 36, 687, 540, 11, 14, '#D6E5EC')
text('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj', 36, 671, 540, 11, 14, '#D6E5EC')

y = text('Make the next line approachable', 36, 628, 350, 18, 22)
y = text('Children need help reading Gurmukhi, hearing correct pronunciation and knowing what to practice next. Parents may lack time or daily access to an ustaad.', 36, y-8, 350)
y = text('We built a playable path through Japji Sahib: 38 pauris across six regions, with guided practice and character rewards inspired by Sundar Gutka.', 36, y-10, 350)

y = text('A simple loop, with a purpose', 36, y-14, 350, 18, 22)
for title, copy in [
    ('Explore', 'Choose Prem Singh or Sehaj Kaur. Open a pauri and preview its connected visual story.'),
    ('Practice', 'Read Gurmukhi, Roman-letter Punjabi and English meaning alongside reference audio.'),
    ('Build mastery', 'Review the challenge scorecard, revisit words and earn stars. Nanak coins unlock clothing, belongings and character actions.')
]:
    y = text(title, 36, y-6, 350, 12, 16, TEAL)
    y = text(copy, 36, y-3, 350)

image = ROOT / 'outputs/journey-regions/calm-v2/review/region-one-phone.png'
C.drawImage(str(image), 412, 346, width=145, height=293.3, mask='auto')
text('The working journey map', 405, 338, 164, 11, 14, MUTED)
assert y >= 305, y

rect(36, 235, 540, 65, '#EAF0F1', 8)
text('What works today', 49, 289, 512, 13, 17, NAVY)
text('Practice audio, the full journey, rewards and saved browser progress work. Challenge scores and word coaching are simulated. Live speech-following and pronunciation assessment still need backend integration.', 49, 267, 512, 11, 14)

text('Useful to Khalis Foundation now', 36, 217, 257, 15, 19)
text('Test the learning flow with children and parents before native integration. Familiar book characters and paath audio connect the experience to existing community resources.', 36, 191, 257, 11, 14)

text('Built for the next team to carry on', 317, 217, 259, 15, 19)
text('JavaScript/JSX, React Native Web screens, assets and integration notes support the handoff. Next: connect recitation tracking and validate scoring with an ustaad.', 317, 191, 259, 11, 14)

text('How the design evolved', 36, 121, 540, 15, 19)
text('We explored journey maps and reward concepts in Paper, then built a playable prototype. Iteration led to calmer imagery, connected visual stories and character rewards tied to mastery.', 36, 97, 540, 11, 14)

C.setStrokeColor(HexColor('#CBD4DA'))
C.line(36, 57, 576, 57)
text('<link href="https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site" color="#176C77"><u>Try the live prototype</u></link>', 36, 43, 180, 11, 15)
text('<link href="https://github.com/Gurjaapk1/Ucharaan-2026/tree/codex/v1-product-journey" color="#176C77"><u>GitHub: code and handoff</u></link>', 221, 43, 180, 11, 15)
text('<link href="https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0" color="#176C77"><u>Paper: design process</u></link>', 419, 43, 157, 11, 15)
C.save()
print('Created Team12_Final_OnePager.pdf')
