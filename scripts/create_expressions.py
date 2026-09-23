"""Deterministic paintover/warp rig of the v1 master. No new character identities.
Facial changes are local, preserve alpha/pivots, and are exported losslessly.
Requires pillow, numpy, opencv-python. This is the executed production pipeline.
"""
from pathlib import Path
import numpy as np, cv2, json, hashlib
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
S=ROOT/'asset-source/expressions';A=ROOT/'public/assets';S.mkdir(parents=True,exist_ok=True)
base=np.array(Image.open(ROOT/'asset-source/typist-master.png').convert('RGBA'))
h,w=base.shape[:2];yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
def g(cx,cy,sx,sy):return np.exp(-.5*((xx-cx)/sx)**2-.5*((yy-cy)/sy)**2)
def expression(name,brow,mouth,openmouth=0):
 dy=np.zeros((h,w),np.float32)
 # Inner eyebrows change independently from the glasses; the original painted texture remains.
 dy+=brow*g(205,175,14,6)+brow*g(241,168,14,6)
 # A restrained mouth warp changes the original smile into a neutral line / downward corners.
 dx=(xx-226)/18
 dy+=mouth*(dx*dx-.23)*g(226,243,16,4.2)
 arr=cv2.remap(base,xx,yy-dy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
 if openmouth:
  # Remove only the old lips; blend a shaded mouth into the existing skin.
  mask=np.zeros((h,w),np.uint8);cv2.ellipse(mask,(226,244),(23,8),-3,0,360,255,-1)
  arr[:,:,:3]=cv2.inpaint(arr[:,:,:3],mask,5,cv2.INPAINT_TELEA)
  canvas=Image.fromarray(arr).resize((w*4,h*4),Image.Resampling.LANCZOS)
  overlay=Image.new('RGBA',canvas.size);d=ImageDraw.Draw(overlay)
  cx,cy=226*4,245*4;mw=(11 if openmouth==1 else 13)*4;mh=(7 if openmouth==1 else 11)*4
  d.ellipse((cx-mw-3,cy-mh-2,cx+mw+3,cy+mh+3),fill=(173,71,60,255))
  d.ellipse((cx-mw,cy-mh,cx+mw,cy+mh),fill=(72,29,33,255))
  d.ellipse((cx-mw+9,cy+mh*.10,cx+mw-7,cy+mh-4),fill=(202,94,103,255))
  d.pieslice((cx-mw+4,cy-mh+3,cx+mw-4,cy+mh*.2),180,360,fill=(254,232,201,255))
  d.arc((cx-mw-1,cy-mh-1,cx+mw+1,cy+mh+4),25,142,fill=(244,153,125,240),width=4)
  arr=np.array(Image.alpha_composite(canvas,overlay).resize((w,h),Image.Resampling.LANCZOS))
 im=Image.fromarray(arr);im.save(S/f'{name}.png');im.save(A/f'typist-{name}.webp',lossless=True,method=6)
 return im
spec=[('calm',0,0,0),('focused',2.0,2.2,0),('worried',-5,5.2,0),('alarmed',-7,5,1),('critical',-9,5,2),('defeated',-6,7.8,0),('celebrate',-1,-2,0)]
ims=[expression(*s) for s in spec]
# Character source rig metadata is shared by runtime / optional Blender authoring bridge.
meta={'masterSize':[w,h],'pivot':[219,420],'upperBodyCut':264,'thresholds':{'calm':0,'focused':25,'worried':50,'alarmed':75,'critical':90},'states':[s[0] for s in spec],'production':'Local deterministic facial displacement + hand-authored mouth paintovers; no Blender render claimed.'}
(S/'rig.json').write_text(json.dumps(meta,indent=2))
# Visual contact sheet is a QA artifact, not a runtime texture.
out=Image.new('RGB',(w*4,h*2),(22,42,39));d=ImageDraw.Draw(out)
for i,(im,s) in enumerate(zip(ims,spec)):
 x=(i%4)*w;y=(i//4)*h;out.paste(im,(x,y),im);d.text((x+12,y+10),s[0].upper(),fill=(241,219,170))
out.save(S/'expression-contact-sheet.jpg',quality=93)
print('Exported seven aligned expressions and contact sheet.')
