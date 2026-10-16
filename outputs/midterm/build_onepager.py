from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
for name, filename in [('Arial', 'Arial.ttf'), ('ArialBold', 'Arial Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, '/System/Library/Fonts/Supplemental/' + filename))
c = canvas.Canvas(str(HERE / 'Team12_Midterm.pdf'), pagesize=(612, 792))
c.setTitle('Uchaaran | Build Day project one-pager')
c.setAuthor('Team 12: Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj')
navy = '#142D4E'
body = ParagraphStyle('body', fontName='Arial', fontSize=11, leading=14, textColor=HexColor(navy))
heading = ParagraphStyle('heading', parent=body, fontName='ArialBold', fontSize=12, leading=15)

def para(text, x, top, width, style=body):
    p = Paragraph(text, style)
    _, h = p.wrap(width, 1000)
    p.drawOn(c, x, top-h)
    return top-h

def section(title, text, y, width=540):
    y = para(title, 36, y, width, heading)-4
    return para(text, 36, y, width)-8

c.setFillColor(HexColor('#F9F7F1'))
c.rect(0, 0, 612, 792, fill=1, stroke=0)
c.setFillColor(HexColor(navy))
c.rect(0, 677, 612, 115, fill=1, stroke=0)
c.setFillColor(HexColor('#F5C768'))
c.rect(36, 682, 38, 3, fill=1, stroke=0)
c.setFont('ArialBold', 28)
c.setFillColor(HexColor('#FFFFFF'))
c.drawString(36, 749, 'Uchaaran')
white = ParagraphStyle('white', parent=body, textColor=HexColor('#FFFFFF'))
para('A playful path to confident Gurbani pronunciation', 36, 735, 540, white)
para('Team 12  |  Partner: Khalis Foundation', 36, 716, 540, white)
para('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj', 36, 700, 540, white)
y = para('<b>Selected problem:</b> Help children build a lasting Gurbani practice through pronunciation support and meaningful progress.', 36, 662, 540)-12
y = section('The problem, in our words', 'Children learning Gurbani can struggle to read Gurmukhi and know whether they are pronouncing a line correctly. Parents want to help, but may not have time or access to an ustaad for everyday practice.', y)
y = section('What we built', 'A working browser prototype inspired by Sundar Gutka: 38 Japji Sahib pauris across six map regions, guided practice, challenge results and character rewards. Audio and saved progress work; pronunciation scores and coaching are simulated.', y)
start = y
y = para('Who uses it and how it helps', 36, y, 359, heading)-5
y = para('For children in grades 6 to 8, with parent support.', 36, y, 357)-8
y = para('<b>Choose a path.</b> Pick Prem Singh or Sehaj Kaur. Open a pauri on the map and preview its connected visual story.', 36, y, 357)-8
y = para('<b>Practice with support.</b> Read Gurmukhi, Roman-letter Punjabi and English meaning. Listen to reference audio; revisit difficult lines.', 36, y, 357)-8
y = para('<b>See progress.</b> Review word-level feedback. Earn stars and Nanak coins for clothing, belongings and character actions.', 36, y, 357)-8
y = para('For Khalis Foundation, this tests a learning journey within Sundar Gutka. Success means children return and improve against an ustaad-reviewed standard.', 36, y, 357)-12
image = ROOT / 'outputs/journey-regions/calm-v2/review/region-one-phone.png'
c.drawImage(str(image), 423, start-220, width=108.76, height=220, mask='auto')
y = min(y, start-232)
y = section('Tech tools we used', 'JavaScript, React Native Web and Vite; BaniDB text and Khalis audio; Codex, Paper, ChatGPT Sites and AI-generated illustrations.', y)
y = section('Links', '<link href="https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site" color="#176B81"><u>Try the live prototype</u></link>  |  <link href="https://github.com/Gurjaapk1/Ucharaan-2026/tree/codex/v1-product-journey" color="#176B81"><u>Review the code on GitHub</u></link>', y)
y = section('Next steps and asks', 'Proposed: test with children, review content with an ustaad and connect voice-following. Ask: reviewers and test families. Final-submission scope needs team confirmation.', y)
y = section('Working with the nonprofit', 'Project discussions shaped the focus on pronunciation, familiar book characters and rewards tied to mastery. Next, confirm the content-review process with Khalis Foundation.', y)
y = section('Hackathon feedback', 'Team input pending: what worked well during Build Day and one change that would help the team finish.', y)
assert y >= 18, f'Content exceeds page: bottom={y}'
c.save()
print(f'Created one page; content bottom = {y:.1f} pt')
