from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
HERE=Path(__file__).parent
for name in ['SF','SFB']: pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/SFNS.ttf'))
pdfmetrics.registerFontFamily('SF',normal='SF',bold='SFB')
c=canvas.Canvas(str(HERE/'Team12_Final.pdf'),pagesize=(612,792));c.setTitle('Uchaaran | Team 12 | Final submission');c.setAuthor('Avi Oberoi, Gurjaap Kalra, Mohkm Singh, Gurasees Bajaj')
navy='#16314E';ink='#21364B';teal='#176C77';muted='#526372'
def box(x,y,w,h,color,r=8):
 c.setFillColor(HexColor(color));c.roundRect(x,y,w,h,r,fill=1,stroke=0)
def para(s,x,top,w,size=11,leading=14,color=ink,bold=False):
 p=Paragraph(s,ParagraphStyle('p',fontName='SFB' if bold else 'SF',fontSize=size,leading=leading,textColor=HexColor(color)))
 _,h=p.wrap(w,900);c.saveState();c.setStrokeColor(HexColor(color));c.setLineWidth(0.25 if bold else 0);c._code.append('2 Tr' if bold else '0 Tr');p.drawOn(c,x,top-h);c.restoreState();print(round(top-h,1),s[:55]);return top-h
box(30,652,552,110,navy)
para('Uchaaran',47,748,310,30,34,'#FFFFFF',True)
para('Team 12 · Khalis Foundation',350,747,218,11,14,'#FFFFFF',True)
para('Avi Oberoi · Gurjaap Kalra<br/>Mohkm Singh · Gurasees Bajaj',350,729,218,11,14,'#D9E6EF')
para('A little practice. A deeper connection.',47,707,510,17,21,'#FFFFFF',True)
para('Uchaaran Helper · Kids Mode for Sundar Gutka',47,677,510,11,14,'#D9E6EF')
para('The problem we are solving',30,637,552,13,17,navy,True)
para('Children need help pronouncing Gurbani and a reason to return to daily practice. Conversations with Khalis focused our design on two needs: engagement that sustains practice, and understanding that goes beyond repeating words.',30,615,552)

para('Two modes. One path toward mastery.',30,562,350,16,20,navy,True)
box(30,464,346,67,'#EDF2F4')
para('1. Practice at your pace',42,521,322,12,16,navy,True)
para('Listen and repeat with Gurmukhi, Roman-letter pronunciation and English meaning. Use recall mode to practice from memory.',42,500,322)
box(30,378,346,77,'#EDF2F4')
para('2. Take the pauri challenge',42,445,322,12,16,navy,True)
para('Recite a line and tap Done. Azure returns word-level feedback. Revisit difficult words across 38 pauris; stars and Nanak coins unlock character rewards.',42,424,322)
para('What changed since midterm',30,365,346,13,17,navy,True)
para('Organizers asked for less pressure and simpler feedback. We added line-by-line scoring, short word prompts, and an ML maintenance guide for Khalis.',30,343,346)
# Actual current app capture, not a reconstructed mockup.
img=HERE/'practice-current.png'
c.drawImage(str(img),420,291,width=125,height=125*844/390,mask='auto')
# Crop above the screenshot to keep its top below the section heading.
# The image is placed below the problem section and ends alongside the feedback section.

para('Rooted in the Panth',30,274,263,13,17,navy,True)
para('Built for children, initially grades 6 to 8. Gurmukhi and the ustaad’s reference recitation stay central. Familiar landmarks form a memory palace for recall; Sikh-inspired characters and seva stories connect learning with community.',30,253,263)
para('Tools and implementation',30,167,263,13,17,navy,True)
para('Expo · React Native · TypeScript · Azure-hosted IndicConformer scoring · BaniDB text · reference audio. Codex and Paper supported development and design.',30,146,263)

para('Private processing, by design',315,274,267,13,17,navy,True)
para('Recordings are processed privately in Azure. Temporary server recordings are deleted after scoring, with no use for public-model training.<br/><br/>Khalis can host the model in its own shared AWS or Azure environment. On-device packaging is another option for fully local processing that keeps recordings on device.',315,253,267)

para('Ready for handover',30,94,552,12,16,navy,True)
para('MIT source, setup and ML maintenance docs are included. Khalis supplies hosting and credentials; costs depend on usage. An ongoing technical owner remains to be named.',30,74,552,11,13)
# Link strip lives on a separate final row.
links=[('Watch demo','https://www.loom.com/share/8f0b7638963c4f4588720084fd15776c'),('Try the app','https://uchaaran-japji-journey.gsingh-honsla.chatgpt.site'),('View code','https://github.com/Gurjaapk1/Ucharaan-2026/tree/codex/submission-ready'),('Design process','https://app.paper.design/file/01M533NG24KGRMXNQQ6EX5Z1BJ/p-1-0')]
for i,(label,url) in enumerate(links):
 x=30+i*141;box(x,14,129,23,teal if i==0 else '#EDF2F4',5);para(label+' ↗',x+10,32,112,11,14,'#FFFFFF' if i==0 else teal,True);c.linkURL(url,(x,14,x+129,37),relative=0)
c.save()
