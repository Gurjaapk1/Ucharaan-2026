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
panel(25,677,558,89,YELLOW,4,2)
text('Uchaaran',39,752,310,34,38,True)
def right(s,top):
 p=Paragraph(s,ParagraphStyle('right',fontName='Body',fontSize=11,leading=14,alignment=2,textColor=HexColor(INK)))
 _,h=p.wrap(240,100);p.drawOn(c,329,top-h)
right('Team 12 · Khalis Foundation',754)
right('Avi Oberoi · Gurjaap Kalra<br/>Mohkm Singh · Gurasees Bajaj',736)
text('A little practice. A deeper connection.',39,705,530,17,21,True)
text('The problem: helping children learn Gurbani',26,660,557,14,18,True)
text('Children need pronunciation support and a reason to practice. Conversations with Khalis Foundation focused us on engagement and understanding: help children return, recite with care, and explore what the words mean.',26,636,557,11,14)
text('Two modes. One path toward mastery.',26,584,557,18,22,True)
panel(26,471,258,80,BLUE,3)
text('1. Practice at your pace',39,537,232,13,17,True)
text('Listen and recall with Gurmukhi, Roman-letter Punjabi and English meaning. Revisit a line or word.',39,514,230,11,13)
panel(26,381,258,80,GREEN,3)
text('2. Take the pauri challenge',39,447,232,12.5,17,True)
text('Recite a line and tap Done. Review word feedback. Earn stars and Nanak coins for character rewards.',39,423,230,11,13)
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
screenshot(HERE/'practice-current.png',302,385,134,166,(15,60,360,538),(390,844))
screenshot(HERE/'review-detail.png',449,385,134,166,(25,72,385,575),(434,886))
def centered(s,x,top,w):
 p=Paragraph(s,ParagraphStyle('caption',fontName='Heading',fontSize=11,leading=14,alignment=1,textColor=HexColor(INK)));_,h=p.wrap(w,100);p.drawOn(c,x,top-h)
centered('Listen + recall',302,374,134)
centered('Review each word',449,374,134)
panel(26,289,557,65,PINK,3)
text('What changed since midterm',39,342,530,12,16,True)
text('Organizers asked for more attainable goals and simpler feedback for students. We added line-by-line scoring, short prompts, and an ML maintenance guide for Khalis Foundation.',39,320,530,11,14)
text('Why a memory palace?',26,280,265,13,17,True)
text('For grades 6 to 8, familiar scenes link each line to a place along 38 pauris. Sikh-inspired journeys invite recall and reflection. The ustaad guides pronunciation; rewards follow learning, not screen time.',26,258,266,11,13)
text('Tools and implementation',26,163,266,13,17,True)
text('React Native / Expo · TypeScript · IndicConformer · BaniDB · reference audio. Built with Codex and Paper. MIT-licensed project code.',26,141,266,11,13)
text('Private processing, by design',311,280,272,13,17,True)
text('Recordings are processed privately in Azure. Temporary server recordings are deleted after scoring, with no use for public-model training.<br/><br/>Khalis Foundation can host the model in its own shared AWS or Azure environment. On-device packaging is another option for fully local processing that keeps recordings on device.',311,258,272,11,13)
links=[('Watch demo','https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c'),('Try the app','https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site'),('View code','https://github.com/Gurjaapk1/Ucharaan-2026/tree/main'),('Design process','https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0')]
for i,(label,url) in enumerate(links):
 x=26+i*142;panel(x,59,130,25,[YELLOW,BLUE,GREEN,PINK][i],2,1.2)
 centered(label+' ↗',x,78,130);c.linkURL(url,(x,59,x+130,84),relative=0)
text('Ready to help Khalis Foundation launch.',26,44,557,11,14,True)
text('An implementation PR is open in the main app repository for review and deployment!',26,28,557,11,14)
c.save()
