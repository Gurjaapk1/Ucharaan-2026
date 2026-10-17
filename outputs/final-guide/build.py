"""Printable BlockFrame-inspired one-pager. Uses Figtree and Open Sans with live links.
Design reference: github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/block-frame
"""
from pathlib import Path
from math import sin, cos, pi
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
HERE=Path(__file__).parent
pdfmetrics.registerFont(TTFont('Heading',str(HERE/'fonts/Figtree-Bold.ttf')))
pdfmetrics.registerFont(TTFont('Body',str(HERE/'fonts/OpenSans.ttf')))
c=canvas.Canvas(str(HERE/'Team12_Final.pdf'),pagesize=(612,792))
c.setTitle('Uchaaran | Team 12 | Final submission')
c.setAuthor('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj')
INK='#17201D'; PAPER='#FFFDF5'; YELLOW='#F7CB46'; BLUE='#C0F7FE'; GREEN='#B3EBA3'; PINK='#F8B8E9'
def panel(x,y,w,h,fill,shadow=0,border=1.5):
 c.setFillColor(HexColor(INK))
 if shadow:c.rect(x+shadow,y-shadow,w,h,fill=1,stroke=0)
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(INK));c.setLineWidth(border);c.rect(x,y,w,h,fill=1,stroke=1)
def text(s,x,top,w,size=10.5,leading=13.5,bold=False,color=INK):
 p=Paragraph(s,ParagraphStyle('text',fontName='Heading' if bold else 'Body',fontSize=size,leading=leading,textColor=HexColor(color)))
 _,h=p.wrap(w,900)
 c.saveState();c.setStrokeColor(HexColor(color));c.setLineWidth(0);c._code.append('0 Tr');p.drawOn(c,x,top-h);c.restoreState()
 return top-h
c.setFillColor(HexColor(PAPER));c.rect(0,0,612,792,fill=1,stroke=0)
panel(25,703,558,63,YELLOW,4,2)
text('Uchaaran',39,758,310,28,31,True)
def right(s,top):
 p=Paragraph(s,ParagraphStyle('right',fontName='Body',fontSize=11,leading=14,alignment=2,textColor=HexColor(INK)))
 _,h=p.wrap(240,100);p.drawOn(c,329,top-h)
right('Team 12 · Khalis Foundation',754)
right('Avi Oberoi · Gurjaap Kalra<br/>Mohkm Singh · Gurasees Bajaj',736)
text('A little practice. A deeper connection.',39,726,530,14,18,True)
text('The problem: helping children learn Gurbani',26,690,557,14,18,True)
text('Children learning Gurbani need both a reason to return to daily practice and guidance to give each word the attention it deserves. Parents want to nurture that connection, but consistent access to an ustaad or time to guide every recitation is not always available. Conversations with Khalis Foundation helped us focus on two priorities: sustaining engagement and supporting pronunciation and understanding. We set out to make practice inviting and feedback clear, with the ustaad’s recitation as the standard and rewards tied to learning rather than screen time.',26,666,557,11,13)
text('Two modes. One path toward mastery.',26,582,557,18,22,True)
panel(26,481,258,70,BLUE,3)
text('1. Practice at your pace',39,546,232,13,17,True)
text('Listen and recall with Gurmukhi, Roman-letter Punjabi and English meaning. Revisit a line or word.',39,524,230,11,13)
panel(26,401,258,70,GREEN,3)
text('2. Take the pauri challenge',39,466,232,12.5,17,True)
text('Recite a line and tap Done. Review word feedback. Earn stars and Nanak coins for character rewards.',39,444,230,11,13)
def screenshot(path,x,y,w,h,crop,source):
 sx,sy,sw,sh=crop; iw,ih=source
 c.saveState();clip=c.beginPath();clip.rect(x,y,w,h);c.clipPath(clip,stroke=0)
 scale=w/sw
 c.drawImage(str(path),x-sx*scale,y+h-(ih-sy)*scale,width=iw*scale,height=ih*scale,mask='auto')
 # Only the English heading/touch-indicator band uses the cleaned image.
 # Preserve every original Gurbani pixel and all other interface content.
 if path.name=='review-detail.png':
  band=c.beginPath();band.rect(x,y+h-(300-sy)*scale,w,80*scale)
  c.clipPath(band,stroke=0)
  c.drawImage(str(HERE/'review-cleaned.png'),x-sx*scale,y+h-(ih-sy)*scale,width=iw*scale,height=ih*scale,mask='auto')
 c.restoreState();c.setStrokeColor(HexColor(INK));c.setLineWidth(1.3);c.rect(x,y,w,h,fill=0,stroke=1)
screenshot(HERE/'practice-current.png',302,405,134,146,(15,60,360,538),(390,844))
screenshot(HERE/'review-detail.png',449,405,134,146,(25,125,385,575),(434,886))
def centered(s,x,top,w):
 p=Paragraph(s,ParagraphStyle('caption',fontName='Heading',fontSize=11,leading=14,alignment=1,textColor=HexColor(INK)));_,h=p.wrap(w,100);p.drawOn(c,x,top-h)
centered('Listen + recall',302,394,134)
centered('Review each word',449,394,134)
panel(26,288,557,88,PINK,3)
text('What changed since midterm',39,368,530,12,16,True)
text('Organizers asked for more attainable goals and simpler feedback for students. We added line-by-line scoring, short prompts, and an ML maintenance guide for Khalis Foundation. We also compared ML models to find the best fit for Gurbani pronunciation, focusing on meaningful word-level scoring and clear, actionable guidance for students.',39,346,530,11,13)
text('Why a memory palace?',26,283,265,13,17,True)
text('For grades 6 to 8, familiar scenes link each line to a place along 38 pauris. Sikh-inspired journeys invite recall and reflection. The ustaad guides pronunciation; rewards follow learning, not screen time.',26,261,266,11,13)
text('Tools and implementation',311,147,272,13,17,True)
text('React Native · JavaScript · Azure-hosted IndicConformer · BaniDB · reference audio. Codex and Paper supported development and design.',311,125,272,11,13)
text('Private processing, by design',311,283,272,13,17,True)
text('Recordings are processed privately in Azure. Temporary server recordings are deleted after scoring, with no use for public-model training.<br/><br/>Khalis Foundation can host the model in its own shared AWS or Azure environment. On-device packaging is another option for fully local processing that keeps recordings on device.',311,261,272,11,13)
text('Rooted in the Panth',26,181,266,13,17,True)
text('Helping the next generation build a lasting connection with Gurbani through careful pronunciation, understanding, and daily practice. Playful technology supports that tradition, with Gurmukhi and the ustaad’s guidance at the center.',26,159,266,11,13)
links=[('Watch demo','https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c'),('Try the app','https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site'),('View code','https://github.com/Gurjaapk1/Ucharaan-2026/tree/main'),('Design process','https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0')]
for i,(label,url) in enumerate(links):
 x=26+i*142;panel(x,59,130,25,[YELLOW,BLUE,GREEN,PINK][i],2,1.2)
 centered(label+' ↗',x,78,130);c.linkURL(url,(x,59,x+130,84),relative=0)
# Use a real bold face for the lead-in within one continuously flowing paragraph.
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Heading')
text('<b>Ready to help Khalis Foundation launch.</b> An implementation PR is open in the main app repository for approval and deployment! We would love to help with infrastructure and support your technical team.',26,48,557,11,13)
c.save()
