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
panel(25,666,558,100,YELLOW,4,2)
text('Uchaaran',39,752,310,37,40,True)
# Right-aligned team details share the header, with no secondary label.
def right(s,top,size=10.5,bold=False):
 p=Paragraph(s,ParagraphStyle('right',fontName='Heading' if bold else 'Body',fontSize=size,leading=14,alignment=2,textColor=HexColor(INK)))
 _,h=p.wrap(225,100);p.drawOn(c,344,top-h)
right('Team 12 · Khalis Foundation',753,bold=True)
right('Avi Oberoi · Gurjaap Kalra<br/>Mohkm Singh · Gurasees Bajaj',734,10.3)
text('A little practice. A deeper connection.',40,700,530,18,23,True)
text('The problem we are solving',26,648,558,14,18,True)
text('Children need help pronouncing Gurbani and a reason to return to daily practice. With Khalis, we focused on pronunciation first, with engagement that sustains practice and understanding that goes beyond repeating words.',26,625,556,11,14)
text('Two modes. One path toward mastery.',26,568,557,19,23,True)
panel(26,436,258,97,BLUE,3)
text('1. Practice at your pace',39,519,232,13,17,True)
text('Listen, repeat, and recall with Gurmukhi, Roman-letter Punjabi and English meaning. Focus on a difficult word or practice a whole line.',39,492,230,10.5,13.5)
panel(26,322,258,98,GREEN,3)
text('2. Take the pauri challenge',39,407,232,12.6,17,True)
text('Recite a line and tap Done. Review word-level feedback, then revisit words that need practice. Stars earn Nanak coins for clothing, belongings and character actions.',39,382,230,10.3,13)
# Focused screenshot viewports preserve the actual pixels and omit device chrome
# and the historical capture's touch marker, outside the word-review viewport.
def screenshot(path,x,y,w,h,crop,source):
 sx,sy,sw,sh=crop; iw,ih=source
 c.saveState();clip=c.beginPath();clip.rect(x,y,w,h);c.clipPath(clip,stroke=0)
 scale=w/sw
 c.drawImage(str(path),x-sx*scale,y+h-(ih-sy)*scale,width=iw*scale,height=ih*scale,mask='auto')
 c.restoreState()
 c.setStrokeColor(HexColor(INK));c.setLineWidth(1.3);c.rect(x,y,w,h,fill=0,stroke=1)
screenshot(HERE/'practice-current.png',302,322,134,211,(15,60,360,567),(390,844))
screenshot(HERE/'word-review.png',449,389,134,144,(29,442,376,404),(434,890))
text('Find the words to practice next.',449,374,134,12,16,True)
text('Focused feedback supports the next attempt.',449,338,134,9,12)
text('Listen + recall',302,309,135,9.5,12,True)
text('Review each word',449,309,135,9.5,12,True)
panel(26,224,557,64,PINK,3)
text('What changed since midterm',39,277,530,12,16,True)
text('Organizers asked for less pressure and simpler feedback. We added line-by-line scoring, short word prompts, and an ML maintenance guide for Khalis.',39,255,530,10.3,13)
# The lower editorial area has fewer boxes, giving the dense handover text room.
text('Why a memory palace?',26,208,266,13,17,True)
text('For grades 6 to 8, familiar scenes link each line to a place along 38 pauris. Sikh-inspired journeys invite recall and reflection. The ustaad guides pronunciation; rewards follow learning, not screen time.',26,186,264,10,12.5)
text('Tools and implementation',26,122,266,12,16,True)
text('Expo · React Native · TypeScript · Azure-hosted IndicConformer · BaniDB · reference audio. Codex and Paper supported development and design.',26,102,264,9.5,12)
text('Private processing, by design',311,208,272,13,17,True)
text('Recordings are processed privately in Azure. Temporary server recordings are deleted after scoring, with no use for public-model training.<br/><br/>Khalis can host the model in its own shared AWS or Azure environment. On-device packaging is another option for fully local processing that keeps recordings on device.',311,186,272,10,12.5)
# Bottom handover and explicit link buttons.
text('Ready for handover.',26,58,116,10,12,True)
text('MIT source, setup and ML maintenance docs included. Khalis supplies hosting and credentials; costs depend on usage. An ongoing technical owner remains to be named.',144,58,439,9,11)
links=[('Watch demo','https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c'),('Try the app','https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site'),('View code','https://github.com/Gurjaapk1/Ucharaan-2026/tree/main'),('Design process','https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0')]
for i,(label,url) in enumerate(links):
 x=26+i*142;panel(x,10,130,22,[YELLOW,BLUE,GREEN,PINK][i],2,1.2)
 text(label+' ↗',x+12,27,112,10,13,True);c.linkURL(url,(x,10,x+130,32),relative=0)
c.save()
