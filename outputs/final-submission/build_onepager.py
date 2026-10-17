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
C.setTitle('Uchaaran | Pronunciation, engagement and understanding | Team 12')
C.setAuthor('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj')
NAVY, INK, MUTED, TEAL = '#152F4E', '#21364B', '#536475', '#176C77'

def text(value, x, top, width, size=11, leading=15, color=INK):
    p = Paragraph(value, ParagraphStyle('SF', fontName='SF', fontSize=size,
        leading=leading, textColor=HexColor(color)))
    _, h = p.wrap(width, 900)
    p.drawOn(C, x, top-h)
    return top-h

def bold(value, x, top, size=15, color=NAVY):
    # Apply a restrained stroke to the same San Francisco glyphs for heading weight.
    C.saveState()
    C.setFillColor(HexColor(color)); C.setStrokeColor(HexColor(color))
    C.setLineWidth(0.27 if size < 20 else 0.4)
    t=C.beginText(x, top-size)
    t.setFont('SF', size); t.setTextRenderMode(2); t.textOut(value)
    C.drawText(t); C.restoreState()

def rect(x,y,w,h,color,radius=0):
    C.setFillColor(HexColor(color))
    if radius: C.roundRect(x,y,w,h,radius,fill=1,stroke=0)
    else: C.rect(x,y,w,h,fill=1,stroke=0)

rect(0,0,612,792,'#FBFAF7')
rect(0,655,612,137,NAVY)
bold('Uchaaran',36,768,32,'#FFFFFF')
text('Pronunciation first. A journey into Gurbani.',36,723,540,17,21,'#FFFFFF')
text('Team 12 · Khalis Foundation',36,689,540,11,14,'#D6E5EC')
text('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj',36,673,540,11,14,'#D6E5EC')

bold('Help children say it, then connect with it.',36,637,18)
text('Designed for grades 6 to 8, Uchaaran helps children navigate the script, sounds and meaning of Gurbani. Engagement brings them back; pronunciation practice gives each visit a purpose.',36,609,540,11,15)

bold('Engagement that serves learning',36,562,16)
text('Choose a bani, open a pauri and build mastery line by line. Japji Sahib spans 38 pauris in six regions. Prem Singh and Sehaj Kaur, stars and Nanak coins make progress personal through character rewards.',36,536,337)

bold('Understanding alongside pronunciation',36,458,16)
text('Listen, recite, review and retry. Gurmukhi, Roman-letter Punjabi and reference audio support pronunciation; word feedback guides the next practice. English meaning adds a path into understanding the shabad.',36,432,337)

image=ROOT/'outputs/journey-regions/calm-v2/review/region-one-phone.png'
C.drawImage(str(image),414,360,width=111,height=224.5,mask='auto')
text('Explore · Practice · Grow',398,351,178,11,14,TEAL)

bold('Why a memory palace?',36,346,16)
text('A connected panorama gives each passage a place and each line a familiar landmark. Returning to that place is intended to support recall and reflection. Inspired by the idea of a journey through time and Sikh history, we chose calm, connected scenes over unrelated illustrations.',36,320,540,11,15)

rect(36,158,540,85,'#EAF0F1',8)
bold('From recitation to a useful next step',49,234,14)
text('Scoring pipeline design',49,213,510,11,14,MUTED)
steps=[('Record a pauri','One continuous recitation'),('Align and compare','ML + the chosen reciter'),('Review and retry','Word feedback + audio')]
for i,(title,desc) in enumerate(steps):
    x=49+i*177
    bold(title,x,197,12)
    text(desc,x,179,164,11,14)
    if i<2:
        C.setStrokeColor(HexColor(TEAL)); C.setLineWidth(1)
        C.line(x+154,187,x+165,187)
        C.line(x+162,190,x+165,187); C.line(x+162,184,x+165,187)

bold('Designed to fit Sundar Gutka',36,143,15)
text('JavaScript and React Native patterns make the experience easier to carry forward. The native design reuses Sundar Gutka audio, text, settings and state, with Kids Mode isolated for small integration PRs. The ustaad sets the standard; ML helps identify what to practice.',36,119,540,11,14)

C.setStrokeColor(HexColor('#CBD4DA')); C.line(36,57,576,57)
text('<link href="https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site" color="#176C77"><u>Try the live prototype</u></link>',36,43,180,11,15)
text('<link href="https://github.com/Gurjaapk1/Ucharaan-2026/tree/main" color="#176C77"><u>GitHub: main branch</u></link>',231,43,170,11,15)
text('<link href="https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0" color="#176C77"><u>Paper: design process</u></link>',419,43,157,11,15)
C.save()
print('Created Team12_Final_OnePager.pdf')
