"""Database tools: Prismo tightens a bolt on a glass database with a glass wrench; a screwdriver
lies on the lid."""
import math
from kit import *

NAME = 'database-tools'


def nut(r=6.5):
    """A chrome hex nut centred at the origin, flats top and bottom."""
    pts = ' '.join(f'{r / math.cos(math.pi / 6) * math.cos(math.radians(a)):.2f},{r / math.cos(math.pi / 6) * math.sin(math.radians(a)):.2f}'
                   for a in range(0, 360, 60))
    return (f'<polygon points="{pts}" fill="url(#chrome)" stroke="#6f7a89" stroke-width=".9" stroke-linejoin="round"/>'
            f'<circle r="{r * .5:g}" fill="#aeb8c6" stroke="#6f7a89" stroke-width=".8"/>'
            f'<circle cx="-1" cy="-1" r="{r * .22:g}" fill="#fff" fill-opacity=".7"/>')


def wrench(length=62, head=14, jaw=6.8, grip=5):
    """An open-end wrench with its jaw around the origin and the handle along +x."""
    jx = math.sqrt(head ** 2 - jaw ** 2)
    hx = math.sqrt(head ** 2 - grip ** 2)
    outline = (f'M{-jx:.2f} {-jaw} L3 {-jaw} A{jaw} {jaw} 0 0 1 3 {jaw} L{-jx:.2f} {jaw} '
               f'A{head} {head} 0 0 0 {hx:.2f} {grip} L{length} {grip} A{grip} {grip} 0 0 0 {length} {-grip} '
               f'L{hx:.2f} {-grip} A{head} {head} 0 0 0 {-jx:.2f} {-jaw} Z')
    return f'''<path d="{outline}" transform="translate(0 2)" fill="#e4e9f0"/>
      <path d="{outline}" fill="url(#glass)"/>
      <path d="{outline}" fill="url(#sweep)" fill-opacity=".2"/>
      <path d="{outline}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="{length - 3}" cy="0" r="2.2" fill="none" stroke="#c6ccd6" stroke-width="1.2"/>'''


def screwdriver():
    """A screwdriver along +x from the origin: red glass handle, chrome shaft."""
    return f'''<rect x="0" y="-5" width="28" height="10" rx="5" fill="url(#database-tools-grip)"/>
      <path d="M8 -2.5H22M8 0H22M8 2.5H22" stroke="#fff" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>
      <rect x="27" y="-3" width="4" height="6" rx="1.5" fill="url(#foot)"/>
      <path d="M31 -1.3H52L55 -.4V.4L52 1.3H31Z" fill="url(#foot)" stroke="#8f9aa8" stroke-width=".5"/>'''


def build():
    cx, top = 204, 100  # the database bleeds off the right edge
    database, _ = glass_database(cx, top, uid='database-tools-db')
    bx, by = 180, 146  # the bolt, in the middle of the yellow band
    angle = 170        # the wrench's handle points left and a little down
    hx = bx + 60 * math.cos(math.radians(angle))
    hy = by + 60 * math.sin(math.radians(angle))
    defs = f'''  <defs>
    <linearGradient id="database-tools-grip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7788a"/><stop offset="1" stop-color="#d8324a"/>
    </linearGradient>
  </defs>'''
    body = f'''  <!-- The database, with a bolt on its side -->
{database}  <g transform="translate({bx} {by}) rotate({angle})" filter="url(#soft)">{nut()}</g>
  <!-- the second tool, lying on the lid -->
  <g transform="translate(206 92) rotate(-6)" filter="url(#soft)">
      {screwdriver()}
  </g>
{prismo(100, 94, tilt=4, face=5, eye_drop=4)}
  <!-- the wrench on the bolt: one hand pulls its handle up, the other steadies the database -->
{speed_lines(hx + 1, hy + 15, dx=0, dy=1, gap=5)}  <g transform="translate({bx} {by}) rotate({angle})" filter="url(#soft)">
      {wrench()}
  </g>
{hand(hx + 3, hy + 1, rot=-95)}{hand(150, 108, rot=8)}'''
    return svg((51, 40, 217, 186), 'Prismo tightening a bolt on a database with a wrench.', body, defs)
