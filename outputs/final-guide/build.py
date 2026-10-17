"""Printable BlockFrame-inspired one-pager. Retains San Francisco and live links.
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
pdfmetrics.registerFont(TTFont('SF','/System/Library/Fonts/SFNS.ttf'))
c=canvas.Canvas(str(HERE/'Team12_Final.pdf'),pagesize=(612,792))
c.setTitle('Uchaaran | Team 12 | Final submission')
c.setAuthor('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj')
INK='#17201D'; PAPER='#FFFDF5'; YELLOW='#F7CB46'; BLUE='#C0F7FE'; GREEN='#B3EBA3'; PINK='#F8B8E9'
def panel(x,y,w,h,fill,shadow=0,border=1.5):
 c.setFillColor(HexColor(INK))
 if shadow:c.rect(x+shadow,y-shadow,w,h,fill=1,stroke=0)
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(INK));c.setLineWidth(border);c.rect(x,y,w,h,fill=1,stroke=1)
def text(s,x,top,w,size=10.5,leading=13.5,bold=False,color=INK):
 p=Paragraph(s,ParagraphStyle('text',fontName='SF',fontSize=size,leading=leading,textColor=HexColor(color)))
 _,h=p.wrap(w,900)
 c.saveState();c.setStrokeColor(HexColor(color));c.setLineWidth(.32 if bold else 0);c._code.append('2 Tr' if bold else '0 Tr');p.drawOn(c,x,top-h);c.restoreState()
 return top-h
c.setFillColor(HexColor(PAPER));c.rect(0,0,612,792,fill=1,stroke=0)
panel(25,654,558,112,YELLOW,4,2)
text('Uchaaran',39,755,310,37,40,True)
text('Team 12 · Khalis Foundation',364,751,210,10.5,14,True)
text('Avi Oberoi · Gurjaap Kalra<br/>Mohkm Singh · Gurasees Bajaj',364,730,205,10.3,14)
text('A little practice. A deeper connection.',40,704,530,18,23,True)
text('Uchaaran Helper · Kids Mode for Sundar Gutka',40,676,500,10.5,14)
text('The problem we are solving',26,638,558,14,18,True)
text('Children need help pronouncing Gurbani and a reason to return to daily practice. Conversations with Khalis focused our design on engagement that sustains practice, and understanding that goes beyond repeating words.',26,615,556,11,14)
text('Two modes. One path toward mastery.',26,560,557,19,23,True)
# Number blocks and readable content cards use the reference's square framing.
panel(26,434,344,89,BLUE,3)
panel(38,481,25,27,PAPER,0,1.2)
text('1',46,504,15,16,20,True)
text('Practice at your pace',73,503,285,13,17,True)
text('Listen and repeat with Gurmukhi, Roman-letter pronunciation and English meaning. Use recall mode to practice from memory.',39,472,316,11,14)
panel(26,326,344,93,GREEN,3)
panel(38,377,25,27,PAPER,0,1.2)
text('2',45,400,16,16,20,True)
text('Take the pauri challenge',73,399,281,13,17,True)
text('Recite a line and tap Done. Azure returns word-level feedback. Revisit difficult words across 38 pauris; stars and Nanak coins unlock character rewards.',39,369,315,11,14)
# A real app screen is the primary product evidence.
panel(389,234,194,289,'#FFFFFF',4,2)
c.drawImage(str(HERE/'practice-current.png'),423,241,width=126,height=126*844/390,mask='auto')
panel(26,234,344,77,PINK,3)
text('What changed since midterm',39,300,318,12,16,True)
text('Organizers asked for less pressure and simpler feedback. We added line-by-line scoring, short word prompts, and an ML maintenance guide for Khalis.',39,278,316,10.5,13)
# The lower editorial area has fewer boxes, giving the dense handover text room.
text('Rooted in the Panth',26,216,266,13,17,True)
text('Built for children, initially grades 6 to 8. Gurmukhi and the ustaad’s recitation stay central. Familiar landmarks form a memory palace for recall; Sikh-inspired characters and seva stories connect learning with community.',26,194,264,10,12.5)
text('Tools and implementation',26,122,266,12,16,True)
text('Expo · React Native · TypeScript · Azure-hosted IndicConformer · BaniDB · reference audio. Codex and Paper supported development and design.',26,102,264,9.5,12)
text('Private processing, by design',311,216,272,13,17,True)
text('Recordings are processed privately in Azure. Temporary server recordings are deleted after scoring, with no use for public-model training.<br/><br/>Khalis can host the model in its own shared AWS or Azure environment. On-device packaging is another option for fully local processing that keeps recordings on device.',311,194,272,10,12.5)
# Bottom handover and explicit link buttons.
text('Ready for handover.',26,58,116,10,12,True)
text('MIT source, setup and ML maintenance docs included. Khalis supplies hosting and credentials; costs depend on usage. An ongoing technical owner remains to be named.',144,58,439,9,11)
links=[('Watch demo','https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c'),('Try the app','https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site'),('View code','https://github.com/Gurjaapk1/Ucharaan-2026/tree/main'),('Design process','https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0')]
for i,(label,url) in enumerate(links):
 x=26+i*142;panel(x,10,130,22,[YELLOW,BLUE,GREEN,PINK][i],2,1.2)
 text(label+' ↗',x+12,27,112,10,13,True);c.linkURL(url,(x,10,x+130,32),relative=0)
c.save()
